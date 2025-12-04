/**
 * Dashboard Builder Page
 * 
 * Main page for creating and editing dashboards with drag-and-drop interface.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { getWidgetDefinition } from '@/lib/stores/widget-registry';
import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { WidgetLibrarySidebar } from '@/components/dashboard/builder/widget-library-sidebar';
import { DashboardToolbar } from '@/components/dashboard/builder/dashboard-toolbar';
import type { WidgetType, LayoutItem } from '@/lib/types/dashboard';

export default function DashboardBuilderPage() {
  const router = useRouter();
  const {
    currentDashboard,
    setCurrentDashboard,
    createDashboard,
    updateDashboard,
    addWidget,
    deleteWidget,
    updateLayout,
  } = useDashboardStore();
  
  const [isEditMode, setIsEditMode] = useState(true);
  
  // Initialize new dashboard on mount
  useEffect(() => {
    if (!currentDashboard) {
      const newDashboard = createDashboard({
        name: 'New Dashboard',
        description: '',
        layout: [],
        widgets: [],
        isTemplate: false,
        createdBy: 'current-user', // TODO: Get from auth
      });
      setCurrentDashboard(newDashboard);
    }
  }, [currentDashboard, createDashboard, setCurrentDashboard]);
  
  // Track dashboard name from current dashboard
  const dashboardName = currentDashboard?.name || '';
  
  const handleNameChange = (name: string) => {
    if (!currentDashboard) return;
    updateDashboard(currentDashboard.id, { name });
  };
  
  const handleAddWidget = (type: WidgetType) => {
    if (!currentDashboard) return;
    
    const widgetDef = getWidgetDefinition(type);
    if (!widgetDef) return;
    
    // Find the next available position
    const maxY = currentDashboard.layout.reduce(
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
      currentDashboard.id,
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
    if (!currentDashboard) return;
    deleteWidget(currentDashboard.id, widgetId);
  };
  
  const handleLayoutChange = (newLayout: LayoutItem[]) => {
    if (!currentDashboard) return;
    updateLayout(currentDashboard.id, newLayout);
  };
  
  const handleSave = () => {
    if (!currentDashboard) return;
    
    // Exit edit mode
    setIsEditMode(false);
    
    // Navigate to dashboard view
    router.push(`/dashboard/${currentDashboard.id}`);
  };
  
  const handleCancel = () => {
    // Navigate back to dashboard list
    router.push('/dashboard');
  };
  
  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };
  
  if (!currentDashboard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col">
      <DashboardToolbar
        dashboardName={dashboardName}
        onNameChange={handleNameChange}
        isEditMode={isEditMode}
        onToggleEditMode={handleToggleEditMode}
        onSave={handleSave}
        onCancel={handleCancel}
        isSaveDisabled={!dashboardName.trim()}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {isEditMode && (
          <WidgetLibrarySidebar onAddWidget={handleAddWidget} />
        )}
        
        <div className="flex-1 overflow-auto p-6 bg-muted/10">
          <DashboardGrid
            dashboard={currentDashboard}
            isEditMode={isEditMode}
            onLayoutChange={handleLayoutChange}
            onDeleteWidget={handleDeleteWidget}
          />
        </div>
      </div>
    </div>
  );
}
