# Widget Sizing Configuration Guide

**Last Updated:** December 13, 2025

---

## Current Minimum Sizes

**File:** `src/Web/sensormine-web/src/app/dashboards/[id]/design/page.tsx`  
**Lines:** ~95-96 in `handleSave` function

```typescript
const MIN_WIDTH = 2;   // Minimum widget width (2 columns = ~16.67% of 12-column grid)
const MIN_HEIGHT = 3;  // Minimum widget height (3 rows = 272px including margins)
```

---

## Grid Configuration

**File:** `src/components/dashboard-v2/layout/DashboardGrid.tsx`

- **Columns:** 12 (12-column grid system)
- **Row Height:** 80px per row
- **Margin:** 16px between widgets
- **Breakpoints:** lg (1200px), md (996px), sm (768px), xs (480px)

---

## Actual Widget Dimensions

### Current Minimum (2×3)
- **Width:** `2/12 = 16.67%` of container width
- **Height:** `(80px × 3) + (16px × 2) = 272px`
- **Best For:** KPI cards, small charts, single metrics

### Recommended Alternatives

#### Small (3×4)
```typescript
const MIN_WIDTH = 3;  // 25% width
const MIN_HEIGHT = 4; // 368px height
```
**Best For:** Compact time-series charts, gauge widgets

#### Medium (4×5)
```typescript
const MIN_WIDTH = 4;  // 33.33% width
const MIN_HEIGHT = 5; // 464px height
```
**Best For:** Standard charts with legend, multi-metric displays

#### Large (6×6)
```typescript
const MIN_WIDTH = 6;  // 50% width
const MIN_HEIGHT = 6; // 560px height
```
**Best For:** Detailed dashboards, table widgets, complex visualizations

#### Extra Large (8×8)
```typescript
const MIN_WIDTH = 8;  // 66.67% width
const MIN_HEIGHT = 8; // 752px height
```
**Best For:** Primary charts, full-featured tables, video feeds

---

## How to Adjust Minimum Sizes

### Step 1: Edit Constants
Open `src/Web/sensormine-web/src/app/dashboards/[id]/design/page.tsx`

Find the `handleSave` function (~line 85):

```typescript
const handleSave = useCallback(async () => {
  if (!currentDashboard) return;

  // Apply minimum size constraints before saving
  const MIN_WIDTH = 2;   // ← Change this value
  const MIN_HEIGHT = 3;  // ← Change this value
  
  const constrainedLayouts = Object.keys(currentDashboard.layout.layouts).reduce(...)
```

### Step 2: Test Changes
1. Reload the designer page (`Ctrl+R`)
2. Drag a widget to minimum size
3. Click "Save"
4. Verify widget maintains minimum size
5. Refresh page to confirm persistence

### Step 3: Update Default Widget Sizes (Optional)

If you want new widgets to start at a larger size, update `src/Web/sensormine-web/src/components/dashboard-v2/WidgetPalette.tsx`:

```typescript
// Find the widget creation logic
const newWidget: Widget = {
  id: crypto.randomUUID(),
  title: widgetConfig.name,
  type: widgetType,
  position: {
    x: 0,
    y: Infinity, // Add to bottom
    w: 4,  // ← Default width (change from 2 to 4)
    h: 5,  // ← Default height (change from 3 to 5)
    i: widgetId,
  },
  config: {}
};
```

---

## Widget-Specific Recommendations

### TimeSeriesChart
- **Minimum:** 4×5 (needs space for legend and axis labels)
- **Optimal:** 6×6 or 8×5 (horizontal layout)
- **Chart has internal minHeight:** 200px (prevents collapse)

### KPI Card
- **Minimum:** 2×2 (compact single metric)
- **Optimal:** 3×3 (with trend indicator)

### Table Widget
- **Minimum:** 6×6 (needs horizontal space for columns)
- **Optimal:** 12×8 (full-width table)

### Gauge Widget
- **Minimum:** 3×3 (square aspect ratio best)
- **Optimal:** 4×4

### DeviceList Widget
- **Minimum:** 4×5 (list with scroll)
- **Optimal:** 6×8 (comfortable reading)

### Video Analytics Widget
- **Minimum:** 6×5 (16:9 aspect ratio)
- **Optimal:** 8×6 or 12×8

---

## User Interaction

### Design Mode Features
- ✅ **Drag from header:** Click and drag anywhere on widget header (not just grip icon)
- ✅ **Resize freely:** No constraints during resize (allows any size)
- ✅ **Minimum enforced on save:** `Math.max(resized_value, MIN_WIDTH/HEIGHT)`
- ✅ **Unsaved changes indicator:** Asterisk (*) shows when changes not saved
- ✅ **Auto-save prompt:** Warns when exiting with unsaved changes

### Save Behavior
1. User resizes widget to 10×8
2. User clicks "Save"
3. Backend receives: `{w: 10, h: 8, minW: 2, minH: 3, ...}`
4. Constraints stored but don't prevent future resizes
5. On next load: Constraints stripped → allows full editing freedom

---

## Troubleshooting

### Widget won't resize smaller than expected
- Check MIN_WIDTH and MIN_HEIGHT in `handleSave`
- Verify constraints stripped in `DashboardGrid.tsx` (layoutsWithoutConstraints)

### Widget reverts to old size after save
- Check browser console for save errors
- Verify Dashboard.API saved new dimensions: 
  ```powershell
  docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -t -c "SELECT jsonb_pretty(widgets) FROM dashboards WHERE id = 'YOUR_DASHBOARD_ID';"
  ```

### New widgets created too small
- Update default `w` and `h` in WidgetPalette.tsx
- Or adjust MIN_WIDTH/MIN_HEIGHT globally

---

## Related Files

| File | Purpose |
|------|---------|
| `design/page.tsx` | Dashboard designer, contains MIN_WIDTH/MIN_HEIGHT |
| `DashboardGrid.tsx` | React-grid-layout wrapper, strips constraints |
| `GridWidget.tsx` | Widget container, renders header + content |
| `WidgetHeader.tsx` | Drag handle (entire header draggable) |
| `TimeSeriesChart.tsx` | Chart widget with 200px minHeight |

---

**Last Review:** December 13, 2025  
**Owner:** Platform Team
