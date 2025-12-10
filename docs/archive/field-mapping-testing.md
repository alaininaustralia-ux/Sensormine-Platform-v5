# Field Mapping Testing Guide

## Overview
This guide covers testing the field mapping feature end-to-end, from backend API to frontend UI.

## Prerequisites

1. **Infrastructure Running**:
   ```powershell
   docker-compose up -d
   ```

2. **Device.API Running**:
   ```powershell
   cd src/Services/Device.API
   dotnet run
   ```
   Should be running on `http://localhost:5295`

3. **Frontend Running** (for UI tests):
   ```powershell
   cd src/Web/sensormine-web
   npm run dev
   ```
   Should be running on `http://localhost:3000`

## Backend API Tests

### Automated Integration Test
Run the comprehensive PowerShell test script:

```powershell
.\test-field-mappings.ps1
```

This script tests:
- ✅ Device type creation with custom fields
- ✅ Field mapping retrieval (merged from schema, custom, system)
- ✅ Field mapping updates (friendly names, visibility, metadata)
- ✅ Field synchronization
- ✅ Data persistence
- ✅ Field source distribution
- ✅ Queryable field analysis

### Manual API Tests

#### 1. Create Device Type
```powershell
$deviceType = @{
    name = "Industrial Temperature Sensor"
    description = "High-precision temperature monitoring"
    protocol = "MQTT"
    protocolConfig = @{
        mqtt = @{
            broker = "localhost"
            port = 1883
            topic = "sensors/temperature"
        }
    }
    customFields = @(
        @{
            name = "calibration_offset"
            label = "Calibration Offset"
            type = "Number"
            required = $false
            description = "Temperature offset for calibration"
        }
    )
    tags = @("industrial", "temperature")
    isActive = $true
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Uri "http://localhost:5295/api/devicetype" `
    -Method POST -ContentType "application/json" -Body $deviceType

$deviceTypeId = $response.id
Write-Host "Created device type: $deviceTypeId"
```

#### 2. Get Field Mappings
```powershell
$fields = Invoke-RestMethod -Uri "http://localhost:5295/api/devicetype/$deviceTypeId/fields"

$fields | Format-Table fieldName, friendlyName, fieldSource, dataType, isVisible, isQueryable
```

Expected fields:
- **System fields**: battery_level, signal_strength, latitude, longitude
- **Custom fields**: calibration_offset
- **Schema fields**: (if schemaId provided)

#### 3. Update Field Mappings
```powershell
$updates = @{
    fieldMappings = @(
        @{
            fieldName = "battery_level"
            friendlyName = "Battery Percentage"
            description = "Remaining battery capacity"
            unit = "%"
            minValue = 0
            maxValue = 100
            isQueryable = $true
            isVisible = $true
            displayOrder = 1
            category = "Status"
            tags = @("health")
            defaultAggregation = "avg"
            supportsAggregations = @("avg", "min", "max")
            formatString = "{0:0.0}%"
        },
        @{
            fieldName = "calibration_offset"
            friendlyName = "Cal. Offset (°C)"
            description = "Temperature calibration adjustment"
            unit = "°C"
            isQueryable = $true
            isVisible = $true
            displayOrder = 10
            category = "Configuration"
        }
    )
} | ConvertTo-Json -Depth 10

$updated = Invoke-RestMethod -Uri "http://localhost:5295/api/devicetype/$deviceTypeId/fields" `
    -Method PUT -ContentType "application/json" -Body $updates

Write-Host "Updated $($updated.Count) field mappings"
```

#### 4. Synchronize Fields
```powershell
$synced = Invoke-RestMethod -Uri "http://localhost:5295/api/devicetype/$deviceTypeId/fields/sync" `
    -Method POST -ContentType "application/json"

Write-Host "Synchronized $($synced.Count) fields"
```

#### 5. Verify Persistence
```powershell
$verify = Invoke-RestMethod -Uri "http://localhost:5295/api/devicetype/$deviceTypeId/fields"

# Check if updates persisted
$batteryField = $verify | Where-Object { $_.fieldName -eq "battery_level" }
Write-Host "Battery friendly name: $($batteryField.friendlyName)"
Write-Host "Battery unit: $($batteryField.unit)"
```

## Frontend UI Tests

### 1. Navigate to Device Type Editor
1. Open browser: `http://localhost:3000`
2. Navigate to **Settings → Device Types**
3. Click on a device type (or create one)
4. Go to **Field Mappings** tab

### 2. View Field Mappings
**Expected UI**:
- Table showing all fields (system, schema, custom)
- Columns: Field Name, Friendly Name, Source (badge), Type, Unit, Visible, Queryable, Actions
- Source badges: Schema (blue), Custom (gray), System (outline)
- Eye icon for visibility toggle
- Edit button for each field

**Test Cases**:
- ✅ All fields displayed in table
- ✅ Source badges show correct colors
- ✅ Visibility icons show correct state (Eye vs EyeOff)
- ✅ Display order is respected
- ✅ Empty state shown if no fields

### 3. Toggle Field Visibility
**Steps**:
1. Click eye icon on any field
2. Icon should change immediately (Eye ↔ EyeOff)
3. Change should persist (reload page to verify)

**Test Cases**:
- ✅ Icon toggles immediately
- ✅ Change persists after page reload
- ✅ API call succeeds
- ✅ Error message shown if API call fails

### 4. Edit Field Mapping
**Steps**:
1. Click **Edit** button on a field
2. Dialog opens with field details
3. Modify:
   - Friendly Name: "My Custom Name"
   - Description: "Updated description"
   - Unit: "°F"
   - Min/Max values
   - Category: "Sensors"
   - Display Order: 5
   - Toggle visibility and queryable switches
4. Click **Save Changes**

**Test Cases**:
- ✅ Dialog opens with current values
- ✅ Field name and source are read-only
- ✅ All fields can be edited
- ✅ Number inputs validate properly
- ✅ Save button disabled during save
- ✅ Success toast shown
- ✅ Table updates with new values
- ✅ Dialog closes after save
- ✅ Cancel button discards changes

### 5. Sync Fields Button
**Steps**:
1. Click **Sync Fields** button
2. Button shows spinner during sync
3. Table refreshes with synchronized data

**Test Cases**:
- ✅ Button disabled during sync
- ✅ Spinner animation shows
- ✅ Success toast shown
- ✅ Table refreshes with new data
- ✅ Error toast if sync fails

### 6. Field Source Filtering (Future Enhancement)
Expected behavior:
- Filter dropdown to show only Schema/Custom/System fields
- Search box to filter by field name or friendly name

## Query API Integration Tests

### 1. Query by Friendly Name
```powershell
# Create some test telemetry data first
# Then query using friendly names

$query = @{
    deviceTypeId = $deviceTypeId
    fields = @("Battery Percentage", "Temperature")
    startTime = (Get-Date).AddHours(-24).ToString("o")
    endTime = (Get-Date).ToString("o")
    aggregation = "avg"
    interval = "1h"
} | ConvertTo-Json

$results = Invoke-RestMethod -Uri "http://localhost:5296/api/query" `
    -Method POST -ContentType "application/json" -Body $query

$results | Format-Table
```

**Expected**:
- Query API resolves "Battery Percentage" → `battery_level` column
- Query API resolves "Temperature" → schema field or custom field
- Results returned with correct data

### 2. Verify Field Mapping Usage
Check Query API logs for:
```
Resolved field mapping: 'Battery Percentage' → 'battery_level' (System)
Resolved field mapping: 'Temperature' → 'custom_fields.temperature' (CustomField)
```

## Dashboard Designer Integration Tests

### 1. Widget Configuration
**Steps**:
1. Open dashboard designer
2. Add a new widget (Line Chart, Gauge, etc.)
3. Select device type
4. Field dropdown should show friendly names

**Expected**:
- Field dropdown populated from field mappings
- Shows friendly names (not field names)
- Grouped by category (if implemented)
- Shows units next to names
- Example: "Battery Percentage (%)" instead of "battery_level"

### 2. Widget Data Binding
**Steps**:
1. Configure widget with friendly name
2. Save widget
3. Widget should fetch data using resolved field name

**Expected**:
- Widget queries using friendly name
- Query API resolves to actual field name
- Data displays correctly
- Unit shown in widget (e.g., axis label)

## Edge Cases & Error Handling

### 1. Device Type Without Schema
**Test**: Create device type without `schemaId`
**Expected**: Only System and Custom fields shown

### 2. Empty Custom Fields
**Test**: Create device type with `customFields = []`
**Expected**: Only System (and Schema if present) fields shown

### 3. Field Name Collision
**Test**: Custom field named "battery_level" (same as system field)
**Expected**: Both fields shown, distinguished by source badge

### 4. Schema Change
**Test**: 
1. Get initial field mappings
2. Update schema in SchemaRegistry.API
3. Click Sync Fields
**Expected**: New schema fields added, existing mappings preserved

### 5. Invalid Field Updates
**Test**: Try to update with empty friendly name
**Expected**: API returns 400 Bad Request, frontend shows error

### 6. Network Errors
**Test**: Stop Device.API while editing
**Expected**: Error toast shown, changes not lost in UI

## Performance Tests

### 1. Large Field Count
**Test**: Device type with 50+ fields (10 system + 30 schema + 10 custom)
**Expected**:
- Table renders quickly (<1s)
- Scrollable interface
- Edit dialog responsive
- Bulk update completes in <2s

### 2. Rapid Updates
**Test**: Toggle visibility on 20 fields in quick succession
**Expected**:
- API handles concurrent requests
- UI updates smoothly
- No race conditions
- Final state consistent

## Accessibility Tests

### 1. Keyboard Navigation
- Tab through table rows
- Enter/Space to toggle visibility
- Tab to Edit button, Enter to open dialog
- Tab through dialog fields
- Escape to close dialog

### 2. Screen Reader
- Field names announced
- Friendly names announced
- Source badges announced
- Visibility state announced
- Form labels properly associated

## Browser Compatibility

Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Edge (latest)
- ✅ Safari (latest, macOS/iOS)

## Mobile Responsiveness

Test on:
- ✅ Desktop (1920x1080)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667)

Expected:
- Table scrollable horizontally on mobile
- Edit dialog responsive
- Touch-friendly buttons (44x44px minimum)

## Test Data Cleanup

After testing, clean up:

```powershell
# Delete test device types
Invoke-RestMethod -Uri "http://localhost:5295/api/devicetype/$deviceTypeId" -Method DELETE

# Verify field mappings cascade deleted
$fields = Invoke-RestMethod -Uri "http://localhost:5295/api/devicetype/$deviceTypeId/fields" -Method GET
# Should return 404
```

## Continuous Integration

Add to CI pipeline:

```yaml
- name: Run Field Mapping Integration Tests
  run: |
    cd src/Services/Device.API
    dotnet run &
    sleep 10
    pwsh ../../test-field-mappings.ps1
```

## Success Criteria

All tests pass if:
- ✅ Field mappings merge all sources correctly
- ✅ Friendly names persist across sessions
- ✅ Visibility toggles work reliably
- ✅ Sync button updates fields without losing customizations
- ✅ UI is responsive and accessible
- ✅ Query API can resolve friendly names
- ✅ Dashboard widgets use friendly names
- ✅ No memory leaks or performance issues
- ✅ Error handling is graceful
- ✅ Multi-tenant isolation maintained
