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
