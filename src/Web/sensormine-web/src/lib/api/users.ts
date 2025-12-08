/**
 * Users API
 * 
 * API client for user management operations
 */

import { apiClient } from './client';

const IDENTITY_API_URL = process.env.NEXT_PUBLIC_IDENTITY_API_URL || 'http://localhost:5003';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  ssoProvider?: string;
  lastLoginAt?: string;
  phoneNumber?: string;
  mfaEnabled: boolean;
  avatarUrl?: string;
  preferredLanguage?: string;
  timezone?: string;
  tenantId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  email: string;
  fullName: string;
  role: string;
  password?: string;
  phoneNumber?: string;
  preferredLanguage?: string;
  timezone?: string;
  sendInvitation?: boolean;
}

export interface UpdateUserRequest {
  fullName?: string;
  role?: string;
  isActive?: boolean;
  phoneNumber?: string;
  mfaEnabled?: boolean;
  avatarUrl?: string;
  preferredLanguage?: string;
  timezone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserListResponse {
  items: User[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserStatistics {
  totalUsers: number;
  tenantId: string;
}

/**
 * User Management API
 */
export const usersApi = {
  /**
   * Get all users in the tenant with pagination and filtering
   */
  async getAll(params?: {
    page?: number;
    pageSize?: number;
    role?: string;
    isActive?: boolean;
  }): Promise<UserListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const query = queryParams.toString();
    const url = `${IDENTITY_API_URL}/api/user${query ? `?${query}` : ''}`;
    
    const response = await apiClient.get<UserListResponse>(url);
    return response.data;
  },

  /**
   * Get a specific user by ID
   */
  async getById(id: string): Promise<User> {
    const response = await apiClient.get<User>(`${IDENTITY_API_URL}/api/user/${id}`);
    return response.data;
  },

  /**
   * Create a new user
   */
  async create(request: CreateUserRequest): Promise<User> {
    const response = await apiClient.post<User>(`${IDENTITY_API_URL}/api/user`, request);
    return response.data;
  },

  /**
   * Update an existing user
   */
  async update(id: string, request: UpdateUserRequest): Promise<User> {
    const response = await apiClient.put<User>(`${IDENTITY_API_URL}/api/user/${id}`, request);
    return response.data;
  },

  /**
   * Delete a user
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${IDENTITY_API_URL}/api/user/${id}`);
  },

  /**
   * Change user password
   */
  async changePassword(id: string, request: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `${IDENTITY_API_URL}/api/user/${id}/change-password`,
      request
    );
    return response.data;
  },

  /**
   * Get user statistics
   */
  async getStatistics(): Promise<UserStatistics> {
    const response = await apiClient.get<UserStatistics>(`${IDENTITY_API_URL}/api/user/statistics`);
    return response.data;
  },
};
