# Custom Widget System Architecture

**Last Updated:** December 13, 2025  
**Status:** In Development  
**Architecture:** Sandboxed Plugin System with Automatic Publishing

---

## 🎯 Overview

The Custom Widget System allows developers to upload their own React/TypeScript dashboard widgets with automatic publishing, isolated execution, and controlled API access.

---

## 🏗️ Architecture Design

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│  Custom Widget System                                       │
├─────────────────────────────────────────────────────────────┤
│  1. Developer Tool                                          │
│     ├─ Widget SDK (@sensormine/widget-sdk)                 │
│     ├─ Widget CLI (widget-dev-cli)                         │
│     └─ Widget Bundler (Vite + esbuild)                     │
│                                                             │
│  2. Upload & Storage                                        │
│     ├─ Template.API (/api/widgets/*)                       │
│     ├─ MinIO Storage (widgets/)                            │
│     └─ Widget Registry (PostgreSQL)                        │
│                                                             │
│  3. Frontend Runtime                                        │
│     ├─ Widget Loader (dynamic import)                      │
│     ├─ Sandbox Manager (iframe isolation)                  │
│     └─ Permission Enforcer                                 │
│                                                             │
│  4. API Gateway (Restricted Access)                        │
│     ├─ Query.API Proxy                                     │
│     └─ Device.API Proxy                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Widget Package Format

### Package Structure
```
my-custom-widget.zip
├── manifest.json          # Widget metadata
├── index.js               # Bundled React component (ESM)
├── index.css              # Optional styles
└── assets/                # Optional assets (images, icons)
    └── icon.png
```

### Manifest Schema
```json
{
  "$schema": "https://sensormine.io/widget-manifest.schema.json",
  "id": "com.example.custom-gauge",
  "name": "Custom Gauge Widget",
  "version": "1.0.0",
  "description": "A custom gauge widget for displaying sensor data",
  "author": {
    "name": "Developer Name",
    "email": "dev@example.com",
    "organization": "Example Corp"
  },
  "license": "MIT",
  "entryPoint": "index.js",
  "icon": "assets/icon.png",
  "category": "chart",
  "tags": ["gauge", "metric", "sensor"],
  "permissions": {
    "apis": ["query", "devices"],
    "resources": ["telemetry", "device-metadata"]
  },
  "config": {
    "inputs": [
      {
        "name": "deviceId",
        "type": "string",
        "label": "Device ID",
        "required": true,
        "description": "The device to display data from"
      },
      {
        "name": "metric",
        "type": "string",
        "label": "Metric Name",
        "required": true,
        "description": "The metric field to display"
      },
      {
        "name": "minValue",
        "type": "number",
        "label": "Minimum Value",
        "default": 0
      },
      {
        "name": "maxValue",
        "type": "number",
        "label": "Maximum Value",
        "default": 100
      },
      {
        "name": "unit",
        "type": "string",
        "label": "Unit",
        "default": ""
      },
      {
        "name": "thresholds",
        "type": "array",
        "label": "Threshold Zones",
        "items": {
          "type": "object",
          "properties": {
            "max": {"type": "number"},
            "color": {"type": "string"}
          }
        },
        "default": []
      }
    ]
  },
  "size": {
    "minWidth": 2,
    "minHeight": 2,
    "maxWidth": 12,
    "maxHeight": 12,
    "defaultWidth": 4,
    "defaultHeight": 4
  }
}
```

---

## 🗄️ Database Schema

### custom_widgets table
```sql
CREATE TABLE custom_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    widget_id VARCHAR(255) NOT NULL,      -- e.g., "com.example.custom-gauge"
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50) NOT NULL,
    author_name VARCHAR(255),
    author_email VARCHAR(255),
    category VARCHAR(100),
    tags TEXT[],
    icon_url TEXT,
    storage_path TEXT NOT NULL,           -- MinIO path
    manifest JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'active',  -- active, deprecated, disabled
    download_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, widget_id, version)
);

CREATE INDEX idx_custom_widgets_tenant_id ON custom_widgets(tenant_id);
CREATE INDEX idx_custom_widgets_widget_id ON custom_widgets(widget_id);
CREATE INDEX idx_custom_widgets_status ON custom_widgets(status);
CREATE INDEX idx_custom_widgets_category ON custom_widgets(category);
```

### widget_permissions table
```sql
CREATE TABLE widget_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID REFERENCES custom_widgets(id) ON DELETE CASCADE,
    permission_type VARCHAR(100) NOT NULL,  -- api.query, api.devices, resource.telemetry
    granted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_widget_permissions_widget_id ON widget_permissions(widget_id);
```

### widget_usage_log table
```sql
CREATE TABLE widget_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID REFERENCES custom_widgets(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    user_id UUID,
    dashboard_id UUID,
    event_type VARCHAR(50) NOT NULL,       -- load, error, api_call
    event_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_widget_usage_log_widget_id ON widget_usage_log(widget_id);
CREATE INDEX idx_widget_usage_log_created_at ON widget_usage_log(created_at);
```

---

## 🔌 API Endpoints

### Widget Registry API (Template.API Extension)

```http
# Upload Widget Package
POST /api/widgets/upload
Content-Type: multipart/form-data
X-Tenant-Id: {tenantId}

Request:
- file: Widget package (.zip)

Response:
{
  "id": "uuid",
  "widgetId": "com.example.custom-gauge",
  "version": "1.0.0",
  "status": "active",
  "downloadUrl": "/api/widgets/{id}/download"
}

# List Widgets
GET /api/widgets?category=chart&tag=gauge
X-Tenant-Id: {tenantId}

Response:
{
  "widgets": [
    {
      "id": "uuid",
      "widgetId": "com.example.custom-gauge",
      "name": "Custom Gauge Widget",
      "version": "1.0.0",
      "author": {...},
      "config": {...},
      "downloadUrl": "/api/widgets/{id}/download"
    }
  ],
  "total": 1
}

# Get Widget Details
GET /api/widgets/{id}
X-Tenant-Id: {tenantId}

Response:
{
  "id": "uuid",
  "widgetId": "com.example.custom-gauge",
  "manifest": {...},
  "downloadUrl": "/api/widgets/{id}/download"
}

# Download Widget Bundle
GET /api/widgets/{id}/download
X-Tenant-Id: {tenantId}

Response:
- Content-Type: application/javascript
- Widget bundle (ESM module)

# Delete Widget
DELETE /api/widgets/{id}
X-Tenant-Id: {tenantId}

Response:
{
  "success": true
}

# Get Widget Permissions
GET /api/widgets/{id}/permissions
X-Tenant-Id: {tenantId}

Response:
{
  "permissions": ["api.query", "api.devices"]
}
```

---

## 🔐 Security Model

### 1. Package Validation
```typescript
// Validation steps during upload
1. Check file size (< 5MB)
2. Verify ZIP structure
3. Validate manifest.json schema
4. Scan for malicious code patterns
5. Verify bundled code is valid ESM
6. Check permissions are within allowed scope
7. Store in MinIO with tenant isolation
```

### 2. Execution Sandboxing

**Iframe Sandbox Approach:**
```html
<iframe
  sandbox="allow-scripts allow-same-origin"
  src="/widget-runtime.html"
  style="width: 100%; height: 100%;"
/>
```

**Communication via postMessage:**
```typescript
// Parent (Dashboard) → Widget
window.frames[0].postMessage({
  type: 'WIDGET_INIT',
  config: widgetConfig,
  permissions: ['api.query', 'api.devices']
}, '*');

// Widget → Parent (Dashboard)
window.parent.postMessage({
  type: 'API_REQUEST',
  method: 'query.getTelemetry',
  params: {deviceId, startTime, endTime}
}, '*');
```

### 3. API Permission Enforcement

**Allowed APIs:**
- `query.getTelemetry` - Read telemetry data
- `query.getLatest` - Read latest telemetry
- `devices.getDevice` - Read device metadata
- `devices.listDevices` - List devices

**Blocked APIs:**
- All write operations
- Admin APIs
- User management
- Billing APIs

```typescript
// Permission check before API call
const ALLOWED_APIS = {
  query: ['getTelemetry', 'getLatest', 'aggregate'],
  devices: ['getDevice', 'listDevices']
};

function checkPermission(widgetId: string, api: string, method: string): boolean {
  const widgetPermissions = getWidgetPermissions(widgetId);
  return widgetPermissions.includes(`api.${api}`) && 
         ALLOWED_APIS[api]?.includes(method);
}
```

### 4. Content Security Policy

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src 'self' http://localhost:5000;
  frame-src 'self';
```

---

## 🎨 Widget SDK

### Developer Experience

**Installation:**
```bash
npm install @sensormine/widget-sdk
```

**Widget Base Class:**
```typescript
import { Widget, WidgetConfig, WidgetProps } from '@sensormine/widget-sdk';

export default class CustomGaugeWidget extends Widget {
  static config: WidgetConfig = {
    id: 'com.example.custom-gauge',
    name: 'Custom Gauge Widget',
    version: '1.0.0',
    inputs: [
      { name: 'deviceId', type: 'string', required: true },
      { name: 'metric', type: 'string', required: true }
    ]
  };

  render(props: WidgetProps) {
    return (
      <div className="custom-gauge-widget">
        {/* Widget UI */}
      </div>
    );
  }
}
```

**API Client:**
```typescript
import { useWidgetAPI } from '@sensormine/widget-sdk';

function MyWidget({ config }) {
  const api = useWidgetAPI();
  
  const { data, loading } = useQuery(async () => {
    return await api.query.getTelemetry({
      deviceId: config.deviceId,
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endTime: new Date()
    });
  });
  
  return <div>{/* Render data */}</div>;
}
```

---

## 🚀 Development Workflow

### 1. Developer Creates Widget

```bash
# Initialize widget project
npx @sensormine/widget-cli init my-custom-gauge

# Develop locally with hot reload
npm run dev

# Build for production
npm run build

# Package widget
npm run package  # Creates my-custom-gauge-v1.0.0.zip
```

### 2. Upload to Platform

```bash
# Via CLI
npx @sensormine/widget-cli publish my-custom-gauge-v1.0.0.zip

# Or via Web UI
Dashboard → Settings → Custom Widgets → Upload Widget
```

### 3. Use in Dashboard

```typescript
// Dashboard configuration
{
  "widgets": [
    {
      "id": "widget-1",
      "type": "custom",
      "widgetId": "com.example.custom-gauge",
      "config": {
        "deviceId": "device-uuid",
        "metric": "temperature",
        "minValue": 0,
        "maxValue": 100
      },
      "position": { "x": 0, "y": 0, "w": 4, "h": 4 }
    }
  ]
}
```

---

## 📊 Storage Architecture

### MinIO Structure
```
sensormine-minio (bucket: widgets)
└── {tenantId}/
    └── {widgetId}/
        └── {version}/
            ├── index.js          # Bundled code
            ├── index.css         # Styles
            ├── manifest.json     # Metadata
            └── assets/           # Assets
                └── icon.png
```

---

## 🧪 Testing Strategy

### 1. Widget Validation Tests
- Manifest schema validation
- Package structure verification
- Code security scanning
- Permission boundary checks

### 2. Sandbox Security Tests
- Escape attempt detection
- Permission violation tests
- API access validation
- Cross-origin checks

### 3. Integration Tests
- Upload workflow
- Download and load widget
- API communication via postMessage
- Dashboard integration

---

## 📈 Performance Considerations

### 1. Widget Bundle Size
- Maximum 5MB per package
- Recommend < 500KB
- Use code splitting for large widgets

### 2. Loading Strategy
```typescript
// Lazy load widgets on demand
const loadWidget = async (widgetId: string) => {
  const widgetUrl = `/api/widgets/${widgetId}/download`;
  const module = await import(/* @vite-ignore */ widgetUrl);
  return module.default;
};
```

### 3. Caching
- CDN caching for widget bundles
- Browser cache with version hash
- Redis cache for widget metadata

---

## 🔄 Versioning

### Semantic Versioning
- **Major**: Breaking changes to config schema or API
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes

### Version Management
```typescript
// Dashboard can pin to specific version
{
  "widgetId": "com.example.custom-gauge",
  "version": "1.2.3"  // Explicit version
}

// Or use latest
{
  "widgetId": "com.example.custom-gauge",
  "version": "latest"
}
```

---

## 📚 Next Steps

1. ✅ **Design Architecture** (This document)
2. 🔨 Create database migration
3. 🔨 Extend Template.API with widget endpoints
4. 🔨 Build Widget SDK package
5. 🔨 Implement frontend widget loader
6. 🔨 Add security validation
7. 🔨 Create developer documentation

---

**Owner:** Platform Team  
**Review Date:** January 13, 2026
