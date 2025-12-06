/**
 * API Client
 * 
 * Core HTTP client for making requests to the backend API
 * Handles authentication, retries, and error handling
 */

import { apiConfig } from './config';
import {
  ApiClientError,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  NotFoundError,
  TimeoutError,
  ValidationError,
  handleApiError,
} from './errors';
import type { ApiResponse } from './types';

interface RequestOptions extends RequestInit {
  timeout?: number;
  retry?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private authToken: string | null = null;

  constructor(baseUrl: string, timeout: number) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  /**
   * Get authentication token
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Build full URL
   */
  private buildUrl(path: string): string {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    return url;
  }

  /**
   * Build request headers
   */
  private buildHeaders(customHeaders?: HeadersInit): Headers {
    const headers = new Headers(customHeaders);
    
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
    if (this.authToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.authToken}`);
    }

    return headers;
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  private async makeRequest<T>(
    url: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.timeout,
      retry = true,
      retryAttempts = apiConfig.retryAttempts,
      retryDelay = apiConfig.retryDelay,
      ...fetchOptions
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: this.buildHeaders(fetchOptions.headers),
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Parse JSON response
      const data = await response.json();

      return {
        data: data as T,
        status: response.status,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError();
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new NetworkError();
      }

      // Retry logic for network errors
      if (retry && retryAttempts > 0) {
        await this.delay(retryDelay);
        return this.makeRequest<T>(url, {
          ...options,
          retryAttempts: retryAttempts - 1,
        });
      }

      throw handleApiError(error);
    }
  }

  /**
   * Handle error responses
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = response.statusText;
    let errorDetails: unknown;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
      errorDetails = errorData.details || errorData;
    } catch {
      // If JSON parsing fails, use status text
    }

    switch (response.status) {
      case 401:
        throw new AuthenticationError(errorMessage);
      case 403:
        throw new AuthorizationError(errorMessage);
      case 404:
        throw new NotFoundError(errorMessage);
      case 400:
        throw new ValidationError(errorMessage, errorDetails);
      default:
        throw new ApiClientError(
          errorMessage,
          response.status,
          undefined,
          errorDetails
        );
    }
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  async get<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    console.log('[API Client] GET request to:', url);
    return this.makeRequest<T>(url, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(
    path: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.makeRequest<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    path: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.makeRequest<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    path: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.makeRequest<T>(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    return this.makeRequest<T>(url, {
      ...options,
      method: 'DELETE',
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient(apiConfig.baseUrl, apiConfig.timeout);

// Export class for testing
export { ApiClient };
