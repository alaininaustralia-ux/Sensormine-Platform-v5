/**
 * Example Dashboard Page
 * 
 * Demonstrates the new Query API integrated widgets with real-time data.
 */

'use client';

import { ConnectedKPIWidget } from '@/components/dashboard/widgets/kpi-widget-connected';
import { ConnectedChartWidget } from '@/components/dashboard/widgets/chart-widget-connected';
import { ConnectedPieChartWidget } from '@/components/dashboard/widgets/pie-chart-widget-connected';

export default function ExampleDashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Query API Dashboard Example</h1>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ConnectedKPIWidget
          id="kpi-temp"
          title="Average Temperature"
          field="temperature"
          aggregation="avg"
          periodHours={24}
          unit="°C"
          refreshInterval={30000}
          trendIsPositive={false}
        />
        
        <ConnectedKPIWidget
          id="kpi-humidity"
          title="Max Humidity"
          field="humidity"
          aggregation="max"
          periodHours={24}
          unit="%"
          refreshInterval={30000}
        />
        
        <ConnectedKPIWidget
          id="kpi-events"
          title="Total Events"
          field="value"
          aggregation="count"
          periodHours={24}
          refreshInterval={30000}
        />
        
        <ConnectedKPIWidget
          id="kpi-pressure"
          title="95th Percentile"
          field="pressure"
          aggregation="avg"
          periodHours={24}
          unit="kPa"
          refreshInterval={30000}
          numberFormat={{ maximumFractionDigits: 1 }}
        />
      </div>

      {/* Time-Series Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ConnectedChartWidget
          id="chart-temp-humidity"
          title="Temperature & Humidity (24h)"
          fields={['temperature', 'humidity']}
          aggregation="avg"
          interval="1h"
          lookbackHours={24}
          chartType="line"
          height={300}
          showGrid={true}
          showLegend={true}
          yAxisLabel="Value"
          refreshInterval={60000}
          seriesConfigs={{
            temperature: {
              seriesName: 'Temperature',
              color: '#ef4444',
              unit: '°C',
            },
            humidity: {
              seriesName: 'Humidity',
              color: '#3b82f6',
              unit: '%',
            },
          }}
        />

        <ConnectedChartWidget
          id="chart-pressure-p95"
          title="Pressure (95th Percentile)"
          fields={['pressure']}
          aggregation="p95"
          interval="1h"
          lookbackHours={24}
          chartType="area"
          height={300}
          showGrid={true}
          showLegend={false}
          yAxisLabel="Pressure (kPa)"
          refreshInterval={60000}
          seriesConfigs={{
            pressure: {
              seriesName: 'P95 Pressure',
              color: '#10b981',
              unit: 'kPa',
              fillOpacity: 0.3,
            },
          }}
        />
      </div>

      {/* Multi-Series Percentile Comparison */}
      <div className="grid grid-cols-1 gap-4">
        <ConnectedChartWidget
          id="chart-temp-distribution"
          title="Temperature Distribution (Multiple Percentiles)"
          fields={['temperature']}
          aggregation="p50"
          interval="30m"
          lookbackHours={12}
          chartType="line"
          height={400}
          showGrid={true}
          showLegend={true}
          xAxisLabel="Time"
          yAxisLabel="Temperature (°C)"
          refreshInterval={60000}
          seriesConfigs={{
            temperature: {
              seriesName: 'Median (P50)',
              color: '#3b82f6',
              unit: '°C',
            },
          }}
        />
      </div>

      {/* Categorical Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ConnectedPieChartWidget
          id="pie-device-events"
          title="Devices by Event Count"
          groupBy="device_id"
          valueField="value"
          aggregation="count"
          lookbackHours={24 * 7}
          limit={8}
          donut={true}
          showLegend={true}
          showPercentages={true}
          height={300}
          refreshInterval={120000}
        />

        <ConnectedPieChartWidget
          id="pie-device-temp"
          title="Average Temperature by Device"
          groupBy="device_id"
          valueField="temperature"
          aggregation="avg"
          lookbackHours={24}
          limit={6}
          donut={false}
          showLegend={true}
          showPercentages={true}
          height={300}
          refreshInterval={120000}
          colors={['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']}
        />
      </div>

      {/* Advanced Multi-Field Chart */}
      <div className="grid grid-cols-1 gap-4">
        <ConnectedChartWidget
          id="chart-multi-sensor"
          title="Multi-Sensor Monitoring (7 days)"
          fields={['temperature', 'humidity', 'pressure']}
          aggregation="avg"
          interval="6h"
          lookbackHours={24 * 7}
          chartType="line"
          height={400}
          showGrid={true}
          showLegend={true}
          xAxisLabel="Time"
          yAxisLabel="Sensor Values"
          refreshInterval={300000}
          seriesConfigs={{
            temperature: {
              seriesName: 'Temperature (°C)',
              color: '#ef4444',
              strokeWidth: 2,
            },
            humidity: {
              seriesName: 'Humidity (%)',
              color: '#3b82f6',
              strokeWidth: 2,
            },
            pressure: {
              seriesName: 'Pressure (kPa)',
              color: '#10b981',
              strokeWidth: 2,
              strokeDasharray: '5 5',
            },
          }}
        />
      </div>
    </div>
  );
}
