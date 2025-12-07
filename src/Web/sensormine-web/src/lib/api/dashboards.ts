/**
 * Dashboard API Client
 * 
 * Client for interacting with the Dashboard API microservice
 * Handles dashboard configuration persistence with multi-tenant support
 */

import { serviceUrls } from './config';
import type { Dashboard, Widget, LayoutItem } from '../types/dashboard';

const DASHBOARD_API_BASE = serviceUrls.dashboard;
const DEFAULT_TENANT_ID = 'default';

export interface CreateDashboardRequest {
  name: string;
  description?: string;
  layout: LayoutItem[];
  widgets: Widget[];
  isTemplate?: boolean;
  templateCategory?: string;
  sharedWith?: string[];
  tags?: string[];
  parentDashboardId?: string;
  displayOrder?: number;
  dashboardType?: number;
}

export interface UpdateDashboardRequest {
  name?: string;
  description?: string;
  layout?: LayoutItem[];
  widgets?: Widget[];
  isTemplate?: boolean;
  templateCategory?: string;
  sharedWith?: string[];
  tags?: string[];
  displayOrder?: number;
}

export interface SubPageSummary {
  id: string;
  name: string;
  description?: string;
  dashboardType: number;
  displayOrder: number;
  widgetCount: number;
}

export interface DashboardDto {
  id: string;
  userId: string;
  tenantId: string;
  name: string;
  description?: string;
  layout: LayoutItem[];
  widgets: Widget[];
  isTemplate: boolean;
  templateCategory?: string;
  sharedWith?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  parentDashboardId?: string;
  parentDashboardName?: string;
  subPages?: SubPageSummary[];
  displayOrder: number;
  dashboardType: number;
}

/**
 * Dashboard API
 */
export const dashboardApi = {
  /**
   * Get all dashboards for the current user
   */
  async list(userId: string, tenantId: string = DEFAULT_TENANT_ID): Promise<DashboardDto[]> {
    try {
      const response = await fetch(`${DASHBOARD_API_BASE}/api/Dashboards`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Tenant-Id': tenantId,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboards: ${response.statusText}`);
      }

      const data = await response.json();
      return data as DashboardDto[];
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      throw error;
    }
  },

  /**
   * Get a specific dashboard by ID
   */
  async get(id: string, userId: string, tenantId: string = DEFAULT_TENANT_ID): Promise<DashboardDto | null> {
    try {
      const response = await fetch(`${DASHBOARD_API_BASE}/api/Dashboards/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Tenant-Id': tenantId,
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
      }

      const data = await response.json();
      return data as DashboardDto;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw error;
    }
  },

  /**
   * Create a new dashboard
   */
  async create(
    request: CreateDashboardRequest,
    userId: string,
    tenantId: string = DEFAULT_TENANT_ID
  ): Promise<DashboardDto> {
    try {
      const response = await fetch(`${DASHBOARD_API_BASE}/api/Dashboards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Tenant-Id': tenantId,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to create dashboard: ${response.statusText}`);
      }

      const data = await response.json();
      return data as DashboardDto;
    } catch (error) {
      console.error('Error creating dashboard:', error);
      throw error;
    }
  },

  /**
   * Update an existing dashboard
   */
  async update(
    id: string,
    request: UpdateDashboardRequest,
    userId: string,
    tenantId: string = DEFAULT_TENANT_ID
  ): Promise<DashboardDto> {
    try {
      const response = await fetch(`${DASHBOARD_API_BASE}/api/Dashboards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Tenant-Id': tenantId,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to update dashboard: ${response.statusText}`);
      }

      const data = await response.json();
      return data as DashboardDto;
    } catch (error) {
      console.error('Error updating dashboard:', error);
      throw error;
    }
  },

  /**
   * Delete a dashboard (soft delete)
   */
  async delete(id: string, userId: string, tenantId: string = DEFAULT_TENANT_ID): Promise<void> {
    try {
      const response = await fetch(`${DASHBOARD_API_BASE}/api/Dashboards/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Tenant-Id': tenantId,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete dashboard: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      throw error;
    }
  },

  /**
   * Search dashboards
   */
  async search(
    query: string,
    tags: string[],
    userId: string,
    tenantId: string = DEFAULT_TENANT_ID
  ): Promise<DashboardDto[]> {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (tags && tags.length > 0) params.append('tags', tags.join(','));

      const response = await fetch(`${DASHBOARD_API_BASE}/api/Dashboards/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Tenant-Id': tenantId,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to search dashboards: ${response.statusText}`);
      }

      const data = await response.json();
      return data as DashboardDto[];
    } catch (error) {
      console.error('Error searching dashboards:', error);
      throw error;
    }
  },

  /**
   * Convert API DTO to Dashboard type for store
   */
  fromDto(dto: DashboardDto): Dashboard {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      layout: dto.layout,
      widgets: dto.widgets,
      isTemplate: dto.isTemplate,
      templateCategory: dto.templateCategory as 'operations' | 'maintenance' | 'security' | 'custom' | undefined,
      createdBy: dto.userId,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      sharedWith: dto.sharedWith,
      tags: dto.tags,
      parentDashboardId: dto.parentDashboardId,
      parentDashboardName: dto.parentDashboardName,
      subPages: dto.subPages,
      displayOrder: dto.displayOrder ?? 0,
      dashboardType: dto.dashboardType ?? 0,
    };
  },

  /**
   * Convert Dashboard to create request
   */
  toCreateRequest(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): CreateDashboardRequest {
    return {
      name: dashboard.name,
      description: dashboard.description,
      layout: dashboard.layout,
      widgets: dashboard.widgets,
      isTemplate: dashboard.isTemplate,
      templateCategory: dashboard.templateCategory,
      sharedWith: dashboard.sharedWith,
      tags: dashboard.tags,
      parentDashboardId: dashboard.parentDashboardId,
      displayOrder: dashboard.displayOrder,
      dashboardType: dashboard.dashboardType,
    };
  },

  /**
   * Convert Dashboard to update request
   */
  toUpdateRequest(dashboard: Partial<Dashboard>): UpdateDashboardRequest {
    return {
      name: dashboard.name,
      description: dashboard.description,
      layout: dashboard.layout,
      widgets: dashboard.widgets,
      isTemplate: dashboard.isTemplate,
      templateCategory: dashboard.templateCategory,
      sharedWith: dashboard.sharedWith,
      tags: dashboard.tags,
      displayOrder: dashboard.displayOrder,
    };
  },

  /**
   * Get all root dashboards (dashboards without a parent)
   */
  async getRoots(userId: string, tenantId: string = DEFAULT_TENANT_ID): Promise<DashboardDto[]> {
    try {
      const response = await fetch(`${DASHBOARD_API_BASE}/api/Dashboards/roots`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Tenant-Id': tenantId,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch root dashboards: ${response.statusText}`);
      }

      const data = await response.json();
      return data as DashboardDto[];
    } catch (error) {
      console.error('Error fetching root dashboards:', error);
      throw error;
    }
  },

  /**
   * Get all subpages for a dashboard
   */
  async getSubPages(parentId: string, tenantId: string = DEFAULT_TENANT_ID): Promise<DashboardDto[]> {
    try {
      const response = await fetch(`${DASHBOARD_API_BASE}/api/Dashboards/${parentId}/subpages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': tenantId,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch subpages: ${response.statusText}`);
      }

      const data = await response.json();
      return data as DashboardDto[];
    } catch (error) {
      console.error('Error fetching subpages:', error);
      throw error;
    }
  },

  /**
   * Create a new subpage under a parent dashboard
   */
  async createSubPage(
    parentId: string,
    request: CreateDashboardRequest,
    userId: string,
    tenantId: string = DEFAULT_TENANT_ID
  ): Promise<DashboardDto> {
    try {
      const response = await fetch(`${DASHBOARD_API_BASE}/api/Dashboards/${parentId}/subpages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Tenant-Id': tenantId,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create subpage: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data as DashboardDto;
    } catch (error) {
      console.error('Error creating subpage:', error);
      throw error;
    }
  },

  /**
   * Reorder subpages within a parent dashboard
   */
  async reorderSubPages(
    parentId: string,
    displayOrders: Record<string, number>,
    tenantId: string = DEFAULT_TENANT_ID
  ): Promise<void> {
    try {
      const response = await fetch(`${DASHBOARD_API_BASE}/api/Dashboards/${parentId}/subpages/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': tenantId,
        },
        body: JSON.stringify(displayOrders),
      });

      if (!response.ok) {
        throw new Error(`Failed to reorder subpages: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error reordering subpages:', error);
      throw error;
    }
  },
};
