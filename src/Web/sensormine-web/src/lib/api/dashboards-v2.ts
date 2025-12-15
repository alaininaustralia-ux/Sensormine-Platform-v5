// Dashboard V2 API Client
// Handles all API communication for dashboards

import type {
  Dashboard,
  DashboardListItem,
  CreateDashboardRequest,
  UpdateDashboardRequest,
  PublishDashboardRequest,
  ShareDashboardRequest,
  DashboardTemplate,
  ApplyTemplateRequest,
  DashboardVersion,
  DashboardAuditEntry,
} from '../types/dashboard-v2';

const API_BASE = '/api/dashboards';

// Dashboard CRUD
export async function getDashboards(): Promise<DashboardListItem[]> {
  const response = await fetch(API_BASE, {
    headers: {
      'X-Tenant-Id': getTenantId(),
      'X-User-Id': getUserId(),
    },
  });
  if (!response.ok) throw new Error('Failed to fetch dashboards');
  return response.json();
}

export async function getDashboard(id: string): Promise<Dashboard> {
  const response = await fetch(`${API_BASE}/${id}`, {
    headers: {
      'X-Tenant-Id': getTenantId(),
      'X-User-Id': getUserId(),
    },
  });
  if (!response.ok) throw new Error('Failed to fetch dashboard');
  return response.json();
}

export async function createDashboard(request: CreateDashboardRequest): Promise<Dashboard> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': getTenantId(),
      'X-User-Id': getUserId(),
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('Failed to create dashboard');
  return response.json();
}

export async function updateDashboard(id: string, request: UpdateDashboardRequest): Promise<Dashboard> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': getTenantId(),
      'X-User-Id': getUserId(),
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('Failed to update dashboard');
  return response.json();
}

export async function deleteDashboard(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: {
      'X-Tenant-Id': getTenantId(),
      'X-User-Id': getUserId(),
    },
  });
  if (!response.ok) throw new Error('Failed to delete dashboard');
}

// Publishing
export async function publishDashboard(id: string, request: PublishDashboardRequest): Promise<Dashboard> {
  const response = await fetch(`${API_BASE}/${id}/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': getTenantId(),
      'X-User-Id': getUserId(),
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('Failed to publish dashboard');
  return response.json();
}

export async function getDashboardVersions(id: string): Promise<DashboardVersion[]> {
  const response = await fetch(`${API_BASE}/${id}/versions`, {
    headers: {
      'X-Tenant-Id': getTenantId(),
      'X-User-Id': getUserId(),
    },
  });
  if (!response.ok) throw new Error('Failed to fetch versions');
  return response.json();
}

export async function revertToVersion(id: string, version: number): Promise<Dashboard> {
  const response = await fetch(`${API_BASE}/${id}/revert/${version}`, {
    method: 'POST',
    headers: {
      'X-Tenant-Id': getTenantId(),
      'X-User-Id': getUserId(),
    },
  });
  if (!response.ok) throw new Error('Failed to revert version');
  return response.json();
}

// Permissions
export async function shareDashboard(id: string, request: ShareDashboardRequest): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': getTenantId(),
      'X-User-Id': getUserId(),
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('Failed to share dashboard');
}

export async function revokeDashboardAccess(id: string, userId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}/share/${userId}`, {
    method: 'DELETE',
    headers: {
      'X-Tenant-Id': getTenantId(),
      'X-User-Id': getUserId(),
    },
  });
  if (!response.ok) throw new Error('Failed to revoke access');
}

// Templates
export async function getTemplates(): Promise<DashboardTemplate[]> {
  const response = await fetch(`${API_BASE}/templates`, {
    headers: {
      'X-Tenant-Id': getTenantId(),
      'X-User-Id': getUserId(),
    },
  });
  if (!response.ok) throw new Error('Failed to fetch templates');
  return response.json();
}

export async function getTemplate(id: string): Promise<DashboardTemplate> {
  const response = await fetch(`${API_BASE}/templates/${id}`, {
    headers: {
      'X-Tenant-Id': getTenantId(),
      'X-User-Id': getUserId(),
    },
  });
  if (!response.ok) throw new Error('Failed to fetch template');
  return response.json();
}

export async function applyTemplate(request: ApplyTemplateRequest): Promise<Dashboard> {
  const response = await fetch(`${API_BASE}/apply-template`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': getTenantId(),
      'X-User-Id': getUserId(),
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('Failed to apply template');
  return response.json();
}

export async function saveAsTemplate(id: string, name: string, description: string, category: string): Promise<DashboardTemplate> {
  const response = await fetch(`${API_BASE}/${id}/save-as-template`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': getTenantId(),
      'X-User-Id': getUserId(),
    },
    body: JSON.stringify({ name, description, category }),
  });
  if (!response.ok) throw new Error('Failed to save as template');
  return response.json();
}

// Audit Log
export async function getAuditLog(id: string): Promise<DashboardAuditEntry[]> {
  const response = await fetch(`${API_BASE}/${id}/audit`, {
    headers: {
      'X-Tenant-Id': getTenantId(),
      'X-User-Id': getUserId(),
    },
  });
  if (!response.ok) throw new Error('Failed to fetch audit log');
  return response.json();
}

// Duplication
export async function duplicateDashboard(id: string, name: string): Promise<Dashboard> {
  const response = await fetch(`${API_BASE}/${id}/duplicate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': getTenantId(),
      'X-User-Id': getUserId(),
    },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error('Failed to duplicate dashboard');
  return response.json();
}

// Utility functions for headers
function getTenantId(): string {
  // TODO: Get from auth context in production
  return '00000000-0000-0000-0000-000000000001';
}

function getUserId(): string {
  // TODO: Get from auth context in production
  return 'demo-user';
}
