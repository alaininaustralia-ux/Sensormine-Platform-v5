/**
 * Dashboard Store
 * 
 * Zustand store for managing dashboard state, including CRUD operations,
 * widget management, and persistence to LocalStorage.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Dashboard, Widget, LayoutItem, DashboardFilters } from '../types/dashboard';

interface DashboardState {
  // State
  dashboards: Dashboard[];
  currentDashboard: Dashboard | null;
  isEditMode: boolean;
  
  // Dashboard CRUD operations
  createDashboard: (dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>) => Dashboard;
  getDashboard: (id: string) => Dashboard | undefined;
  updateDashboard: (id: string, updates: Partial<Dashboard>) => void;
  deleteDashboard: (id: string) => void;
  listDashboards: (filters?: DashboardFilters) => Dashboard[];
  
  // Dashboard state management
  setCurrentDashboard: (dashboard: Dashboard | null) => void;
  setEditMode: (isEditMode: boolean) => void;
  
  // Widget operations
  addWidget: (dashboardId: string, widget: Omit<Widget, 'id' | 'createdAt' | 'updatedAt'>, layout: Omit<LayoutItem, 'i'>) => Widget;
  updateWidget: (dashboardId: string, widgetId: string, updates: Partial<Widget>) => void;
  deleteWidget: (dashboardId: string, widgetId: string) => void;
  
  // Layout operations
  updateLayout: (dashboardId: string, layout: LayoutItem[]) => void;
  
  // Template operations
  createFromTemplate: (templateId: string, name: string) => Dashboard | null;
  
  // Utility operations
  duplicateDashboard: (id: string, newName: string) => Dashboard | null;
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
      
      // Create a new dashboard
      createDashboard: (dashboardData) => {
        const now = new Date();
        const newDashboard: Dashboard = {
          id: generateId(),
          ...dashboardData,
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          dashboards: [...state.dashboards, newDashboard],
        }));
        
        return newDashboard;
      },
      
      // Get dashboard by ID
      getDashboard: (id) => {
        return get().dashboards.find(d => d.id === id);
      },
      
      // Update dashboard
      updateDashboard: (id, updates) => {
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
      },
      
      // Delete dashboard
      deleteDashboard: (id) => {
        set((state) => ({
          dashboards: state.dashboards.filter(d => d.id !== id),
          currentDashboard:
            state.currentDashboard?.id === id ? null : state.currentDashboard,
        }));
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
      addWidget: (dashboardId, widgetData, layoutData) => {
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
        
        set((state) => ({
          dashboards: state.dashboards.map(d =>
            d.id === dashboardId
              ? {
                  ...d,
                  widgets: [...d.widgets, newWidget],
                  layout: [...d.layout, newLayoutItem],
                  updatedAt: now,
                }
              : d
          ),
          currentDashboard:
            state.currentDashboard?.id === dashboardId
              ? {
                  ...state.currentDashboard,
                  widgets: [...state.currentDashboard.widgets, newWidget],
                  layout: [...state.currentDashboard.layout, newLayoutItem],
                  updatedAt: now,
                }
              : state.currentDashboard,
        }));
        
        return newWidget;
      },
      
      // Update widget
      updateWidget: (dashboardId, widgetId, updates) => {
        const now = new Date();
        
        set((state) => ({
          dashboards: state.dashboards.map(d =>
            d.id === dashboardId
              ? {
                  ...d,
                  widgets: d.widgets.map(w =>
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
                  widgets: state.currentDashboard.widgets.map(w =>
                    w.id === widgetId
                      ? { ...w, ...updates, updatedAt: now }
                      : w
                  ),
                  updatedAt: now,
                }
              : state.currentDashboard,
        }));
      },
      
      // Delete widget
      deleteWidget: (dashboardId, widgetId) => {
        const now = new Date();
        
        set((state) => ({
          dashboards: state.dashboards.map(d =>
            d.id === dashboardId
              ? {
                  ...d,
                  widgets: d.widgets.filter(w => w.id !== widgetId),
                  layout: d.layout.filter(l => l.i !== widgetId),
                  updatedAt: now,
                }
              : d
          ),
          currentDashboard:
            state.currentDashboard?.id === dashboardId
              ? {
                  ...state.currentDashboard,
                  widgets: state.currentDashboard.widgets.filter(w => w.id !== widgetId),
                  layout: state.currentDashboard.layout.filter(l => l.i !== widgetId),
                  updatedAt: now,
                }
              : state.currentDashboard,
        }));
      },
      
      // Update layout
      updateLayout: (dashboardId, layout) => {
        const now = new Date();
        
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
      },
      
      // Create dashboard from template
      createFromTemplate: (templateId, name) => {
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
        
        const newDashboard: Dashboard = {
          id: generateId(),
          name,
          description: template.description,
          layout: newLayout,
          widgets: newWidgets,
          isTemplate: false,
          createdBy: 'current-user', // TODO: Get from auth context
          createdAt: now,
          updatedAt: now,
          tags: template.tags,
        };
        
        set((state) => ({
          dashboards: [...state.dashboards, newDashboard],
        }));
        
        return newDashboard;
      },
      
      // Duplicate dashboard
      duplicateDashboard: (id, newName) => {
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
        
        const newDashboard: Dashboard = {
          ...dashboard,
          id: generateId(),
          name: newName,
          layout: newLayout,
          widgets: newWidgets,
          isTemplate: false,
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          dashboards: [...state.dashboards, newDashboard],
        }));
        
        return newDashboard;
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
