# Custom Widget Development - Quick Start Guide

**Get your first custom widget running in 10 minutes!**

---

## Prerequisites

- Node.js 18+
- Basic React knowledge
- Sensormine Platform access

---

## Step 1: Create Widget Project

```bash
mkdir my-first-widget && cd my-first-widget
npm init -y
npm install @sensormine/widget-sdk react@19 react-dom@19
npm install -D typescript @types/react @types/react-dom
```

## Step 2: Create Widget Class

Create `src/index.tsx`:

```typescript
import React from 'react';
import { WidgetBase, WidgetContext } from '@sensormine/widget-sdk';

interface Props {}
interface State {
  devices: any[];
  loading: boolean;
}

export default class MyFirstWidget extends WidgetBase<Props, State> {
  state: State = {
    devices: [],
    loading: true,
  };

  protected async onMount(context: WidgetContext): Promise<void> {
    console.log('Widget mounted with context:', context);
    
    // Load devices
    try {
      const devices = await this.api.listDevices({ limit: 10 });
      this.setState({ devices, loading: false });
    } catch (error) {
      console.error('Error loading devices:', error);
      this.setState({ loading: false });
    }
  }

  protected onConfigChange(config: Record<string, unknown>): void {
    console.log('Config changed:', config);
    // Reload data based on new config
  }

  render() {
    const { devices, loading } = this.state;

    if (loading) {
      return <div className="p-4">Loading devices...</div>;
    }

    return (
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">My First Widget</h2>
        <ul className="space-y-2">
          {devices.map((device) => (
            <li key={device.id} className="border p-2 rounded">
              <strong>{device.name}</strong>
              <p className="text-sm text-gray-600">{device.serialNumber}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}
```

## Step 3: Create Manifest

Create `manifest.json`:

```json
{
  "id": "com.yourcompany.my-first-widget",
  "name": "My First Widget",
  "version": "1.0.0",
  "description": "Displays a list of devices",
  "author": "Your Name",
  "icon": "📊",
  "category": "other",
  "tags": ["devices", "list", "demo"],
  "permissions": {
    "apis": ["api.devices"]
  },
  "size": {
    "defaultWidth": 4,
    "defaultHeight": 4,
    "minWidth": 3,
    "minHeight": 3
  },
  "config": {
    "inputs": [
      {
        "name": "maxDevices",
        "label": "Max Devices",
        "type": "number",
        "required": false,
        "default": 10,
        "description": "Maximum number of devices to display"
      },
      {
        "name": "showDetails",
        "label": "Show Details",
        "type": "boolean",
        "default": true,
        "description": "Show device details"
      }
    ]
  }
}
```

## Step 4: Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "jsx": "react",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Step 5: Add Build Script

Update `package.json`:

```json
{
  "name": "my-first-widget",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc && cp manifest.json dist/ && cp -r src/*.css dist/ 2>/dev/null || true"
  },
  "dependencies": {
    "@sensormine/widget-sdk": "^1.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
```

## Step 6: Build Widget

```bash
npm run build
```

Output:
```
dist/
├── manifest.json
├── index.js
├── index.d.ts
└── (other files)
```

## Step 7: Package Widget

```bash
cd dist
zip -r ../my-first-widget.zip *
cd ..
```

## Step 8: Upload to Platform

1. Go to http://localhost:3020/widgets/upload
2. Drag-and-drop `my-first-widget.zip`
3. Wait for success message
4. Click "View in Gallery"

## Step 9: Add to Dashboard

1. Go to Dashboard Builder
2. Open Widget Palette (left sidebar)
3. Scroll to "Custom Widgets" section
4. Click "My First Widget"
5. Widget appears on dashboard!

## Step 10: Configure Widget

1. Click widget settings icon
2. Adjust "Max Devices" slider
3. Toggle "Show Details"
4. Click "Apply & Close"
5. Widget updates with new config!

---

## 🎉 Congratulations!

You've created, uploaded, and deployed your first custom widget!

---

## Next Steps

### Add Telemetry Queries

```typescript
protected async loadTelemetry() {
  const response = await this.api.queryTelemetry({
    deviceIds: ['device-uuid'],
    fields: ['temperature', 'humidity'],
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date().toISOString(),
    aggregation: 'avg',
    interval: '15m',
  });

  console.log('Telemetry:', response.data);
}
```

### Add Real-Time Subscriptions

```typescript
protected onMount(context: WidgetContext): void {
  // Subscribe to real-time updates
  const unsubscribe = this.api.subscribeTelemetry(['device-uuid'], (data) => {
    console.log('New telemetry:', data);
    // Update widget state
  });

  // Store unsubscribe function for cleanup
  this.unsubscribe = unsubscribe;
}

protected onUnmount(): void {
  // Cleanup subscription
  this.unsubscribe?.();
}
```

### Add Charts

```bash
npm install recharts
```

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

render() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Temperature Trend</h2>
      <LineChart width={400} height={300} data={this.state.data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="temperature" stroke="#8884d8" />
      </LineChart>
    </div>
  );
}
```

---

## 📚 Additional Resources

- **Full Documentation:** `docs/custom-widget-system-complete.md`
- **Widget SDK API:** `src/Web/widget-sdk/README.md`
- **Example Widgets:** (Coming soon)
- **Architecture Guide:** `docs/custom-widget-system-architecture.md`

---

## 🐛 Troubleshooting

### "Widget not found" error
- Check widget ID in manifest.json matches reverse domain format
- Verify upload succeeded (check Widget Gallery)

### API calls return 403
- Check permissions in manifest.json
- Verify you're using whitelisted APIs: `api.query`, `api.devices`

### Widget doesn't update
- Check browser console for errors
- Verify onConfigChange is implemented
- Test with console.log in lifecycle hooks

### TypeScript errors
- Run `npm install` to ensure dependencies are installed
- Check tsconfig.json is properly configured
- Verify @sensormine/widget-sdk version compatibility

---

## 💡 Tips

1. **Always test locally** before uploading (use browser console)
2. **Use TypeScript** for better development experience
3. **Handle errors gracefully** (try/catch in API calls)
4. **Keep widgets lightweight** (< 5MB including dependencies)
5. **Follow React best practices** (functional components, hooks)
6. **Document your config inputs** (clear descriptions)
7. **Version widgets semantically** (1.0.0 → 1.1.0 → 2.0.0)

---

**Happy Widget Building! 🚀**
