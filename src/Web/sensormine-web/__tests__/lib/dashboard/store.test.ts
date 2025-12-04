/**
 * Dashboard Store Tests (Story 4.1)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useDashboardStore } from '@/lib/dashboard/store';

describe('Dashboard Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useDashboardStore.setState({
      dashboard: null,
      selectedWidgetId: null,
      isEditing: false,
      isDirty: false,
      history: [],
      historyIndex: -1,
    });
  });

  describe('Dashboard Operations', () => {
    it('creates a new dashboard', () => {
      const { createDashboard } = useDashboardStore.getState();
      
      const dashboard = createDashboard('Test Dashboard');
      
      expect(dashboard).toBeDefined();
      expect(dashboard.name).toBe('Test Dashboard');
      expect(dashboard.widgets).toEqual([]);
      expect(dashboard.layoutType).toBe('grid');
    });

    it('creates dashboard with custom layout type', () => {
      const { createDashboard } = useDashboardStore.getState();
      
      const dashboard = createDashboard('Test', 'freeform');
      
      expect(dashboard.layoutType).toBe('freeform');
    });

    it('sets isEditing to true after creating dashboard', () => {
      const { createDashboard } = useDashboardStore.getState();
      
      createDashboard('Test Dashboard');
      
      const { isEditing } = useDashboardStore.getState();
      expect(isEditing).toBe(true);
    });

    it('loads an existing dashboard', () => {
      const { loadDashboard } = useDashboardStore.getState();
      const existingDashboard = {
        id: 'test-id',
        name: 'Loaded Dashboard',
        layoutType: 'grid' as const,
        widgets: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'user',
        isShared: false,
      };
      
      loadDashboard(existingDashboard);
      
      const { dashboard } = useDashboardStore.getState();
      expect(dashboard?.name).toBe('Loaded Dashboard');
    });

    it('clears dashboard state', () => {
      const { createDashboard, clearDashboard } = useDashboardStore.getState();
      
      createDashboard('Test Dashboard');
      clearDashboard();
      
      const { dashboard, isEditing } = useDashboardStore.getState();
      expect(dashboard).toBeNull();
      expect(isEditing).toBe(false);
    });
  });

  describe('Widget Operations', () => {
    beforeEach(() => {
      useDashboardStore.getState().createDashboard('Test Dashboard');
    });

    it('adds a widget to the dashboard', () => {
      const { addWidget } = useDashboardStore.getState();
      
      const widget = addWidget('chart');
      
      expect(widget).toBeDefined();
      expect(widget?.type).toBe('chart');
      expect(widget?.title).toBe('Chart');
    });

    it('adds widget at specified position', () => {
      const { addWidget } = useDashboardStore.getState();
      
      const widget = addWidget('kpi', { x: 2, y: 3 });
      
      expect(widget?.position.x).toBe(2);
      expect(widget?.position.y).toBe(3);
    });

    it('removes a widget from the dashboard', () => {
      const { addWidget, removeWidget } = useDashboardStore.getState();
      
      const widget = addWidget('chart');
      expect(useDashboardStore.getState().dashboard?.widgets.length).toBe(1);
      
      removeWidget(widget!.id);
      
      expect(useDashboardStore.getState().dashboard?.widgets.length).toBe(0);
    });

    it('updates widget properties', () => {
      const { addWidget, updateWidget } = useDashboardStore.getState();
      
      const widget = addWidget('chart');
      updateWidget(widget!.id, { title: 'Updated Title' });
      
      const { dashboard } = useDashboardStore.getState();
      const updatedWidget = dashboard?.widgets.find((w) => w.id === widget!.id);
      expect(updatedWidget?.title).toBe('Updated Title');
    });

    it('selects a widget', () => {
      const { addWidget, selectWidget } = useDashboardStore.getState();
      
      const widget = addWidget('chart');
      selectWidget(widget!.id);
      
      const { selectedWidgetId } = useDashboardStore.getState();
      expect(selectedWidgetId).toBe(widget!.id);
    });

    it('deselects widget with null', () => {
      const { addWidget, selectWidget } = useDashboardStore.getState();
      
      const widget = addWidget('chart');
      selectWidget(widget!.id);
      selectWidget(null);
      
      const { selectedWidgetId } = useDashboardStore.getState();
      expect(selectedWidgetId).toBeNull();
    });

    it('moves widget to new position', () => {
      const { addWidget, moveWidget } = useDashboardStore.getState();
      
      const widget = addWidget('chart', { x: 0, y: 0 });
      moveWidget(widget!.id, { x: 4, y: 2 });
      
      const { dashboard } = useDashboardStore.getState();
      const movedWidget = dashboard?.widgets.find((w) => w.id === widget!.id);
      expect(movedWidget?.position.x).toBe(4);
      expect(movedWidget?.position.y).toBe(2);
    });

    it('resizes widget', () => {
      const { addWidget, resizeWidget } = useDashboardStore.getState();
      
      const widget = addWidget('chart');
      resizeWidget(widget!.id, { width: 6, height: 4 });
      
      const { dashboard } = useDashboardStore.getState();
      const resizedWidget = dashboard?.widgets.find((w) => w.id === widget!.id);
      expect(resizedWidget?.position.width).toBe(6);
      expect(resizedWidget?.position.height).toBe(4);
    });

    it('enforces minimum widget size', () => {
      const { addWidget, resizeWidget } = useDashboardStore.getState();
      
      const widget = addWidget('chart');
      resizeWidget(widget!.id, { width: 0, height: 0 });
      
      const { dashboard } = useDashboardStore.getState();
      const resizedWidget = dashboard?.widgets.find((w) => w.id === widget!.id);
      expect(resizedWidget?.position.width).toBeGreaterThanOrEqual(2);
      expect(resizedWidget?.position.height).toBeGreaterThanOrEqual(1);
    });
  });

  describe('History (Undo/Redo)', () => {
    beforeEach(() => {
      useDashboardStore.getState().createDashboard('Test Dashboard');
    });

    it('can undo widget addition', () => {
      const { addWidget, undo, canUndo } = useDashboardStore.getState();
      
      addWidget('chart');
      expect(useDashboardStore.getState().dashboard?.widgets.length).toBe(1);
      expect(canUndo()).toBe(true);
      
      undo();
      
      expect(useDashboardStore.getState().dashboard?.widgets.length).toBe(0);
    });

    it('can redo after undo', () => {
      const { addWidget, undo, redo, canRedo } = useDashboardStore.getState();
      
      addWidget('chart');
      undo();
      
      expect(canRedo()).toBe(true);
      
      redo();
      
      expect(useDashboardStore.getState().dashboard?.widgets.length).toBe(1);
    });

    it('cannot undo when at start of history', () => {
      const { canUndo } = useDashboardStore.getState();
      
      expect(canUndo()).toBe(false);
    });

    it('cannot redo when at end of history', () => {
      const { addWidget, canRedo } = useDashboardStore.getState();
      
      addWidget('chart');
      
      expect(canRedo()).toBe(false);
    });
  });

  describe('Dashboard Metadata', () => {
    beforeEach(() => {
      useDashboardStore.getState().createDashboard('Test Dashboard');
    });

    it('updates dashboard name', () => {
      const { updateDashboardName } = useDashboardStore.getState();
      
      updateDashboardName('New Name');
      
      const { dashboard } = useDashboardStore.getState();
      expect(dashboard?.name).toBe('New Name');
    });

    it('updates dashboard description', () => {
      const { updateDashboardDescription } = useDashboardStore.getState();
      
      updateDashboardDescription('A test description');
      
      const { dashboard } = useDashboardStore.getState();
      expect(dashboard?.description).toBe('A test description');
    });

    it('sets dashboard sharing', () => {
      const { setSharing } = useDashboardStore.getState();
      
      setSharing(true, ['user1', 'user2']);
      
      const { dashboard } = useDashboardStore.getState();
      expect(dashboard?.isShared).toBe(true);
      expect(dashboard?.sharedWith).toEqual(['user1', 'user2']);
    });

    it('adds and removes tags', () => {
      const { addTag, removeTag } = useDashboardStore.getState();
      
      addTag('operations');
      addTag('monitoring');
      
      let { dashboard } = useDashboardStore.getState();
      expect(dashboard?.tags).toContain('operations');
      expect(dashboard?.tags).toContain('monitoring');
      
      removeTag('operations');
      
      dashboard = useDashboardStore.getState().dashboard;
      expect(dashboard?.tags).not.toContain('operations');
      expect(dashboard?.tags).toContain('monitoring');
    });

    it('does not add duplicate tags', () => {
      const { addTag } = useDashboardStore.getState();
      
      addTag('test');
      addTag('test');
      
      const { dashboard } = useDashboardStore.getState();
      expect(dashboard?.tags?.filter((t) => t === 'test').length).toBe(1);
    });
  });

  describe('Dirty State', () => {
    beforeEach(() => {
      useDashboardStore.getState().createDashboard('Test Dashboard');
      useDashboardStore.getState().setDirty(false);
    });

    it('sets dirty flag on widget addition', () => {
      const { addWidget } = useDashboardStore.getState();
      
      addWidget('chart');
      
      const { isDirty } = useDashboardStore.getState();
      expect(isDirty).toBe(true);
    });

    it('clears dirty flag on save', () => {
      const { addWidget, saveDashboard } = useDashboardStore.getState();
      
      addWidget('chart');
      expect(useDashboardStore.getState().isDirty).toBe(true);
      
      saveDashboard();
      
      expect(useDashboardStore.getState().isDirty).toBe(false);
    });
  });
});
