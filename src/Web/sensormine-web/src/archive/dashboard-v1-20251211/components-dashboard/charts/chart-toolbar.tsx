/**
 * Chart Toolbar Component
 * 
 * Story 4.2: Time-Series Charts
 * Provides controls for time range selection, aggregation, and export.
 */

'use client';

import { useState, useCallback } from 'react';
import { format as formatDate, subHours, subDays } from 'date-fns';
import { 
  Calendar, 
  Download, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TimeRangePreset, AggregationInterval, TimeRange } from '@/lib/types/chart';
import { TIME_RANGE_PRESETS, AGGREGATION_INTERVALS } from '@/lib/types/chart';

export interface ChartToolbarProps {
  /** Current time range */
  timeRange?: TimeRange;
  /** Current aggregation interval */
  aggregation?: AggregationInterval;
  /** Whether auto-refresh is enabled */
  autoRefresh?: boolean;
  /** Auto-refresh interval in seconds */
  refreshInterval?: number;
  /** Callback when time range changes */
  onTimeRangeChange?: (range: TimeRange) => void;
  /** Callback when aggregation changes */
  onAggregationChange?: (aggregation: AggregationInterval) => void;
  /** Callback when refresh is clicked */
  onRefresh?: () => void;
  /** Callback when auto-refresh is toggled */
  onAutoRefreshToggle?: (enabled: boolean) => void;
  /** Callback when zoom in is clicked */
  onZoomIn?: () => void;
  /** Callback when zoom out/reset is clicked */
  onZoomOut?: () => void;
  /** Callback when export is requested */
  onExport?: (format: 'png' | 'svg' | 'csv' | 'json') => void;
  /** Whether the chart is loading */
  isLoading?: boolean;
  /** CSS class name */
  className?: string;
}

/**
 * Calculate time range from preset
 */
function getTimeRangeFromPreset(preset: TimeRangePreset): TimeRange | null {
  const presetConfig = TIME_RANGE_PRESETS[preset];
  if (!presetConfig.hours) return null;
  
  const end = new Date();
  const start = presetConfig.hours <= 24 
    ? subHours(end, presetConfig.hours)
    : subDays(end, presetConfig.hours / 24);
  
  return { start, end };
}

/**
 * Format time range for display
 */
function formatTimeRange(range: TimeRange): string {
  const formatStr = 'MMM dd, HH:mm';
  return `${formatDate(range.start, formatStr)} - ${formatDate(range.end, formatStr)}`;
}

/**
 * Chart Toolbar Component
 */
export function ChartToolbar({
  timeRange,
  aggregation = 'raw',
  autoRefresh = false,
  isLoading = false,
  onTimeRangeChange,
  onAggregationChange,
  onRefresh,
  onAutoRefreshToggle,
  onZoomIn,
  onZoomOut,
  onExport,
  className,
}: ChartToolbarProps) {
  const [selectedPreset, setSelectedPreset] = useState<TimeRangePreset>('24h');
  
  // Handle time range preset selection
  const handlePresetSelect = useCallback((preset: TimeRangePreset) => {
    setSelectedPreset(preset);
    
    if (preset !== 'custom') {
      const range = getTimeRangeFromPreset(preset);
      if (range && onTimeRangeChange) {
        onTimeRangeChange(range);
      }
    }
  }, [onTimeRangeChange]);
  
  // Handle aggregation selection
  const handleAggregationSelect = useCallback((interval: AggregationInterval) => {
    if (onAggregationChange) {
      onAggregationChange(interval);
    }
  }, [onAggregationChange]);
  
  // Handle export format selection
  const handleExport = useCallback((format: 'png' | 'svg' | 'csv' | 'json') => {
    if (onExport) {
      onExport(format);
    }
  }, [onExport]);
  
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className || ''}`}>
      {/* Time Range Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Calendar className="h-4 w-4 mr-2" />
            {TIME_RANGE_PRESETS[selectedPreset].label}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {(Object.entries(TIME_RANGE_PRESETS) as [TimeRangePreset, typeof TIME_RANGE_PRESETS[TimeRangePreset]][]).map(
            ([key, config]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => handlePresetSelect(key)}
                className={selectedPreset === key ? 'bg-accent' : ''}
              >
                {config.label}
              </DropdownMenuItem>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Custom Time Range Display */}
      {timeRange && selectedPreset === 'custom' && (
        <span className="text-sm text-muted-foreground">
          {formatTimeRange(timeRange)}
        </span>
      )}
      
      {/* Aggregation Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            {AGGREGATION_INTERVALS[aggregation].label}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {(Object.entries(AGGREGATION_INTERVALS) as [AggregationInterval, typeof AGGREGATION_INTERVALS[AggregationInterval]][]).map(
            ([key, config]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => handleAggregationSelect(key)}
                className={aggregation === key ? 'bg-accent' : ''}
              >
                {config.label}
              </DropdownMenuItem>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <div className="flex items-center gap-1">
        {/* Zoom Controls */}
        {onZoomIn && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onZoomIn}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        )}
        
        {onZoomOut && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onZoomOut}
            title="Reset Zoom"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        )}
        
        {/* Refresh Button */}
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onRefresh}
            disabled={isLoading}
            title={autoRefresh ? 'Auto-refresh enabled' : 'Refresh'}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''} ${autoRefresh ? 'text-primary' : ''}`} />
          </Button>
        )}
        
        {/* Auto-refresh Toggle */}
        {onAutoRefreshToggle && (
          <Button
            variant={autoRefresh ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8"
            onClick={() => onAutoRefreshToggle(!autoRefresh)}
            title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
          >
            Auto
          </Button>
        )}
        
        {/* Export Menu */}
        {onExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Export">
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('png')}>
                Export as PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('svg')}>
                Export as SVG
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
