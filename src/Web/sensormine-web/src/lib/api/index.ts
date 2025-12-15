/**
 * API Module
 * 
 * Centralized exports for API client functionality
 */

export { apiClient, ApiClient } from './client';
export { apiConfig, endpoints } from './config';
export { deviceApiClient as deviceTypesApiClient } from './deviceTypes';
export { deviceApiClient } from './devices';
export { queryApiClient } from './widget-data';
export { simulationApiClient } from './simulation';
export { digitalTwinApiClient } from './digital-twin';

// Import all API clients for centralized configuration
import { apiClient } from './client';
import { deviceApiClient as deviceTypesClient } from './deviceTypes';
import { deviceApiClient as devicesClient } from './devices';
import { queryApiClient } from './widget-data';
import { simulationApiClient } from './simulation';
import { digitalTwinApiClient } from './digital-twin';

/**
 * Set tenant ID for all API clients
 * This ensures multi-tenancy headers are included in all requests
 */
export function setGlobalTenantId(tenantId: string | null) {
  apiClient.setTenantId(tenantId);
  deviceTypesClient.setTenantId(tenantId);
  devicesClient.setTenantId(tenantId);
  queryApiClient.setTenantId(tenantId);
  simulationApiClient.setTenantId(tenantId);
  digitalTwinApiClient.setTenantId(tenantId);
}

/**
 * Set authentication token for all API clients
 */
export function setGlobalAuthToken(token: string | null) {
  apiClient.setAuthToken(token);
  deviceTypesClient.setAuthToken(token);
  devicesClient.setAuthToken(token);
  queryApiClient.setAuthToken(token);
  simulationApiClient.setAuthToken(token);
  digitalTwinApiClient.setAuthToken(token);
}

// Initialize all clients with default tenant ID for development
const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001';
setGlobalTenantId(DEFAULT_TENANT_ID);

/**
 * Get current tenant ID from any API client
 * Used for direct fetch calls that can't use the API client
 */
export function getCurrentTenantId(): string {
  return apiClient.getTenantId() || DEFAULT_TENANT_ID;
}

/**
 * Get current auth token from any API client
 * Used for direct fetch calls that can't use the API client
 */
export function getCurrentAuthToken(): string | null {
  return apiClient.getAuthToken();
}
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

export {
  getRealtimeWidgetData,
  getHistoricalWidgetData,
  getAggregatedWidgetData,
  getKpiData,
  getCategoricalData,
  getMultiSeriesData,
  getKpiWithTrend,
} from './widget-data';

export type {
  RealtimeQueryParams,
  HistoricalQueryParams,
  AggregatedQueryParams,
  KpiQueryParams,
  CategoricalQueryParams,
} from './widget-data';

export {
  alertRulesApi,
  alertInstancesApi,
} from './alerts';

export type {
  AlertRule,
  CreateAlertRuleRequest,
  UpdateAlertRuleRequest,
  AlertInstance,
  AlertInstanceStatistics,
  AlertCondition,
  EscalationRule,
} from './alerts';

export {
  AlertSeverity as ApiAlertSeverity,
  AlertTargetType,
  AlertOperator,
  AlertStatus,
} from './alerts';

export {
  publishTelemetry,
  startSimulation,
  stopSimulation,
  quickStartSimulation,
  getActiveSimulations,
  getSimulationLogs,
} from './simulation';

export type {
  SimulatedDevice,
  SimulatedSensor,
  PublishTelemetryRequest,
  PublishTelemetryResponse,
  SimulationLogEntry,
  SimulationStartResponse,
  SimulationStopResponse,
} from './simulation';

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
  ProbeTypeInfo,
  SensorTypeInfo,
  CommunicationProtocolInfo,
  ValidateConfigurationRequest,
  ValidateConfigurationResponse,
  ValidationError as NexusValidationError,
  ValidationWarning,
} from './nexusConfiguration';

export { usersApi } from './users';
export type {
  User as ApiUser,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  UserListResponse,
  UserStatistics,
} from './users';

export { billingApi } from './billing';
export type {
  PaymentMethod,
  CardDetails,
  Invoice,
  InvoiceLineItem,
  Subscription,
  BillingPortalRequest,
  BillingPortalResponse,
  AddPaymentMethodRequest,
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
} from './billing.types';
