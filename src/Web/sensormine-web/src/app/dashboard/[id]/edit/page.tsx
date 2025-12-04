/**
 * Dashboard Edit Page
 * 
 * Edits an existing dashboard with drag-and-drop interface.
 */

'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { getWidgetDefinition } from '@/lib/stores/widget-registry';
import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { WidgetLibrarySidebar } from '@/components/dashboard/builder/widget-library-sidebar';
import { DashboardToolbar } from '@/components/dashboard/builder/dashboard-toolbar';
import type { WidgetType, LayoutItem } from '@/lib/types/dashboard';

export default function DashboardEditPage() {
  const router = useRouter();
  const params = useParams();
  const dashboardId = params.id as string;
  
  const {
    getDashboard,
    setCurrentDashboard,
    updateDashboard,
    addWidget,
    deleteWidget,
    updateLayout,
  } = useDashboardStore();
  
  const dashboard = getDashboard(dashboardId);
  
  useEffect(() => {
    if (dashboard) {
      setCurrentDashboard(dashboard);
    }
  }, [dashboard, setCurrentDashboard]);
  
  const handleAddWidget = (type: WidgetType) => {
    if (!dashboard) return;
    
    const widgetDef = getWidgetDefinition(type);
    if (!widgetDef) return;
    
    // Find the next available position
    const maxY = dashboard.layout.reduce(
      (max, item) => Math.max(max, item.y + item.h),
      0
    );
    
    const layoutItem: Omit<LayoutItem, 'i'> = {
      x: 0,
      y: maxY,
      w: widgetDef.defaultSize.w,
      h: widgetDef.defaultSize.h,
      minW: widgetDef.minSize?.w,
      minH: widgetDef.minSize?.h,
    };
    
    addWidget(
      dashboard.id,
      {
        type,
        title: widgetDef.name,
        description: widgetDef.description,
        config: {},
      },
      layoutItem
    );
  };
  
  const handleDeleteWidget = (widgetId: string) => {
    if (!dashboard) return;
    deleteWidget(dashboard.id, widgetId);
  };
  
  const handleLayoutChange = (newLayout: LayoutItem[]) => {
    if (!dashboard) return;
    updateLayout(dashboard.id, newLayout);
  };
  
  const handleNameChange = (name: string) => {
    if (!dashboard) return;
    updateDashboard(dashboard.id, { name });
  };
  
  const handleSave = () => {
    if (!dashboard) return;
    router.push(`/dashboard/${dashboard.id}`);
  };
  
  const handleCancel = () => {
    if (!dashboard) return;
    router.push(`/dashboard/${dashboard.id}`);
  };
  
  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Dashboard not found</div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col">
      <DashboardToolbar
        dashboardName={dashboard.name}
        onNameChange={handleNameChange}
        isEditMode={true}
        onToggleEditMode={() => {}}
        onSave={handleSave}
        onCancel={handleCancel}
        isSaveDisabled={!dashboard.name.trim()}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <WidgetLibrarySidebar onAddWidget={handleAddWidget} />
        
        <div className="flex-1 overflow-auto p-6 bg-muted/10">
          <DashboardGrid
            dashboard={dashboard}
            isEditMode={true}
            onLayoutChange={handleLayoutChange}
            onDeleteWidget={handleDeleteWidget}
          />
        </div>
      </div>
    </div>
  );
}
