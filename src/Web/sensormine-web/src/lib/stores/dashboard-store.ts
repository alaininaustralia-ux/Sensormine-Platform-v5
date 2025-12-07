/**
 * Dashboard Store
 * 
 * Zustand store for managing dashboard state, including CRUD operations,
 * widget management, and persistence with backend API sync.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Dashboard, Widget, LayoutItem, DashboardFilters } from '../types/dashboard';
import { dashboardApi } from '../api/dashboards';

interface DashboardState {
  // State
  dashboards: Dashboard[];
  currentDashboard: Dashboard | null;
  isEditMode: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  lastError: string | null;
  
  // Initialization
  initializeDashboards: (userId: string) => Promise<void>;
  loadFromServer: (userId: string) => Promise<void>;
  
  // Dashboard CRUD operations
  createDashboard: (dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, userId: string) => Promise<Dashboard>;
  getDashboard: (id: string) => Dashboard | undefined;
  updateDashboard: (id: string, updates: Partial<Dashboard>, userId: string) => Promise<void>;
  deleteDashboard: (id: string, userId: string) => Promise<void>;
  listDashboards: (filters?: DashboardFilters) => Dashboard[];
  
  // Dashboard state management
  setCurrentDashboard: (dashboard: Dashboard | null) => void;
  setEditMode: (isEditMode: boolean) => void;
  
  // Widget operations
  addWidget: (dashboardId: string, widget: Omit<Widget, 'id' | 'createdAt' | 'updatedAt'>, layout: Omit<LayoutItem, 'i'>, userId: string) => Promise<Widget>;
  updateWidget: (dashboardId: string, widgetId: string, updates: Partial<Widget>, userId: string) => Promise<void>;
  deleteWidget: (dashboardId: string, widgetId: string, userId: string) => Promise<void>;
  
  // Layout operations
  updateLayout: (dashboardId: string, layout: LayoutItem[], userId: string) => Promise<void>;
  
  // Template operations
  createFromTemplate: (templateId: string, name: string, userId: string) => Promise<Dashboard | null>;
  
  // Utility operations
  duplicateDashboard: (id: string, newName: string, userId: string) => Promise<Dashboard | null>;
  clearAll: () => void;
}

/**
 * Generate a UUID v4
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Filter dashboards based on criteria
 */
function filterDashboards(dashboards: Dashboard[], filters?: DashboardFilters): Dashboard[] {
  if (!filters) return dashboards;
  
  let filtered = [...dashboards];
  
  // Search filter
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(d => 
      d.name.toLowerCase().includes(search) ||
      d.description?.toLowerCase().includes(search)
    );
  }
  
  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter(d =>
      d.tags?.some(tag => filters.tags!.includes(tag))
    );
  }
  
  // Creator filter
  if (filters.createdBy) {
    filtered = filtered.filter(d => d.createdBy === filters.createdBy);
  }
  
  // Template filter
  if (filters.isTemplate !== undefined) {
    filtered = filtered.filter(d => d.isTemplate === filters.isTemplate);
  }
  
  // Category filter (for templates)
  if (filters.category) {
    filtered = filtered.filter(d => d.templateCategory === filters.category);
  }
  
  // Sorting
  if (filters.sortBy) {
    const sortField = filters.sortBy;
    const sortOrder = filters.sortOrder || 'asc';
    
    filtered.sort((a, b) => {
      let aVal: string | Date | number = a[sortField];
      let bVal: string | Date | number = b[sortField];
      
      if (aVal instanceof Date && bVal instanceof Date) {
        aVal = aVal.getTime();
        bVal = bVal.getTime();
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  }
  
  return filtered;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      // Initial state
      dashboards: [],
      currentDashboard: null,
      isEditMode: false,
      isLoading: false,
      isSyncing: false,
      lastError: null,
      
      // Initialize dashboards for a user
      initializeDashboards: async (userId: string) => {
        set({ isLoading: true, lastError: null });
        
        try {
          const dashboardDtos = await dashboardApi.list(userId);
          const dashboards = dashboardDtos.map(dto => dashboardApi.fromDto(dto));
          set({ dashboards, isLoading: false });
        } catch (error) {
          console.error('Failed to initialize dashboards:', error);
          set({ 
            isLoading: false,
            lastError: error instanceof Error ? error.message : 'Failed to load dashboards'
          });
        }
      },
      
      // Load dashboards from server
      loadFromServer: async (userId: string) => {
        set({ isLoading: true, lastError: null });
        
        try {
          const dashboardDtos = await dashboardApi.list(userId);
          const dashboards = dashboardDtos.map(dto => dashboardApi.fromDto(dto));
          set({ dashboards, isLoading: false });
        } catch (error) {
          console.error('Failed to load dashboards from server:', error);
          set({ 
            isLoading: false,
            lastError: error instanceof Error ? error.message : 'Failed to load dashboards'
          });
        }
      },
      
      // Create a new dashboard
      createDashboard: async (dashboardData, userId) => {
        // Optimistic update - create locally first
        const now = new Date();
        const tempId = generateId();
        const localDashboard: Dashboard = {
          id: tempId,
          ...dashboardData,
          layout: dashboardData.layout || [],
          widgets: dashboardData.widgets || [],
          createdBy: userId,
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          dashboards: [...state.dashboards, localDashboard],
        }));
        
        // Sync to server
        try {
          const request = dashboardApi.toCreateRequest(dashboardData);
          const dto = await dashboardApi.create(request, userId);
          const serverDashboard = dashboardApi.fromDto(dto);
          
          // Replace local version with server version (including currentDashboard if it matches)
          set((state) => ({
            dashboards: state.dashboards.map(d => 
              d.id === tempId ? serverDashboard : d
            ),
            currentDashboard: state.currentDashboard?.id === tempId 
              ? serverDashboard 
              : state.currentDashboard,
          }));
          
          return serverDashboard;
        } catch (error) {
          console.error('Failed to create dashboard on server:', error);
          set({ lastError: error instanceof Error ? error.message : 'Failed to create dashboard' });
          return localDashboard;
        }
      },
      
      // Get dashboard by ID
      getDashboard: (id) => {
        return get().dashboards.find(d => d.id === id);
      },
      
      // Update dashboard
      updateDashboard: async (id, updates, userId) => {
        // Optimistic update - update locally first
        set((state) => ({
          dashboards: state.dashboards.map(d =>
            d.id === id
              ? { ...d, ...updates, updatedAt: new Date() }
              : d
          ),
          currentDashboard:
            state.currentDashboard?.id === id
              ? { ...state.currentDashboard, ...updates, updatedAt: new Date() }
              : state.currentDashboard,
        }));
        
        // Sync to server (fire and forget)
        try {
          const request = dashboardApi.toUpdateRequest(updates);
          const dto = await dashboardApi.update(id, request, userId);
          const serverDashboard = dashboardApi.fromDto(dto);
          
          // Update with server version
          set((state) => ({
            dashboards: state.dashboards.map(d => 
              d.id === id ? serverDashboard : d
            ),
            currentDashboard:
              state.currentDashboard?.id === id ? serverDashboard : state.currentDashboard,
          }));
        } catch (error) {
          console.error('Failed to update dashboard on server:', error);
          set({ lastError: error instanceof Error ? error.message : 'Failed to update dashboard' });
        }
      },
      
      // Delete dashboard
      deleteDashboard: async (id, userId) => {
        // Optimistic update - delete locally first
        set((state) => ({
          dashboards: state.dashboards.filter(d => d.id !== id),
          currentDashboard:
            state.currentDashboard?.id === id ? null : state.currentDashboard,
        }));
        
        // Sync to server (fire and forget)
        try {
          await dashboardApi.delete(id, userId);
        } catch (error) {
          console.error('Failed to delete dashboard on server:', error);
          set({ lastError: error instanceof Error ? error.message : 'Failed to delete dashboard' });
        }
      },
      
      // List dashboards with optional filters
      listDashboards: (filters) => {
        const { dashboards } = get();
        return filterDashboards(dashboards, filters);
      },
      
      // Set current dashboard
      setCurrentDashboard: (dashboard) => {
        set({ currentDashboard: dashboard });
      },
      
      // Set edit mode
      setEditMode: (isEditMode) => {
        set({ isEditMode });
      },
      
      // Add widget to dashboard
      addWidget: async (dashboardId, widgetData, layoutData, userId) => {
        const now = new Date();
        const widgetId = generateId();
        
        const newWidget: Widget = {
          id: widgetId,
          ...widgetData,
          createdAt: now,
          updatedAt: now,
        };
        
        const newLayoutItem: LayoutItem = {
          i: widgetId,
          ...layoutData,
        };
        
        // Optimistic update
        set((state) => ({
          dashboards: state.dashboards.map(d =>
            d.id === dashboardId
              ? {
                  ...d,
                  widgets: [...(d.widgets || []), newWidget],
                  layout: [...(d.layout || []), newLayoutItem],
                  updatedAt: now,
                }
              : d
          ),
          currentDashboard:
            state.currentDashboard?.id === dashboardId
              ? {
                  ...state.currentDashboard,
                  widgets: [...(state.currentDashboard.widgets || []), newWidget],
                  layout: [...(state.currentDashboard.layout || []), newLayoutItem],
                  updatedAt: now,
                }
              : state.currentDashboard,
        }));
        
        // Sync to server (fire and forget)
        const dashboard = get().getDashboard(dashboardId);
        if (dashboard) {
          dashboardApi.update(
            dashboardId,
            { widgets: dashboard.widgets, layout: dashboard.layout },
            userId
          ).catch(error => {
            console.error('Failed to sync widget addition:', error);
            set({ lastError: error instanceof Error ? error.message : 'Failed to sync widget' });
          });
        }
        
        return newWidget;
      },
      
      // Update widget
      updateWidget: async (dashboardId, widgetId, updates, userId) => {
        const now = new Date();
        
        // Optimistic update
        set((state) => ({
          dashboards: state.dashboards.map(d =>
            d.id === dashboardId
              ? {
                  ...d,
                  widgets: (d.widgets || []).map(w =>
                    w.id === widgetId
                      ? { ...w, ...updates, updatedAt: now }
                      : w
                  ),
                  updatedAt: now,
                }
              : d
          ),
          currentDashboard:
            state.currentDashboard?.id === dashboardId
              ? {
                  ...state.currentDashboard,
                  widgets: (state.currentDashboard.widgets || []).map(w =>
                    w.id === widgetId
                      ? { ...w, ...updates, updatedAt: now }
                      : w
                  ),
                  updatedAt: now,
                }
              : state.currentDashboard,
        }));
        
        // Sync to server (fire and forget)
        const dashboard = get().getDashboard(dashboardId);
        if (dashboard) {
          dashboardApi.update(
            dashboardId,
            { widgets: dashboard.widgets },
            userId
          ).catch(error => {
            console.error('Failed to sync widget update:', error);
            set({ lastError: error instanceof Error ? error.message : 'Failed to sync widget' });
          });
        }
      },
      
      // Delete widget
      deleteWidget: async (dashboardId, widgetId, userId) => {
        const now = new Date();
        
        // Optimistic update
        set((state) => ({
          dashboards: state.dashboards.map(d =>
            d.id === dashboardId
              ? {
                  ...d,
                  widgets: (d.widgets || []).filter(w => w.id !== widgetId),
                  layout: (d.layout || []).filter(l => l.i !== widgetId),
                  updatedAt: now,
                }
              : d
          ),
          currentDashboard:
            state.currentDashboard?.id === dashboardId
              ? {
                  ...state.currentDashboard,
                  widgets: (state.currentDashboard.widgets || []).filter(w => w.id !== widgetId),
                  layout: (state.currentDashboard.layout || []).filter(l => l.i !== widgetId),
                  updatedAt: now,
                }
              : state.currentDashboard,
        }));
        
        // Sync to server (fire and forget)
        const dashboard = get().getDashboard(dashboardId);
        if (dashboard) {
          dashboardApi.update(
            dashboardId,
            { widgets: dashboard.widgets, layout: dashboard.layout },
            userId
          ).catch(error => {
            console.error('Failed to sync widget deletion:', error);
            set({ lastError: error instanceof Error ? error.message : 'Failed to sync widget' });
          });
        }
      },
      
      // Update layout
      updateLayout: async (dashboardId, layout, userId) => {
        const now = new Date();
        
        // Optimistic update
        set((state) => ({
          dashboards: state.dashboards.map(d =>
            d.id === dashboardId
              ? { ...d, layout, updatedAt: now }
              : d
          ),
          currentDashboard:
            state.currentDashboard?.id === dashboardId
              ? { ...state.currentDashboard, layout, updatedAt: now }
              : state.currentDashboard,
        }));
        
        // Sync to server (fire and forget)
        dashboardApi.update(
          dashboardId,
          { layout },
          userId
        ).catch(error => {
          console.error('Failed to sync layout update:', error);
          set({ lastError: error instanceof Error ? error.message : 'Failed to sync layout' });
        });
      },
      
      // Create dashboard from template
      createFromTemplate: async (templateId, name, userId) => {
        const template = get().dashboards.find(d => d.id === templateId && d.isTemplate);
        
        if (!template) return null;
        
        const now = new Date();
        const newWidgets: Widget[] = template.widgets.map(w => ({
          ...w,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        }));
        
        // Map old widget IDs to new widget IDs for layout
        const widgetIdMap = new Map(
          template.widgets.map((w, idx) => [w.id, newWidgets[idx].id])
        );
        
        const newLayout: LayoutItem[] = template.layout.map(l => ({
          ...l,
          i: widgetIdMap.get(l.i) || l.i,
        }));
        
        const dashboardData = {
          name,
          description: template.description,
          layout: newLayout,
          widgets: newWidgets,
          isTemplate: false,
          tags: template.tags,
          displayOrder: 0,
          dashboardType: 0, // DashboardType.Root
        };
        
        // Use createDashboard to handle API sync
        return await get().createDashboard(dashboardData, userId);
      },
      
      // Duplicate dashboard
      duplicateDashboard: async (id, newName, userId) => {
        const dashboard = get().getDashboard(id);
        
        if (!dashboard) return null;
        
        const now = new Date();
        const newWidgets: Widget[] = dashboard.widgets.map(w => ({
          ...w,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        }));
        
        // Map old widget IDs to new widget IDs for layout
        const widgetIdMap = new Map(
          dashboard.widgets.map((w, idx) => [w.id, newWidgets[idx].id])
        );
        
        const newLayout: LayoutItem[] = dashboard.layout.map(l => ({
          ...l,
          i: widgetIdMap.get(l.i) || l.i,
        }));
        
        const dashboardData = {
          name: newName,
          description: dashboard.description,
          layout: newLayout,
          widgets: newWidgets,
          isTemplate: false,
          tags: dashboard.tags,
          displayOrder: 0,
          dashboardType: 0, // DashboardType.Root
        };
        
        // Use createDashboard to handle API sync
        return await get().createDashboard(dashboardData, userId);
      },
      
      // Clear all dashboards (for testing)
      clearAll: () => {
        set({
          dashboards: [],
          currentDashboard: null,
          isEditMode: false,
        });
      },
    }),
    {
      name: 'sensormine-dashboards',
      version: 1,
    }
  )
);
