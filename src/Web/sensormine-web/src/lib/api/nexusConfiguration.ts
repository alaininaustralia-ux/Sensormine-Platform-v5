/**
 * Nexus Configuration API Client
 * 
 * API client for managing Nexus device configurations
 */

import { apiClient } from './client';
import { apiConfig } from './config';

const BASE_PATH = '/api/NexusConfiguration';
const NEXUS_CONFIG_API_URL = process.env.NEXT_PUBLIC_NEXUS_CONFIG_API_URL || apiConfig.baseUrl;

// Types
export interface ProbeConfig {
  probeId: string;
  probeName: string;
  probeType: 'RS485' | 'RS232' | 'OneWire' | 'Analog420mA' | 'Digital';
  sensorType: string;
  unit: string;
  protocolSettings: Record<string, unknown>;
  calibration?: CalibrationSettings;
  transformationFormula?: string;
  samplingIntervalSeconds: number;
}

export interface CalibrationSettings {
  offset: number;
  scale: number;
  minValue?: number;
  maxValue?: number;
  lastCalibrationDate?: string;
  nextCalibrationDate?: string;
}

export interface CommunicationSettings {
  protocol: 'MQTT' | 'HTTP' | 'Azure IoT Hub';
  transmissionIntervalSeconds: number;
  enableBatching: boolean;
  maxBatchSize: number;
  enableCompression: boolean;
  mqttSettings?: MqttSettings;
  azureIoTSettings?: AzureIoTSettings;
}

export interface MqttSettings {
  brokerUrl: string;
  port: number;
  topicPattern: string;
  qoS: number;
  useTls: boolean;
}

export interface AzureIoTSettings {
  scopeId: string;
  useDps: boolean;
  iotHubHostname?: string;
}

export interface AlertRuleTemplate {
  name: string;
  condition: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  message: string;
  enabled: boolean;
}

export interface DocumentInfo {
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  uploadedAt: string;
  storagePath?: string;
  aiParsed: boolean;
  aiModel?: string;
  aiConfidenceScore?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface NexusConfiguration {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  deviceTypeId?: string;
  schemaId?: string;
  sourceDocument?: DocumentInfo;
  probeConfigurations: ProbeConfig[];
  schemaFieldMappings: Record<string, string>;
  communicationSettings: CommunicationSettings;
  customLogic?: string;
  customLogicLanguage?: string;
  alertRuleTemplates: AlertRuleTemplate[];
  tags: string[];
  status: 'Draft' | 'Validated' | 'Deployed';
  isTemplate: boolean;
  templateCategory?: string;
  aiInsights?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateNexusConfigurationRequest {
  name: string;
  description?: string;
  probeConfigurations?: ProbeConfig[];
  schemaFieldMappings?: Record<string, string>;
  communicationSettings?: CommunicationSettings;
  customLogic?: string;
  customLogicLanguage?: string;
  alertRuleTemplates?: AlertRuleTemplate[];
  tags?: string[];
  isTemplate?: boolean;
  templateCategory?: string;
}

export interface UpdateNexusConfigurationRequest {
  name?: string;
  description?: string;
  probeConfigurations?: ProbeConfig[];
  schemaFieldMappings?: Record<string, string>;
  communicationSettings?: CommunicationSettings;
  customLogic?: string;
  customLogicLanguage?: string;
  alertRuleTemplates?: AlertRuleTemplate[];
  tags?: string[];
  status?: string;
}

export interface ParseDocumentRequest {
  fileName: string;
  fileContent: string; // Base64 encoded for PDFs, plain text for MD/TXT
  fileType: 'PDF' | 'MD' | 'TXT';
}

export interface ParseDocumentResponse {
  success: boolean;
  errorMessage?: string;
  parsedConfiguration?: NexusConfiguration;
  confidenceScore: number;
  suggestions: string[];
  aiModel: string;
  tokensUsed: number;
}

export interface GenerateCustomLogicRequest {
  prompt: string;
  probeConfigurations?: ProbeConfig[];
  existingLogic?: string;
  language: string;
}

export interface GenerateCustomLogicResponse {
  success: boolean;
  errorMessage?: string;
  generatedCode: string;
  explanation: string;
  suggestions: string[];
  tokensUsed: number;
}

export interface ValidateCustomLogicRequest {
  code: string;
  language: string;
}

export interface ValidateCustomLogicResponse {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DeployConfigurationRequest {
  configurationId: string;
  createDeviceType: boolean;
  createSchema: boolean;
  deviceTypeName?: string;
  schemaName?: string;
}

export interface DeployConfigurationResponse {
  success: boolean;
  errorMessage?: string;
  deviceTypeId?: string;
  schemaId?: string;
  warnings: string[];
}

export interface ProbeTypeInfo {
  type: string;
  displayName: string;
  description: string;
  supportedProtocols: string[];
  defaultSettings: Record<string, string>;
}

export interface SensorTypeInfo {
  type: string;
  displayName: string;
  description: string;
  defaultUnit: string;
  compatibleProbeTypes: string[];
  typicalMinValue?: number;
  typicalMaxValue?: number;
  commonUnits: string[];
}

export interface CommunicationProtocolInfo {
  protocol: string;
  displayName: string;
  description: string;
  requiresBrokerUrl: boolean;
  supportsCompression: boolean;
  supportsBatching: boolean;
  defaultSettings: Record<string, unknown>;
}

export interface ValidateConfigurationRequest {
  name: string;
  probeConfigurations?: ProbeConfig[];
  schemaFieldMappings?: Record<string, string>;
  communicationSettings?: CommunicationSettings;
  customLogic?: string;
  customLogicLanguage?: string;
}

export interface ValidateConfigurationResponse {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

/**
 * Helper function to make direct API calls to NexusConfiguration.API
 */
async function nexusFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${NEXUS_CONFIG_API_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText}`);
  }
  
  // Handle empty responses (like DELETE)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }
  
  return response.json();
}

/**
 * Nexus Configuration API Service
 */
export const nexusConfigurationApi = {
  /**
   * Get all configurations
   */
  async getAll(page = 1, pageSize = 20): Promise<NexusConfiguration[]> {
    return nexusFetch<NexusConfiguration[]>(`${BASE_PATH}?page=${page}&pageSize=${pageSize}`);
  },

  /**
   * Get configuration by ID
   */
  async getById(id: string): Promise<NexusConfiguration> {
    return nexusFetch<NexusConfiguration>(`${BASE_PATH}/${id}`);
  },

  /**
   * Get configuration templates
   */
  async getTemplates(category?: string, page = 1, pageSize = 20): Promise<NexusConfiguration[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    if (category) {
      params.append('category', category);
    }
    return nexusFetch<NexusConfiguration[]>(`${BASE_PATH}/templates?${params.toString()}`);
  },

  /**
   * Search configurations
   */
  async search(searchTerm: string, page = 1, pageSize = 20): Promise<NexusConfiguration[]> {
    return nexusFetch<NexusConfiguration[]>(
      `${BASE_PATH}/search?searchTerm=${encodeURIComponent(searchTerm)}&page=${page}&pageSize=${pageSize}`
    );
  },

  /**
   * Create new configuration
   */
  async create(data: CreateNexusConfigurationRequest): Promise<NexusConfiguration> {
    return nexusFetch<NexusConfiguration>(BASE_PATH, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update configuration
   */
  async update(id: string, data: UpdateNexusConfigurationRequest): Promise<NexusConfiguration> {
    return nexusFetch<NexusConfiguration>(`${BASE_PATH}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete configuration
   */
  async delete(id: string): Promise<void> {
    return nexusFetch<void>(`${BASE_PATH}/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Parse document to extract configuration
   */
  async parseDocument(data: ParseDocumentRequest): Promise<ParseDocumentResponse> {
    return nexusFetch<ParseDocumentResponse>(`${BASE_PATH}/parse-document`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Generate custom logic using AI
   */
  async generateLogic(data: GenerateCustomLogicRequest): Promise<GenerateCustomLogicResponse> {
    return nexusFetch<GenerateCustomLogicResponse>(`${BASE_PATH}/generate-logic`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Validate custom logic code
   */
  async validateLogic(data: ValidateCustomLogicRequest): Promise<ValidateCustomLogicResponse> {
    return nexusFetch<ValidateCustomLogicResponse>(`${BASE_PATH}/validate-logic`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Deploy configuration to platform
   */
  async deploy(data: DeployConfigurationRequest): Promise<DeployConfigurationResponse> {
    return nexusFetch<DeployConfigurationResponse>(`${BASE_PATH}/deploy`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get available probe types for configuration builder
   */
  async getProbeTypes(): Promise<ProbeTypeInfo[]> {
    return nexusFetch<ProbeTypeInfo[]>(`${BASE_PATH}/probe-types`);
  },

  /**
   * Get available sensor types (optionally filtered by probe type)
   */
  async getSensorTypes(probeType?: string): Promise<SensorTypeInfo[]> {
    const params = probeType ? `?probeType=${encodeURIComponent(probeType)}` : '';
    return nexusFetch<SensorTypeInfo[]>(`${BASE_PATH}/sensor-types${params}`);
  },

  /**
   * Get available communication protocols
   */
  async getCommunicationProtocols(): Promise<CommunicationProtocolInfo[]> {
    return nexusFetch<CommunicationProtocolInfo[]>(`${BASE_PATH}/communication-protocols`);
  },

  /**
   * Validate configuration before saving
   */
  async validateConfiguration(data: ValidateConfigurationRequest): Promise<ValidationResult> {
    return nexusFetch<ValidationResult>(`${BASE_PATH}/validate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },};
