/**
 * Device Telemetry View Component
 * 
 * Real-time display of telemetry data for a specific device
 * Auto-refreshes every 30 seconds to show live metrics
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  ActivityIcon,
  RefreshCwIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  Loader2Icon,
  PauseIcon,
  PlayIcon,
} from 'lucide-react';

interface TelemetryDataPoint {
  time: string;
  deviceId: string;
  tenantId: string;
  values: Record<string, number>;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

interface TelemetryQueryResponse {
  data: TelemetryDataPoint[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface DeviceTelemetryViewProps {
  deviceId: string;
  refreshInterval?: number; // in milliseconds, default 30000
}

export function DeviceTelemetryView({ deviceId, refreshInterval = 30000 }: DeviceTelemetryViewProps) {
  const { toast } = useToast();
  const [telemetryData, setTelemetryData] = useState<TelemetryDataPoint[]>([]);
  const [latestValues, setLatestValues] = useState<Record<string, number>>({});
  const [previousValues, setPreviousValues] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchTelemetry = useCallback(async () => {
    if (isPaused) return;

    try {
      setError(null);
      
      // Query last 5 minutes of data
      const response = await fetch(
        `http://localhost:5079/api/TimeSeries/telemetry?deviceId=${encodeURIComponent(deviceId)}&hours=0.083&limit=100`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch telemetry: ${response.statusText}`);
      }

      const result: TelemetryQueryResponse = await response.json();
      
      if (result.data && result.data.length > 0) {
        setTelemetryData(result.data);
        
        // Get the latest data point
        const latest = result.data[0];
        
        // Store previous values for trend calculation
        if (Object.keys(latestValues).length > 0) {
          setPreviousValues({ ...latestValues });
        }
        
        setLatestValues(latest.values);
        setLastUpdate(new Date());
      }

      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch telemetry';
      setError(errorMessage);
      setIsLoading(false);
      
      toast({
        title: 'Telemetry Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [deviceId, isPaused, latestValues, toast]);

  // Initial fetch and auto-refresh interval
  useEffect(() => {
    if (isPaused) return;

    // Initial fetch
    fetchTelemetry();

    // Set up refresh interval
    const interval = setInterval(() => {
      fetchTelemetry();
    }, refreshInterval);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, refreshInterval, isPaused]);

  const getTrend = (metricName: string, currentValue: number): 'up' | 'down' | 'stable' => {
    if (!previousValues[metricName]) return 'stable';
    
    const previous = previousValues[metricName];
    const diff = currentValue - previous;
    const threshold = Math.abs(previous) * 0.01; // 1% change threshold

    if (Math.abs(diff) < threshold) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const formatValue = (value: number): string => {
    if (Number.isInteger(value)) {
      return value.toString();
    }
    return value.toFixed(2);
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  const getMetricColor = (metricName: string): string => {
    const colorMap: Record<string, string> = {
      temperature: 'text-orange-600',
      humidity: 'text-blue-600',
      pressure: 'text-purple-600',
      batteryLevel: 'text-green-600',
      voltage: 'text-yellow-600',
      current: 'text-red-600',
      power: 'text-pink-600',
      speed: 'text-cyan-600',
      height: 'text-indigo-600',
      floatSwitch: 'text-teal-600',
    };

    return colorMap[metricName] || 'text-gray-600';
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      // Resume and fetch immediately
      fetchTelemetry();
    }
  };

  if (isLoading && telemetryData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            Live Telemetry
          </CardTitle>
          <CardDescription>Real-time device metrics and sensor data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center space-y-4">
              <Loader2Icon className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading telemetry data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && telemetryData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            Live Telemetry
          </CardTitle>
          <CardDescription>Real-time device metrics and sensor data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center space-y-4">
              <AlertCircleIcon className="h-12 w-12 mx-auto text-destructive" />
              <div>
                <p className="font-medium">Failed to Load Telemetry</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button onClick={fetchTelemetry} size="sm">
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (telemetryData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            Live Telemetry
          </CardTitle>
          <CardDescription>Real-time device metrics and sensor data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center space-y-4">
              <AlertCircleIcon className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">No Telemetry Data</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This device hasn't sent any telemetry data yet
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const excludedMetrics = ['deviceId', 'timestamp'];
  const metrics = Object.keys(latestValues).filter(key => !excludedMetrics.includes(key));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon className="h-5 w-5" />
              Live Telemetry
              {!isPaused && (
                <Badge variant="outline" className="ml-2 gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Live
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Real-time device metrics • {telemetryData.length} data points
              {lastUpdate && (
                <> • Updated {formatTimestamp(lastUpdate.toISOString())}</>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePause}
            >
              {isPaused ? (
                <>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <PauseIcon className="h-4 w-4 mr-2" />
                  Pause
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTelemetry}
              disabled={isLoading}
            >
              <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Current Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {metrics.map((metricName) => {
            const value = latestValues[metricName];
            const trend = getTrend(metricName, value);
            
            return (
              <Card key={metricName} className="border-2">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide">
                      {metricName}
                    </span>
                    {trend === 'up' && <TrendingUpIcon className="h-4 w-4 text-green-600" />}
                    {trend === 'down' && <TrendingDownIcon className="h-4 w-4 text-red-600" />}
                    {trend === 'stable' && <MinusIcon className="h-4 w-4 text-gray-400" />}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getMetricColor(metricName)}`}>
                    {formatValue(value)}
                  </div>
                  {previousValues[metricName] !== undefined && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Prev: {formatValue(previousValues[metricName])}
                      {trend !== 'stable' && (
                        <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                          {' '}({trend === 'up' ? '+' : ''}{formatValue(value - previousValues[metricName])})
                        </span>
                      )}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Separator className="my-6" />

        {/* Recent Data Table */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Data Points</h3>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium">Time</th>
                    {metrics.map((metric) => (
                      <th key={metric} className="text-right p-3 font-medium">
                        {metric}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {telemetryData.slice(0, 20).map((dataPoint, index) => (
                    <tr key={index} className="hover:bg-muted/50">
                      <td className="p-3 font-mono text-xs">
                        {formatTimestamp(dataPoint.time)}
                      </td>
                      {metrics.map((metric) => (
                        <td key={metric} className="text-right p-3 font-mono">
                          {dataPoint.values[metric] !== undefined
                            ? formatValue(dataPoint.values[metric])
                            : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
