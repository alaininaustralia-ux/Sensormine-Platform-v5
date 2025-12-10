# Dashboard Builder - Field Selector Documentation

## Overview

The Dashboard Builder now includes a schema-driven field selector that allows users to:
1. Browse all device types in their system
2. View the schema fields available for each device type
3. Select specific fields to display in dashboard widgets
4. Configure data sources with aggregation, time ranges, and refresh intervals

## Components

### 1. FieldSelector (`field-selector.tsx`)

A reusable component for browsing device types and selecting schema fields.

**Features:**
- Lists all device types with their protocols
- Displays schema fields with type information, units, and descriptions
- Supports nested fields (e.g., `gps.lat`, `gps.lon`)
- Search/filter fields by name or path
- Single or multi-select mode
- Shows selected fields as removable badges

**Usage:**
```typescript
import { FieldSelector, type SelectedField } from '@/components/dashboard/builder/field-selector';

function MyComponent() {
  const [selectedFields, setSelectedFields] = useState<SelectedField[]>([]);

  return (
    <FieldSelector
      selectedFields={selectedFields}
      onFieldsChange={setSelectedFields}
      multiSelect={true}
    />
  );
}
```

**SelectedField Interface:**
```typescript
interface SelectedField {
  deviceTypeId: string;
  deviceTypeName: string;
  fieldPath: string;
  fieldName: string;
  fieldType: string;
}
```

### 2. WidgetDataConfig (`widget-data-config.tsx`)

Widget configuration component that integrates the field selector with data source options.

**Features:**
- Configure data source type (realtime, historical, aggregated)
- Set time ranges for historical data
- Choose aggregation methods (avg, sum, min, max, count)
- Set refresh intervals for real-time data
- Widget-specific recommendations (e.g., gauge = single field, chart = multiple fields)
- Collapsible field selector interface

**Usage:**
```typescript
import { WidgetDataConfig, type WidgetDataConfig } from '@/components/dashboard/builder/widget-data-config';

function WidgetConfig() {
  const [config, setConfig] = useState<WidgetDataConfig>({
    dataSource: {
      type: 'realtime',
      fields: [],
      refreshInterval: 5,
    },
  });

  return (
    <WidgetDataConfig
      config={config}
      onChange={setConfig}
      widgetType="chart"
    />
  );
}
```

**DataSourceConfig Interface:**
```typescript
interface DataSourceConfig {
  type: 'realtime' | 'historical' | 'aggregated';
  fields: SelectedField[];
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
  timeRange?: {
    value: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks';
  };
  refreshInterval?: number; // seconds
}
```

## Integration with Dashboard Widgets

### Step 1: Add Data Configuration to Widget Config Panel

In `WidgetConfigPanel.tsx`, add the `WidgetDataConfig` component:

```typescript
import { WidgetDataConfig } from './builder/widget-data-config';

function WidgetConfigPanel() {
  return (
    <CardContent>
      {/* Basic Properties */}
      <div className="space-y-4">
        <Input value={widget.title} onChange={handleTitleChange} />
      </div>

      {/* Data Configuration */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Data Configuration</h4>
        <WidgetDataConfig
          config={widget.dataConfig}
          onChange={(dataConfig) => updateWidget(widget.id, { dataConfig })}
          widgetType={widget.type}
        />
      </div>
    </CardContent>
  );
}
```

### Step 2: Update Widget Types

Add data configuration to widget interface:

```typescript
interface Widget {
  id: string;
  type: 'chart' | 'gauge' | 'kpi' | 'table' | 'map' | 'video';
  title: string;
  dataConfig: WidgetDataConfig;
  // ... other properties
}
```

### Step 3: Use Selected Fields in Widget Rendering

In widget components (e.g., `ChartWidget.tsx`):

```typescript
function ChartWidget({ widget }: { widget: Widget }) {
  const { dataConfig } = widget;
  const deviceTypeId = dataConfig.dataSource.fields[0]?.deviceTypeId;
  const fieldPaths = dataConfig.dataSource.fields.map(f => f.fieldPath);

  // Fetch data based on configuration
  const { data } = useQuery({
    queryKey: ['telemetry', deviceTypeId, fieldPaths],
    queryFn: () => fetchTelemetryData({
      deviceTypeId,
      fields: fieldPaths,
      type: dataConfig.dataSource.type,
      timeRange: dataConfig.dataSource.timeRange,
      aggregation: dataConfig.dataSource.aggregation,
    }),
  });

  return <ResponsiveContainer>...</ResponsiveContainer>;
}
```

## Schema Field Structure

The field selector parses JSON Schema to extract fields. Example schema:

```json
{
  "type": "object",
  "properties": {
    "temperature": {
      "type": "number",
      "title": "Temperature",
      "description": "Temperature reading",
      "unit": "°C"
    },
    "gps": {
      "type": "object",
      "title": "GPS Location",
      "properties": {
        "lat": {
          "type": "number",
          "title": "Latitude"
        },
        "lon": {
          "type": "number",
          "title": "Longitude"
        }
      }
    }
  }
}
```

Extracted fields:
- `temperature` (number, °C) - Temperature
- `gps.lat` (number) - GPS Location > Latitude
- `gps.lon` (number) - GPS Location > Longitude

## Widget Type Recommendations

The system provides intelligent defaults based on widget type:

| Widget Type | Data Source | Aggregation | Max Fields | Recommended Use |
|-------------|-------------|-------------|------------|-----------------|
| Gauge | Realtime | avg | 1 | Single metric visualization |
| KPI | Realtime | avg | 1 | Key performance indicator |
| Chart | Historical | avg | 5 | Time-series plotting |
| Table | Realtime | none | 10 | Multi-column data display |
| Map | Realtime | none | 5 | Geo-located data |

## API Dependencies

### Device Types API
- `GET /api/DeviceType` - List all device types
- `GET /api/DeviceType/{id}` - Get device type details

### Schemas API
- `GET /api/Schema/{id}` - Get schema by ID
- Schema content parsed to extract field definitions

## Future Enhancements

1. **Device Filtering**: Filter data by specific devices within a device type
2. **Custom Expressions**: Build calculated fields using formulas (e.g., `temperature * 1.8 + 32`)
3. **Field Grouping**: Group related fields for easier selection
4. **Field Favorites**: Save frequently used field combinations
5. **Preview Data**: Show sample data for selected fields before adding to dashboard
6. **Validation**: Check that selected fields match widget requirements (e.g., numeric only for gauges)
7. **Conditional Formatting**: Set up rules based on field values
8. **Multi-Device**: Support aggregating data from multiple devices

## Testing

Test the field selector with different device types:

```bash
# 1. Create a device type with schema
POST /api/DeviceType
{
  "name": "Temperature Sensor",
  "protocol": "MQTT",
  "schemaId": "<schema-id>",
  ...
}

# 2. Open dashboard builder
# 3. Add a widget (chart, gauge, etc.)
# 4. Click "Add Fields"
# 5. Select device type from dropdown
# 6. Browse and select fields
# 7. Configure data source options
# 8. Save widget configuration
```

## Troubleshooting

**No fields showing:**
- Check that device type has a schema assigned
- Verify schema content is valid JSON Schema
- Check browser console for parsing errors

**Fields not updating:**
- Ensure `onChange` handler is connected properly
- Check that selected fields state is managed correctly

**Type errors:**
- Verify all TypeScript interfaces match between components
- Check that API responses match expected types
