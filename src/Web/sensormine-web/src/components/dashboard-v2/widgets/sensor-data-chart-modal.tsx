/**
 * Sensor Data Chart Modal
 * 
 * Modal for displaying sensor data in various chart formats when clicking mapped elements.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, BarChart3, Activity, TrendingUp, Calendar } from 'lucide-react';
import type { SensorMappingData } from './sensor-mapping-modal';

export interface SensorDataChartModalProps {
  open: boolean;
  mapping: SensorMappingData;
  onClose: () => void;
}

interface TelemetryData {
  timestamp: string;
  value: number;
}

export function SensorDataChartModal({
  open,
  mapping,
  onClose,
}: SensorDataChartModalProps) {
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1h');

  useEffect(() => {
    if (open && mapping) {
      loadTelemetryData();
    }
  }, [open, mapping, timeRange]);

  const loadTelemetryData = async () => {
    setIsLoading(true);
    try {
      const tenantId = '00000000-0000-0000-0000-000000000001';
      
      // Calculate time range
      const endTime = new Date();
      const startTime = new Date();
      switch (timeRange) {
        case '1h':
          startTime.setHours(startTime.getHours() - 1);
          break;
        case '6h':
          startTime.setHours(startTime.getHours() - 6);
          break;
        case '24h':
          startTime.setHours(startTime.getHours() - 24);
          break;
        case '7d':
          startTime.setDate(startTime.getDate() - 7);
          break;
      }

      const response = await fetch('/api/query/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': tenantId,
        },
        body: JSON.stringify({
          deviceIds: [mapping.deviceId],
          fields: [mapping.fieldName],
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          aggregation: 'avg',
          interval: timeRange === '7d' ? '1h' : '5m',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Transform data for chart
        const transformed: TelemetryData[] = data.map((point: any) => ({
          timestamp: point.timestamp,
          value: point[mapping.fieldName] || 0,
        }));
        setTelemetryData(transformed);
        
        // Set current value (latest)
        if (transformed.length > 0) {
          setCurrentValue(transformed[transformed.length - 1].value);
        }
      }
    } catch (error) {
      console.error('Error loading telemetry data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      );
    }

    if (telemetryData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No data available</p>
        </div>
      );
    }

    switch (mapping.chartType) {
      case 'value':
        return (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <TrendingUp className="h-12 w-12 text-primary" />
            <div className="text-center">
              <p className="text-5xl font-bold">{currentValue?.toFixed(2)}</p>
              <p className="text-muted-foreground mt-2">
                {mapping.fieldFriendlyName || mapping.fieldName}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {telemetryData[telemetryData.length - 1]?.timestamp 
                  ? new Date(telemetryData[telemetryData.length - 1].timestamp).toLocaleString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        );

      case 'gauge':
        const min = Math.min(...telemetryData.map(d => d.value));
        const max = Math.max(...telemetryData.map(d => d.value));
        const percentage = currentValue !== null ? ((currentValue - min) / (max - min)) * 100 : 0;
        
        return (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 200 200" className="transform -rotate-90">
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="20"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="20"
                  strokeDasharray={`${(percentage / 100) * 502.65} 502.65`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold">{currentValue?.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">
                  Range: {min.toFixed(1)} - {max.toFixed(1)}
                </p>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {mapping.fieldFriendlyName || mapping.fieldName}
            </p>
          </div>
        );

      case 'line':
      case 'bar':
        // Simple ASCII-style visualization (replace with actual chart library)
        const chartHeight = 200;
        const chartWidth = 500;
        const dataMax = Math.max(...telemetryData.map(d => d.value));
        const dataMin = Math.min(...telemetryData.map(d => d.value));
        const range = dataMax - dataMin || 1;
        
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>High: {dataMax.toFixed(2)}</span>
              <span>Current: {currentValue?.toFixed(2)}</span>
              <span>Low: {dataMin.toFixed(2)}</span>
            </div>
            <div className="border rounded-lg p-4 bg-muted/20" style={{ height: chartHeight }}>
              <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => (
                  <line
                    key={i}
                    x1="0"
                    y1={chartHeight * fraction}
                    x2={chartWidth}
                    y2={chartHeight * fraction}
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                    strokeDasharray="4"
                  />
                ))}
                
                {/* Data points */}
                {mapping.chartType === 'line' ? (
                  <polyline
                    points={telemetryData.map((d, i) => {
                      const x = (i / (telemetryData.length - 1)) * chartWidth;
                      const y = chartHeight - ((d.value - dataMin) / range) * chartHeight;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                  />
                ) : (
                  telemetryData.map((d, i) => {
                    const barWidth = chartWidth / telemetryData.length - 2;
                    const x = (i / telemetryData.length) * chartWidth;
                    const height = ((d.value - dataMin) / range) * chartHeight;
                    const y = chartHeight - height;
                    return (
                      <rect
                        key={i}
                        x={x}
                        y={y}
                        width={barWidth}
                        height={height}
                        fill="hsl(var(--primary))"
                      />
                    );
                  })
                )}
              </svg>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{telemetryData[0]?.timestamp 
                ? new Date(telemetryData[0].timestamp).toLocaleTimeString()
                : 'Start'}</span>
              <span>{telemetryData[telemetryData.length - 1]?.timestamp 
                ? new Date(telemetryData[telemetryData.length - 1].timestamp).toLocaleTimeString()
                : 'End'}</span>
            </div>
          </div>
        );

      default:
        return <p>Unsupported chart type</p>;
    }
  };

  const getChartIcon = () => {
    switch (mapping.chartType) {
      case 'line': return LineChart;
      case 'bar': return BarChart3;
      case 'gauge': return Activity;
      case 'value': return TrendingUp;
      default: return LineChart;
    }
  };

  const ChartIcon = getChartIcon();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChartIcon className="h-5 w-5 text-primary" />
              <div>
                <DialogTitle>{mapping.elementName}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {mapping.deviceName} → {mapping.fieldFriendlyName || mapping.fieldName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="6h">6 Hours</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {renderChart()}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <Badge variant="outline">{telemetryData.length} data points</Badge>
          <Badge variant="outline">{mapping.chartType.toUpperCase()}</Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}
