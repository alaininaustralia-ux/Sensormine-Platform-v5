# Query API Dashboard Integration

This document describes the new Query API enhancements and their frontend integration for building powerful, data-driven dashboards.

## Overview

The Query API has been enhanced with three major capabilities:
1. **KPI Trend Comparison** - Compare current vs. previous period with automatic trend calculation
2. **Multi-Field Aggregation** - Query multiple time-series fields in a single request
3. **Categorical Grouping** - Group and aggregate data by categorical fields for pie/bar charts
4. **Percentile Aggregations** - Support for median, p50, p90, p95, p99 percentile calculations

## Backend API Endpoints

### 1. KPI Data with Trend (`/api/kpidata`)

Fetches a single KPI value with comparison to a previous period.

**Endpoint:** `GET /api/kpidata`

**Parameters:**
- `field` (required): Field name to query (e.g., "temperature", "humidity")
- `aggregation`: Aggregation function - `current`, `avg`, `sum`, `min`, `max`, `count` (default: "avg")
- `periodHours`: Time period in hours (default: 24)
- `includeTrend`: Whether to include previous period comparison (default: true)
- `comparisonType`: Type of comparison - `previous`, `historical` (default: "previous")
- `deviceIds`: Comma-separated device IDs to filter

**Response:**
```json
{
  "field": "temperature",
  "aggregation": "avg",
  "currentValue": 23.5,
  "currentCount": 1440,
  "currentPeriod": {
    "start": "2025-12-06T10:00:00Z",
    "end": "2025-12-07T10:00:00Z"
  },
  "previousValue": 22.8,
  "previousCount": 1440,
  "previousPeriod": {
    "start": "2025-12-05T10:00:00Z",
    "end": "2025-12-06T10:00:00Z"
  },
  "change": 0.7,
  "percentChange": 3.07
}
```

### 2. Multi-Field Aggregated Data (`/api/widgetdata/aggregated`)

Fetches time-bucketed aggregated data for multiple fields in one request.

**Endpoint:** `GET /api/widgetdata/aggregated`

**Parameters:**
- `fields` (required): Comma-separated field names (e.g., "temperature,humidity,pressure")
- `startTime` (required): ISO 8601 start time
- `endTime` (required): ISO 8601 end time
- `aggregation`: `avg`, `sum`, `min`, `max`, `count`, `first`, `last`, `median`, `p50`, `p90`, `p95`, `p99` (default: "avg")
- `interval`: Time bucket size - "1s", "5m", "1h", "1d", etc. (default: "5m")
- `deviceIds`: Comma-separated device IDs to filter

**Response:**
```json
{
  "timestamp": "2025-12-07T10:00:00Z",
  "aggregation": "avg",
  "interval": "1h",
  "series": [
    {
      "field": "temperature",
      "dataPoints": [
        { "timestamp": "2025-12-07T09:00:00Z", "value": 23.5, "count": 60 },
        { "timestamp": "2025-12-07T10:00:00Z", "value": 24.1, "count": 60 }
      ]
    },
    {
      "field": "humidity",
      "dataPoints": [
        { "timestamp": "2025-12-07T09:00:00Z", "value": 65.2, "count": 60 },
        { "timestamp": "2025-12-07T10:00:00Z", "value": 63.8, "count": 60 }
      ]
    }
  ],
  "timeRange": {
    "start": "2025-12-07T09:00:00Z",
    "end": "2025-12-07T11:00:00Z"
  }
}
```

### 3. Categorical Data (`/api/widgetdata/categorical`)

Groups data by a categorical field and calculates aggregates with percentages.

**Endpoint:** `GET /api/widgetdata/categorical`

**Parameters:**
- `groupBy` (required): Field name to group by (e.g., "device_id", "location")
- `valueField`: Field to aggregate (default: "value")
- `aggregation`: `count`, `sum`, `avg`, `min`, `max` (default: "count")
- `startTime`: ISO 8601 start time (default: 7 days ago)
- `endTime`: ISO 8601 end time (default: now)
- `deviceIds`: Comma-separated device IDs to filter
- `limit`: Maximum number of categories (default: 20)

**Response:**
```json
{
  "groupByField": "device_id",
  "valueField": "temperature",
  "aggregation": "avg",
  "categories": [
    { "name": "device-001", "value": 25.3, "count": 1440, "percentage": 35.5 },
    { "name": "device-002", "value": 23.1, "count": 1200, "percentage": 30.2 },
    { "name": "device-003", "value": 24.5, "count": 1100, "percentage": 28.1 }
  ],
  "timeRange": {
    "start": "2025-11-30T10:00:00Z",
    "end": "2025-12-07T10:00:00Z"
  }
}
```

## Frontend Components

### Connected KPI Widget

Automatically fetches KPI data with trend comparison.

```tsx
import { ConnectedKPIWidget } from '@/components/dashboard/widgets/kpi-widget-connected';

<ConnectedKPIWidget
  title="Average Temperature"
  field="temperature"
  aggregation="avg"
  periodHours={24}
  unit="°C"
  refreshInterval={30000}
  trendIsPositive={false}
/>
```

**Props:**
- `field`: Field name to query
- `aggregation`: `current`, `avg`, `sum`, `min`, `max`, `count`
- `periodHours`: Time period (default: 24)
- `deviceIds`: Filter by devices
- `unit`: Display unit
- `refreshInterval`: Auto-refresh in ms (default: 30000)
- `trendIsPositive`: Whether increase is good (default: true)

### Connected Chart Widget

Fetches multi-series time-series data with advanced aggregations.

```tsx
import { ConnectedChartWidget } from '@/components/dashboard/widgets/chart-widget-connected';

<ConnectedChartWidget
  title="Temperature & Humidity"
  fields={['temperature', 'humidity']}
  aggregation="avg"
  interval="1h"
  lookbackHours={24}
  chartType="line"
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
```

**Props:**
- `fields`: Array of field names
- `aggregation`: `avg`, `sum`, `min`, `max`, `count`, `median`, `p50`, `p90`, `p95`, `p99`
- `interval`: Time bucket size (e.g., "5m", "1h", "1d")
- `lookbackHours`: Hours to look back (default: 24)
- `chartType`: `line`, `area`, `bar`, `step`
- `seriesConfigs`: Per-field display configuration
- `refreshInterval`: Auto-refresh in ms (default: 60000)

### Connected Pie Chart Widget

Fetches categorical data for pie/donut charts.

```tsx
import { ConnectedPieChartWidget } from '@/components/dashboard/widgets/pie-chart-widget-connected';

<ConnectedPieChartWidget
  title="Events by Device"
  groupBy="device_id"
  valueField="value"
  aggregation="count"
  lookbackHours={168}
  limit={8}
  donut={true}
  showPercentages={true}
  refreshInterval={120000}
/>
```

**Props:**
- `groupBy`: Field to group by
- `valueField`: Field to aggregate (default: "value")
- `aggregation`: `count`, `sum`, `avg`, `min`, `max`
- `lookbackHours`: Hours to look back (default: 168 = 7 days)
- `limit`: Max categories (default: 10)
- `donut`: Show as donut chart
- `showPercentages`: Display percentages
- `refreshInterval`: Auto-refresh in ms (default: 60000)

## Example Dashboard

See the complete example at `src/app/dashboard/example/page.tsx`:

```tsx
import { ConnectedKPIWidget } from '@/components/dashboard/widgets/kpi-widget-connected';
import { ConnectedChartWidget } from '@/components/dashboard/widgets/chart-widget-connected';
import { ConnectedPieChartWidget } from '@/components/dashboard/widgets/pie-chart-widget-connected';

export default function ExampleDashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <ConnectedKPIWidget
          title="Avg Temperature"
          field="temperature"
          aggregation="avg"
          periodHours={24}
          unit="°C"
        />
        {/* More KPIs... */}
      </div>

      {/* Multi-Series Chart */}
      <ConnectedChartWidget
        title="Temperature & Humidity"
        fields={['temperature', 'humidity']}
        aggregation="avg"
        interval="1h"
        lookbackHours={24}
        chartType="line"
      />

      {/* Percentile Chart */}
      <ConnectedChartWidget
        title="95th Percentile Pressure"
        fields={['pressure']}
        aggregation="p95"
        interval="1h"
        lookbackHours={24}
        chartType="area"
      />

      {/* Pie Chart */}
      <ConnectedPieChartWidget
        title="Events by Device"
        groupBy="device_id"
        aggregation="count"
        lookbackHours={168}
        donut={true}
      />
    </div>
  );
}
```

## API Client Usage

Direct API client usage (without React components):

```typescript
import {
  getKpiWithTrend,
  getMultiSeriesData,
  getCategoricalData
} from '@/lib/api/widget-data';

// KPI with trend
const kpiResponse = await getKpiWithTrend('temperature', 24, 'avg');
console.log(kpiResponse.data.currentValue);
console.log(kpiResponse.data.percentChange);

// Multi-series time-series
const chartResponse = await getMultiSeriesData(
  ['temperature', 'humidity'],
  'avg',
  '1h',
  '2025-12-06T00:00:00Z',
  '2025-12-07T00:00:00Z'
);
chartResponse.data.series.forEach(series => {
  console.log(series.field, series.dataPoints.length);
});

// Categorical data
const pieResponse = await getCategoricalData({
  groupBy: 'device_id',
  valueField: 'temperature',
  aggregation: 'avg',
  limit: 10,
});
pieResponse.data.categories.forEach(cat => {
  console.log(cat.name, cat.value, `${cat.percentage}%`);
});
```

## Aggregation Functions

### Standard Aggregations
- `avg` - Average value
- `sum` - Sum of values
- `min` - Minimum value
- `max` - Maximum value
- `count` - Number of data points
- `first` - First value in period
- `last` / `current` - Last/most recent value

### Percentile Aggregations
- `median` / `p50` - 50th percentile (median)
- `p90` - 90th percentile
- `p95` - 95th percentile
- `p99` - 99th percentile
- `p99.9` - 99.9th percentile

Percentiles are useful for understanding data distribution and identifying outliers.

## Time Intervals

Supported interval formats:
- `1s`, `5s`, `30s` - Seconds
- `1m`, `5m`, `15m`, `30m` - Minutes
- `1h`, `6h`, `12h` - Hours
- `1d`, `7d` - Days

## Performance Considerations

1. **Refresh Intervals**: Set appropriate refresh intervals based on data volatility
   - KPIs: 30 seconds - 1 minute
   - Charts: 1-5 minutes
   - Categorical: 2-5 minutes

2. **Time Ranges**: Limit lookback periods to reduce query load
   - Real-time dashboards: 1-24 hours
   - Analysis dashboards: 7-30 days
   - Historical analysis: Use coarser intervals

3. **Field Limits**: Query only necessary fields
   - KPIs: 1 field per widget
   - Charts: 2-5 fields per chart
   - Use multiple charts instead of overcrowding

4. **Device Filtering**: Filter by specific devices when possible to reduce data volume

## Testing

Access the example dashboard at: `http://localhost:3020/dashboard/example`

Test individual endpoints:
- KPI: `http://localhost:5079/api/kpidata?field=temperature&aggregation=avg&periodHours=24`
- Multi-field: `http://localhost:5079/api/widgetdata/aggregated?fields=temperature,humidity&aggregation=avg&interval=1h&startTime=...&endTime=...`
- Categorical: `http://localhost:5079/api/widgetdata/categorical?groupBy=device_id&aggregation=count`
