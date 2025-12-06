/**
 * Nexus Configuration API Client
 * 
 * API client for managing Nexus device configurations
 */

import { apiClient } from './client';

const BASE_PATH = '/api/NexusConfiguration';
const NEXUS_CONFIG_API_URL = process.env.NEXT_PUBLIC_NEXUS_CONFIG_API_URL || 'http://localhost:5298';

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

/**
 * Nexus Configuration API Service
 */
export const nexusConfigurationApi = {
  /**
   * Get all configurations
   */
  async getAll(page = 1, pageSize = 20): Promise<NexusConfiguration[]> {
    const response = await apiClient.get<NexusConfiguration[]>(
      `${BASE_PATH}?page=${page}&pageSize=${pageSize}`,
      { baseURL: NEXUS_CONFIG_API_URL }
    );
    return response.data;
  },

  /**
   * Get configuration by ID
   */
  async getById(id: string): Promise<NexusConfiguration> {
    const response = await apiClient.get<NexusConfiguration>(
      `${BASE_PATH}/${id}`,
      { baseURL: NEXUS_CONFIG_API_URL }
    );
    return response.data;
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
    
    const response = await apiClient.get<NexusConfiguration[]>(
      `${BASE_PATH}/templates?${params.toString()}`,
      { baseURL: NEXUS_CONFIG_API_URL }
    );
    return response.data;
  },

  /**
   * Search configurations
   */
  async search(searchTerm: string, page = 1, pageSize = 20): Promise<NexusConfiguration[]> {
    const response = await apiClient.get<NexusConfiguration[]>(
      `${BASE_PATH}/search?searchTerm=${encodeURIComponent(searchTerm)}&page=${page}&pageSize=${pageSize}`,
      { baseURL: NEXUS_CONFIG_API_URL }
    );
    return response.data;
  },

  /**
   * Create new configuration
   */
  async create(data: CreateNexusConfigurationRequest): Promise<NexusConfiguration> {
    const response = await apiClient.post<NexusConfiguration>(
      BASE_PATH,
      data,
      { baseURL: NEXUS_CONFIG_API_URL }
    );
    return response.data;
  },

  /**
   * Update configuration
   */
  async update(id: string, data: UpdateNexusConfigurationRequest): Promise<NexusConfiguration> {
    const response = await apiClient.put<NexusConfiguration>(
      `${BASE_PATH}/${id}`,
      data,
      { baseURL: NEXUS_CONFIG_API_URL }
    );
    return response.data;
  },

  /**
   * Delete configuration
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(
      `${BASE_PATH}/${id}`,
      { baseURL: NEXUS_CONFIG_API_URL }
    );
  },

  /**
   * Parse document to extract configuration
   */
  async parseDocument(data: ParseDocumentRequest): Promise<ParseDocumentResponse> {
    const response = await apiClient.post<ParseDocumentResponse>(
      `${BASE_PATH}/parse-document`,
      data,
      { baseURL: NEXUS_CONFIG_API_URL }
    );
    return response.data;
  },

  /**
   * Generate custom logic using AI
   */
  async generateLogic(data: GenerateCustomLogicRequest): Promise<GenerateCustomLogicResponse> {
    const response = await apiClient.post<GenerateCustomLogicResponse>(
      `${BASE_PATH}/generate-logic`,
      data,
      { baseURL: NEXUS_CONFIG_API_URL }
    );
    return response.data;
  },

  /**
   * Validate custom logic code
   */
  async validateLogic(data: ValidateCustomLogicRequest): Promise<ValidateCustomLogicResponse> {
    const response = await apiClient.post<ValidateCustomLogicResponse>(
      `${BASE_PATH}/validate-logic`,
      data,
      { baseURL: NEXUS_CONFIG_API_URL }
    );
    return response.data;
  },

  /**
   * Deploy configuration to platform
   */
  async deploy(data: DeployConfigurationRequest): Promise<DeployConfigurationResponse> {
    const response = await apiClient.post<DeployConfigurationResponse>(
      `${BASE_PATH}/deploy`,
      data,
      { baseURL: NEXUS_CONFIG_API_URL }
    );
    return response.data;
  },
};
