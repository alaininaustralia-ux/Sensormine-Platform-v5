/**
 * Alert API Client
 * 
 * Handles API calls for alert rules and alert instances
 */

import { apiClient } from './client';
import { serviceUrls } from './config';

// Alert Rule Types
export enum AlertSeverity {
  Info = 'Info',
  Warning = 'Warning',
  Critical = 'Critical',
}

export enum AlertTargetType {
  DeviceType = 'DeviceType',
  Device = 'Device',
}

export enum AlertOperator {
  GreaterThan = 'GreaterThan',
  LessThan = 'LessThan',
  Equal = 'Equal',
  NotEqual = 'NotEqual',
  Between = 'Between',
  Outside = 'Outside',
  Plateau = 'Plateau',
  Escalating = 'Escalating',
  Deescalating = 'Deescalating',
  Spike = 'Spike',
  Drop = 'Drop',
}

export enum AlertStatus {
  Active = 'Active',
  Acknowledged = 'Acknowledged',
  Resolved = 'Resolved',
  Suppressed = 'Suppressed',
}

export interface AlertCondition {
  field: string;
  operator: AlertOperator;
  value: any;
  secondValue?: any;
  unit?: string;
  level: AlertSeverity;
}

export interface EscalationRule {
  escalateAfterMinutes: number;
  escalationChannels: string[];
  escalationRecipients: string[];
  escalationMessage?: string;
}

export interface AlertRule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  severity: AlertSeverity;
  targetType: AlertTargetType;
  deviceTypeIds: string[];
  deviceIds: string[];
  conditions: AlertCondition[];
  conditionLogic: string;
  timeWindowSeconds: number;
  evaluationFrequencySeconds: number;
  deliveryChannels: string[];
  recipients: string[];
  isEnabled: boolean;
  escalationRule?: EscalationRule;
  cooldownMinutes: number;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

// Backend DTO with PascalCase
export interface AlertConditionDto {
  Field: string;
  Operator: AlertOperator;
  Value: any;
  SecondValue?: any;
  Unit?: string;
  Level: AlertSeverity;
}

export interface CreateAlertRuleRequest {
  name: string;
  description?: string;
  severity: AlertSeverity;
  targetType: AlertTargetType;
  deviceTypeIds: string[];
  deviceIds: string[];
  conditions: AlertConditionDto[];
  conditionLogic: string;
  timeWindowSeconds: number;
  evaluationFrequencySeconds: number;
  deliveryChannels: string[];
  recipients: string[];
  isEnabled: boolean;
  escalationRule?: EscalationRule;
  cooldownMinutes: number;
  tags: string[];
}

export interface UpdateAlertRuleRequest {
  name?: string;
  description?: string;
  severity?: AlertSeverity;
  targetType?: AlertTargetType;
  deviceTypeIds?: string[];
  deviceIds?: string[];
  conditions?: AlertCondition[];
  conditionLogic?: string;
  timeWindowSeconds?: number;
  evaluationFrequencySeconds?: number;
  deliveryChannels?: string[];
  recipients?: string[];
  isEnabled?: boolean;
  escalationRule?: EscalationRule;
  cooldownMinutes?: number;
  tags?: string[];
}

export interface AlertInstance {
  id: string;
  tenantId: string;
  alertRuleId: string;
  alertRuleName: string;
  deviceId: string;
  deviceName: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  details: string;
  fieldValues: Record<string, any>;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  acknowledgmentNotes?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  isEscalated: boolean;
  escalatedAt?: string;
  notificationCount: number;
  lastNotificationAt?: string;
}

export interface AlertInstanceStatistics {
  totalActive: number;
  totalAcknowledged: number;
  totalResolved: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}

/**
 * Alert Rules API
 */
export const alertRulesApi = {
  /**
   * Get all alert rules with pagination
   */
  async list(page = 1, pageSize = 20, search?: string): Promise<{
    data: AlertRule[];
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    if (search) params.append('search', search);

    const response = await apiClient.get<{
      data: AlertRule[];
      pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
      };
    }>(`${serviceUrls.alerts}/api/alert-rules?${params}`);
    
    return response.data;
  },

  /**
   * Get alert rule by ID
   */
  async get(id: string): Promise<AlertRule> {
    const response = await apiClient.get<AlertRule>(`${serviceUrls.alerts}/api/alert-rules/${id}`);
    return response.data;
  },

  /**
   * Create a new alert rule
   */
  async create(request: CreateAlertRuleRequest): Promise<AlertRule> {
    return apiClient.post(`${serviceUrls.alerts}/api/alert-rules`, request);
  },

  /**
   * Update an alert rule
   */
  async update(id: string, request: UpdateAlertRuleRequest): Promise<AlertRule> {
    return apiClient.put(`${serviceUrls.alerts}/api/alert-rules/${id}`, request);
  },

  /**
   * Delete an alert rule
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete(`${serviceUrls.alerts}/api/alert-rules/${id}`);
  },

  /**
   * Get alert rules by device type
   */
  async getByDeviceType(deviceTypeId: string): Promise<AlertRule[]> {
    return apiClient.get(`${serviceUrls.alerts}/api/alert-rules/by-device-type/${deviceTypeId}`);
  },

  /**
   * Get alert rules by device
   */
  async getByDevice(deviceId: string): Promise<AlertRule[]> {
    return apiClient.get(`${serviceUrls.alerts}/api/alert-rules/by-device/${deviceId}`);
  },
};

/**
 * Alert Instances API
 */
export const alertInstancesApi = {
  /**
   * Get all alert instances with pagination and filtering
   */
  async list(
    page = 1,
    pageSize = 20,
    status?: AlertStatus,
    severity?: AlertSeverity,
    deviceId?: string
  ): Promise<{
    data: AlertInstance[];
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
    filters: {
      status?: AlertStatus;
      severity?: AlertSeverity;
      deviceId?: string;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    if (status) params.append('status', status);
    if (severity) params.append('severity', severity);
    if (deviceId) params.append('deviceId', deviceId);

    const response = await apiClient.get<{
      data: AlertInstance[];
      pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
      };
      filters: {
        status?: AlertStatus;
        severity?: AlertSeverity;
        deviceId?: string;
      };
    }>(`${serviceUrls.alerts}/api/alert-instances?${params}`);
    
    return response.data;
  },

  /**
   * Get alert instance by ID
   */
  async get(id: string): Promise<AlertInstance> {
    const response = await apiClient.get<AlertInstance>(`${serviceUrls.alerts}/api/alert-instances/${id}`);
    return response.data;
  },

  /**
   * Get alert instance statistics
   */
  async getStatistics(): Promise<AlertInstanceStatistics> {
    return apiClient.get(`${serviceUrls.alerts}/api/alert-instances/statistics`);
  },

  /**
   * Get active alerts for a device
   */
  async getActiveByDevice(deviceId: string): Promise<AlertInstance[]> {
    return apiClient.get(`${serviceUrls.alerts}/api/alert-instances/active/device/${deviceId}`);
  },

  /**
   * Get alert instances by rule
   */
  async getByRule(ruleId: string, limit = 100): Promise<AlertInstance[]> {
    return apiClient.get(`${serviceUrls.alerts}/api/alert-instances/by-rule/${ruleId}?limit=${limit}`);
  },

  /**
   * Acknowledge an alert
   */
  async acknowledge(id: string, notes?: string): Promise<AlertInstance> {
    return apiClient.post(`${serviceUrls.alerts}/api/alert-instances/${id}/acknowledge`, { notes });
  },

  /**
   * Resolve an alert
   */
  async resolve(id: string, resolutionNotes?: string): Promise<AlertInstance> {
    return apiClient.post(`${serviceUrls.alerts}/api/alert-instances/${id}/resolve`, { resolutionNotes });
  },
};
