'use client';

// Dashboard V2 Builder - Design Mode
// Main dashboard designer interface with drag-and-drop layout editing

import { use, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Responsive, WidthProvider, Layout as RGLLayout } from 'react-grid-layout';
import { Save, Eye, Settings2, Plus, Undo, Redo, Play, Pause } from 'lucide-react';
import { useDashboardV2Store } from '@/lib/stores/dashboard-v2-store';
import { useBreadcrumb } from '@/lib/contexts/breadcrumb-context';
import type { LayoutConfig } from '@/lib/types/dashboard-v2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { WidgetPalette } from '@/components/dashboard-v2/WidgetPalette';
import { ConfigurationPanel } from '@/components/dashboard-v2/ConfigurationPanel';
import { DashboardGrid } from '@/components/dashboard-v2/layout/DashboardGrid';
import { GridWidget } from '@/components/dashboard-v2/layout/GridWidget';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface DashboardBuilderProps {
  params: Promise<{ id: string }>;
}

export default function DashboardBuilderPage({ params }: DashboardBuilderProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const {
    currentDashboard,
    currentMode,
    selectedWidgetForConfig,
    loading,
    saving,
    loadDashboard,
    updateDashboard,
    setMode,
    setSelectedWidgetForConfig,
    removeWidget,
    updateLayout,
  } = useDashboardV2Store();

  const [dashboardName, setDashboardName] = useState(currentDashboard?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(currentDashboard?.settings?.autoRefresh ?? true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [selectedElement, setSelectedElement] = useState<{ elementId: string; elementName: string } | null>(null);
  const { setName } = useBreadcrumb();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (resolvedParams.id) {
      loadDashboard(resolvedParams.id).catch(() => {
        // If dashboard doesn't exist, redirect to list
        router.push('/dashboards');
      });
      setMode('design');
    }
  }, [resolvedParams.id, loadDashboard, router, setMode]);

  // Update breadcrumb when dashboard loads
  useEffect(() => {
    if (currentDashboard) {
      setName(currentDashboard.id, currentDashboard.name, 'dashboard');
    }
  }, [currentDashboard, setName]);

  // Sync local state when dashboard changes - this is intentional state synchronization
  useEffect(() => {
    if (currentDashboard) {
      setDashboardName(currentDashboard.name);
      setAutoRefresh(currentDashboard.settings?.autoRefresh ?? true);
    }
  }, [currentDashboard?.id, currentDashboard?.name, currentDashboard?.settings?.autoRefresh]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = useCallback(async () => {
    if (!currentDashboard) return;

    // Apply minimum size constraints before saving
    const MIN_WIDTH = 2;
    const MIN_HEIGHT = 3;
    const constrainedLayouts = Object.keys(currentDashboard.layout.layouts).reduce((acc, breakpoint) => {
      const bp = breakpoint as keyof typeof currentDashboard.layout.layouts;
      acc[bp] = currentDashboard.layout.layouts[bp].map(item => ({
        ...item,
        w: Math.max(item.w, MIN_WIDTH),
        h: Math.max(item.h, MIN_HEIGHT),
        minW: MIN_WIDTH,
        minH: MIN_HEIGHT,
      }));
      return acc;
    }, {} as typeof currentDashboard.layout.layouts);

    try {
      await updateDashboard(currentDashboard.id, {
        name: dashboardName,
        widgets: currentDashboard.widgets,
        layout: {
          ...currentDashboard.layout,
          layouts: constrainedLayouts,
        },
        settings: {
          autoRefresh,
          refreshInterval: currentDashboard.settings?.refreshInterval || '5m',
          showToolbar: currentDashboard.settings?.showToolbar ?? true,
          theme: currentDashboard.settings?.theme || 'auto',
        },
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save dashboard:', error);
    }
  }, [currentDashboard, dashboardName, autoRefresh, updateDashboard]);

  const handleLayoutChange = useCallback((layout: RGLLayout[], layouts: { [key: string]: RGLLayout[] }) => {
    if (currentMode === 'design' && currentDashboard) {
      // Check if layout actually changed to avoid infinite loops
      const currentLg = JSON.stringify(currentDashboard.layout.layouts.lg);
      const newLg = JSON.stringify(layouts.lg);
      
      if (currentLg !== newLg) {
        updateLayout(layouts as LayoutConfig['layouts']);
        setHasUnsavedChanges(true);
      }
    }
  }, [currentMode, currentDashboard, updateLayout]);

  const handleWidgetDelete = useCallback((widgetId: string) => {
    if (confirm('Are you sure you want to delete this widget?')) {
      removeWidget(widgetId);
      setHasUnsavedChanges(true);
    }
  }, [removeWidget]);

  const handleElementSelected = useCallback((widgetId: string, elementId: string, elementName: string) => {
    console.log('[DesignPage] Element selected:', elementId, elementName, 'from widget:', widgetId);
    setSelectedElement({ elementId, elementName });
    
    // Auto-open configuration panel if not already open for this widget
    if (selectedWidgetForConfig !== widgetId) {
      console.log('[DesignPage] Opening configuration panel for widget:', widgetId);
      setSelectedWidgetForConfig(widgetId);
    }
  }, [selectedWidgetForConfig]);

  // Reset selected element when widget selection changes
  useEffect(() => {
    setSelectedElement(null);
  }, [selectedWidgetForConfig]);

  const handleViewMode = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowExitConfirm(true);
    } else {
      router.push(`/dashboards/${resolvedParams.id}`);
    }
  }, [hasUnsavedChanges, router, resolvedParams.id]);

  const handleExitWithoutSaving = useCallback(() => {
    setShowExitConfirm(false);
    router.push(`/dashboards/${resolvedParams.id}`);
  }, [router, resolvedParams.id]);

  const handleSaveAndExit = useCallback(async () => {
    await handleSave();
    setShowExitConfirm(false);
    router.push(`/dashboards/${resolvedParams.id}`);
  }, [handleSave, router, resolvedParams.id]);

  const handleNameSave = useCallback(() => {
    setIsEditingName(false);
    if (currentDashboard && dashboardName !== currentDashboard.name) {
      handleSave();
    }
  }, [currentDashboard, dashboardName, handleSave]);

  if (loading || !currentDashboard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col -m-6 lg:-m-8">
      {/* Toolbar */}
      <div className="bg-background border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Dashboard Name */}
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <Input
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') {
                    setDashboardName(currentDashboard.name);
                    setIsEditingName(false);
                  }
                }}
                className="font-semibold text-lg h-8"
                autoFocus
              />
            ) : (
              <h1
                className="font-semibold text-lg cursor-pointer hover:text-primary"
                onClick={() => setIsEditingName(true)}
              >
                {dashboardName}
              </h1>
            )}
            <Badge variant={currentDashboard.state === 'published' ? 'default' : 'secondary'}>
              {currentDashboard.state}
            </Badge>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-muted rounded-md p-1">
            <Button
              variant={currentMode === 'view' ? 'default' : 'ghost'}
              size="sm"
              onClick={handleViewMode}
            >
              <Eye className="mr-2 h-4 w-4" />
              View
              {hasUnsavedChanges && <span className="ml-1 text-xs">*</span>}
            </Button>
            <Button
              variant={currentMode === 'design' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('design')}
            >
              <Settings2 className="mr-2 h-4 w-4" />
              Design
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-refresh toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? (
              <>
                <Play className="mr-2 h-4 w-4" />
                Auto-Refresh On
              </>
            ) : (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Auto-Refresh Off
              </>
            )}
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Action buttons */}
          <Button variant="outline" size="sm" disabled>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Redo className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button
            variant={hasUnsavedChanges ? "default" : "secondary"}
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : hasUnsavedChanges ? 'Save *' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Widget Palette (Design Mode Only) */}
        {currentMode === 'design' && (
          <div className="border-r overflow-y-auto relative">
            <WidgetPalette />
          </div>
        )}

        {/* Dashboard Canvas */}
        <div className="flex-1 overflow-auto bg-muted/20 p-4">
          {currentDashboard.widgets.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Plus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No widgets yet</h3>
                <p className="text-muted-foreground">
                  {currentMode === 'design'
                    ? 'Drag widgets from the palette to get started'
                    : 'Switch to Design mode to add widgets'}
                </p>
              </div>
            </div>
          ) : (
            <DashboardGrid
              layouts={currentDashboard.layout.layouts}
              breakpoints={currentDashboard.layout.breakpoints}
              cols={currentDashboard.layout.cols}
              isDraggable={currentMode === 'design'}
              isResizable={currentMode === 'design'}
              onLayoutChange={handleLayoutChange}
            >
              {currentDashboard.widgets.map((widget) => {
                // DEBUG: Log each widget's layout
                const layoutItem = currentDashboard.layout.layouts.lg?.find(l => l.i === widget.id);
                console.log(`[DesignPage] Widget ${widget.id} layout:`, layoutItem);
                return (
                  <div key={widget.position.i || widget.id} className="widget-container">
                    <GridWidget
                      widget={widget}
                      mode={currentMode}
                      onConfigure={() => setSelectedWidgetForConfig(widget.id)}
                      onDelete={() => handleWidgetDelete(widget.id)}
                      onElementSelected={(elementId, elementName) => 
                        handleElementSelected(widget.id, elementId, elementName)
                      }
                    />
                  </div>
                );
              })}
            </DashboardGrid>
          )}
        </div>

        {/* Configuration Panel (Side Panel) */}
        {selectedWidgetForConfig && (
          <div className="w-80 border-l overflow-y-auto bg-background">
            <ConfigurationPanel
              widgetId={selectedWidgetForConfig}
              onClose={() => setSelectedWidgetForConfig(null)}
              selectedElementId={selectedElement?.elementId}
              selectedElementName={selectedElement?.elementName}
            />
          </div>
        )}
      </div>
      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to your dashboard layout. Would you like to save before exiting?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleExitWithoutSaving}>
              Exit Without Saving
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndExit}>
              Save & Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>    </div>
  );
}
