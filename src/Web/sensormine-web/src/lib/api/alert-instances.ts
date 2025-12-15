// API client for alert instances

import { apiClient } from './client';

export enum ApiAlertStatus {
  Active = 0,
  Acknowledged = 1,
  Resolved = 2,
}

export enum ApiAlertSeverityEnum {
  Info = 0,
  Warning = 1,
  Error = 2,
  Critical = 3,
}

export interface AlertInstanceDto {
  id: string;
  tenantId: string;
  alertRuleId: string;
  alertRuleName: string;
  deviceId: string;
  deviceName: string;
  severity: ApiAlertSeverityEnum;
  status: ApiAlertStatus;
  message: string;
  details: string;
  fieldValues: Record<string, unknown>;
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
  severityBreakdown: {
    critical: number;
    error: number;
    warning: number;
    info: number;
  };
}

export interface AlertInstanceListResponse {
  data: AlertInstanceDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  filters: {
    status?: ApiAlertStatus;
    severity?: ApiAlertSeverityEnum;
    deviceId?: string;
  };
}

export interface AcknowledgeAlertRequest {
  notes?: string;
}

export interface ResolveAlertRequest {
  resolutionNotes?: string;
}

export const alertInstancesApi = {
  /**
   * Get all alert instances with pagination and filtering
   */
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    status?: ApiAlertStatus;
    severity?: ApiAlertSeverityEnum;
    deviceId?: string;
  }): Promise<AlertInstanceListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.status !== undefined) queryParams.append('status', params.status.toString());
    if (params?.severity !== undefined) queryParams.append('severity', params.severity.toString());
    if (params?.deviceId) queryParams.append('deviceId', params.deviceId);

    const response = await apiClient.get<AlertInstanceListResponse>(
      `/api/alert-instances?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get alert instance by ID
   */
  getById: async (id: string): Promise<AlertInstanceDto> => {
    const response = await apiClient.get<AlertInstanceDto>(`/api/alert-instances/${id}`);
    return response.data;
  },

  /**
   * Get alert instance statistics
   */
  getStatistics: async (): Promise<AlertInstanceStatistics> => {
    const response = await apiClient.get<AlertInstanceStatistics>('/api/alert-instances/statistics');
    return response.data;
  },

  /**
   * Get active alerts for a device
   */
  getActiveByDevice: async (deviceId: string): Promise<AlertInstanceDto[]> => {
    const response = await apiClient.get<AlertInstanceDto[]>(
      `/api/alert-instances/active/device/${deviceId}`
    );
    return response.data;
  },

  /**
   * Get alert instances by alert rule
   */
  getByRule: async (ruleId: string, limit?: number): Promise<AlertInstanceDto[]> => {
    const queryParams = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get<AlertInstanceDto[]>(
      `/api/alert-instances/by-rule/${ruleId}${queryParams}`
    );
    return response.data;
  },

  /**
   * Acknowledge an alert
   */
  acknowledge: async (id: string, request: AcknowledgeAlertRequest): Promise<AlertInstanceDto> => {
    const response = await apiClient.post<AlertInstanceDto>(
      `/api/alert-instances/${id}/acknowledge`,
      request
    );
    return response.data;
  },

  /**
   * Resolve an alert
   */
  resolve: async (id: string, request: ResolveAlertRequest): Promise<AlertInstanceDto> => {
    const response = await apiClient.post<AlertInstanceDto>(
      `/api/alert-instances/${id}/resolve`,
      request
    );
    return response.data;
  },
};
