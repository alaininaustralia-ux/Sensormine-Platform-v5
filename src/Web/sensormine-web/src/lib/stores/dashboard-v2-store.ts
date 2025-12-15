// Dashboard V2 Zustand Store
// Manages dashboard state, widgets, events, and interactions

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  Dashboard,
  DashboardStore,
  DashboardListItem,
  DashboardMode,
  Widget,
  WidgetEvent,
  DashboardTemplate,
  DigitalTwinNode,
  CreateDashboardRequest,
  UpdateDashboardRequest,
  PublishDashboardRequest,
  ApplyTemplateRequest,
  LayoutConfig,
  WidgetEventType,
} from '../types/dashboard-v2';

// Event handlers registry
type EventHandler = (event: WidgetEvent) => void;
const eventHandlers = new Map<WidgetEventType, Map<string, EventHandler[]>>();

export const useDashboardV2Store = create<DashboardStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        currentDashboard: null,
        currentMode: 'view',
        selectedWidgetId: null,
        selectedWidgetForConfig: null,
        dashboards: [],
        templates: [],
        digitalTwinFilter: null,
        widgetEvents: [],
        widgetPaletteVisible: true,
        loading: false,
        saving: false,

        // Dashboard CRUD
        loadDashboards: async () => {
          set({ loading: true });
          try {
            const response = await fetch('/api/dashboards', {
              headers: {
                'X-Tenant-Id': '00000000-0000-0000-0000-000000000001',
                'X-User-Id': 'demo-user',
              },
            });
            if (!response.ok) throw new Error('Failed to load dashboards');
            const dashboards: DashboardListItem[] = await response.json();
            set({ dashboards, loading: false });
          } catch (error) {
            console.error('Error loading dashboards:', error);
            set({ dashboards: [], loading: false });
            throw error;
          }
        },

        loadDashboard: async (id: string) => {
          // CRITICAL: Clear existing dashboard state FIRST to prevent contamination
          set({ 
            currentDashboard: null,
            selectedWidgetId: null,
            selectedWidgetForConfig: null,
            widgetEvents: [],
            loading: true 
          });

          try {
            const response = await fetch(`/api/dashboards/${id}`, {
              headers: {
                'X-Tenant-Id': '00000000-0000-0000-0000-000000000001',
                'X-User-Id': 'demo-user',
              },
            });
            if (!response.ok) throw new Error('Failed to load dashboard');
            const dashboard: Dashboard = await response.json();
            
            console.log('[Store] Loaded dashboard:', dashboard.id, 'version:', dashboard.version);
            
            // Ensure each widget's position.i is set to match its id (required for ReactGridLayout)
            dashboard.widgets?.forEach(widget => {
              if (!widget.position.i || widget.position.i === '') {
                widget.position.i = widget.id;
              }
            });
            
            // Fix layouts to ensure all 'i' values match widget IDs
            if (dashboard.widgets && dashboard.layout?.layouts) {
              const widgetIdMap = new Map(dashboard.widgets.map(w => [w.id, w]));
              Object.keys(dashboard.layout.layouts).forEach(breakpoint => {
                dashboard.layout.layouts[breakpoint as keyof typeof dashboard.layout.layouts] = 
                  dashboard.layout.layouts[breakpoint as keyof typeof dashboard.layout.layouts].map(layoutItem => {
                    // If this layout item references a valid widget, ensure i matches widget.id
                    const widget = widgetIdMap.get(layoutItem.i);
                    if (widget) {
                      return { ...layoutItem, i: widget.id };
                    }
                    return layoutItem;
                  }).filter(layoutItem => widgetIdMap.has(layoutItem.i)); // Remove orphaned layout items
              });
            }
            
            set({ currentDashboard: dashboard, loading: false });
          } catch (error) {
            console.error('Error loading dashboard:', error);
            set({ loading: false });
            throw error;
          }
        },

        createDashboard: async (request: CreateDashboardRequest) => {
          set({ saving: true });
          try {
            const response = await fetch('/api/dashboards', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Id': '00000000-0000-0000-0000-000000000001',
                'X-User-Id': 'demo-user',
              },
              body: JSON.stringify(request),
            });
            if (!response.ok) throw new Error('Failed to create dashboard');
            const dashboard: Dashboard = await response.json();
            set((state) => ({
              currentDashboard: dashboard,
              dashboards: [...state.dashboards, {
                id: dashboard.id,
                name: dashboard.name,
                description: dashboard.description,
                tags: dashboard.tags,
                state: dashboard.state,
                version: dashboard.version,
                widgetCount: dashboard.widgets.length,
                createdAt: dashboard.createdAt,
                updatedAt: dashboard.updatedAt,
                createdBy: dashboard.createdBy,
              }],
              saving: false,
            }));
            return dashboard;
          } catch (error) {
            console.error('Error creating dashboard:', error);
            set({ saving: false });
            throw error;
          }
        },

        updateDashboard: async (id: string, request: UpdateDashboardRequest) => {
          set({ saving: true });
          try {
            // Include current version for optimistic locking
            const currentVersion = get().currentDashboard?.version;
            const requestWithVersion = {
              ...request,
              expectedVersion: currentVersion,
            };

            const response = await fetch(`/api/dashboards/${id}`, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'X-Tenant-Id': '00000000-0000-0000-0000-000000000001',
                'X-User-Id': 'demo-user',
              },
              body: JSON.stringify(requestWithVersion),
            });

            // Handle version conflict (409 Conflict)
            if (response.status === 409) {
              const conflictData = await response.json();
              console.error('[Store] Version conflict detected:', conflictData);
              set({ saving: false });
              throw new Error('Dashboard was modified by another user. Please reload and try again.');
            }

            if (!response.ok) {
              const errorText = await response.text();
              console.error('[Store] Dashboard update failed:', response.status, errorText);
              throw new Error(`Failed to update dashboard: ${response.status}`);
            }

            const dashboard: Dashboard = await response.json();
            console.log('[Store] Dashboard updated successfully to version', dashboard.version);
            
            set((state) => ({
              currentDashboard: dashboard,
              dashboards: state.dashboards.map(d =>
                d.id === id
                  ? { 
                      ...d, 
                      name: dashboard.name, 
                      description: dashboard.description, 
                      version: dashboard.version,
                      updatedAt: dashboard.updatedAt 
                    }
                  : d
              ),
              saving: false,
            }));
            return dashboard;
          } catch (error) {
            console.error('[Store] Error updating dashboard:', error);
            set({ saving: false });
            throw error;
          }
        },

        deleteDashboard: async (id: string) => {
          set({ saving: true });
          try {
            const response = await fetch(`/api/dashboards/${id}`, {
              method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete dashboard');
            set((state) => ({
              dashboards: state.dashboards.filter(d => d.id !== id),
              currentDashboard: state.currentDashboard?.id === id ? null : state.currentDashboard,
              saving: false,
            }));
          } catch (error) {
            console.error('Error deleting dashboard:', error);
            set({ saving: false });
            throw error;
          }
        },

        publishDashboard: async (id: string, request: PublishDashboardRequest) => {
          set({ saving: true });
          try {
            const response = await fetch(`/api/dashboards/${id}/publish`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(request),
            });
            if (!response.ok) throw new Error('Failed to publish dashboard');
            const dashboard: Dashboard = await response.json();
            set((state) => ({
              currentDashboard: dashboard,
              dashboards: state.dashboards.map(d =>
                d.id === id
                  ? { ...d, state: dashboard.state, version: dashboard.version }
                  : d
              ),
              saving: false,
            }));
            return dashboard;
          } catch (error) {
            console.error('Error publishing dashboard:', error);
            set({ saving: false });
            throw error;
          }
        },

        // Mode & Selection
        setMode: (mode: DashboardMode) => {
          set({ currentMode: mode });
          // Clear selections when switching to view mode
          if (mode === 'view') {
            set({ selectedWidgetId: null, selectedWidgetForConfig: null });
          }
          // Clear widget selection when switching to design mode
          if (mode === 'design') {
            set({ selectedWidgetId: null });
          }
        },

        selectWidget: (widgetId: string | null) => {
          set({ selectedWidgetId: widgetId });
        },

        setSelectedWidgetForConfig: (widgetId: string | null) => {
          set({ selectedWidgetForConfig: widgetId });
        },

        setWidgetPaletteVisible: (visible: boolean) => {
          set({ widgetPaletteVisible: visible });
        },

        toggleWidgetPalette: () => {
          set((state) => ({ widgetPaletteVisible: !state.widgetPaletteVisible }));
        },

        // Widget Management
        addWidget: (widget: Omit<Widget, 'id'>) => {
          const newWidget: Widget = {
            ...widget,
            id: uuidv4(),
          };

          // Update widget position to include the id
          newWidget.position.i = newWidget.id;

          set((state) => {
            if (!state.currentDashboard) return state;

            // Add widget position to all layout breakpoints
            const updatedLayouts = { ...state.currentDashboard.layout.layouts };
            Object.keys(updatedLayouts).forEach(breakpoint => {
              updatedLayouts[breakpoint as keyof typeof updatedLayouts] = [
                ...updatedLayouts[breakpoint as keyof typeof updatedLayouts],
                { ...newWidget.position }
              ];
            });

            const updatedDashboard = {
              ...state.currentDashboard,
              widgets: [...state.currentDashboard.widgets, newWidget],
              layout: {
                ...state.currentDashboard.layout,
                layouts: updatedLayouts,
              },
            };

            return {
              currentDashboard: updatedDashboard,
              selectedWidgetForConfig: newWidget.id,
            };
          });
        },

        updateWidget: (widgetId: string, updates: Partial<Widget>) => {
          set((state) => {
            if (!state.currentDashboard) return state;

            const updatedWidgets = state.currentDashboard.widgets.map(w => {
              if (w.id === widgetId) {
                // Deep merge config if it exists in updates
                const updatedWidget = { ...w, ...updates };
                if (updates.config) {
                  updatedWidget.config = { ...w.config, ...updates.config };
                }
                return updatedWidget;
              }
              return w;
            });

            return {
              currentDashboard: {
                ...state.currentDashboard,
                widgets: updatedWidgets,
              },
            };
          });
        },

        removeWidget: (widgetId: string) => {
          set((state) => {
            if (!state.currentDashboard) return state;

            return {
              currentDashboard: {
                ...state.currentDashboard,
                widgets: state.currentDashboard.widgets.filter(w => w.id !== widgetId),
              },
              selectedWidgetId: state.selectedWidgetId === widgetId ? null : state.selectedWidgetId,
            };
          });
        },

        // Layout Management
        updateLayout: (layouts: LayoutConfig['layouts']) => {
          set((state) => {
            if (!state.currentDashboard) return state;

            // Update widget positions to match layout
            const updatedWidgets = state.currentDashboard.widgets.map(widget => {
              // Find the widget's layout position in the lg breakpoint
              const layoutPosition = layouts.lg.find(l => l.i === widget.id || l.i === widget.position.i);
              if (layoutPosition) {
                // Preserve minW, minH, maxW, maxH from widget's existing position
                const updatedPosition = {
                  ...layoutPosition,
                  i: widget.id, // Ensure i matches widget id
                  minW: widget.position.minW,
                  minH: widget.position.minH,
                  maxW: widget.position.maxW,
                  maxH: widget.position.maxH,
                };
                
                return {
                  ...widget,
                  position: updatedPosition,
                };
              }
              return widget;
            });

            return {
              currentDashboard: {
                ...state.currentDashboard,
                widgets: updatedWidgets,
                layout: {
                  ...state.currentDashboard.layout,
                  layouts,
                },
              },
            };
          });
        },

        // Digital Twin Filter
        setDigitalTwinFilter: (node: DigitalTwinNode | null) => {
          set({ digitalTwinFilter: node });
          
          // Publish filter event to all subscribed widgets
          if (node) {
            get().publishWidgetEvent({
              type: 'asset:selected',
              sourceWidgetId: 'digital-twin-filter',
              payload: {
                assetId: node.id,
              },
            });
          }
        },

        // Widget Event System
        publishWidgetEvent: (event: Omit<WidgetEvent, 'id' | 'timestamp'>) => {
          const fullEvent: WidgetEvent = {
            ...event,
            id: uuidv4(),
            timestamp: new Date().toISOString(),
          };

          set((state) => ({
            widgetEvents: [...state.widgetEvents.slice(-99), fullEvent], // Keep last 100 events
          }));

          // Notify subscribers
          const handlers = eventHandlers.get(event.type);
          if (handlers) {
            handlers.forEach((subscriberHandlers) => {
              subscriberHandlers.forEach((handler) => handler(fullEvent));
            });
          }
        },

        subscribeToEvent: (
          widgetId: string,
          eventType: WidgetEventType,
          handler: EventHandler
        ) => {
          if (!eventHandlers.has(eventType)) {
            eventHandlers.set(eventType, new Map());
          }

          const typeHandlers = eventHandlers.get(eventType)!;
          if (!typeHandlers.has(widgetId)) {
            typeHandlers.set(widgetId, []);
          }

          typeHandlers.get(widgetId)!.push(handler);

          // Return unsubscribe function
          return () => {
            const handlers = typeHandlers.get(widgetId);
            if (handlers) {
              const index = handlers.indexOf(handler);
              if (index > -1) {
                handlers.splice(index, 1);
              }
            }
          };
        },

        // Template Management
        loadTemplates: async () => {
          set({ loading: true });
          try {
            const response = await fetch('/api/dashboard-templates');
            if (!response.ok) throw new Error('Failed to load templates');
            const templates: DashboardTemplate[] = await response.json();
            set({ templates, loading: false });
          } catch (error) {
            console.error('Error loading templates:', error);
            set({ loading: false });
            throw error;
          }
        },

        applyTemplate: async (request: ApplyTemplateRequest) => {
          set({ saving: true });
          try {
            const response = await fetch('/api/dashboards/apply-template', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(request),
            });
            if (!response.ok) throw new Error('Failed to apply template');
            const dashboard: Dashboard = await response.json();
            set((state) => ({
              currentDashboard: dashboard,
              dashboards: [...state.dashboards, {
                id: dashboard.id,
                name: dashboard.name,
                description: dashboard.description,
                tags: dashboard.tags,
                state: dashboard.state,
                version: dashboard.version,
                widgetCount: dashboard.widgets.length,
                createdAt: dashboard.createdAt,
                updatedAt: dashboard.updatedAt,
                createdBy: dashboard.createdBy,
              }],
              saving: false,
            }));
            return dashboard;
          } catch (error) {
            console.error('Error applying template:', error);
            set({ saving: false });
            throw error;
          }
        },

        // Reset
        reset: () => {
          set({
            currentDashboard: null,
            currentMode: 'view',
            selectedWidgetId: null,
            digitalTwinFilter: null,
            widgetEvents: [],
          });
          eventHandlers.clear();
        },
      }),
      {
        name: 'dashboard-v2-storage',
        version: 2, // Increment version to trigger migration
        migrate: (persistedState: any, version: number) => {
          // Migration from v1 or v0: Remove currentDashboard from localStorage
          if (version < 2) {
            console.log('[Store] Migrating dashboard storage from v' + version + ' to v2 - cleaning up old data');
            // Only keep dashboard list, remove everything else that could cause contamination
            return {
              dashboards: persistedState?.dashboards || [],
              templates: [],
              currentDashboard: null,
              currentMode: 'view',
              selectedWidgetId: null,
              selectedWidgetForConfig: null,
              digitalTwinFilter: null,
              widgetEvents: [],
              widgetPaletteVisible: true,
              loading: false,
              saving: false,
            };
          }
          return persistedState;
        },
        partialize: (state) => ({
          // ONLY persist dashboard list metadata, NOT current dashboard
          // This prevents state contamination between dashboards
          dashboards: state.dashboards.map(d => ({
            id: d.id,
            name: d.name,
            description: d.description,
            state: d.state,
            version: d.version,
            tags: d.tags,
            widgetCount: d.widgetCount,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
            createdBy: d.createdBy,
          })),
        }),
      }
    ),
    { name: 'DashboardV2Store' }
  )
);

// Selector hooks for performance
export const useCurrentDashboard = () => useDashboardV2Store((state) => state.currentDashboard);
export const useCurrentMode = () => useDashboardV2Store((state) => state.currentMode);
export const useSelectedWidgetId = () => useDashboardV2Store((state) => state.selectedWidgetId);
export const useDigitalTwinFilter = () => useDashboardV2Store((state) => state.digitalTwinFilter);
export const useDashboardLoading = () => useDashboardV2Store((state) => state.loading);
export const useDashboardSaving = () => useDashboardV2Store((state) => state.saving);
