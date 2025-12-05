# Device-Schema Integration

## Overview
This document describes the integration of schema selection into the device configuration workflow, enabling users to associate data schemas with IoT devices for proper data validation and structure.

## Feature Summary

### 1. Schema Selection in Device Configuration
Devices can now be associated with a data schema that defines the structure and validation rules for the data they produce.

**Key Features:**
- **Optional Schema Assignment**: Schemas are optional during device creation
- **Smart Filtering**: Schemas are filtered and prioritized based on device type
- **Browse & Search**: Dialog-based schema browser with search capability
- **Quick Creation**: Direct link to schema creation wizard from device form
- **Visual Feedback**: Selected schema displayed with full details and tags
- **Version Display**: Shows current schema version in use

### 2. Components Created/Modified

#### New Components

**`SchemaSelector.tsx`**
- Reusable component for schema selection
- Features:
  - Dropdown selector for quick selection
  - Full dialog browser with search
  - Device-type aware filtering
  - Real-time schema loading
  - Link to create new schemas
  - Selected schema details display with remove option
  - External link to view schema details

#### Modified Components

**`DeviceConfigurationForm.tsx`**
- Added new "Schema" tab to device wizard
- Integrated SchemaSelector component
- Extended DeviceConfig interface with:
  - `schemaId?: string`
  - `schemaName?: string`
- Added best practices panel for schema usage
- Tab order: Basic Info → Schema → Network → Advanced → Security

**`DeviceList.tsx`**
- Added schema name to device cards
- Shows "Not set" for devices without schemas
- Updated mock data to include schema information

**`devices/[id]/page.tsx`** (Device Detail)
- Added "Data Schema" field to device information card
- Clickable link to view schema details
- Shows "Not configured" for devices without schemas

### 3. User Workflow

#### Creating a Device with Schema

1. **Navigate to Add Device** (`/devices/new`)
2. **Fill Basic Info Tab**
   - Device name, type, serial number, location, tags
3. **Select Schema Tab** (NEW)
   - Choose from dropdown (shows 10 most relevant schemas)
   - OR click "Browse Schemas" for full dialog
   - Search by name, description, or tags
   - Schemas auto-prioritized by device type match
   - Option to create new schema in separate tab
4. **Configure Network Settings**
5. **Configure Advanced & Security**
6. **Save Configuration**

#### Browsing Available Schemas

From the Schema tab:
- **Quick Select**: Dropdown shows 10 most relevant schemas
- **Full Browse**: "Browse Schemas" button opens dialog
  - Search bar for filtering
  - Visual schema cards with descriptions and tags
  - Version information displayed
  - Click to select
  - Link to create new schema

#### Schema Information Display

**Device List** (`/devices`)
- Each device card shows schema name
- "Not set" shown for devices without schemas

**Device Detail** (`/devices/[id]`)
- Schema name shown in Device Information card
- Clickable link to schema details page
- "Not configured" shown when no schema assigned

### 4. Technical Implementation

#### Data Flow

```typescript
// Device Configuration Form
interface DeviceConfig {
  // ... existing fields
  schemaId?: string;      // Schema reference
  schemaName?: string;    // Cache for display
}

// Schema Selector
interface SchemaSelectorProps {
  selectedSchemaId?: string;
  onSchemaSelect: (schemaId: string | undefined, schema?: Schema) => void;
  deviceType?: string;  // Used for filtering
}
```

#### Schema Filtering Logic

1. **Load All Active Schemas**: Only schemas with `status: 'Active'`
2. **Search Filtering**: Match against name, description, and tags
3. **Device Type Prioritization**: 
   - Schemas with tags matching device type appear first
   - Example: `NEXUS_PROBE` prioritizes tags containing "nexus" or "probe"
4. **Sorting**: Alphabetical by name within priority groups

#### API Integration

**Schemas Loaded:**
```typescript
getSchemas({
  status: 'Active',
  pageSize: 100,
  sortBy: 'name',
  sortOrder: 'asc',
})
```

**Schema Selection:**
```typescript
handleSchemaSelect(schemaId: string, schema?: Schema) {
  updateConfig({ 
    schemaId, 
    schemaName: schema?.name 
  });
}
```

### 5. UI/UX Design

#### Schema Tab Layout

```
┌─────────────────────────────────────────────┐
│ 📄 Data Schema Configuration                │
│                                             │
│ Define how data from this device should    │
│ be structured and validated...             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Data Schema           [ℹ Browse Schemas]   │
│                                             │
│ ┌───────────────────────────────────────┐  │
│ │ 📄 Water Tank Telemetry Schema   v1.0│  │
│ │ IoT sensor data schema for water tanks│  │
│ │ [temperature] [level] [iot]          │  │
│ │                         [🔗] [Remove] │  │
│ └───────────────────────────────────────┘  │
│                                             │
│ The schema defines the structure of data... │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 💡 Best Practices                           │
│ • Choose schema matching device data format │
│ • Use AI schema generator for sample data  │
│ • Schemas can be updated later             │
│ • Active schemas ensure data validation    │
└─────────────────────────────────────────────┘
```

#### Browse Dialog Layout

```
┌──────────────────────────────────────────────┐
│ Select Data Schema                      [X]  │
│ Choose a schema that defines the data...    │
├──────────────────────────────────────────────┤
│ [🔍 Search schemas...]                      │
│                                              │
│ ┌──────────────────────────────────────┐   │
│ │ Can't find the right schema?         │   │
│ │           [+ Create New Schema 🔗]   │   │
│ └──────────────────────────────────────┘   │
│                                              │
│ ┌──────────────────────────────────────┐   │
│ │ 📄 Water Tank Telemetry    [✓] v1.0  │   │
│ │ IoT sensor data for water monitoring │   │
│ │ [temperature] [level] [iot]          │   │
│ └──────────────────────────────────────┘   │
│                                              │
│ ┌──────────────────────────────────────┐   │
│ │ 📄 HVAC Sensor Data         v2.1     │   │
│ │ HVAC system telemetry schema         │   │
│ │ [hvac] [temperature] [humidity]      │   │
│ └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

### 6. Benefits

1. **Data Consistency**: Ensures all devices send properly structured data
2. **Validation**: Automatic data validation against defined schemas
3. **Documentation**: Self-documenting data structures
4. **Type Safety**: Frontend and backend can generate types from schemas
5. **Flexibility**: Optional during initial setup, can be configured later
6. **Discoverability**: Easy to find and assign appropriate schemas
7. **Version Control**: Schema versions tracked and displayed

### 7. Future Enhancements

- **Auto-suggest schemas** based on device type and manufacturer
- **Schema templates** for common device types
- **Schema validation testing** before assignment
- **Multi-schema support** for devices with multiple data streams
- **Schema migration tools** when updating device schemas
- **Analytics** on schema usage and adoption

### 8. Files Modified

```
New Files:
- src/Web/sensormine-web/src/components/devices/SchemaSelector.tsx

Modified Files:
- src/Web/sensormine-web/src/components/devices/DeviceConfigurationForm.tsx
- src/Web/sensormine-web/src/components/devices/DeviceList.tsx
- src/Web/sensormine-web/src/app/devices/[id]/page.tsx
- src/Web/sensormine-web/src/app/devices/new/page.tsx (indirectly via DeviceConfig interface)

Documentation:
- docs/device-schema-integration.md (this file)
```

### 9. Testing Checklist

- [ ] Schema selector loads active schemas
- [ ] Search filters schemas correctly
- [ ] Device type filtering prioritizes relevant schemas
- [ ] Browse dialog opens and closes properly
- [ ] Schema selection updates device config
- [ ] Selected schema displays with all details
- [ ] Remove button clears schema selection
- [ ] Link to schema details page works
- [ ] Link to create new schema opens in new tab
- [ ] Device list shows schema names
- [ ] Device detail page shows schema information
- [ ] Form validation works with optional schema
- [ ] Tab navigation works correctly
- [ ] Mobile responsive layout

### 10. Screenshots Locations

When implementing in production:
- Add screenshots to `docs/images/device-schema-integration/`
- Include: schema tab, browse dialog, device list, device detail

---

**Document Version**: 1.0  
**Last Updated**: December 5, 2025  
**Author**: GitHub Copilot  
**Related Stories**: Story 2.1 (Schema Registry), Story 1.x (Device Management)
