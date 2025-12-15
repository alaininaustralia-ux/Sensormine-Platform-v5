# Sub-Dashboards - Drill-Through Navigation

**Last Updated:** December 13, 2025  
**Status:** Implemented  
**Feature:** Parameterized dashboard navigation for aggregate widgets

---

## 📋 Overview

**Sub-dashboards** are parameterized dashboards that enable drill-through navigation from aggregate widgets (maps, device lists, digital twin trees). They allow users to click on an item in an aggregate view and navigate to a detailed dashboard specific to that item, passing context such as a device ID or asset ID.

### Key Characteristics

- **Parameterized:** Accept either `deviceId` or `assetId` as a URL parameter
- **Contextual:** Display data specific to the selected device or asset
- **Single-Level:** No sub-sub-dashboards (only one level of drill-through)
- **Aggregate-Only:** Only available for widgets showing multiple items (map, device-list, digital-twin-tree)
- **Modal View:** Open in a modal dialog within the parent dashboard or in a new browser tab

---

## 🎯 Use Cases

### Example 1: Device Map → Device Details
1. **Parent Dashboard:** Factory overview with map showing all temperature sensors
2. **User Action:** Clicks on a specific temperature sensor marker
3. **Sub-Dashboard:** Opens "Sensor Details" dashboard showing:
   - Real-time telemetry for that sensor
   - Historical trends
   - Alert history
   - Maintenance logs

### Example 2: Asset Hierarchy → Asset Performance
1. **Parent Dashboard:** Plant overview with digital twin tree
2. **User Action:** Clicks on "Production Line A" asset
3. **Sub-Dashboard:** Opens "Line Performance" dashboard showing:
   - OEE metrics for that line
   - Equipment status
   - Production output
   - Downtime analysis

### Example 3: Device List → Device Diagnostics
1. **Parent Dashboard:** Device inventory list
2. **User Action:** Clicks "View Details" for a specific device
3. **Sub-Dashboard:** Opens "Device Diagnostics" showing:
   - System health metrics
   - Configuration details
   - Network connectivity
   - Firmware information

---

## 🏗️ Architecture

### Type Definitions

```typescript
// Parameter types supported
export type SubDashboardParameterType = 'deviceId' | 'assetId';

// Sub-dashboard configuration
export interface SubDashboardConfig {
  id: string;                              // Unique identifier
  name: string;                            // Display name (e.g., "Device Details")
  parameterType: SubDashboardParameterType; // Which parameter to pass
  dashboardId: string;                     // Target dashboard UUID
}

// Widget behavior configuration
export interface DrillDownConfig {
  enabled: boolean;
  subDashboards?: SubDashboardConfig[];   // List of configured sub-dashboards
  // ... other drill-down options
}
```

### Dashboard Model Extensions

```typescript
export interface Dashboard {
  // ... existing properties
  subDashboards?: SubDashboard[];     // If this dashboard has sub-dashboards
  parentDashboardId?: string;         // If this is a sub-dashboard
  parameterType?: SubDashboardParameterType; // If this is a sub-dashboard
}
```

---

## 🔧 Configuration

### 1. Configure in Widget Settings

Sub-dashboards are configured in the **Configuration Panel** for aggregate widgets:

**Steps:**
1. Open dashboard in **Design Mode**
2. Click widget to select it
3. Click **Configure** (gear icon)
4. Scroll to **"Drill-Through Sub-Dashboards"** section
5. Click **"Add Sub-Dashboard"**
6. Fill in:
   - **Name:** Display name (e.g., "Device Details")
   - **Parameter Type:** `deviceId` or `assetId`
   - **Dashboard ID:** UUID of target dashboard
7. Click **Add**

**Example Configuration:**
```json
{
  "behavior": {
    "drillDown": {
      "enabled": true,
      "subDashboards": [
        {
          "id": "sd-001",
          "name": "Device Details",
          "parameterType": "deviceId",
          "dashboardId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
        },
        {
          "id": "sd-002",
          "name": "Device History",
          "parameterType": "deviceId",
          "dashboardId": "b2c3d4e5-f6g7-8901-bcde-f12345678901"
        }
      ]
    }
  }
}
```

### 2. Create Target Dashboard

The target dashboard must be designed to accept the parameter:

**Requirements:**
- Dashboard should filter widgets based on URL parameter
- Use `?deviceId=<uuid>` or `?assetId=<uuid>` in URL
- Widgets should respect the parameter in their data source

**Example URL:**
```
/dashboards/a1b2c3d4-e5f6-7890-abcd-ef1234567890?deviceId=device-123
```

---

## 💻 User Experience

### In View Mode

**Map Widget Example:**
1. User sees devices plotted on map
2. User clicks a device marker
3. Popup displays device information
4. **"View Details"** section shows sub-dashboard links
5. User clicks a sub-dashboard link
6. Modal opens showing the sub-dashboard with device context

**Modal Features:**
- Full-screen overlay (95% viewport)
- Header shows sub-dashboard name and parameter (e.g., "Device: Sensor-001")
- **Back button** to close modal
- **Open in new tab** button for full-screen view
- Embedded dashboard with parameter context

### Visual Flow

```
┌─────────────────────────────────────┐
│  Factory Overview (Parent)          │
│  ┌─────────────────────────────┐   │
│  │  Map Widget                 │   │
│  │  📍 Sensor 1  📍 Sensor 2   │   │
│  │     ↓ (click)               │   │
│  │  ┌─────────────────────┐   │   │
│  │  │ Sensor 1            │   │   │
│  │  │ Status: Online      │   │   │
│  │  │ ──────────────────  │   │   │
│  │  │ View Details:       │   │   │
│  │  │ → Device Details    │◄──┼───┼── Click opens modal
│  │  │ → Device History    │   │   │
│  │  └─────────────────────┘   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
                 ↓
┌───────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════════╗   │
│  ║ ← Device Details  [Device: Sensor 1]  🗗 ║   │
│  ╠═══════════════════════════════════════════╣   │
│  ║ ┌────────────────────────────────────┐  ║   │
│  ║ │ Telemetry Chart (filtered)         │  ║   │
│  ║ │ Temperature: 72°F                  │  ║   │
│  ║ └────────────────────────────────────┘  ║   │
│  ║ ┌────────────────────────────────────┐  ║   │
│  ║ │ Alert History (filtered)           │  ║   │
│  ║ │ Last 24 hours: 2 warnings          │  ║   │
│  ║ └────────────────────────────────────┘  ║   │
│  ╚═══════════════════════════════════════════╝   │
└───────────────────────────────────────────────────┘
```

---

## 🔐 Security & Permissions

### Access Control

Sub-dashboards inherit standard dashboard permissions:
- User must have **view** permission on target dashboard
- User must have access to the device/asset being viewed
- Tenant isolation enforced (can only view own tenant's data)

### Parameter Validation

- Parameter UUIDs validated against database
- Invalid parameters show error message
- Missing parameters prevent dashboard load

---

## 🚀 Implementation Details

### Components

1. **SubDashboardManager** (`config/SubDashboardManager.tsx`)
   - Configuration UI for managing sub-dashboards
   - Add/Edit/Delete sub-dashboard configurations
   - Validation and preview

2. **SubDashboardViewer** (`SubDashboardViewer.tsx`)
   - Modal dialog for viewing sub-dashboards
   - Parameter loading and display
   - Iframe-based dashboard embedding

3. **MapWidget** (`widgets/MapWidget.tsx`)
   - Updated to show sub-dashboard links in popups
   - Handles click events on sub-dashboard links
   - Opens SubDashboardViewer with context

### Data Flow

```
User Click on Device
        ↓
Widget captures deviceId
        ↓
Looks up configured sub-dashboards
        ↓
Filters by parameterType === 'deviceId'
        ↓
Displays links in popup/list
        ↓
User clicks sub-dashboard link
        ↓
SubDashboardViewer opens with:
  - subDashboard config
  - parameterId (deviceId/assetId)
  - parameterType
        ↓
Loads dashboard + parameter name
        ↓
Renders iframe with URL:
  /dashboards/{dashboardId}?{parameterType}={parameterId}&embed=true
```

### URL Structure

**Embedded View:**
```
/dashboards/a1b2c3d4?deviceId=device-123&embed=true
```

**New Tab View:**
```
/dashboards/a1b2c3d4?deviceId=device-123
```

---

## 📊 Widget Support

### Supported Widgets (Aggregate Widgets)

| Widget Type | Parameter Types | Description |
|-------------|----------------|-------------|
| **map** | `deviceId` | Shows devices with GPS coordinates |
| **device-list** | `deviceId` | Lists devices with filters |
| **digital-twin-tree** | `assetId`, `deviceId` | Hierarchical asset tree |

### Unsupported Widgets (Detail Widgets)

These widgets show single items and don't need sub-dashboards:
- `timeseries-chart` - Already shows specific device/asset
- `kpi-card` - Single metric
- `gauge` - Single measurement

---

## 🎨 Design Patterns

### Best Practices

1. **Naming Convention:**
   - Use descriptive names: "Device Details", "Asset Performance"
   - Avoid generic names like "Details" or "Info"

2. **Parameter Consistency:**
   - Use `deviceId` for device-centric dashboards
   - Use `assetId` for asset-centric dashboards
   - Don't mix parameter types in same dashboard

3. **Dashboard Design:**
   - Design sub-dashboards to work with single parameter
   - Add title showing current context (e.g., device name)
   - Use filters that respect URL parameters
   - Include "Back to Overview" navigation

4. **Limit Sub-Dashboards:**
   - 2-3 sub-dashboards per widget is ideal
   - Too many options overwhelm users
   - Group related views into single dashboard with tabs

### Anti-Patterns

❌ **DON'T:**
- Create sub-sub-dashboards (only one level allowed)
- Mix deviceId and assetId in same sub-dashboard
- Use sub-dashboards for widgets that already show details
- Create circular references (A → B → A)

✅ **DO:**
- Keep drill-through hierarchy shallow (one level)
- Use consistent parameter types
- Provide clear navigation back to parent
- Test with actual data before deployment

---

## 🧪 Testing Scenarios

### Test Case 1: Basic Navigation
1. Create parent dashboard with map widget
2. Add devices with GPS coordinates
3. Configure sub-dashboard "Device Details"
4. **Expected:** Clicking device marker shows "View Details" link
5. **Expected:** Clicking link opens modal with device data

### Test Case 2: Multiple Sub-Dashboards
1. Configure two sub-dashboards: "Details" and "History"
2. **Expected:** Both links appear in popup
3. **Expected:** Each opens correct dashboard with same deviceId

### Test Case 3: Parameter Type Filtering
1. Configure sub-dashboard with `assetId` parameter
2. Use with map widget (deviceId context)
3. **Expected:** Sub-dashboard NOT shown in device popup

### Test Case 4: Missing Target Dashboard
1. Configure sub-dashboard with invalid dashboardId
2. **Expected:** Shows error message when clicked
3. **Expected:** Doesn't break parent dashboard

### Test Case 5: Permissions
1. Configure sub-dashboard user doesn't have access to
2. **Expected:** Shows permission error
3. **Expected:** Graceful failure, no security leak

---

## 📚 Related Documentation

- **[dashboard-v2.md](./dashboard-v2.md)** - Overall dashboard architecture
- **[widget-system.md](./widget-system.md)** - Widget configuration and behavior
- **[APPLICATION.md](./APPLICATION.md)** - Service architecture and APIs

---

## 🔮 Future Enhancements

### Planned Features
- **Breadcrumb Navigation:** Show navigation path in sub-dashboard header
- **Deep Linking:** Share URLs to sub-dashboards directly
- **Parameter Mapping:** Pass multiple parameters (deviceId + assetId)
- **Sub-Dashboard Templates:** Pre-built templates for common scenarios
- **Dynamic Parameters:** Pass additional context (time range, filters)

### Under Consideration
- **Cross-Dashboard Filtering:** Filter parent dashboard from sub-dashboard
- **Side-by-Side View:** Show parent and sub-dashboard simultaneously
- **Bookmarking:** Save favorite drill-through paths
- **Analytics:** Track which sub-dashboards are most used

---

## 📖 Summary for Copilot Agent

**Quick Explanation:**

Sub-dashboards are parameterized dashboards that open when users click items in aggregate widgets (maps, lists, trees). They enable drill-through navigation by passing a `deviceId` or `assetId` parameter to show detailed views for specific items.

**Key Points:**
1. **Configuration:** Managed in widget's Configuration Panel under "Drill-Through Sub-Dashboards"
2. **Parameters:** Support `deviceId` or `assetId` only
3. **Restriction:** Only available for aggregate widgets (map, device-list, digital-twin-tree)
4. **No Nesting:** Only one level of drill-through (no sub-sub-dashboards)
5. **UI:** Opens in modal dialog with back button and "open in new tab" option
6. **URLs:** Target dashboard receives parameter via query string: `?deviceId=<uuid>`

**Implementation Files:**
- `src/lib/types/dashboard-v2.ts` - Type definitions
- `src/components/dashboard-v2/SubDashboardViewer.tsx` - Modal viewer
- `src/components/dashboard-v2/config/SubDashboardManager.tsx` - Configuration UI
- `src/components/dashboard-v2/widgets/MapWidget.tsx` - Example integration

**Workflow:**
Configure → User clicks item → Popup shows links → Modal opens with context → Dashboard filters by parameter

---

**Last Review:** December 13, 2025  
**Next Review:** January 13, 2026  
**Owner:** Platform Team
