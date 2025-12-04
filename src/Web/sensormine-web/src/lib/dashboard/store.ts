/**
 * Dashboard Store
 * Zustand store for dashboard builder state management (Story 4.1)
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Dashboard,
  DashboardWidget,
  DashboardBuilderState,
  WidgetPosition,
  WidgetConfig,
  DataSource,
  WidgetStyling,
  DashboardLayoutType,
} from './types';
import { getWidgetByType, GRID_CONFIG } from './widget-library';

interface DashboardStore extends DashboardBuilderState {
  // Dashboard operations
  createDashboard: (name: string, layoutType?: DashboardLayoutType, templateId?: string) => Dashboard;
  loadDashboard: (dashboard: Dashboard) => void;
  saveDashboard: () => Dashboard | null;
  clearDashboard: () => void;

  // Widget operations
  addWidget: (type: string, position?: Partial<WidgetPosition>) => DashboardWidget | null;
  removeWidget: (widgetId: string) => void;
  updateWidget: (widgetId: string, updates: Partial<DashboardWidget>) => void;
  selectWidget: (widgetId: string | null) => void;
  moveWidget: (widgetId: string, position: Partial<WidgetPosition>) => void;
  resizeWidget: (widgetId: string, size: { width: number; height: number }) => void;

  // Widget configuration
  updateWidgetConfig: (widgetId: string, config: WidgetConfig) => void;
  updateWidgetDataSource: (widgetId: string, dataSource: DataSource) => void;
  updateWidgetStyling: (widgetId: string, styling: Partial<WidgetStyling>) => void;

  // Editing state
  setEditing: (isEditing: boolean) => void;
  setDirty: (isDirty: boolean) => void;

  // History (undo/redo)
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Dashboard metadata
  updateDashboardName: (name: string) => void;
  updateDashboardDescription: (description: string) => void;
  setSharing: (isShared: boolean, sharedWith?: string[]) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
}

/**
 * Create an empty dashboard
 */
function createEmptyDashboard(name: string, layoutType: DashboardLayoutType = 'grid', createdBy: string = 'user'): Dashboard {
  return {
    id: uuidv4(),
    name,
    layoutType,
    widgets: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy,
    isShared: false,
    tags: [],
  };
}

/**
 * Find next available position in grid
 */
function findNextAvailablePosition(widgets: DashboardWidget[], newWidth: number, newHeight: number): WidgetPosition {
  const occupied = new Set<string>();
  
  // Mark all occupied cells
  widgets.forEach((widget) => {
    for (let x = widget.position.x; x < widget.position.x + widget.position.width; x++) {
      for (let y = widget.position.y; y < widget.position.y + widget.position.height; y++) {
        occupied.add(`${x},${y}`);
      }
    }
  });

  // Find first available position
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x <= GRID_CONFIG.columns - newWidth; x++) {
      let canPlace = true;
      for (let dx = 0; dx < newWidth && canPlace; dx++) {
        for (let dy = 0; dy < newHeight && canPlace; dy++) {
          if (occupied.has(`${x + dx},${y + dy}`)) {
            canPlace = false;
          }
        }
      }
      if (canPlace) {
        return { x, y, width: newWidth, height: newHeight };
      }
    }
  }

  // Default to appending at bottom
  const maxY = widgets.reduce((max, w) => Math.max(max, w.position.y + w.position.height), 0);
  return { x: 0, y: maxY, width: newWidth, height: newHeight };
}

/**
 * Dashboard store
 */
export const useDashboardStore = create<DashboardStore>((set, get) => ({
  // Initial state
  dashboard: null,
  selectedWidgetId: null,
  isEditing: false,
  isDirty: false,
  history: [],
  historyIndex: -1,

  // Dashboard operations
  createDashboard: (name, layoutType = 'grid', _templateId) => {
    const dashboard = createEmptyDashboard(name, layoutType);
    set({
      dashboard,
      selectedWidgetId: null,
      isEditing: true,
      isDirty: false,
      history: [dashboard],
      historyIndex: 0,
    });
    return dashboard;
  },

  loadDashboard: (dashboard) => {
    set({
      dashboard: { ...dashboard },
      selectedWidgetId: null,
      isEditing: false,
      isDirty: false,
      history: [dashboard],
      historyIndex: 0,
    });
  },

  saveDashboard: () => {
    const { dashboard } = get();
    if (!dashboard) return null;
    
    const savedDashboard = {
      ...dashboard,
      updatedAt: new Date().toISOString(),
    };
    
    set({ dashboard: savedDashboard, isDirty: false });
    return savedDashboard;
  },

  clearDashboard: () => {
    set({
      dashboard: null,
      selectedWidgetId: null,
      isEditing: false,
      isDirty: false,
      history: [],
      historyIndex: -1,
    });
  },

  // Widget operations
  addWidget: (type, position) => {
    const { dashboard, history, historyIndex } = get();
    if (!dashboard) return null;

    const libraryItem = getWidgetByType(type);
    if (!libraryItem) return null;

    const defaultSize = libraryItem.defaultSize;
    const widgetPosition = position
      ? {
          x: position.x ?? 0,
          y: position.y ?? 0,
          width: position.width ?? defaultSize.width,
          height: position.height ?? defaultSize.height,
        }
      : findNextAvailablePosition(dashboard.widgets, defaultSize.width, defaultSize.height);

    const newWidget: DashboardWidget = {
      id: uuidv4(),
      title: libraryItem.name,
      type: libraryItem.type,
      position: widgetPosition,
      config: libraryItem.defaultConfig,
    };

    const updatedDashboard = {
      ...dashboard,
      widgets: [...dashboard.widgets, newWidget],
      updatedAt: new Date().toISOString(),
    };

    // Update history for undo
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updatedDashboard);

    set({
      dashboard: updatedDashboard,
      selectedWidgetId: newWidget.id,
      isDirty: true,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    return newWidget;
  },

  removeWidget: (widgetId) => {
    const { dashboard, history, historyIndex, selectedWidgetId } = get();
    if (!dashboard) return;

    const updatedDashboard = {
      ...dashboard,
      widgets: dashboard.widgets.filter((w) => w.id !== widgetId),
      updatedAt: new Date().toISOString(),
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updatedDashboard);

    set({
      dashboard: updatedDashboard,
      selectedWidgetId: selectedWidgetId === widgetId ? null : selectedWidgetId,
      isDirty: true,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  updateWidget: (widgetId, updates) => {
    const { dashboard, history, historyIndex } = get();
    if (!dashboard) return;

    const updatedDashboard = {
      ...dashboard,
      widgets: dashboard.widgets.map((w) =>
        w.id === widgetId ? { ...w, ...updates } : w
      ),
      updatedAt: new Date().toISOString(),
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updatedDashboard);

    set({
      dashboard: updatedDashboard,
      isDirty: true,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  selectWidget: (widgetId) => {
    set({ selectedWidgetId: widgetId });
  },

  moveWidget: (widgetId, position) => {
    const { dashboard } = get();
    if (!dashboard) return;

    const widget = dashboard.widgets.find((w) => w.id === widgetId);
    if (!widget) return;

    get().updateWidget(widgetId, {
      position: {
        ...widget.position,
        x: position.x ?? widget.position.x,
        y: position.y ?? widget.position.y,
      },
    });
  },

  resizeWidget: (widgetId, size) => {
    const { dashboard } = get();
    if (!dashboard) return;

    const widget = dashboard.widgets.find((w) => w.id === widgetId);
    if (!widget) return;

    const newWidth = Math.min(Math.max(size.width, GRID_CONFIG.minWidgetWidth), GRID_CONFIG.maxWidgetWidth);
    const newHeight = Math.min(Math.max(size.height, GRID_CONFIG.minWidgetHeight), GRID_CONFIG.maxWidgetHeight);

    get().updateWidget(widgetId, {
      position: {
        ...widget.position,
        width: newWidth,
        height: newHeight,
      },
    });
  },

  // Widget configuration
  updateWidgetConfig: (widgetId, config) => {
    get().updateWidget(widgetId, { config });
  },

  updateWidgetDataSource: (widgetId, dataSource) => {
    get().updateWidget(widgetId, { dataSource });
  },

  updateWidgetStyling: (widgetId, styling) => {
    const { dashboard } = get();
    if (!dashboard) return;

    const widget = dashboard.widgets.find((w) => w.id === widgetId);
    if (!widget) return;

    get().updateWidget(widgetId, {
      styling: { ...widget.styling, ...styling },
    });
  },

  // Editing state
  setEditing: (isEditing) => {
    set({ isEditing });
  },

  setDirty: (isDirty) => {
    set({ isDirty });
  },

  // History (undo/redo)
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      set({
        dashboard: history[historyIndex - 1],
        historyIndex: historyIndex - 1,
        isDirty: true,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({
        dashboard: history[historyIndex + 1],
        historyIndex: historyIndex + 1,
        isDirty: true,
      });
    }
  },

  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },

  // Dashboard metadata
  updateDashboardName: (name) => {
    const { dashboard } = get();
    if (!dashboard) return;

    set({
      dashboard: { ...dashboard, name, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  updateDashboardDescription: (description) => {
    const { dashboard } = get();
    if (!dashboard) return;

    set({
      dashboard: { ...dashboard, description, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  setSharing: (isShared, sharedWith) => {
    const { dashboard } = get();
    if (!dashboard) return;

    set({
      dashboard: {
        ...dashboard,
        isShared,
        sharedWith: sharedWith || dashboard.sharedWith,
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  addTag: (tag) => {
    const { dashboard } = get();
    if (!dashboard) return;

    const tags = dashboard.tags || [];
    if (!tags.includes(tag)) {
      set({
        dashboard: { ...dashboard, tags: [...tags, tag], updatedAt: new Date().toISOString() },
        isDirty: true,
      });
    }
  },

  removeTag: (tag) => {
    const { dashboard } = get();
    if (!dashboard) return;

    const tags = dashboard.tags || [];
    set({
      dashboard: { ...dashboard, tags: tags.filter((t) => t !== tag), updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },
}));
