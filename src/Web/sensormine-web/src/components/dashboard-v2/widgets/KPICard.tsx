'use client';

// KPI Card Widget - Single value with trend

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import type { Widget, DashboardMode } from '@/lib/types/dashboard-v2';
import { getKpiData } from '@/lib/api/widget-data';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubDashboard } from '../SubDashboardContext';

interface KPICardProps {
  widget: Widget;
  mode: DashboardMode;
}

interface KpiConfig {
  sourceType: 'device' | 'deviceType';
  deviceId?: string;
  deviceName?: string;
  deviceTypeId?: string;
  deviceTypeName?: string;
  fieldName: string;
  fieldFriendlyName?: string;
  aggregation: 'avg' | 'sum' | 'count' | 'min' | 'max' | 'last';
  timeRange: 'last-1h' | 'last-6h' | 'last-24h' | 'last-7d' | 'last-30d' | 'current';
  decimalPlaces: number;
  showTrend: boolean;
  trendPeriod: 'hour' | 'day' | 'week' | 'month';
  prefix?: string;
  suffix?: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  thresholdDirection: 'above' | 'below';
  autoRefresh: boolean;
  refreshInterval: number;
}

export function KPICard({ widget }: KPICardProps) {
  const [value, setValue] = useState<number | null>(null);
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subDashboard = useSubDashboard();

  const config = widget.config as unknown as KpiConfig & { useSubDashboardParameter?: boolean };

  console.log('[KPICard] Rendering with config:', {
    widgetId: widget.id,
    widgetTitle: widget.title,
    config,
    dataSource: widget.dataSource,
  });

  useEffect(() => {
    console.log('[KPICard] Effect triggered, starting data fetch...');
    
    // Validate configuration
    if (!config.fieldName) {
      console.error('[KPICard] No field name configured');
      setError('Please configure a field to display');
      setLoading(false);
      return;
    }

    // Use sub-dashboard parameter if enabled
    let effectiveDeviceId = config.deviceId;
    if (config.useSubDashboardParameter && subDashboard.isSubDashboard && subDashboard.parameterType === 'deviceId') {
      effectiveDeviceId = subDashboard.parameterId;
    }

    if (!effectiveDeviceId && config.sourceType === 'device') {
      console.error('[KPICard] No device ID configured for device source type');
      setError('Please select a device');
      setLoading(false);
      return;
    }

    if (!config.deviceTypeId && config.sourceType === 'deviceType') {
      console.error('[KPICard] No device type ID configured for deviceType source type');
      setError('Please select a device type');
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        // Use sub-dashboard parameter if enabled
        let effectiveDeviceId = config.deviceId;
        if (config.useSubDashboardParameter && subDashboard.isSubDashboard && subDashboard.parameterType === 'deviceId') {
          effectiveDeviceId = subDashboard.parameterId;
        }

        console.log('[KPICard] Fetching KPI data with params:', {
          field: config.fieldName,
          aggregation: config.aggregation || 'avg',
          deviceId: effectiveDeviceId,
          deviceTypeId: config.deviceTypeId,
          timeRange: config.timeRange,
        });

        setLoading(true);
        setError(null);

        // Calculate period hours from time range
        const periodHoursMap = {
          'current': 0,
          'last-1h': 1,
          'last-6h': 6,
          'last-24h': 24,
          'last-7d': 168,
          'last-30d': 720,
        };

        const periodHours = periodHoursMap[config.timeRange] || 24;

        const response = await getKpiData({
          field: config.fieldName,
          aggregation: config.timeRange === 'current' ? 'last' : config.aggregation || 'avg',
          periodHours: periodHours > 0 ? periodHours : undefined,
          includeTrend: config.showTrend,
          comparisonType: 'previous',
          deviceIds: config.sourceType === 'device' ? effectiveDeviceId : undefined,
        });

        console.log('[KPICard] API response:', response);

        if (response && response.data) {
          console.log('[KPICard] Setting value:', response.data.currentValue);
          setValue(response.data.currentValue);
          
          if (response.data.previousValue !== undefined) {
            console.log('[KPICard] Setting previous value:', response.data.previousValue);
            setPreviousValue(response.data.previousValue);
          }
        } else {
          console.error('[KPICard] API request failed - no data in response');
          setError('No data available from API');
        }
      } catch (err) {
        console.error('[KPICard] Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Set up auto-refresh if enabled
    if (config.autoRefresh && config.refreshInterval > 0) {
      console.log('[KPICard] Setting up auto-refresh every', config.refreshInterval, 'seconds');
      const intervalId = setInterval(fetchData, config.refreshInterval * 1000);
      return () => {
        console.log('[KPICard] Cleaning up auto-refresh interval');
        clearInterval(intervalId);
      };
    }
  }, [config.fieldName, config.deviceId, config.deviceTypeId, config.sourceType, config.aggregation, config.timeRange, config.autoRefresh, config.refreshInterval]);

  // Calculate trend if we have both values
  let change = 0;
  let changePercent = '0';
  let trend: 'up' | 'down' | 'neutral' = 'neutral';

  if (value !== null && previousValue !== null && previousValue !== 0) {
    change = value - previousValue;
    changePercent = ((change / previousValue) * 100).toFixed(1);
    trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
    console.log('[KPICard] Calculated trend:', { change, changePercent, trend });
  }

  // Determine threshold level based on value
  let thresholdLevel: 'normal' | 'warning' | 'critical' = 'normal';
  if (value !== null && config.warningThreshold !== undefined && config.criticalThreshold !== undefined) {
    if (config.thresholdDirection === 'above') {
      if (value >= config.criticalThreshold) {
        thresholdLevel = 'critical';
      } else if (value >= config.warningThreshold) {
        thresholdLevel = 'warning';
      }
    } else {
      // 'below'
      if (value <= config.criticalThreshold) {
        thresholdLevel = 'critical';
      } else if (value <= config.warningThreshold) {
        thresholdLevel = 'warning';
      }
    }
    console.log('[KPICard] Threshold level:', thresholdLevel);
  }

  const levelColors = {
    normal: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600',
  };

  if (loading) {
    console.log('[KPICard] Rendering loading state');
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading KPI data...</div>
      </div>
    );
  }

  if (error) {
    console.log('[KPICard] Rendering error state:', error);
    return (
      <div className="h-full flex items-center justify-center p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (value === null) {
    console.log('[KPICard] Rendering no data state');
    return (
      <div className="h-full flex items-center justify-center p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No data available</AlertDescription>
        </Alert>
      </div>
    );
  }

  const displayValue = value.toFixed(config.decimalPlaces || 1);
  const prefix = config.prefix || '';
  const suffix = config.suffix || '';

  console.log('[KPICard] Rendering value:', { displayValue, prefix, suffix, thresholdLevel });

  return (
    <div className="h-full flex flex-col justify-center p-4 relative">
      {/* UnTested Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 select-none">
        <div className="text-6xl font-bold text-red-500 rotate-[-25deg]">
          UnTested
        </div>
      </div>

      <div className={`text-4xl font-bold ${levelColors[thresholdLevel]} relative z-10`}>
        {prefix}{displayValue}{suffix}
      </div>

      <div className="text-sm text-muted-foreground mt-2 relative z-10">
        {widget.title}
        {config.fieldFriendlyName && config.fieldFriendlyName !== widget.title && (
          <span className="block text-xs opacity-70">{config.fieldFriendlyName}</span>
        )}
      </div>

      {config.showTrend && previousValue !== null && (
        <div className="flex items-center gap-2 mt-4 relative z-10">
          {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
          {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
          {trend === 'neutral' && <Minus className="h-4 w-4 text-gray-600" />}
          <span className={`text-sm ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
            {change > 0 ? '+' : ''}{changePercent}%
          </span>
          <span className="text-xs text-muted-foreground">vs {config.trendPeriod || 'previous'}</span>
        </div>
      )}

      {config.sourceType === 'device' && config.deviceName && (
        <div className="text-xs text-muted-foreground mt-2 opacity-70 relative z-10">
          Device: {config.deviceName}
        </div>
      )}

      {config.sourceType === 'deviceType' && config.deviceTypeName && (
        <div className="text-xs text-muted-foreground mt-2 opacity-70 relative z-10">
          All {config.deviceTypeName} devices
        </div>
      )}
    </div>
  );
}
