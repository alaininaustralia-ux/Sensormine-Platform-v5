# @sensormine/widget-sdk

SDK for building custom Sensormine dashboard widgets.

## Installation

```bash
npm install @sensormine/widget-sdk
```

## Quick Start

```tsx
import { WidgetBase, WidgetContext, WidgetConfig } from '@sensormine/widget-sdk';

interface MyWidgetState {
  value: number;
}

class MyCustomWidget extends WidgetBase<{}, MyWidgetState> {
  state = {
    value: 0
  };
  
  async onMount(context: WidgetContext) {
    // Load initial data
    const deviceId = this.config.deviceId;
    const device = await this.api.getDevice(deviceId);
    console.log('Device:', device);
  }
  
  async onConfigChange(config: WidgetConfig) {
    // React to configuration changes
    console.log('Config updated:', config);
  }
  
  render() {
    return (
      <div>
        <h2>{this.config.title || 'My Widget'}</h2>
        <p>Value: {this.state.value}</p>
      </div>
    );
  }
}

export default MyCustomWidget;
```

## API Reference

### WidgetBase

Base class for custom widgets. Extend this class to create your widget.

**Lifecycle Hooks:**
- `onMount(context)` - Called when widget is mounted
- `onConfigChange(config)` - Called when configuration changes
- `onResize(size)` - Called when widget is resized
- `onUnmount()` - Called before widget is unmounted

**Properties:**
- `this.api` - Widget API for querying data
- `this.config` - Current widget configuration
- `this.size` - Current widget size

### Widget API

```typescript
// Query telemetry data
const response = await this.api.queryTelemetry({
  deviceIds: ['device-uuid'],
  fields: ['temperature', 'humidity'],
  startTime: '2025-01-01T00:00:00Z',
  endTime: '2025-01-02T00:00:00Z',
  aggregation: 'avg',
  interval: '15m'
});

// Get device
const device = await this.api.getDevice('device-uuid');

// List devices
const devices = await this.api.listDevices({ deviceTypeId: 'type-uuid' });

// Subscribe to real-time updates
const unsubscribe = this.api.subscribeTelemetry(['device-uuid'], (data) => {
  console.log('New data:', data);
});
```

## Widget Manifest

Create a `manifest.json` file:

```json
{
  "id": "com.example.custom-gauge",
  "name": "Custom Gauge Widget",
  "version": "1.0.0",
  "description": "A custom gauge widget",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "category": "kpi",
  "tags": ["gauge", "kpi"],
  "entryPoint": "index.js",
  "permissions": {
    "apis": ["api.query", "api.devices"]
  },
  "config": {
    "inputs": [
      {
        "name": "deviceId",
        "type": "devicePicker",
        "label": "Select Device",
        "required": true
      },
      {
        "name": "field",
        "type": "fieldPicker",
        "label": "Data Field",
        "required": true
      }
    ]
  },
  "size": {
    "minWidth": 1,
    "minHeight": 1,
    "defaultWidth": 2,
    "defaultHeight": 2
  }
}
```

## Building & Packaging

1. Build your widget:
```bash
npm run build
```

2. Create a ZIP package:
```bash
zip -r widget-package.zip manifest.json index.js
```

3. Upload to Sensormine platform

## License

MIT
