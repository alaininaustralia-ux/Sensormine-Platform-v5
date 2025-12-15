/**
 * Dashboard Components Tests (Story 4.1)
 * Updated to use consolidated WIDGET_REGISTRY
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WidgetPalette } from '@/components/dashboard/WidgetPalette';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { WidgetConfigPanel } from '@/components/dashboard/WidgetConfigPanel';
import { DashboardToolbar } from '@/components/dashboard/DashboardToolbar';
import { useDashboardStore } from '@/lib/dashboard/store';
import { getAvailableWidgets } from '@/lib/stores/widget-registry';

describe('Dashboard Components', () => {
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

  describe('WidgetPalette', () => {
    it('renders all widget types from registry', () => {
      render(<WidgetPalette />);
      
      const availableWidgets = getAvailableWidgets();
      availableWidgets.forEach((widget) => {
        expect(screen.getByText(widget.name)).toBeInTheDocument();
      });
    });

    it('displays widget descriptions', () => {
      render(<WidgetPalette />);
      
      // Check for a specific widget description
      expect(screen.getByText(/time-series data visualization/i)).toBeInTheDocument();
    });

    it('renders draggable widget items', () => {
      render(<WidgetPalette />);
      
      const chartItem = screen.getByText('Time-Series Chart').closest('[draggable]');
      expect(chartItem).toHaveAttribute('draggable', 'true');
    });
  });

  describe('DashboardGrid', () => {
    it('shows empty state when no dashboard loaded', () => {
      render(<DashboardGrid />);
      
      expect(screen.getByText(/No dashboard loaded/i)).toBeInTheDocument();
    });

    it('shows empty state when dashboard has no widgets', () => {
      useDashboardStore.getState().createDashboard('Test');
      
      render(<DashboardGrid />);
      
      expect(screen.getByText(/No widgets yet/i)).toBeInTheDocument();
    });

    it('renders widgets when dashboard has widgets', () => {
      useDashboardStore.getState().createDashboard('Test');
      useDashboardStore.getState().addWidget('chart');
      
      render(<DashboardGrid />);
      
      expect(screen.getByText('Time-Series Chart')).toBeInTheDocument();
    });

    it('has testid for grid container', () => {
      useDashboardStore.getState().createDashboard('Test');
      
      render(<DashboardGrid />);
      
      expect(screen.getByTestId('dashboard-grid')).toBeInTheDocument();
    });
  });

  describe('WidgetConfigPanel', () => {
    it('shows placeholder when no widget selected', () => {
      useDashboardStore.getState().createDashboard('Test');
      
      render(<WidgetConfigPanel />);
      
      expect(screen.getByText(/Select a widget to configure/i)).toBeInTheDocument();
    });

    it('shows widget config when widget is selected', () => {
      useDashboardStore.getState().createDashboard('Test');
      const widget = useDashboardStore.getState().addWidget('chart');
      useDashboardStore.getState().selectWidget(widget!.id);
      
      render(<WidgetConfigPanel />);
      
      expect(screen.getByText(/Configure chart widget/i)).toBeInTheDocument();
    });

    it('allows editing widget title', async () => {
      const user = userEvent.setup();
      useDashboardStore.getState().createDashboard('Test');
      const widget = useDashboardStore.getState().addWidget('chart');
      useDashboardStore.getState().selectWidget(widget!.id);
      
      render(<WidgetConfigPanel />);
      
      const titleInput = screen.getByLabelText(/Title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'New Title');
      
      const { dashboard } = useDashboardStore.getState();
      const updatedWidget = dashboard?.widgets.find((w) => w.id === widget!.id);
      expect(updatedWidget?.title).toBe('New Title');
    });
  });

  describe('DashboardToolbar', () => {
    beforeEach(() => {
      useDashboardStore.getState().createDashboard('Test Dashboard');
    });

    it('displays dashboard name', () => {
      render(<DashboardToolbar />);
      
      expect(screen.getByText('Test Dashboard')).toBeInTheDocument();
    });

    it('shows edit button when not editing', () => {
      useDashboardStore.getState().setEditing(false);
      
      render(<DashboardToolbar />);
      
      expect(screen.getByText(/Edit/i)).toBeInTheDocument();
    });

    it('shows preview button when editing', () => {
      useDashboardStore.getState().setEditing(true);
      
      render(<DashboardToolbar />);
      
      expect(screen.getByText(/Preview/i)).toBeInTheDocument();
    });

    it('toggles editing mode on button click', async () => {
      const user = userEvent.setup();
      useDashboardStore.getState().setEditing(false);
      
      render(<DashboardToolbar />);
      
      await user.click(screen.getByText(/Edit/i));
      
      expect(useDashboardStore.getState().isEditing).toBe(true);
    });

    it('shows unsaved changes indicator when dirty', () => {
      useDashboardStore.getState().setDirty(true);
      
      render(<DashboardToolbar />);
      
      expect(screen.getByText(/Unsaved changes/i)).toBeInTheDocument();
    });

    it('shows undo/redo buttons in edit mode', () => {
      useDashboardStore.getState().setEditing(true);
      
      render(<DashboardToolbar />);
      
      expect(screen.getByTitle('Undo')).toBeInTheDocument();
      expect(screen.getByTitle('Redo')).toBeInTheDocument();
    });
  });
});
