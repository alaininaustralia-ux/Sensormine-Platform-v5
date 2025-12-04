/**
 * Charts Demo Page
 * 
 * Demonstrates all time-series chart types and features.
 * Story 4.2 - Time-Series Charts
 */

// @ts-nocheck
/* eslint-disable react-compiler/react-compiler */
'use client';

import { useMemo } from 'react';
import { TimeSeriesChart } from '@/components/dashboard/widgets/charts/time-series-chart';
import type { ChartConfiguration } from '@/lib/types/chart-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Generate sample data
function generateSampleData(hours: number, seriesCount: number = 1) {
  const now = Date.now();
  const HOUR = 60 * 60 * 1000;
  const data = [];

  for (let i = 0; i < seriesCount; i++) {
    const seriesData = [];
    for (let h = hours; h >= 0; h--) {
      seriesData.push({
        timestamp: now - h * HOUR,
        value: 20 + Math.random() * 10 + Math.sin(h / 4) * 5 + i * 5,
      });
    }
    data.push({
      seriesName: `Sensor ${String.fromCharCode(65 + i)}`,
      data: seriesData,
      color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'][i],
      unit: '°C',
    });
  }

  return data;
}

export default function ChartsDemoPage() {
  // Line chart config (using useMemo to avoid re-generating on every render)
  const lineChartConfig: ChartConfiguration = useMemo(() => ({
    title: 'Temperature Trends',
    subtitle: 'Multi-sensor temperature monitoring',
    chartType: 'line',
    series: generateSampleData(48, 3),
    xAxisLabel: 'Time',
    yAxisLabel: 'Temperature (°C)',
    showLegend: true,
    showGrid: true,
    enableZoom: true,
  }), []);

  // Bar chart config
  const barChartConfig: ChartConfiguration = useMemo(() => ({
    title: 'Daily Production Output',
    subtitle: 'Last 30 days',
    chartType: 'bar',
    series: [
      {
        seriesName: 'Units Produced',
        data: Array.from({ length: 30 }, (_, i) => ({
          timestamp: Date.now() - (30 - i) * 24 * 60 * 60 * 1000,
          value: 100 + Math.random() * 50,
        })),
        color: '#10b981',
        unit: 'units',
      },
    ],
    xAxisLabel: 'Date',
    yAxisLabel: 'Production',
    showLegend: false,
    showGrid: true,
  }), []);

  // Area chart config
  const areaChartConfig: ChartConfiguration = useMemo(() => ({
    title: 'System Resource Usage',
    subtitle: 'CPU and Memory over 24 hours',
    chartType: 'area',
    series: [
      {
        seriesName: 'CPU Usage',
        data: generateSampleData(24, 1)[0].data.map(d => ({
          ...d,
          value: 30 + Math.random() * 40,
        })),
        color: '#3b82f6',
        unit: '%',
      },
      {
        seriesName: 'Memory Usage',
        data: generateSampleData(24, 1)[0].data.map(d => ({
          ...d,
          value: 40 + Math.random() * 30,
        })),
        color: '#ef4444',
        unit: '%',
      },
    ],
    xAxisLabel: 'Time',
    yAxisLabel: 'Usage (%)',
    showLegend: true,
    showGrid: true,
  }), []);

  // Scatter chart config
  const scatterChartConfig: ChartConfiguration = useMemo(() => ({
    title: 'Sensor Correlation Analysis',
    subtitle: 'Temperature vs Pressure',
    chartType: 'scatter',
    series: [
      {
        seriesName: 'Sensor Data',
        data: Array.from({ length: 100 }, () => ({
          timestamp: Date.now() - Math.random() * 24 * 60 * 60 * 1000,
          value: 15 + Math.random() * 20,
        })),
        color: '#8b5cf6',
        unit: 'psi',
      },
    ],
    xAxisLabel: 'Time',
    yAxisLabel: 'Pressure (psi)',
    showLegend: false,
    showGrid: true,
  }), []);

  // Step chart config
  const stepChartConfig: ChartConfiguration = useMemo(() => ({
    title: 'Machine State Changes',
    subtitle: 'On/Off status over time',
    chartType: 'step',
    series: [
      {
        seriesName: 'Machine A',
        data: Array.from({ length: 20 }, (_, i) => ({
          timestamp: Date.now() - (20 - i) * 60 * 60 * 1000,
          value: Math.random() > 0.5 ? 1 : 0,
        })),
        color: '#10b981',
      },
      {
        seriesName: 'Machine B',
        data: Array.from({ length: 20 }, (_, i) => ({
          timestamp: Date.now() - (20 - i) * 60 * 60 * 1000,
          value: Math.random() > 0.5 ? 1 : 0,
        })),
        color: '#ef4444',
      },
    ],
    xAxisLabel: 'Time',
    yAxisLabel: 'State',
    showLegend: true,
    showGrid: true,
  }), []);

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Time-Series Charts Demo</h1>
        <p className="text-muted-foreground mt-2">
          Explore all chart types with interactive features
        </p>
      </div>

      <div className="space-y-8">
        {/* Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Line Chart with Zoom</CardTitle>
            <CardDescription>
              Multiple series with time range selection and brush zoom
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimeSeriesChart config={lineChartConfig} />
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Bar Chart</CardTitle>
            <CardDescription>
              Single series bar chart for categorical comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimeSeriesChart config={barChartConfig} />
          </CardContent>
        </Card>

        {/* Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Area Chart</CardTitle>
            <CardDescription>
              Stacked area chart showing resource usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimeSeriesChart config={areaChartConfig} />
          </CardContent>
        </Card>

        {/* Scatter Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Scatter Chart</CardTitle>
            <CardDescription>
              Distribution and correlation visualization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimeSeriesChart config={scatterChartConfig} />
          </CardContent>
        </Card>

        {/* Step Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Step Chart</CardTitle>
            <CardDescription>
              Discrete state changes over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimeSeriesChart config={stepChartConfig} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
