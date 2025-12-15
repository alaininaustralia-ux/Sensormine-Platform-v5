# Template System Design

**Last Updated:** December 13, 2025  
**Status:** Design Proposal  
**Purpose:** Enable packaging and sharing of tenant configurations

---

## 🎯 Overview

The Template System allows users to export tenant configurations (dashboards, alerts, device types, schemas, etc.) into JSON templates that can be imported into other tenants. This enables:

- **Reusability:** Share best-practice configurations across tenants
- **Onboarding:** Quick setup for new customers
- **Marketplace:** Future marketplace for community templates
- **Version Control:** Git-friendly JSON format
- **AI Integration:** Templates can be generated or modified by AI

---

## 🏗️ Architecture

### New Service: Template.API

**Port:** 5320  
**Database:** sensormine_metadata  
**Purpose:** Template orchestration and management

**Responsibilities:**
- Export configurations from multiple services into unified template
- Import templates with ID remapping and validation
- Template versioning and compatibility checking
- Template marketplace (future)
- AI-assisted template generation (future)

---

## 📋 Template JSON Schema

### Root Structure

```json
{
  "template": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Industrial Monitoring Package",
    "version": "1.0.0",
    "schemaVersion": "1.0",
    "description": "Complete monitoring setup for industrial facilities with temperature, pressure, and vibration sensors",
    "author": "Sensormine",
    "authorEmail": "support@sensormine.com",
    "createdAt": "2025-12-13T00:00:00Z",
    "updatedAt": "2025-12-13T00:00:00Z",
    "tags": ["industrial", "monitoring", "temperature", "pressure"],
    "category": "Industrial IoT",
    "license": "MIT",
    "dependencies": [],
    "compatibility": {
      "minPlatformVersion": "5.0.0",
      "maxPlatformVersion": "6.0.0"
    },
    "metadata": {
      "downloadCount": 0,
      "rating": 0,
      "verified": false
    }
  },
  "resources": {
    "schemas": [...],
    "deviceTypes": [...],
    "assets": [...],
    "dashboards": [...],
    "alertRules": [...],
    "nexusConfigurations": [...],
    "navigation": [...],
    "preferences": [...]
  },
  "mappings": {
    "references": {
      "schema_1": "deviceType_1",
      "deviceType_1": ["alert_1", "dashboard_1"],
      "asset_1": ["dashboard_2"]
    }
  },
  "importOptions": {
    "conflictResolution": "skip|overwrite|rename",
    "preserveIds": false,
    "importDevices": false,
    "importData": false
  }
}
```

---

## 🔧 Resource Structures

### Schemas

```json
"schemas": [
  {
    "localId": "schema_1",
    "name": "Temperature Sensor Schema",
    "version": "1.0.0",
    "schemaDefinition": {
      "type": "record",
      "name": "TemperatureSensor",
      "fields": [
        {"name": "temperature", "type": "float"},
        {"name": "humidity", "type": "float"},
        {"name": "timestamp", "type": "long", "logicalType": "timestamp-millis"}
      ]
    },
    "description": "Standard temperature and humidity sensor schema"
  }
]
```

### Device Types

```json
"deviceTypes": [
  {
    "localId": "deviceType_1",
    "name": "Industrial Temperature Sensor",
    "description": "Temperature sensor for industrial environments",
    "schemaRef": "schema_1",
    "customFields": {
      "manufacturer": "ACME Corp",
      "model": "TEMP-3000",
      "certifications": ["IP67", "ATEX"]
    },
    "fieldMappings": [
      {
        "fieldName": "temperature",
        "friendlyName": "Temperature",
        "description": "Ambient temperature in Celsius",
        "unit": "°C",
        "dataType": "Float",
        "isQueryable": true,
        "isVisible": true,
        "fieldSource": "Schema"
      }
    ],
    "icon": "thermometer",
    "color": "#FF6B6B"
  }
]
```

### Assets

```json
"assets": [
  {
    "localId": "asset_1",
    "name": "Production Floor",
    "type": "Floor",
    "parentRef": null,
    "icon": "building",
    "metadata": {
      "area_sqm": 5000,
      "capacity": 100
    },
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "dataPointMappings": []
  }
]
```

### Dashboards

```json
"dashboards": [
  {
    "localId": "dashboard_1",
    "name": "Temperature Overview",
    "description": "Real-time temperature monitoring across all zones",
    "layout": {
      "columns": 12,
      "rowHeight": 60
    },
    "widgets": [
      {
        "id": "widget_1",
        "type": "chart",
        "position": {"x": 0, "y": 0, "w": 6, "h": 4},
        "config": {
          "chartType": "line",
          "title": "Temperature Trends",
          "deviceTypeRef": "deviceType_1",
          "fields": ["temperature"],
          "timeRange": "24h",
          "aggregation": "avg",
          "refreshInterval": 30
        }
      }
    ],
    "filters": {
      "deviceTypeRef": "deviceType_1",
      "assetRef": "asset_1"
    }
  }
]
```

### Alert Rules

```json
"alertRules": [
  {
    "localId": "alert_1",
    "name": "High Temperature Alert",
    "description": "Triggers when temperature exceeds 75°C",
    "condition": "temperature > 75",
    "deviceTypeRef": "deviceType_1",
    "deviceRef": null,
    "severity": 3,
    "isEnabled": true,
    "actions": [
      {
        "type": "email",
        "config": {
          "recipients": ["operator@example.com"],
          "subject": "High Temperature Alert",
          "body": "Temperature exceeded threshold"
        }
      }
    ],
    "cooldownMinutes": 15
  }
]
```

### Nexus Configurations

```json
"nexusConfigurations": [
  {
    "localId": "nexus_1",
    "name": "Production MQTT Broker",
    "protocol": "MQTT",
    "configuration": {
      "brokerUrl": "mqtt://broker.example.com:1883",
      "clientId": "nexus-client-1",
      "qos": 1,
      "topics": [
        {
          "topic": "factory/floor1/+/temperature",
          "deviceTypeRef": "deviceType_1"
        }
      ]
    },
    "authType": "UsernamePassword",
    "isEnabled": true
  }
]
```

### Navigation (Extensibility Example)

```json
"navigation": [
  {
    "localId": "nav_1",
    "name": "Production Monitoring",
    "items": [
      {
        "label": "Overview",
        "type": "dashboard",
        "dashboardRef": "dashboard_1",
        "icon": "home"
      },
      {
        "label": "Alerts",
        "type": "alerts",
        "filter": {
          "alertRuleRef": "alert_1"
        },
        "icon": "bell"
      }
    ]
  }
]
```

### Preferences (Extensibility Example)

```json
"preferences": [
  {
    "localId": "pref_1",
    "scope": "tenant",
    "category": "display",
    "preferences": {
      "theme": "dark",
      "temperatureUnit": "celsius",
      "timezone": "UTC",
      "dateFormat": "YYYY-MM-DD",
      "language": "en"
    }
  }
]
```

---

## 🔄 ID Remapping Strategy

### Problem

Templates use local IDs (`localId`) that must be mapped to actual UUIDs on import. Resources reference each other (e.g., alert references device type).

### Solution: Three-Pass Import

**Pass 1: Create Resources**
- Import schemas → Generate UUID mappings
- Import device types → Map schema references
- Import assets → Map parent references
- Import nexus configurations

**Pass 2: Create Dependent Resources**
- Import dashboards → Map device type and asset references
- Import alert rules → Map device type references

**Pass 3: Create Associations**
- Import navigation → Map dashboard references
- Apply preferences

### Mapping Table

```json
{
  "schema_1": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "deviceType_1": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "dashboard_1": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "alert_1": "d4e5f6a7-b8c9-0123-def1-234567890123"
}
```

---

## 🌐 API Endpoints

### Template.API (Port 5320)

```
POST   /api/templates/export            # Export template from current tenant
POST   /api/templates/import            # Import template into current tenant
GET    /api/templates                   # List available templates
GET    /api/templates/{id}              # Get template details
POST   /api/templates                   # Create/upload template
DELETE /api/templates/{id}              # Delete template
GET    /api/templates/{id}/validate     # Validate template structure
GET    /api/templates/{id}/preview      # Preview what will be imported
POST   /api/templates/{id}/apply        # Apply template to tenant
```

### Export Request

```json
{
  "name": "My Custom Template",
  "description": "Custom monitoring setup",
  "author": "John Doe",
  "includeResources": {
    "schemas": true,
    "deviceTypes": ["uuid1", "uuid2"],
    "dashboards": ["uuid3"],
    "alertRules": ["uuid4"],
    "assets": false,
    "nexusConfigurations": true,
    "includeDevices": false
  },
  "exportOptions": {
    "includeData": false,
    "anonymize": false
  }
}
```

### Import Request

```json
{
  "template": { /* entire template JSON */ },
  "importOptions": {
    "conflictResolution": "skip",
    "preserveIds": false,
    "dryRun": true,
    "mapping": {
      "asset_1": "existing-asset-uuid"
    }
  }
}
```

### Import Response

```json
{
  "success": true,
  "imported": {
    "schemas": 2,
    "deviceTypes": 3,
    "dashboards": 1,
    "alertRules": 5
  },
  "skipped": {
    "schemas": ["Schema already exists: Temperature Sensor"]
  },
  "errors": [],
  "mappings": {
    "schema_1": "uuid1",
    "deviceType_1": "uuid2"
  }
}
```

---

## 🔒 Security Considerations

### Tenant Isolation

- All imported resources tagged with importing tenant's `tenant_id`
- No cross-tenant references allowed
- Template validation ensures no malicious payloads

### Validation

```csharp
public class TemplateValidator
{
    public ValidationResult Validate(Template template)
    {
        // Schema version compatibility
        // Resource reference integrity
        // No SQL injection in conditions
        // Size limits (max 100MB per template)
        // No circular dependencies
    }
}
```

### Permissions

- `templates:export` - Export configurations
- `templates:import` - Import configurations
- `templates:publish` - Publish to marketplace (future)

---

## 🚀 Implementation Plan

### Phase 1: Core Infrastructure (Current Sprint)

1. **Create Template.API project**
   - Port 5320
   - Database: sensormine_metadata
   - Connection to other services

2. **Define template schema**
   - JSON schema definition
   - Validation logic

3. **Implement export**
   - Export schemas (SchemaRegistry.API)
   - Export device types (Device.API)
   - Export dashboards (Dashboard.API)

4. **Implement import**
   - ID remapping logic
   - Three-pass import
   - Conflict resolution

### Phase 2: Extended Resources (Next Sprint)

5. **Add alert rules export/import** (Alerts.API)
6. **Add nexus configurations** (NexusConfiguration.API)
7. **Add assets** (DigitalTwin.API)

### Phase 3: Advanced Features (Future)

8. **Template marketplace**
9. **AI-assisted template generation**
10. **Template versioning and updates**
11. **Template dependencies**

---

## 🎨 Frontend Integration

### Template Management Page

```
/templates
  - List all available templates
  - Upload custom template
  - Export current configuration

/templates/{id}
  - Preview template
  - Import options
  - Apply to tenant
```

### Export Dialog

```tsx
<TemplateExportDialog>
  <Input name="Template Name" />
  <TextArea name="Description" />
  <Checklist>
    - [ ] Include Schemas
    - [ ] Include Device Types (3 selected)
    - [ ] Include Dashboards (1 selected)
    - [ ] Include Alert Rules (5 selected)
  </Checklist>
  <Button onClick={exportTemplate}>Export as JSON</Button>
</TemplateExportDialog>
```

### Import Preview

```tsx
<TemplateImportPreview template={template}>
  <Summary>
    - 2 schemas
    - 3 device types
    - 1 dashboard
    - 5 alert rules
  </Summary>
  <Conflicts>
    ⚠️ Device type "Temperature Sensor" already exists
    Action: [Skip | Overwrite | Rename]
  </Conflicts>
  <Button onClick={importTemplate}>Import</Button>
</TemplateImportPreview>
```

---

## 📚 Example Templates

### Starter Template

```json
{
  "template": {
    "name": "Starter Pack",
    "version": "1.0.0",
    "description": "Basic monitoring setup"
  },
  "resources": {
    "schemas": [/* temperature, humidity */],
    "deviceTypes": [/* basic sensors */],
    "dashboards": [/* overview dashboard */]
  }
}
```

### Industry-Specific Templates

- **Manufacturing:** Production line monitoring
- **Energy:** Solar farm monitoring
- **Agriculture:** Greenhouse monitoring
- **Smart Building:** HVAC and lighting

---

## 🤖 AI Integration (Future)

### AI-Assisted Template Creation

```
User: "Create a template for monitoring a water treatment facility"

AI: 
- Analyzes requirement
- Generates schemas (pH, flow rate, turbidity)
- Creates device types
- Designs dashboards
- Sets up alert rules
- Outputs complete template JSON
```

### AI Template Modification

```
User: "Add pressure monitoring to this template"

AI:
- Parses existing template
- Adds pressure field to schema
- Updates device type
- Adds pressure widget to dashboard
- Creates pressure alert rule
- Returns updated template
```

---

## 📝 Database Schema

### Templates Table

```sql
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    schema_version VARCHAR(50) NOT NULL,
    description TEXT,
    author VARCHAR(255),
    author_email VARCHAR(255),
    template_json JSONB NOT NULL,
    tags TEXT[],
    category VARCHAR(100),
    license VARCHAR(100),
    is_public BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    download_count INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    
    CONSTRAINT fk_templates_tenant FOREIGN KEY (tenant_id) 
        REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_templates_tenant_id ON templates(tenant_id);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_tags ON templates USING gin(tags);
CREATE INDEX idx_templates_is_public ON templates(is_public) WHERE is_public = true;
```

### Template Import History

```sql
CREATE TABLE template_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    template_id UUID NOT NULL,
    template_version VARCHAR(50) NOT NULL,
    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    imported_by VARCHAR(255),
    status VARCHAR(50) NOT NULL, -- success, partial, failed
    imported_count JSONB, -- {"schemas": 2, "deviceTypes": 3, ...}
    skipped_count JSONB,
    errors JSONB,
    
    CONSTRAINT fk_template_imports_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_template_imports_template FOREIGN KEY (template_id)
        REFERENCES templates(id) ON DELETE CASCADE
);

CREATE INDEX idx_template_imports_tenant_id ON template_imports(tenant_id);
CREATE INDEX idx_template_imports_template_id ON template_imports(template_id);
```

---

## ✅ Validation Rules

### Template Validation

```csharp
public class TemplateValidationRules
{
    // Schema validation
    - Schema version must be valid semver
    - Platform compatibility versions must exist
    - All required template fields present
    
    // Resource validation
    - All localIds must be unique within resource type
    - All references must exist within template
    - No circular references in asset hierarchy
    - Alert conditions must be valid expressions
    - Dashboard widget types must be supported
    
    // Security validation
    - No SQL injection in alert conditions
    - No XSS in descriptions/names
    - File size < 100MB
    - No binary data in JSON
    
    // Consistency validation
    - Schema fields match device type mappings
    - Dashboard references valid device types
    - Alert rules reference valid device types
}
```

---

## 🎯 Success Metrics

- Template export time < 5 seconds
- Template import time < 30 seconds
- Template validation time < 1 second
- Support templates up to 100MB
- Support 1000+ resources per template

---

**Next Steps:**
1. Review and approve design
2. Create Template.API project structure
3. Implement export functionality
4. Implement import with ID remapping
5. Build frontend UI
6. Create example templates
7. Documentation and testing

