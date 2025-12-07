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
import { WidgetConfigDialog } from '@/components/dashboard/builder/widget-config-dialog';
import type { WidgetType, LayoutItem, Widget } from '@/lib/types/dashboard';

export default function DashboardBuilderPage() {
  const router = useRouter();
  const {
    currentDashboard,
    setCurrentDashboard,
    createDashboard,
    updateDashboard,
    addWidget,
    updateWidget,
    deleteWidget,
    updateLayout,
  } = useDashboardStore();
  
  const [isEditMode, setIsEditMode] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configureWidgetId, setConfigureWidgetId] = useState<string | null>(null);
  
  // Initialize new dashboard on mount
  useEffect(() => {
    if (!currentDashboard && !isInitializing) {
      const initializeDashboard = async () => {
        setIsInitializing(true);
        try {
          // TODO: Get userId from auth context when available
          const userId = 'demo-user';
          const newDashboard = await createDashboard({
            name: 'New Dashboard',
            description: '',
            layout: [],
            widgets: [],
            isTemplate: false,
            displayOrder: 0,
            dashboardType: 0, // DashboardType.Root
          }, userId);
          
          console.log('Dashboard created:', newDashboard);
          
          // Ensure dashboard has a valid server ID before proceeding
          if (!newDashboard || !newDashboard.id) {
            console.error('Failed to create dashboard - no ID returned');
            return;
          }
          
          setCurrentDashboard(newDashboard);
        } catch (error) {
          console.error('Failed to initialize dashboard:', error);
        } finally {
          setIsInitializing(false);
        }
      };
      initializeDashboard();
    }
  }, [currentDashboard, createDashboard, setCurrentDashboard, isInitializing]);
  
  // Track dashboard name from current dashboard
  const dashboardName = currentDashboard?.name || '';
  
  const handleNameChange = (name: string) => {
    if (!currentDashboard) return;
    // TODO: Get userId from auth context when available
    const userId = 'demo-user';
    updateDashboard(currentDashboard.id, { name }, userId);
  };
  
  const handleAddWidget = (type: WidgetType) => {
    if (!currentDashboard) return;
    
    const widgetDef = getWidgetDefinition(type);
    if (!widgetDef) return;
    
    // Find the next available position
    const maxY = (currentDashboard.layout || []).reduce(
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
    
    // TODO: Get userId from auth context when available
    const userId = 'demo-user';
    addWidget(
      currentDashboard.id,
      {
        type,
        title: widgetDef.name,
        description: widgetDef.description,
        config: {},
      },
      layoutItem,
      userId
    );
  };
  
  const handleConfigureWidget = (widgetId: string) => {
    setConfigureWidgetId(widgetId);
    setConfigDialogOpen(true);
  };

  const handleSaveConfiguration = (widgetId: string, updates: Partial<Widget>) => {
    if (!currentDashboard) return;
    // TODO: Get userId from auth context when available
    const userId = 'demo-user';
    updateWidget(currentDashboard.id, widgetId, updates, userId);
  };

  const handleDeleteWidget = (widgetId: string) => {
    if (!currentDashboard) return;
    // TODO: Get userId from auth context when available
    const userId = 'demo-user';
    deleteWidget(currentDashboard.id, widgetId, userId);
  };
  
  const handleLayoutChange = (newLayout: LayoutItem[]) => {
    if (!currentDashboard) return;
    // TODO: Get userId from auth context when available
    const userId = 'demo-user';
    updateLayout(currentDashboard.id, newLayout, userId);
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
            onConfigureWidget={handleConfigureWidget}
            onDeleteWidget={handleDeleteWidget}
          />
        </div>
      </div>

      {/* Widget Configuration Dialog */}
      {configureWidgetId && (
        <WidgetConfigDialog
          widget={currentDashboard.widgets.find(w => w.id === configureWidgetId) || null}
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
          onSave={handleSaveConfiguration}
        />
      )}
    </div>
  );
}
