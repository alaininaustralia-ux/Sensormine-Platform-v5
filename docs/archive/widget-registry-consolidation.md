# Widget Registry Consolidation

## Summary
Consolidated the dual widget library system into a single source of truth using `WIDGET_REGISTRY`.

## Problem
The codebase had two separate widget catalogs:
1. **WIDGET_LIBRARY** in `src/lib/dashboard/widget-library.ts` - Old format with detailed config
2. **WIDGET_REGISTRY** in `src/lib/stores/widget-registry.ts` - New format used by dashboard builder UI

This caused confusion and required maintaining widget definitions in two places.

## Solution
- Made `WIDGET_REGISTRY` the single source of truth
- Updated `widget-library.ts` to re-export `WIDGET_REGISTRY` and provide backward compatibility
- Added conversion function to transform `WidgetDefinition` to `WidgetLibraryItem` format
- Updated all imports and tests to use `WIDGET_REGISTRY` directly

## Changes Made

### Files Modified

#### 1. `src/lib/dashboard/widget-library.ts`
- Removed hardcoded `WIDGET_LIBRARY` array
- Now imports and re-exports `WIDGET_REGISTRY`
- Added `widgetDefinitionToLibraryItem()` conversion function for backward compatibility
- Added `getDefaultConfig()` helper to provide widget-specific default configurations
- Marked `WIDGET_LIBRARY` as deprecated with JSDoc comment

#### 2. `src/components/dashboard/WidgetPalette.tsx`
- Updated to import `WIDGET_REGISTRY` from `widget-registry.ts`
- Added inline conversion to `WIDGET_LIBRARY` format for component compatibility
- Filters only available widgets

#### 3. `__tests__/lib/dashboard/widget-library.test.ts`
- Renamed test suite from "Widget Library" to "Widget Registry"
- Updated to import and test `WIDGET_REGISTRY`, `getWidgetDefinition`, `getAvailableWidgets`
- Updated assertions to match new widget property names (e.g., `defaultSize.w` instead of `defaultSize.width`)
- Updated test cases to use registry-specific functions

#### 4. `__tests__/components/dashboard/components.test.tsx`
- Updated to import `getAvailableWidgets` from `widget-registry.ts`
- Fixed widget names in tests (e.g., "Chart" → "Time-Series Chart")
- Updated test description text to match new widget descriptions

## Widget Registry Format

### WidgetDefinition (New Format)
```typescript
{
  type: string;           // Widget type identifier
  name: string;           // Display name
  description: string;    // User-facing description
  icon: string;          // Lucide icon name
  defaultSize: { w: number; h: number }; // Grid units
  minSize: { w: number; h: number };     // Minimum size
  category: 'data-visualization' | 'monitoring' | 'media' | 'other';
  available: boolean;    // Whether widget is ready for use
}
```

### WidgetLibraryItem (Legacy Format - Deprecated)
```typescript
{
  type: string;
  name: string;
  description: string;
  icon: string;
  defaultConfig: { type: string; config: Record<string, any> };
  defaultSize: { width: number; height: number };
}
```

## Current Widgets in Registry

| Type | Name | Category | Available | Size (w×h) |
|------|------|----------|-----------|------------|
| kpi | KPI Card | monitoring | ✅ | 2×2 |
| chart | Time-Series Chart | data-visualization | ✅ | 6×4 |
| table | Data Table | data-visualization | ✅ | 6×4 |
| map | GIS Map | monitoring | ✅ | 6×6 |
| video | Video Feed | media | ❌ | 4×3 |
| gauge | Gauge | monitoring | ✅ | 3×3 |
| device-list | Device List | monitoring | ✅ | 6×4 |

## Benefits

1. **Single Source of Truth**: Only one place to add/modify widget definitions
2. **Consistency**: Dashboard builder UI and widget palette use same data
3. **Easier Maintenance**: Adding new widgets requires only updating `WIDGET_REGISTRY`
4. **Better Types**: `WidgetDefinition` type provides stronger typing with category unions
5. **Backward Compatible**: Old code using `WIDGET_LIBRARY` still works via conversion

## Migration Guide

### Before
```typescript
import { WIDGET_LIBRARY } from '@/lib/dashboard/widget-library';

const widgets = WIDGET_LIBRARY.map(w => w.type);
```

### After
```typescript
import { WIDGET_REGISTRY, getAvailableWidgets } from '@/lib/stores/widget-registry';

// Get all available widgets
const widgets = getAvailableWidgets();

// Get specific widget
const chartWidget = getWidgetDefinition('chart');

// Get widgets by category
const monitoringWidgets = getWidgetsByCategory('monitoring');
```

## Test Results
- ✅ Widget library tests: 16/16 passed
- ✅ Dashboard component tests: 16/16 passed

All tests updated and passing with consolidated registry.
