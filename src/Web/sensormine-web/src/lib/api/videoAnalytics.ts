/**
 * Video Analytics Configuration API Client
 */

import { ApiClient } from './client';
import { apiConfig } from './config';
import type {
  VideoAnalyticsConfiguration,
  CreateVideoAnalyticsRequest,
  UpdateVideoAnalyticsRequest,
  VideoAnalyticsListResponse,
  StreamHealthStatus,
} from '@/lib/types/video-analytics';

// Create dedicated client for VideoMetadata.API
const videoAnalyticsClient = new ApiClient('http://localhost:5298', apiConfig.timeout);

// Set default tenant ID
const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001';
videoAnalyticsClient.setTenantId(DEFAULT_TENANT_ID);

export const videoAnalyticsApi = {
  /**
   * Get all video analytics configurations
   */
  async list(page: number = 1, pageSize: number = 50): Promise<VideoAnalyticsListResponse> {
    const response = await videoAnalyticsClient.get<VideoAnalyticsListResponse>(
      `/api/video-analytics?page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },

  /**
   * Get a single video analytics configuration by ID
   */
  async get(id: string): Promise<VideoAnalyticsConfiguration> {
    const response = await videoAnalyticsClient.get<VideoAnalyticsConfiguration>(
      `/api/video-analytics/${id}`
    );
    return response.data;
  },

  /**
   * Create a new video analytics configuration
   */
  async create(data: CreateVideoAnalyticsRequest): Promise<VideoAnalyticsConfiguration> {
    const response = await videoAnalyticsClient.post<VideoAnalyticsConfiguration>(
      '/api/video-analytics',
      data
    );
    return response.data;
  },

  /**
   * Update a video analytics configuration
   */
  async update(id: string, data: UpdateVideoAnalyticsRequest): Promise<VideoAnalyticsConfiguration> {
    const response = await videoAnalyticsClient.put<VideoAnalyticsConfiguration>(
      `/api/video-analytics/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Delete a video analytics configuration
   */
  async delete(id: string): Promise<void> {
    await videoAnalyticsClient.delete<void>(`/api/video-analytics/${id}`);
  },

  /**
   * Enable a video analytics configuration
   */
  async enable(id: string): Promise<VideoAnalyticsConfiguration> {
    const response = await videoAnalyticsClient.post<VideoAnalyticsConfiguration>(
      `/api/video-analytics/${id}/enable`
    );
    return response.data;
  },

  /**
   * Disable a video analytics configuration
   */
  async disable(id: string): Promise<VideoAnalyticsConfiguration> {
    const response = await videoAnalyticsClient.post<VideoAnalyticsConfiguration>(
      `/api/video-analytics/${id}/disable`
    );
    return response.data;
  },

  /**
   * Get stream health status
   */
  async getHealthStatus(id: string): Promise<StreamHealthStatus> {
    const response = await videoAnalyticsClient.get<StreamHealthStatus>(
      `/api/video-analytics/${id}/health`
    );
    return response.data;
  },

  /**
   * Test stream connection
   */
  async testConnection(data: CreateVideoAnalyticsRequest): Promise<{ success: boolean; message: string }> {
    const response = await videoAnalyticsClient.post<{ success: boolean; message: string }>(
      '/api/video-analytics/test-connection',
      data
    );
    return response.data;
  },
};
