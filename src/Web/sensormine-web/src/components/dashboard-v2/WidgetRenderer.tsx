'use client';

// Widget Renderer - Displays widget content based on type

import type { Widget, DashboardMode } from '@/lib/types/dashboard-v2';
import { TimeSeriesChart } from './widgets/TimeSeriesChart';
import { KPICard } from './widgets/KPICard';
import { GaugeWidget } from './widgets/GaugeWidget';
import { DeviceListWidget } from './widgets/DeviceListWidget';
import { DataTableWidget } from './widgets/DataTableWidget';
import { MapWidget } from './widgets/MapWidget';
import { DigitalTwinTreeWidget } from './widgets/DigitalTwinTreeWidget';
import { CAD3DViewerWidget } from './widgets/cad-3d-viewer-widget';
import { VideoPlayerWidget } from './widgets/VideoPlayerWidget';

interface WidgetRendererProps {
  widget: Widget;
  mode: DashboardMode;
  onElementSelected?: (elementId: string, elementName: string) => void;
}

export function WidgetRenderer({ widget, mode, onElementSelected }: WidgetRendererProps) {
  // Show placeholder in design mode if no data source configured
  // Check both deviceTypeId (for device-type based widgets) and deviceIds (for specific device widgets)
  // For CAD 3D Viewer, check if modelUrl is configured
  // For Map widget, it's always configured (can show all devices)
  // For Video Player, check if videoUrl is configured
  const isConfigured = widget.type === 'cad-3d-viewer' 
    ? !!(widget.config as any)?.modelUrl
    : widget.type === 'map'
    ? true // Map widget can show all devices with GPS, so it's always configured
    : widget.type === 'video-player'
    ? !!(widget.config as any)?.videoUrl
    : widget.dataSource.deviceTypeId || 
      (widget.dataSource.deviceIds && widget.dataSource.deviceIds.length > 0);
  
  if (mode === 'design' && !isConfigured && widget.type !== 'digital-twin-tree') {
    return (
      <div className="h-full flex items-center justify-center text-center p-4">
        <div className="text-muted-foreground">
          <p className="text-sm font-medium">Not Configured</p>
          <p className="text-xs mt-1">Click to configure this widget</p>
        </div>
      </div>
    );
  }

  switch (widget.type) {
    case 'timeseries-chart':
      return <TimeSeriesChart widget={widget} mode={mode} />;
    
    case 'kpi-card':
      return <KPICard widget={widget} mode={mode} />;
    
    case 'gauge':
      return <GaugeWidget widget={widget} mode={mode} />;
    
    case 'device-list':
      return <DeviceListWidget widget={widget} mode={mode} />;
    
    case 'data-table':
      return <DataTableWidget widget={widget} mode={mode} />;
    
    case 'map':
      return <MapWidget widget={widget} mode={mode} />;
    
    case 'digital-twin-tree':
      return <DigitalTwinTreeWidget widget={widget} mode={mode} />;
    
    case 'cad-3d-viewer':
      return (
        <CAD3DViewerWidget
          id={widget.id}
          title={widget.title}
          description={typeof widget.config.description === 'string' ? widget.config.description : undefined}
          config={widget.config as unknown as import('./widgets/cad-3d-viewer-widget').CAD3DViewerConfig}
          isEditMode={mode === 'design'}
          dashboardId={widget.id}
          onElementSelected={onElementSelected}
        />
      );
    
    case 'video-player':
      return <VideoPlayerWidget widget={widget} mode={mode} />;
    
    default:
      return (
        <div className="h-full flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Unknown widget type: {widget.type}</p>
        </div>
      );
  }
}
