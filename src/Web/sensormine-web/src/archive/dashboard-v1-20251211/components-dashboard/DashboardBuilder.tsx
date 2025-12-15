/**
 * Dashboard Builder Component
 * Main component for the drag-and-drop dashboard editor (Story 4.1)
 */

'use client';

import React, { useEffect, useState } from 'react';
import { DashboardToolbar } from './DashboardToolbar';
import { WidgetPalette } from './WidgetPalette';
import { DashboardGrid } from './DashboardGrid';
import { WidgetConfigPanel } from './WidgetConfigPanel';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { DASHBOARD_TEMPLATES } from '@/lib/dashboard/widget-library';
import type { DashboardTemplate } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardBuilderProps {
  className?: string;
  dashboardId?: string;
}

export function DashboardBuilder({ className, dashboardId }: DashboardBuilderProps) {
  const {
    dashboard,
    isEditing,
    selectedWidgetId,
    createDashboard,
    setEditing,
  } = useDashboardStore();

  const [showTemplateSelector, setShowTemplateSelector] = useState(!dashboard);
  const [isDragging, setIsDragging] = useState(false);

  // Load dashboard if ID is provided
  useEffect(() => {
    if (dashboardId && !dashboard) {
      // In a real app, this would fetch from API
      // For now, we'll create a new dashboard
      createDashboard('My Dashboard');
      setEditing(true);
    }
  }, [dashboardId, dashboard, createDashboard, setEditing]);

  const handleCreateNew = () => {
    createDashboard('New Dashboard');
    setShowTemplateSelector(false);
    setEditing(true);
  };

  const handleSelectTemplate = (template: DashboardTemplate) => {
    createDashboard(template.name, template.layoutType, template.id);
    
    // Add template widgets with unique IDs
    template.widgets.forEach((widgetTemplate) => {
      useDashboardStore.getState().addWidget(widgetTemplate.type, widgetTemplate.position);
      const widgets = useDashboardStore.getState().dashboard?.widgets;
      if (widgets && widgets.length > 0) {
        const lastWidget = widgets[widgets.length - 1];
        useDashboardStore.getState().updateWidget(lastWidget.id, {
          title: widgetTemplate.title,
        });
      }
    });

    setShowTemplateSelector(false);
    setEditing(true);
  };

  const handleWidgetDragStart = () => {
    setIsDragging(true);
  };

  const handleWidgetConfigure = () => {
    // Widget is already selected when configure is clicked
    // The WidgetConfigPanel will show automatically
  };

  // Template selector view
  if (showTemplateSelector && !dashboard) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h1 className="text-2xl font-bold">Create Dashboard</h1>
        </div>
        <div className="flex-1 p-6 overflow-auto">
          <p className="text-muted-foreground mb-6">
            Choose a template to get started or create a blank dashboard.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {DASHBOARD_TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={() => handleSelectTemplate(template)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toolbar */}
      <DashboardToolbar
        onCreateNew={handleCreateNew}
        onOpenTemplates={() => setShowTemplateSelector(true)}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Widget Palette (left sidebar) - only visible in edit mode */}
        {isEditing && (
          <aside className="w-64 border-r overflow-y-auto">
            <WidgetPalette onWidgetDragStart={handleWidgetDragStart} />
          </aside>
        )}

        {/* Dashboard Grid (center) */}
        <main
          className={cn(
            'flex-1 overflow-auto bg-muted/30',
            isDragging && 'ring-2 ring-primary ring-inset'
          )}
          onDragEnd={() => setIsDragging(false)}
        >
          <DashboardGrid onWidgetConfigure={handleWidgetConfigure} />
        </main>

        {/* Configuration Panel (right sidebar) - only visible when widget is selected in edit mode */}
        {isEditing && selectedWidgetId && (
          <aside className="w-80 border-l overflow-y-auto">
            <WidgetConfigPanel />
          </aside>
        )}
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: DashboardTemplate;
  onSelect: () => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <Card className="cursor-pointer hover:border-primary transition-colors" onClick={onSelect}>
      <CardHeader>
        <CardTitle className="text-lg">{template.name}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
          {template.id === 'blank' ? (
            <span className="text-muted-foreground">Empty</span>
          ) : (
            <div className="grid grid-cols-4 gap-1 p-2 w-full h-full">
              {template.widgets.slice(0, 4).map((widget, i) => (
                <div
                  key={i}
                  className="bg-primary/20 rounded"
                  style={{
                    gridColumn: `span ${Math.min(widget.position.width, 2)}`,
                    gridRow: `span ${Math.min(widget.position.height, 2)}`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {template.widgets.length} widget{template.widgets.length !== 1 ? 's' : ''}
          </span>
          <Button size="sm" variant="outline">
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Export individual components for flexibility
export { DashboardToolbar } from './DashboardToolbar';
export { WidgetPalette } from './WidgetPalette';
export { DashboardGrid } from './DashboardGrid';
export { WidgetConfigPanel } from './WidgetConfigPanel';
export { DashboardWidgetComponent } from './DashboardWidget';
