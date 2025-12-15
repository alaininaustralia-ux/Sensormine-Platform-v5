'use client';

// Time Series Chart Widget

import { useEffect, useState, useCallback, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Widget, DashboardMode } from '@/lib/types/dashboard-v2';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTimeSeriesForWidget } from '@/lib/api/widgetData';
import { format } from 'date-fns';
import { TimeRangeSlider } from './TimeRangeSlider';
import { useSubDashboard } from '../SubDashboardContext';

interface TimeSeriesChartProps {
  widget: Widget;
  mode: DashboardMode;
}

interface ChartDataPoint {
  timestamp: string;
  timestampMs: number;
}

interface ChartDataPointWithValues extends ChartDataPoint {
  [key: string]: string | number;
}

export function TimeSeriesChart({ widget }: TimeSeriesChartProps) {
  const [data, setData] = useState<ChartDataPointWithValues[]>([]);
  const [fullData, setFullData] = useState<ChartDataPointWithValues[]>([]); // Store full dataset
  const [timeRange, setTimeRange] = useState<[number, number] | null>(null); // Current time window
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subDashboard = useSubDashboard();

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      // Extract configuration from widget.config (simplified structure)
      const config = widget.config as {
        deviceId?: string;
        fields?: string[];
        timeRange?: string;
        aggregation?: string;
        aggregationInterval?: string;
        useSubDashboardParameter?: boolean;
      };

      console.log('[TimeSeriesChart] Widget config:', config);
      console.log('[TimeSeriesChart] Sub-dashboard context:', subDashboard);

      // Use sub-dashboard parameter if enabled and available
      let deviceId = config.deviceId;
      if (config.useSubDashboardParameter && subDashboard.isSubDashboard && subDashboard.parameterType === 'deviceId') {
        deviceId = subDashboard.parameterId;
        console.log('[TimeSeriesChart] Using sub-dashboard deviceId:', deviceId);
      }

      console.log('[TimeSeriesChart] Device ID:', deviceId);
      console.log('[TimeSeriesChart] Fields:', config.fields);

      const fields = config.fields || [];
      
      if (!deviceId || fields.length === 0) {
        console.log('[TimeSeriesChart] Missing deviceId or fields - skipping fetch');
        setLoading(false);
        return;
      }

      const timeRange = config.timeRange || 'last-24h';
      const aggregation = config.aggregation || 'none';
      const aggregationInterval = config.aggregationInterval || '5m';

      const requestPayload = {
        deviceIds: [deviceId],
        fields,
        timeRange: timeRange as 'last-1h' | 'last-6h' | 'last-24h' | 'last-7d' | 'last-30d' | 'custom',
        aggregation: aggregation === 'none' ? undefined : (aggregation as 'avg' | 'sum' | 'min' | 'max' | 'count'),
        aggregationInterval: aggregation !== 'none' ? aggregationInterval : undefined,
      };

      console.log('[TimeSeriesChart] Calling API with:', requestPayload);

      const response = await getTimeSeriesForWidget(requestPayload);
      
      console.log('[TimeSeriesChart] API Response:', response);
      console.log('[TimeSeriesChart] response.series.length:', response.series.length);

      // Transform API response to chart format
      if (response.series.length > 0) {
        // Group data points by timestamp
        const dataByTime = new Map<string, ChartDataPointWithValues>();
        
        response.series.forEach(series => {
          console.log('[TimeSeriesChart] Processing series:', series.field, 'dataPoints:', series.dataPoints?.length);
          series.dataPoints.forEach(point => {
            const timestamp = point.timestamp;
            const timestampMs = new Date(timestamp).getTime();
            if (!dataByTime.has(timestamp)) {
              dataByTime.set(timestamp, { timestamp, timestampMs });
            }
            const dataPoint = dataByTime.get(timestamp)!;
            // Use field name as key for multiple series
            const key = series.deviceName 
              ? `${series.field}_${series.deviceName}` 
              : series.field;
            if (point.value !== null) {
              dataPoint[key] = point.value;
            }
          });
        });

        // Convert to array and sort by timestamp
        const chartData = Array.from(dataByTime.values())
          .sort((a, b) => a.timestampMs - b.timestampMs)
          .map(point => ({
            ...point,
            timestamp: format(new Date(point.timestampMs), 'HH:mm'),
          }));

        console.log('[TimeSeriesChart] chartData length:', chartData.length);
        console.log('[TimeSeriesChart] Sample chartData[0]:', chartData[0]);
        setFullData(chartData);
        
        // Initialize time range to full extent
        if (chartData.length > 0) {
          const minTime = chartData[0].timestampMs;
          const maxTime = chartData[chartData.length - 1].timestampMs;
          console.log('[TimeSeriesChart] Time range check:', { minTime, maxTime, currentTimeRange: timeRange, isNull: timeRange === null });
          
          // Always set data immediately when we have chartData, don't wait for filter effect
          console.log('[TimeSeriesChart] Setting data directly with chartData');
          setData(chartData);
          
          if (!timeRange) {
            console.log('[TimeSeriesChart] Setting initial time range');
            setTimeRange([minTime, maxTime]);
          }
        }
        
        // Apply current time filter if set
        if (timeRange && chartData.length > 0) {
          const minRange = Number(timeRange[0]);
          const maxRange = Number(timeRange[1]);
          const filteredData = chartData.filter(d => {
            const ts = Number(d.timestampMs);
            return ts >= minRange && ts <= maxRange;
          });
          setData(filteredData);
        } else {
          setData(chartData);
        }
      } else {
        setFullData([]);
        setData([]);
        setTimeRange(null);
      }
    } catch (err) {
      console.error('Failed to fetch time series data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [widget]);

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    fetchData();

    // Setup auto-refresh if enabled
    if (widget.behavior?.autoRefresh && widget.behavior?.refreshInterval) {
      const intervalMs = parseRefreshInterval(widget.behavior.refreshInterval);
      if (intervalMs > 0) {
        refreshIntervalRef.current = setInterval(fetchData, intervalMs);
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchData, widget.behavior?.autoRefresh, widget.behavior?.refreshInterval]);

  // Filter data when time range changes
  useEffect(() => {
    console.log('[TimeSeriesChart] Filter effect triggered - timeRange:', timeRange, 'fullData.length:', fullData.length);
    if (fullData.length > 0) {
      if (timeRange) {
        const minRange = Number(timeRange[0]);
        const maxRange = Number(timeRange[1]);
        const filteredData = fullData.filter(d => {
          const ts = Number(d.timestampMs);
          return ts >= minRange && ts <= maxRange;
        });
        console.log('[TimeSeriesChart] Filtered data length:', filteredData.length);
        setData(filteredData);
      } else {
        // No time range set, show all data
        console.log('[TimeSeriesChart] No time range, showing all data:', fullData.length);
        setData(fullData);
      }
    }
  }, [timeRange, fullData]);

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  const handleTimeRangeChange = (newRange: [number, number]) => {
    setTimeRange(newRange);
  };

  if (loading && data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <div className="text-center">
          <p className="text-sm font-medium text-destructive">Error Loading Chart Data</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  const config = widget.config as {
    chartType?: string;
    fields?: string[];
    showLegend?: boolean;
  };

  const chartType = config.chartType || 'line';

  // Get all data keys (excluding timestamp and timestampMs)
  const dataKeys = data.length > 0 
    ? Object.keys(data[0]).filter(k => k !== 'timestamp' && k !== 'timestampMs') 
    : [];

  const ChartComponent = {
    line: LineChart,
    bar: BarChart,
    area: AreaChart,
    scatter: ScatterChart,
    step: LineChart,
  }[chartType] || LineChart;

  // Calculate full time range for slider
  const fullTimeRange = fullData.length > 0
    ? { min: fullData[0].timestampMs, max: fullData[fullData.length - 1].timestampMs }
    : null;

  return (
    <div className="h-full w-full flex flex-col gap-2 p-2" style={{ height: '100%', width: '100%' }}>
      {loading && (
        <div className="absolute top-2 right-2 z-10">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {/* Time Range Slider */}
      {fullTimeRange && timeRange && fullData.length > 1 && (
        <div className="px-2">
          <TimeRangeSlider
            minTime={fullTimeRange.min}
            maxTime={fullTimeRange.max}
            currentRange={timeRange}
            onChange={handleTimeRangeChange}
          />
        </div>
      )}
      
      {/* Chart */}
      <div className="flex-1" style={{ minHeight: 200, height: '100%', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
          <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ fontSize: 12 }}
            labelFormatter={(label) => `Time: ${label}`}
          />
          {config.showLegend !== false && <Legend wrapperStyle={{ fontSize: 12 }} />}
          
          {(chartType === 'line' || chartType === 'step') && dataKeys.map((key, i) => (
            <Line
              key={key}
              type={chartType === 'step' ? 'stepAfter' : 'monotone'}
              dataKey={key}
              name={key}
              stroke={`hsl(${i * 137.5 % 360}, 70%, 50%)`}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}

          {chartType === 'bar' && dataKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              name={key}
              fill={`hsl(${i * 137.5 % 360}, 70%, 50%)`}
              isAnimationActive={false}
            />
          ))}

          {chartType === 'area' && dataKeys.map((key, i) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={key}
              fill={`hsl(${i * 137.5 % 360}, 70%, 50%)`}
              stroke={`hsl(${i * 137.5 % 360}, 70%, 50%)`}
              isAnimationActive={false}
            />
          ))}

          {chartType === 'scatter' && dataKeys.map((key, i) => (
            <Scatter
              key={key}
              dataKey={key}
              name={key}
              fill={`hsl(${i * 137.5 % 360}, 70%, 50%)`}
              isAnimationActive={false}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

// Helper function to parse refresh interval string to milliseconds
function parseRefreshInterval(interval: string): number {
  const map: Record<string, number> = {
    '10s': 10000,
    '30s': 30000,
    '1m': 60000,
    '5m': 300000,
    '10m': 600000,
    '30m': 1800000,
    'never': 0,
  };
  return map[interval] || 0;
}
