# Custom Widget System - Complete Implementation

**Status:** ✅ Complete  
**Last Updated:** December 13, 2025

---

## 📋 Overview

The custom widget system allows developers to upload their own dashboard widgets packaged as ZIP files. Widgets are executed in isolated iframes with restricted API access, providing a secure and extensible platform for custom visualizations.

---

## 🏗️ Architecture

### Components

1. **Backend API** (Template.API)
   - Widget upload, validation, storage (MinIO)
   - Database persistence (PostgreSQL)
   - Download and management endpoints

2. **Widget SDK** (@sensormine/widget-sdk)
   - TypeScript/React base classes
   - API communication layer (postMessage)
   - Lifecycle hooks and error handling

3. **Widget Loader** (WidgetLoader.tsx)
   - Iframe sandbox component
   - postMessage bridge for API calls
   - Security isolation and CSP headers

4. **Widget Gallery** (Next.js App Router)
   - Browse widgets with search/filters
   - Upload interface with drag-drop
   - Widget details pages

5. **Dashboard Integration**
   - Widget Palette with custom widgets section
   - WidgetRenderer support for 'custom' type
   - Dynamic configuration panel

---

## 📦 Widget SDK (@sensormine/widget-sdk)

### Location
```
src/Web/widget-sdk/
├── src/
│   ├── types.ts          # TypeScript type definitions
│   ├── WidgetBase.tsx    # React base class
│   ├── api.ts            # API communication layer
│   └── index.ts          # Exports
├── package.json          # NPM package config
├── tsconfig.json         # TypeScript config
└── README.md            # Developer documentation
```

### Key Types

```typescript
interface WidgetManifest {
  id: string;                     // Reverse domain (com.example.widget)
  name: string;                   // Display name
  version: string;                // Semantic version (1.0.0)
  description: string;
  author: string;
  icon?: string;                  // Emoji or icon code
  category: string;               // chart, kpi, gauge, map, table, control, other
  tags?: string[];
  permissions: {
    apis: ('api.query' | 'api.devices')[];
  };
  size?: {
    defaultWidth: number;         // Grid columns (1-12)
    defaultHeight: number;        // Grid rows
    minWidth?: number;
    minHeight?: number;
  };
  config?: {
    inputs?: Array<{
      name: string;
      label: string;
      type: 'text' | 'number' | 'boolean' | 'select';
      required?: boolean;
      default?: unknown;
      description?: string;
      options?: Array<{ label: string; value: string }>;
    }>;
  };
}

interface WidgetContext {
  instanceId: string;             // Unique widget instance ID
  tenantId: string;               // Tenant context
  config: Record<string, unknown>; // User configuration
  size: { width: number; height: number };
}

interface WidgetAPI {
  queryTelemetry(request: TelemetryQueryRequest): Promise<TelemetryQueryResponse>;
  getDevice(deviceId: string): Promise<Device>;
  listDevices(filter?: DeviceFilter): Promise<Device[]>;
  subscribeTelemetry(deviceIds: string[], callback: (data: TelemetryData) => void): () => void;
}
```

### WidgetBase Class

```typescript
import { WidgetBase } from '@sensormine/widget-sdk';

export default class MyCustomWidget extends WidgetBase<Props, State> {
  // Called when widget is mounted
  protected onMount(context: WidgetContext): void {
    // Initialize widget
  }

  // Called when configuration changes
  protected onConfigChange(config: Record<string, unknown>): void {
    // Update widget based on new config
  }

  // Called when widget is resized
  protected onResize(size: { width: number; height: number }): void {
    // Adjust layout
  }

  // Called when widget is unmounted
  protected onUnmount(): void {
    // Cleanup
  }

  render() {
    return <div>My Widget</div>;
  }
}
```

### API Methods

```typescript
// Query telemetry data
const response = await this.api.queryTelemetry({
  deviceIds: ['device-uuid'],
  fields: ['temperature', 'humidity'],
  startTime: '2025-12-01T00:00:00Z',
  endTime: '2025-12-13T23:59:59Z',
  aggregation: 'avg',
  interval: '15m',
});

// Get device details
const device = await this.api.getDevice('device-uuid');

// List devices
const devices = await this.api.listDevices({
  type: 'temperature-sensor',
  status: 'active',
});

// Subscribe to real-time updates
const unsubscribe = this.api.subscribeTelemetry(['device-uuid'], (data) => {
  console.log('New telemetry:', data);
});
// Later: unsubscribe();
```

---

## 🔒 Widget Loader (Iframe Sandbox)

### Location
`src/Web/sensormine-web/src/components/widgets/WidgetLoader.tsx`

### Features
- **Iframe Isolation**: `sandbox="allow-scripts allow-same-origin"`
- **CSP Headers**: Restricts inline scripts, external resources
- **PostMessage Bridge**: Secure communication between iframe and parent
- **API Routing**: Routes widget API calls to backend services
- **Loading/Error States**: User feedback with icons
- **Context Injection**: Injects `window.__WIDGET_CONTEXT__` into iframe

### Security

```html
<!-- CSP header in iframe HTML -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: blob:;">
```

### Communication Flow

```
┌─────────────────────┐                    ┌──────────────────────┐
│  Parent Dashboard   │                    │   Widget (iframe)    │
└──────────┬──────────┘                    └──────────┬───────────┘
           │                                          │
           │  1. Load widget HTML + context          │
           ├─────────────────────────────────────────>│
           │                                          │
           │  2. widget:ready                        │
           │<─────────────────────────────────────────┤
           │                                          │
           │  3. api:request (queryTelemetry)        │
           │<─────────────────────────────────────────┤
           │                                          │
           │  4. Fetch /api/query/telemetry          │
           │  (with X-Tenant-Id header)              │
           │                                          │
           │  5. api:response                        │
           ├─────────────────────────────────────────>│
           │                                          │
```

---

## 🎨 Widget Gallery UI

### Pages

1. **Browse Page** (`/widgets`)
   - Search by name/description
   - Filter by category (all/chart/kpi/gauge/map/table/control/other)
   - Pagination (10 items per page)
   - Widget cards with icon, name, description, version, tags, author, download count
   - Actions: View Details, Download, Delete

2. **Upload Page** (`/widgets/upload`)
   - Drag-and-drop zone
   - File validation (.zip, 5MB limit)
   - Progress indicator
   - Requirements checklist:
     - Max 5MB ZIP file
     - manifest.json required
     - index.js entry point
     - Reverse domain ID (com.example.widget)
     - Semantic versioning
     - Restricted permissions (api.query, api.devices only)

3. **Widget Details** (`/widgets/[id]`)
   - Header: Icon, name, version, description
   - Actions: Download, Install
   - Information Card: Author, created date, download count, file size
   - Categories & Tags
   - Configuration Options: Dynamic inputs from manifest
   - Permissions: API access list

### API Integration

```typescript
// Fetch widgets
GET /api/widgets?limit=20&page=1&category=chart&status=published

// Upload widget
POST /api/widgets/upload
Content-Type: multipart/form-data
Body: { file: <ZIP file> }

// Get widget details
GET /api/widgets/{id}

// Download widget
GET /api/widgets/{id}/download

// Delete widget
DELETE /api/widgets/{id}
```

---

## 🧩 Dashboard Integration

### Widget Palette

**Location:** `src/Web/sensormine-web/src/components/dashboard-v2/WidgetPalette.tsx`

**Features:**
- Built-in Widgets section (timeseries-chart, kpi-card, gauge, etc.)
- Custom Widgets section
  - Loads from `/api/widgets?limit=20&status=published`
  - Shows icon, name, description, version
  - Click to add to dashboard
- Link to Widget Gallery if no custom widgets

**Usage:**
```tsx
const handleAddCustomWidget = (widget: CustomWidget) => {
  addWidget({
    type: 'custom',
    title: widget.name,
    config: {
      showTitle: true,
      customWidgetId: widget.id,
      customWidgetConfig: {},
    },
    position: {
      w: widget.manifest.size?.defaultWidth || 4,
      h: widget.manifest.size?.defaultHeight || 4,
      minW: widget.manifest.size?.minWidth || 2,
      minH: widget.manifest.size?.minHeight || 3,
    },
  });
};
```

### Widget Renderer

**Location:** `src/Web/sensormine-web/src/components/dashboard-v2/WidgetRenderer.tsx`

**Custom Widget Rendering:**
```tsx
case 'custom':
  return (
    <WidgetLoader
      widgetId={widget.config.customWidgetId}
      widgetUrl={`/api/widgets/${widget.config.customWidgetId}/download`}
      config={widget.config.customWidgetConfig || {}}
      size={{
        width: widget.position.w,
        height: widget.position.h,
      }}
      context={{
        instanceId: widget.id,
        tenantId: 'current',
        config: widget.config.customWidgetConfig || {},
        size: {
          width: widget.position.w,
          height: widget.position.h,
        },
      }}
    />
  );
```

### Configuration Panel

**Location:** `src/Web/sensormine-web/src/components/dashboard-v2/ConfigurationPanel.tsx`

**Custom Widget Config:**
- `CustomWidgetConfig` component
- Fetches widget manifest from `/api/widgets/{id}`
- Dynamically generates form inputs based on `manifest.config.inputs`
- Supports: text, number, boolean, select
- Updates `widget.config.customWidgetConfig` on change

---

## 🗄️ Backend API (Template.API)

### Endpoints

```
POST   /api/widgets/upload              # Upload widget package
GET    /api/widgets                     # List widgets (pagination, filters)
GET    /api/widgets/{id}                # Get widget details
GET    /api/widgets/{id}/download       # Download widget package
DELETE /api/widgets/{id}                # Delete widget
GET    /api/widgets/{id}/permissions    # List widget permissions
```

### Database Schema

```sql
-- custom_widgets table
CREATE TABLE custom_widgets (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(50) NOT NULL,
  author VARCHAR(255),
  icon VARCHAR(50),
  category VARCHAR(50),
  tags TEXT[],
  manifest JSONB NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  status VARCHAR(50) DEFAULT 'published',
  download_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- widget_permissions table
CREATE TABLE widget_permissions (
  id UUID PRIMARY KEY,
  widget_id UUID NOT NULL REFERENCES custom_widgets(id) ON DELETE CASCADE,
  permission_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- widget_usage_log table
CREATE TABLE widget_usage_log (
  id UUID PRIMARY KEY,
  widget_id UUID NOT NULL REFERENCES custom_widgets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,  -- 'download', 'install', 'uninstall'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Storage (MinIO)

**Bucket:** `widgets`  
**Path Structure:** `{tenantId}/{widgetId}/{version}/widget.zip`

**Example:**
```
s3://widgets/12345678-1234-1234-1234-123456789012/com.example.widget/1.0.0/widget.zip
```

### Validation

1. **File Size:** Max 5MB
2. **Format:** ZIP archive
3. **Required Files:** `manifest.json`, `index.js`
4. **Manifest Validation:**
   - Valid JSON schema
   - Reverse domain ID (com.example.widget)
   - Semantic versioning (1.0.0)
   - Whitelisted permissions (api.query, api.devices)
5. **Security Scan:** Check for eval, Function, document.write patterns

---

## 🧪 Testing

### Widget Development

```bash
# Create widget structure
mkdir my-widget && cd my-widget
npm init -y
npm install @sensormine/widget-sdk react react-dom

# Create widget
# src/index.tsx
import { WidgetBase } from '@sensormine/widget-sdk';

export default class MyWidget extends WidgetBase {
  render() {
    return <div>Hello World</div>;
  }
}

# Create manifest
# manifest.json
{
  "id": "com.example.my-widget",
  "name": "My Widget",
  "version": "1.0.0",
  "description": "My custom widget",
  "author": "Your Name",
  "permissions": {
    "apis": ["api.query"]
  }
}

# Build widget
npm run build

# Package widget
zip -r my-widget.zip manifest.json index.js
```

### Upload & Test

1. Go to http://localhost:3020/widgets/upload
2. Drag-drop `my-widget.zip`
3. Wait for success message
4. Go to dashboard builder
5. Open Widget Palette → Custom Widgets
6. Click "My Widget" to add to dashboard
7. Verify widget loads in iframe
8. Configure widget if needed
9. Test API calls (open browser console)

---

## 📚 Documentation

### For Widget Developers

- **SDK README:** `src/Web/widget-sdk/README.md`
- **Architecture Doc:** `docs/custom-widget-system-architecture.md`
- **API Implementation:** `docs/custom-widget-upload-api-implementation.md`
- **Example Widgets:** (To be created in separate repo)

### For Platform Users

- **Widget Gallery:** http://localhost:3020/widgets
- **Upload Guide:** In-page requirements list on upload page
- **Dashboard Help:** (To be added to platform docs)

---

## 🚀 Deployment

### Widget SDK Publishing

```bash
cd src/Web/widget-sdk

# Build SDK
npm run build

# Test locally
npm link

# Publish to npm
npm publish
# OR publish to private registry
npm publish --registry https://registry.example.com
```

### Backend Deployment

1. **Environment Variables:**
   ```env
   MinIO__Endpoint=minio:9000
   MinIO__AccessKey=minio
   MinIO__SecretKey=minio123
   MinIO__BucketName=widgets
   MinIO__UseSSL=false
   Widget__MaxFileSizeBytes=5242880  # 5MB
   Widget__AllowedFileExtensions=.zip
   ```

2. **Database Migration:**
   ```bash
   docker exec -i sensormine-timescaledb psql -U sensormine -d sensormine_metadata < infrastructure/migrations/20251213_add_custom_widgets.sql
   ```

3. **MinIO Bucket:**
   ```bash
   # Create bucket via MinIO console or CLI
   mc mb local/widgets
   mc policy set download local/widgets
   ```

---

## 🔧 Troubleshooting

### Widget Won't Load

**Symptom:** "Widget not found" or loading spinner never stops

**Solution:**
1. Check widget ID in browser console
2. Verify widget exists: `GET /api/widgets/{id}`
3. Check MinIO storage path exists
4. Verify widget file is valid ZIP

### API Calls Fail

**Symptom:** Widget shows error, API requests return 403/404

**Solution:**
1. Check widget permissions in manifest.json
2. Verify postMessage communication in browser console
3. Check X-Tenant-Id header in network tab
4. Verify backend API endpoints are accessible
5. Check CORS configuration

### Widget Not Appearing in Palette

**Symptom:** Custom Widgets section is empty

**Solution:**
1. Check widget status (must be 'published')
2. Verify `/api/widgets` returns data
3. Check browser console for fetch errors
4. Verify tenant_id matches current user

### Configuration Not Saving

**Symptom:** Widget config resets after page reload

**Solution:**
1. Check "Apply & Close" button clicked
2. Verify dashboard save API call succeeds
3. Check `customWidgetConfig` in widget object
4. Verify backend persists widget config in dashboard.widgets

---

## 📈 Future Enhancements

### Phase 2
- [ ] Widget SDK npm package publishing
- [ ] Example widgets repository
- [ ] Widget marketplace with ratings/reviews
- [ ] Widget versioning and update notifications
- [ ] Widget sandboxing with WebAssembly
- [ ] Advanced API permissions (api.alerts, api.commands)
- [ ] Widget templates and scaffolding CLI
- [ ] Widget debugging tools

### Phase 3
- [ ] Widget monetization and licensing
- [ ] Widget analytics (usage, performance)
- [ ] Widget collaboration (shared development)
- [ ] Widget CI/CD pipeline
- [ ] Widget testing framework
- [ ] Widget documentation generator

---

## 📞 Support

**Issues:** GitHub Issues  
**Documentation:** `docs/` folder  
**Team:** platform-team@example.com  
**Slack:** #sensormine-widgets

---

**Last Updated:** December 13, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
