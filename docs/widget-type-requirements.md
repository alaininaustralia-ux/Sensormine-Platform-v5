# Widget Type Requirements

## Overview
This document defines the data requirements, field selection patterns, aggregation methods, and configuration options for each widget type in the dashboard builder.

---

## 1. KPI Card Widget

### Data Pattern
**Single Value** - Displays one aggregated metric

### Field Selection
- **Primary Metric**: Single numeric field (required)
  - Examples: temperature, pressure, count, voltage
  
### Aggregation Methods
- **Current Value**: Latest/most recent value
- **Average**: Mean over time period
- **Sum**: Total over time period
- **Min**: Minimum value in period
- **Max**: Maximum value in period
- **Count**: Number of data points
- **Change**: Difference from previous period
- **Percentage Change**: Percent difference from previous period

### Trend Calculation
- **Comparison Period**: hour, day, week, month
- **Trend Type**: 
  - Percentage change (default)
  - Absolute change
  - Direction only (up/down/stable)

### Display Options
- **Formatting**:
  - Prefix (e.g., "$", "€")
  - Suffix (e.g., "°C", "kW", "devices")
  - Decimal places (0-4)
  - Thousand separator
- **Trend Display**:
  - Show/hide trend indicator
  - Show/hide percentage
  - Show/hide sparkline mini-chart
  - Trend period selection
- **Thresholds**:
  - Warning threshold (yellow indicator)
  - Critical threshold (red indicator)
  - Threshold comparison (above/below)

### Use Cases
- Total device count
- Current temperature reading
- Battery level percentage
- Alert count with trend

---

## 2. Time-Series Chart Widget

### Data Pattern
**Multi-Series Time-Based** - Multiple fields plotted over time

### Field Selection
- **X-Axis**: Always timestamp (automatic)
- **Y-Axis Fields**: Multiple numeric fields (1-10 series)
  - Each field becomes a line/bar/area
  - Field colors auto-assigned or manually set
  
### Aggregation Methods (Per Time Bucket)
- **Average**: Mean value per time bucket
- **Sum**: Total per time bucket
- **Min**: Minimum per time bucket
- **Max**: Maximum per time bucket
- **Count**: Data points per bucket
- **First**: First value in bucket
- **Last**: Last value in bucket
- **Median**: Median value per bucket
- **Percentile**: 90th, 95th, 99th percentile

### Time Bucketing
- **Bucket Size**: auto, 1m, 5m, 15m, 1h, 6h, 1d, 1w
- **Time Range**: last 1h, 6h, 24h, 7d, 30d, custom

### Display Options
- **Chart Type**: 
  - Line (smooth or stepped)
  - Bar (grouped or stacked)
  - Area (stacked or overlapping)
  - Mixed (different types per series)
- **Visual Elements**:
  - Show legend (with position: top, bottom, left, right)
  - Show grid lines
  - Show tooltips with crosshair
  - Enable zoom/pan
  - Show data points on line
- **Axes**:
  - Y-axis label
  - X-axis label
  - Y-axis range (auto or fixed min/max)
  - Dual Y-axis support (for different scales)
  - Logarithmic scale option
- **Colors**:
  - Color scheme: default, blue, green, red, purple, custom
  - Line thickness (1-5px)
  - Fill opacity (0-100%)

### Use Cases
- Temperature trends over 24 hours
- Multiple sensor readings comparison
- Battery voltage over time
- Event counts per hour

---

## 3. Gauge Widget

### Data Pattern
**Single Value with Range** - One metric displayed in gauge context

### Field Selection
- **Primary Metric**: Single numeric field (required)
- **Target Value**: Optional comparison field or fixed value

### Aggregation Methods
- **Current Value**: Latest reading (default)
- **Average**: Mean over time period
- **Min**: Minimum in period
- **Max**: Maximum in period

### Display Options
- **Gauge Type**:
  - Circular (0-270° arc)
  - Semi-circular (180° arc)
  - Linear (horizontal bar)
  - Vertical bar
- **Range Configuration**:
  - Minimum value
  - Maximum value
  - Unit label (e.g., "°C", "%", "kPa")
- **Color Ranges** (multiple segments):
  - Range 1: 0-33% (green - normal)
  - Range 2: 34-66% (yellow - warning)
  - Range 3: 67-100% (red - critical)
  - Custom ranges with colors
- **Display Elements**:
  - Show current value number
  - Show min/max labels
  - Show range labels
  - Show target indicator
  - Animate needle/fill
- **Formatting**:
  - Decimal places
  - Prefix/suffix
  - Font size: small, medium, large

### Use Cases
- Tank level (0-100%)
- CPU usage gauge
- Pressure reading with safe ranges
- Speed indicator

---

## 4. Data Table Widget

### Data Pattern
**Multi-Row, Multi-Column** - Tabular display of multiple records

### Field Selection
- **Columns**: Multiple fields (any type)
  - Numeric fields
  - Text fields
  - Timestamp fields
  - Boolean fields (shown as badges)
  - Status fields (colored indicators)

### Aggregation Methods
- **Row-Level**: Show individual records (default)
- **Grouped Aggregation**:
  - Group by field (e.g., deviceType, location)
  - Aggregate columns: sum, avg, min, max, count
  - Subtotal rows

### Data Operations
- **Sorting**:
  - Enable/disable sorting
  - Default sort column and direction
  - Multi-column sort
- **Filtering**:
  - Show filter row
  - Column-specific filters (text, number ranges, dates)
  - Global search
- **Pagination**:
  - Enable/disable pagination
  - Page size: 5, 10, 20, 50, 100
  - Page size selector

### Display Options
- **Appearance**:
  - Striped rows
  - Compact mode (dense spacing)
  - Show/hide table header
  - Show/hide borders
  - Row hover highlight
- **Column Configuration**:
  - Column width (auto, fixed, percentage)
  - Column visibility toggles
  - Column reordering
  - Freeze columns (sticky left)
- **Cell Formatting**:
  - Number format (decimals, thousand separator)
  - Date format (relative, absolute)
  - Conditional formatting (color based on value)
  - Cell actions (buttons, links)
- **Actions**:
  - Row selection (single/multiple)
  - Bulk actions
  - Row-level actions (edit, delete, view)
  - Export to CSV

### Use Cases
- Device list with status
- Recent alerts with timestamps
- Sensor readings table
- Event log

---

## 5. Map Widget

### Data Pattern
**Geospatial Points** - Latitude/longitude with associated data

### Field Selection
- **Location Fields** (required):
  - Latitude field
  - Longitude field
  - OR: Combined location field (GeoJSON)
- **Display Fields**:
  - Label field (shown on marker)
  - Tooltip fields (1-5 fields shown on hover)
  - Color field (for marker coloring)
  - Size field (for marker sizing)

### Aggregation Methods
- **Point-Level**: Show individual locations (default)
- **Clustering**:
  - Cluster markers when zoomed out
  - Show count in cluster
  - Cluster radius configuration
- **Heatmap**:
  - Density heatmap overlay
  - Intensity field (optional)
  - Radius and blur settings

### Display Options
- **Map Configuration**:
  - Map style: default, satellite, terrain, dark, light
  - Default center (lat/lng)
  - Default zoom level (1-20)
  - Auto-fit to markers
- **Markers**:
  - Marker type: pin, circle, custom icon
  - Marker color: fixed, field-based, status-based
  - Marker size: fixed, field-based (5-50px)
  - Show device markers
  - Show alert markers
  - Show geofence boundaries
- **Interactions**:
  - Enable pan and zoom
  - Enable marker click (drill-down)
  - Show scale bar
  - Show zoom controls
  - Show layer controls
- **Overlays**:
  - Geofence polygons
  - Route lines
  - Custom shapes
  - Weather layer
  - Traffic layer

### Use Cases
- Device locations on site map
- Alert locations with severity colors
- Delivery route tracking
- Coverage area visualization

---

## 6. Device List Widget

### Data Pattern
**Device Records** - Structured list of devices with metadata

### Field Selection
- **Core Fields** (automatic from Device API):
  - Device name
  - Device ID
  - Device type
  - Status (online/offline/error)
  - Last seen timestamp
  - Location
- **Custom Fields**: Additional device properties to display

### Aggregation Methods
- **List View**: Individual devices (no aggregation)
- **Group View**: Group by device type or location
- **Summary**: Count by status, type

### Display Options
- **Search & Filters**:
  - Show search box
  - Filter by status (all, online, offline, error)
  - Filter by device type
  - Filter by location
  - Custom field filters
- **Column Visibility**:
  - Show/hide status column
  - Show/hide location column
  - Show/hide last seen column
  - Show/hide custom columns
- **Navigation**:
  - Enable drill-down to device details
  - Target sub-page/dashboard for details
  - Open in modal vs. navigate
- **Limits**:
  - Max rows to display (5-100)
  - Enable pagination
  - Show total count
- **Appearance**:
  - Show status indicators (colored badges)
  - Show device type icons
  - Compact mode
  - Card view vs. table view

### Use Cases
- All devices overview
- Online devices only
- Devices by location
- Critical status devices

---

## 7. Pie/Donut Chart Widget

### Data Pattern
**Categorical Distribution** - Grouped data showing proportions

### Field Selection
- **Group By Field**: Categorical field (required)
  - Examples: deviceType, status, location, alertLevel
- **Value Field**: Numeric field to aggregate
  - If not specified, uses count of records

### Aggregation Methods
- **Count**: Number of items in each category (default)
- **Sum**: Total of value field per category
- **Average**: Mean of value field per category
- **Percentage**: Automatic (of total)

### Display Options
- **Chart Type**:
  - Pie (full circle)
  - Donut (hollow center)
  - Semi-donut (180° arc)
- **Slices**:
  - Max slices to show (5-20)
  - Group small slices into "Other"
  - Min percentage threshold (hide <2%)
  - Slice sorting: value, label, none
- **Visual Elements**:
  - Show legend
  - Show labels on slices
  - Show values (count, percentage, both)
  - Show center total (donut only)
  - Explode slices on hover
  - Slice spacing
- **Colors**:
  - Color scheme: default, categorical, custom
  - Auto-assign colors
  - Manual color mapping
- **Interactions**:
  - Enable slice click (filter/drill-down)
  - Show tooltips
  - Animate on load

### Use Cases
- Devices by type distribution
- Alerts by severity
- Sensors by status
- Data volume by location

---

## 8. Bar/Column Chart Widget

### Data Pattern
**Categorical Comparison** - Compare values across categories

### Field Selection
- **Category Field**: X-axis categorical field (required)
  - Examples: deviceName, location, hour, deviceType
- **Value Fields**: 1-10 numeric fields (Y-axis)
  - Each field becomes a bar series
  - Supports grouped or stacked bars

### Aggregation Methods
- **Sum**: Total per category
- **Average**: Mean per category
- **Count**: Number of items per category
- **Min**: Minimum per category
- **Max**: Maximum per category

### Display Options
- **Orientation**:
  - Vertical bars (column chart)
  - Horizontal bars (bar chart)
- **Bar Style**:
  - Grouped (side-by-side)
  - Stacked (cumulative)
  - Percentage stacked (100%)
- **Visual Elements**:
  - Show legend
  - Show grid lines
  - Show value labels on bars
  - Show tooltips
  - Bar spacing and width
- **Axes**:
  - X-axis label
  - Y-axis label
  - Y-axis range (auto or fixed)
  - Rotate x-axis labels
  - Axis font size
- **Colors**:
  - Color scheme
  - Gradient fill
  - Border color and width
- **Sorting**:
  - Sort categories: none, ascending, descending, custom
  - Top N categories (show top 10, 20, etc.)

### Use Cases
- Device count by type
- Average temperature by location
- Alert count by hour
- Top 10 devices by data volume

---

## Data Configuration Tab Structure

### For Each Widget Type

#### Section 1: Data Source
- **Source Type**: Realtime, Historical, API, Static
- **Time Range**: (for time-based widgets)
- **Refresh Interval**: Auto-refresh setting

#### Section 2: Field Selection
*Widget-specific based on data pattern above*

#### Section 3: Aggregation
*Show applicable aggregation methods for widget type*

#### Section 4: Filters
- **Device Filter**: Specific devices, types, or all
- **Time Filter**: Relative or absolute time range
- **Custom Filters**: Field-based conditions

---

## Implementation Priority

1. **Phase 1** (Current - Basic field selection):
   - KPI Card: Single field + aggregation
   - Chart: Multiple fields + time bucketing
   - Gauge: Single field + range

2. **Phase 2** (Next - Advanced options):
   - Table: Multi-field with formatting
   - Device List: Pre-configured fields + custom
   - Map: Location fields + overlays

3. **Phase 3** (Future - Grouping & calculated fields):
   - Pie/Donut: Group by + aggregation
   - Bar: Category + multiple series
   - Calculated fields: field1 + field2, field1 / field2

---

## Field Selection Component Design

### Proposed UI Structure

```
┌─────────────────────────────────────┐
│ Data Configuration                  │
├─────────────────────────────────────┤
│                                     │
│ Data Pattern: [Single Value ▼]     │
│                                     │
│ Primary Metric                      │
│ ┌─────────────────────────────────┐ │
│ │ Select field...          [▼]    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Aggregation Method                  │
│ ┌─────────────────────────────────┐ │
│ │ Average                   [▼]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Time Period                         │
│ ┌─────────────────────────────────┐ │
│ │ Last 24 hours            [▼]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ☑ Include trend comparison          │
│   └─ Compare to: [Previous 24h ▼]  │
│                                     │
└─────────────────────────────────────┘
```

This provides a clear, consistent approach to field selection that adapts to each widget's data pattern.
