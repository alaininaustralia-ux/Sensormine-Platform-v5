/**
 * Gauge Widget with Asset Filtering
 * 
 * Story 5: Gauge Widget with Asset-Based Filtering
 * Displays an aggregated gauge value from devices under an asset with threshold visualization
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { BaseWidget, type BaseWidgetProps } from './base-widget';
import { CircularGauge } from './gauges/circular-gauge';
import { LinearGauge } from './gauges/linear-gauge';
import { BulletGauge, type BulletRange } from './gauges/bullet-gauge';
import { getAggregatedTelemetryByAsset, type AggregatedTelemetryQuery } from '@/lib/api/assets';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface GaugeWidgetWithAssetConfig {
  /** Asset ID to filter devices */
  assetId?: string;
  /** Include devices from descendant assets */
  includeDescendants?: boolean;
  /** Field to display */
  field?: string;
  /** Aggregation method */
  aggregation?: 'avg' | 'sum' | 'min' | 'max';
  /** Gauge type */
  gaugeType?: 'circular' | 'linear' | 'bullet';
  /** Orientation for linear/bullet gauges */
  orientation?: 'horizontal' | 'vertical';
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Warning threshold (yellow) */
  warningThreshold?: number;
  /** Critical threshold (red) */
  criticalThreshold?: number;
  /** Target value for bullet gauge */
  target?: number;
  /** Custom ranges for bullet gauge */
  ranges?: BulletRange[];
  /** Compact mode */
  compact?: boolean;
  /** Auto-refresh interval in seconds (0 = disabled) */
  refreshInterval?: number;
}

interface GaugeWidgetWithAssetProps extends Omit<BaseWidgetProps, 'children'> {
  /** Widget configuration */
  config: GaugeWidgetWithAssetConfig;
}

export function GaugeWidgetWithAsset({
  config,
  ...baseProps
}: GaugeWidgetWithAssetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [unit, setUnit] = useState<string>('');
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch gauge data
  const fetchData = useCallback(async () => {
    if (!config.assetId || !config.field) {
      setError('Asset and field must be configured');
      return;
    }

    try {
      setIsLoading(true);
      setError(undefined);

      const now = new Date();
      // Fetch recent data (last 5 minutes for current value)
      const startTime = new Date(now.getTime() - 5 * 60 * 1000);

      const query: AggregatedTelemetryQuery = {
        assetId: config.assetId,
        includeDescendants: config.includeDescendants ?? true,
        fields: [config.field],
        startTime,
        endTime: now,
        aggregation: config.aggregation || 'avg',
        interval: '1m',
        limit: 5,
      };

      const response = await getAggregatedTelemetryByAsset(query);
      
      if (response.series.length === 0) {
        setError('No data available');
        return;
      }

      // Get the most recent value across all series
      let latestValue = 0;
      let latestTimestamp = 0;

      response.series.forEach(series => {
        series.data.forEach(point => {
          const timestamp = new Date(point.timestamp).getTime();
          if (timestamp > latestTimestamp) {
            latestTimestamp = timestamp;
            latestValue = point.value;
          }
        });
      });

      setCurrentValue(latestValue);
      setUnit(response.series[0]?.unit || '');
    } catch (err) {
      console.error('Error fetching gauge data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load gauge data');
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!config.refreshInterval || config.refreshInterval <= 0) return;

    refreshIntervalRef.current = setInterval(() => {
      fetchData();
    }, config.refreshInterval * 1000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [config.refreshInterval, fetchData]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchData();
  };

  const renderGauge = () => {
    const {
      gaugeType = 'circular',
      orientation = 'horizontal',
      min = 0,
      max = 100,
      warningThreshold,
      criticalThreshold,
      target,
      ranges,
      compact,
    } = config;

    const commonProps = {
      value: currentValue,
      min,
      max,
      unit,
      warningThreshold,
      criticalThreshold,
    };
    
    switch (gaugeType) {
      case 'linear':
        return (
          <LinearGauge
            {...commonProps}
            orientation={orientation}
          />
        );
      
      case 'bullet':
        return (
          <BulletGauge
            {...commonProps}
            target={target}
            ranges={ranges}
            orientation={orientation}
            compact={compact}
          />
        );
      
      case 'circular':
      default:
        return (
          <CircularGauge {...commonProps} />
        );
    }
  };

  return (
    <BaseWidget {...baseProps} isLoading={isLoading} error={error}>
      <div className="flex flex-col h-full">
        {/* Header with field name and refresh button */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-muted-foreground">
            {config.field}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Gauge */}
        <div className="flex-1 flex items-center justify-center">
          {currentValue !== undefined ? (
            renderGauge()
          ) : (
            <div className="text-muted-foreground">
              No data available
            </div>
          )}
        </div>
      </div>
    </BaseWidget>
  );
}
