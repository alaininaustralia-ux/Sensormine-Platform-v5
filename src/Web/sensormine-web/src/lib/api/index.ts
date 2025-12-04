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
} from './types';
