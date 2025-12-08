/**
 * Authentication Provider
 * 
 * Manages authentication state and operations
 */

'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { apiClient, endpoints } from '@/lib/api';
import type { LoginResponse, User } from '@/lib/api';
import { AuthContext } from './AuthContext';
import { tokenStorage } from './storage';
import type { AuthState, LoginCredentials } from './types';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  /**
   * Initialize auth state from storage
   */
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenStorage.getToken();
      const storedUser = tokenStorage.getUser();

      if (token && storedUser) {
        // Restore auth token and tenant ID from storage
        apiClient.setAuthToken(token);
        apiClient.setTenantId((storedUser as User).tenantId);
        
        setState({
          user: storedUser as User,
          token,
          refreshToken: tokenStorage.getRefreshToken(),
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  /**
   * Login user
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiClient.post<LoginResponse>(
        endpoints.auth.login,
        credentials
      );

      const { token, refreshToken, user } = response.data;

      // Store tokens and user
      tokenStorage.setToken(token);
      tokenStorage.setRefreshToken(refreshToken);
      tokenStorage.setUser(user);
      
      // Set auth token and tenant ID for all API requests
      apiClient.setAuthToken(token);
      apiClient.setTenantId(user.tenantId);

      setState({
        user,
        token,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      // Attempt to call logout endpoint
      await apiClient.post(endpoints.auth.logout);
    } catch {
      // Continue with logout even if API call fails
    }

    // Clear local state
    tokenStorage.clear();
    apiClient.setAuthToken(null);
    apiClient.setTenantId(null);

    setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  /**
   * Refresh authentication
   */
  const refreshAuth = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      await logout();
      return;
    }

    try {
      const response = await apiClient.post<LoginResponse>(
        endpoints.auth.refresh,
        { refreshToken }
      );

      const { token, refreshToken: newRefreshToken, user } = response.data;

      tokenStorage.setToken(token);
      tokenStorage.setRefreshToken(newRefreshToken);
      tokenStorage.setUser(user);
      apiClient.setAuthToken(token);
      apiClient.setTenantId(user.tenantId);

      setState({
        user,
        token,
        refreshToken: newRefreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch {
      await logout();
    }
  }, [logout]);

  const value = {
    ...state,
    login,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
