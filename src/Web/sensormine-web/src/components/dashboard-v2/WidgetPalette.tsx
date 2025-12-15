'use client';

// Widget Palette - Drag widgets onto dashboard

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  BarChart3, 
  Gauge, 
  ListFilter, 
  Table2, 
  Map, 
  TreePine, 
  Box,
  Cuboid,
  Video,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useDashboardV2Store } from '@/lib/stores/dashboard-v2-store';
import type { WidgetType } from '@/lib/types/dashboard-v2';

interface WidgetPaletteItem {
  type: WidgetType;
  name: string;
  description: string;
  icon: React.ReactNode;
  defaultSize: { w: number; h: number };
}

// Calculate default widget sizes as percentage of screen
// For 12-column grid: 20% of screen ≈ 2.4 columns, rounded to 3
// Heights are proportional to maintain aspect ratios
const widgetTypes: WidgetPaletteItem[] = [
  {
    type: 'timeseries-chart',
    name: 'Time-Series Chart',
    description: 'Line, bar, area charts',
    icon: <LineChart className="h-5 w-5" />,
    defaultSize: { w: 3, h: 4 },  // 20% width, tall for charts
  },
  {
    type: 'kpi-card',
    name: 'KPI Card',
    description: 'Single value with trend',
    icon: <BarChart3 className="h-5 w-5" />,
    defaultSize: { w: 3, h: 3 },  // 20% width, square-ish
  },
  {
    type: 'gauge',
    name: 'Gauge',
    description: 'Circular or linear gauge',
    icon: <Gauge className="h-5 w-5" />,
    defaultSize: { w: 3, h: 3 },  // 20% width, square for circular gauge
  },
  {
    type: 'device-list',
    name: 'Device List',
    description: 'Tabular device listing',
    icon: <ListFilter className="h-5 w-5" />,
    defaultSize: { w: 4, h: 5 },  // Slightly wider for table columns
  },
  {
    type: 'data-table',
    name: 'Data Table',
    description: 'Time-series data table',
    icon: <Table2 className="h-5 w-5" />,
    defaultSize: { w: 4, h: 5 },  // Slightly wider for table columns
  },
  {
    type: 'map',
    name: 'Map',
    description: 'Interactive device map',
    icon: <Map className="h-5 w-5" />,
    defaultSize: { w: 4, h: 5 },  // Wider for map visibility
  },
  {
    type: 'digital-twin-tree',
    name: 'Digital Twin Tree',
    description: 'Asset hierarchy',
    icon: <TreePine className="h-5 w-5" />,
    defaultSize: { w: 3, h: 5 },  // Narrow, tall for tree structure
  },
  {
    type: 'cad-3d-viewer',
    name: 'CAD 3D Viewer',
    description: '3D CAD with sensors',
    icon: <Cuboid className="h-5 w-5" />,
    defaultSize: { w: 5, h: 5 },  // Larger for detailed CAD views
  },
  {
    type: 'video-player',
    name: 'Video Player',
    description: 'Live or recorded video',
    icon: <Video className="h-5 w-5" />,
    defaultSize: { w: 4, h: 3 },  // 16:9 aspect ratio for video
  },
];

interface CustomWidget {
  id: string;
  name: string;
  description: string;
  icon?: string;
  version: string;
  manifest: {
    id: string;
    name: string;
    version: string;
    description: string;
    size?: {
      defaultWidth: number;
      defaultHeight: number;
      minWidth?: number;
      minHeight?: number;
    };
  };
}

export function WidgetPalette() {
  const { addWidget, currentDashboard, widgetPaletteVisible, toggleWidgetPalette } = useDashboardV2Store();
  const [customWidgets, setCustomWidgets] = useState<CustomWidget[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(false);

  // Load custom widgets on mount
  useEffect(() => {
    loadCustomWidgets();
  }, []);

  const loadCustomWidgets = async () => {
    setLoadingCustom(true);
    try {
      const response = await fetch('/api/widgets?limit=20&status=published');
      if (response.ok) {
        const data = await response.json();
        setCustomWidgets(data.items || []);
      }
    } catch (error) {
      console.error('Failed to load custom widgets:', error);
    } finally {
      setLoadingCustom(false);
    }
  };

  const handleAddWidget = (item: WidgetPaletteItem) => {
    const widgets = currentDashboard?.widgets || [];
    const maxY = Math.max(...widgets.map(w => w.position.y + w.position.h), 0);

    // Calculate default size (20% of 12-column grid = 2.4, rounded appropriately)
    const defaultWidth = item.defaultSize.w;
    const defaultHeight = item.defaultSize.h;
    
    console.log(`[WidgetPalette] Adding ${item.type} with size: ${defaultWidth}x${defaultHeight} (grid units)`);

    addWidget({
      type: item.type,
      title: item.name,
      config: {
        showTitle: true,
      },
      dataSource: {
        type: 'device-type',
        fieldMappings: [],
        aggregation: {
          function: 'avg',
        },
        timeRange: {
          type: 'relative',
          relative: '24h',
        },
      },
      appearance: {},
      behavior: {
        refreshInterval: '1m',
        autoRefresh: true,
        subscriptions: [],
        links: [],
      },
      position: {
        i: '',
        x: 0,
        y: maxY,
        w: defaultWidth,
        h: defaultHeight,
        minW: 2,  // Minimum 2 columns (~17% of screen)
        minH: 3,  // Minimum 3 rows for content visibility
      },
    });
  };

  const handleAddCustomWidget = (widget: CustomWidget) => {
    const widgets = currentDashboard?.widgets || [];
    const maxY = Math.max(...widgets.map(w => w.position.y + w.position.h), 0);

    // Use size from manifest or defaults
    const defaultWidth = widget.manifest.size?.defaultWidth || 4;
    const defaultHeight = widget.manifest.size?.defaultHeight || 4;
    const minWidth = widget.manifest.size?.minWidth || 2;
    const minHeight = widget.manifest.size?.minHeight || 3;

    console.log(`[WidgetPalette] Adding custom widget ${widget.name} with size: ${defaultWidth}x${defaultHeight}`);

    addWidget({
      type: 'custom' as WidgetType,
      title: widget.name,
      config: {
        showTitle: true,
        customWidgetId: widget.id,
        customWidgetConfig: {},
      },
      dataSource: {
        type: 'device-type',
        fieldMappings: [],
        aggregation: {
          function: 'avg',
        },
        timeRange: {
          type: 'relative',
          relative: '24h',
        },
      },
      appearance: {},
      behavior: {
        refreshInterval: '1m',
        autoRefresh: true,
        subscriptions: [],
        links: [],
      },
      position: {
        i: '',
        x: 0,
        y: maxY,
        w: defaultWidth,
        h: defaultHeight,
        minW: minWidth,
        minH: minHeight,
      },
    });
  };

  return (
    <div className="relative h-full flex">
      {/* Palette Content */}
      <div
        className={`h-full transition-all duration-300 ease-in-out ${
          widgetPaletteVisible ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <div className="w-64 p-4 h-full overflow-y-auto">
          <h3 className="font-semibold mb-4">Widget Palette</h3>
          
          {/* Built-in Widgets */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Built-in Widgets</h4>
            <div className="space-y-2">
              {widgetTypes.map((item) => (
                <Card
                  key={item.type}
                  className="p-3 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleAddWidget(item)}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 text-primary">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Widgets */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Custom Widgets</h4>
            {loadingCustom ? (
              <div className="text-xs text-muted-foreground p-3">Loading...</div>
            ) : customWidgets.length === 0 ? (
              <div className="text-xs text-muted-foreground p-3">
                No custom widgets installed. Visit the{' '}
                <a href="/widgets" className="text-primary underline">Widget Gallery</a> to browse.
              </div>
            ) : (
              <div className="space-y-2">
                {customWidgets.map((widget) => (
                  <Card
                    key={widget.id}
                    className="p-3 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleAddCustomWidget(widget)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 text-primary">
                        {widget.icon ? (
                          <span className="text-lg">{widget.icon}</span>
                        ) : (
                          <Box className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{widget.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{widget.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">v{widget.version}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toggle Button - always visible */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 mt-4 -ml-3 h-8 w-8 rounded-full border bg-background shadow-md hover:bg-accent z-10"
        onClick={toggleWidgetPalette}
      >
        {widgetPaletteVisible ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
