'use client';

// Configuration Panel - Widget configuration interface

import { useState } from 'react';
import { useDashboardV2Store } from '@/lib/stores/dashboard-v2-store';
import type { WidgetConfig } from '@/lib/types/dashboard-v2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { X, Check } from 'lucide-react';
import { DeviceListConfig } from './config/DeviceListConfig';
import { TimeSeriesChartConfig } from './config/TimeSeriesChartConfig';
import { KpiWidgetConfig } from './config/KpiWidgetConfig';
import { GaugeWidgetConfig } from './config/GaugeWidgetConfig';
import { MapWidgetConfig } from './config/MapWidgetConfig';
import { CAD3DViewerWidgetConfig } from './builder/widget-configs/cad-3d-viewer-widget-config';
import { VideoPlayerConfig } from './config/VideoPlayerConfig';
import { CustomWidgetConfig } from './config/CustomWidgetConfig';

interface ConfigurationPanelProps {
  widgetId: string;
  onClose?: () => void;
  selectedElementId?: string;
  selectedElementName?: string;
}

export function ConfigurationPanel({ widgetId, onClose, selectedElementId, selectedElementName }: ConfigurationPanelProps) {
  const { currentDashboard, updateWidget, updateDashboard, selectWidget, setSelectedWidgetForConfig } = useDashboardV2Store();
  const widget = currentDashboard?.widgets.find(w => w.id === widgetId);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!widget) return null;

  const handleUpdate = (field: string, value: unknown) => {
    updateWidget(widgetId, { [field]: value });
    setHasChanges(true);
  };

  const handleConfigChange = (config: Partial<typeof widget.config>) => {
    const updatedConfig = { ...widget.config, ...config };
    
    // IMPORTANT: Also update dataSource.deviceIds when config.deviceId changes
    // This ensures WidgetRenderer doesn't show "Not Configured" state
    const updates: Partial<typeof widget> = { config: updatedConfig };
    
    // Check if deviceId is being updated and it's a string
    const deviceId = (config as { deviceId?: string }).deviceId;
    if (deviceId && typeof deviceId === 'string') {
      updates.dataSource = {
        ...widget.dataSource,
        type: 'device' as const,
        deviceIds: [deviceId],
      };
    }
    
    updateWidget(widgetId, updates);
    setHasChanges(true);
  };

  const handleBehaviorChange = (behavior: Partial<typeof widget.behavior>) => {
    const updatedBehavior = { ...widget.behavior, ...behavior };
    updateWidget(widgetId, { behavior: updatedBehavior });
    setHasChanges(true);
  };

  const handleApplyAndClose = async () => {
    if (!currentDashboard || !hasChanges) {
      setSelectedWidgetForConfig(null);
      onClose?.();
      return;
    }
    
    try {
      setIsSaving(true);
      console.log('[ConfigurationPanel] Saving dashboard to backend...');
      
      // Save the entire dashboard including widget changes
      await updateDashboard(currentDashboard.id, {
        name: currentDashboard.name,
        description: currentDashboard.description,
        widgets: currentDashboard.widgets,
        layout: currentDashboard.layout,
      });
      
      console.log('[ConfigurationPanel] Dashboard saved successfully');
      setShowSavedMessage(true);
      setTimeout(() => {
        setShowSavedMessage(false);
        setHasChanges(false);
        setIsSaving(false);
        setSelectedWidgetForConfig(null);
        onClose?.();
      }, 800);
    } catch (error) {
      console.error('[ConfigurationPanel] Error saving dashboard:', error);
      setIsSaving(false);
      alert('Failed to save dashboard configuration. Please try again.');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Configure Widget</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            selectWidget(null);
            onClose?.();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Widget Title (always shown) */}
        <div className="space-y-2 mb-6">
          <Label htmlFor="title">Widget Title</Label>
          <Input
            id="title"
            value={widget.title}
            onChange={(e) => handleUpdate('title', e.target.value)}
          />
        </div>

        <Separator className="my-4" />

        {/* Widget-Specific Configuration */}
        {widget.type === 'device-list' && (
          <DeviceListConfig widget={widget} onChange={handleConfigChange} />
        )}

        {widget.type === 'timeseries-chart' && (
          <TimeSeriesChartConfig widget={widget} onChange={handleConfigChange} />
        )}

        {widget.type === 'kpi-card' && (
          <KpiWidgetConfig widget={widget} onChange={handleConfigChange} />
        )}

        {widget.type === 'gauge' && (
          <GaugeWidgetConfig widget={widget} onChange={handleConfigChange} />
        )}

        {widget.type === 'map' && (
          <MapWidgetConfig 
            widget={widget} 
            onChange={handleConfigChange}
            onBehaviorChange={handleBehaviorChange}
          />
        )}

        {widget.type === 'cad-3d-viewer' && (
          <CAD3DViewerWidgetConfig 
            config={widget.config as unknown as import('./builder/widget-configs/cad-3d-viewer-widget-config').CAD3DViewerConfigType} 
            onChange={(config) => handleConfigChange(config as unknown as Partial<WidgetConfig>)}
            selectedElementId={selectedElementId}
            selectedElementName={selectedElementName}
          />
        )}

        {widget.type === 'video-player' && (
          <VideoPlayerConfig widget={widget} onChange={handleConfigChange} />
        )}

        {widget.type === 'custom' && (
          <CustomWidgetConfig widget={widget} onChange={handleConfigChange} />
        )}

        {/* Default for unsupported widget types */}
        {!['device-list', 'timeseries-chart', 'kpi-card', 'gauge', 'map', 'cad-3d-viewer', 'video-player', 'custom'].includes(widget.type) && (
          <div className="text-center text-muted-foreground p-8">
            <p className="mb-2">Configuration not yet implemented for this widget type.</p>
            <p className="text-sm">Widget type: <code className="bg-muted px-2 py-1 rounded">{widget.type}</code></p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1" 
          onClick={() => {
            setHasChanges(false);
            setSelectedWidgetForConfig(null);
            onClose?.();
          }}
        >
          Cancel
        </Button>
        <Button 
          className="flex-1" 
          onClick={handleApplyAndClose}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            'Saving...'
          ) : showSavedMessage ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Applied!
            </>
          ) : (
            'Apply & Close'
          )}
        </Button>
      </div>
    </div>
  );
}
