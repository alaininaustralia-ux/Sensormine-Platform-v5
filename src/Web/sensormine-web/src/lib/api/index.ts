/**
 * API Module
 * 
 * Centralized exports for API client functionality
 */

export { apiClient, ApiClient } from './client';
export { apiConfig, endpoints } from './config';
export {
  ApiClientError,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  NotFoundError,
  TimeoutError,
  ValidationError,
  handleApiError,
} from './errors';
export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  PaginationParams,
  Device,
  TimeSeriesQuery,
  TimeSeriesDataPoint,
  Dashboard,
  DashboardWidget,
  Alert,
  User,
  LoginRequest,
  LoginResponse,
  DeviceType,
  DeviceTypeRequest,
  DeviceTypeListResponse,
  SearchDeviceTypesRequest,
  DeviceProtocol,
  CustomFieldDefinition,
  CustomFieldType,
  AlertRuleTemplate,
  AlertSeverity,
  ProtocolConfig,
} from './types';

export {
  createDeviceType,
  getDeviceTypeById,
  getAllDeviceTypes,
  updateDeviceType,
  deleteDeviceType,
  searchDeviceTypes,
} from './deviceTypes';

export {
  getDevices,
  getDeviceById,
  getDeviceByDeviceId,
  registerDevice,
  updateDevice,
  deleteDevice,
  bulkRegisterDevices,
  getDevicesByType,
  getDeviceSchema,
} from './devices';

export type {
  Device as ApiDevice,
  DeviceListResponse,
  CreateDeviceRequest,
  UpdateDeviceRequest,
  BulkDeviceRegistrationRequest,
  BulkDeviceRegistrationResult,
} from './devices';

export { nexusConfigurationApi } from './nexusConfiguration';
export type {
  NexusConfiguration,
  ProbeConfig,
  CommunicationSettings,
  AlertRuleTemplate as NexusAlertRuleTemplate,
  CreateNexusConfigurationRequest,
  UpdateNexusConfigurationRequest,
  ParseDocumentRequest,
  ParseDocumentResponse,
  GenerateCustomLogicRequest,
  GenerateCustomLogicResponse,
  ValidateCustomLogicRequest,
  ValidateCustomLogicResponse,
  DeployConfigurationRequest,
  DeployConfigurationResponse,
} from './nexusConfiguration';
