# Story Plan: 4.2 - Time-Series Charts

**Story**: 4.2  
**Epic**: Epic 4 - Visualization & Dashboards  
**Priority**: High  
**Story Points**: 13  
**Started**: 2025-12-04  
**Developer**: AI Agent

---

## Story Description

**As a** analyst  
**I want** to create line, bar, and scatter charts for time-series data  
**So that** I can visualize trends and patterns

---

## Acceptance Criteria

From user story:
- [ ] Chart types: line, bar, area, scatter, step
- [ ] Multiple series per chart
- [ ] Time range selection and zooming
- [ ] Aggregation intervals configurable
- [ ] Chart legends and axis labels
- [ ] Export chart as image or data

---

## Technical Analysis

### Dependencies
- **Required Stories**: 
  - ✅ Story 0.0 - Frontend Project Setup (Complete)
  - ✅ Story 4.1 - Dashboard Builder (Complete)
- **External Dependencies**: Recharts library (React charting library)
- **Blocked By**: None

### Architecture Alignment
- **Component**: TimeSeriesChart component (presentational + widget wrapper)
- **Location**: `src/Web/sensormine-web/src/components/dashboard/widgets/`
- **Integration**: Dashboard widget system from Story 4.1
- **State Management**: Local component state + optional Zustand for global settings

### Technology Choices
- **Chart Library**: Recharts (chosen over D3.js for simplicity and React integration)
- **Export**: html2canvas + file-saver for image export, CSV generation for data export
- **Date/Time**: Native JavaScript Date + Intl API for formatting
- **Testing**: Vitest + React Testing Library
- **TypeScript**: Full type safety with defined interfaces

---

## Implementation Plan

### Phase 1: Dependencies & Types
**Files to Create/Modify**:
- [ ] `package.json` - Add recharts, html2canvas, file-saver
- [ ] `src/lib/types/chart-types.ts` - Chart data and configuration types

**Tasks**:
- [ ] Install Recharts: `npm install recharts`
- [ ] Install export libraries: `npm install html2canvas file-saver @types/file-saver`
- [ ] Define TypeScript interfaces for chart data, config, and props

### Phase 2: Core Chart Component (TDD)
**Files to Create**:
- [ ] `src/components/dashboard/widgets/charts/time-series-chart.tsx` - Main chart component
- [ ] `__tests__/components/dashboard/widgets/charts/time-series-chart.test.tsx` - Tests

**Tasks**:
- [ ] Write failing tests (RED)
  - Test line chart renders
  - Test bar chart renders
  - Test area chart renders
  - Test scatter chart renders
  - Test step chart renders
  - Test multiple series rendering
  - Test legend displays correctly
  - Test axis labels display
- [ ] Implement TimeSeriesChart component (GREEN)
  - Line chart using Recharts LineChart
  - Bar chart using BarChart
  - Area chart using AreaChart
  - Scatter chart using ScatterChart
  - Step line chart using LineChart with type="step"
  - Multiple series support
  - Configurable colors
  - Responsive container
  - Tooltip on hover
- [ ] Refactor and optimize

### Phase 3: Time Range & Zoom (TDD)
**Files to Modify**:
- [ ] `src/components/dashboard/widgets/charts/time-series-chart.tsx`
- [ ] `__tests__/components/dashboard/widgets/charts/time-series-chart.test.tsx`

**Tasks**:
- [ ] Write failing tests (RED)
  - Test time range selector component
  - Test zoom functionality
  - Test brush component for zoom
  - Test date range filtering
- [ ] Implement time controls (GREEN)
  - Add date range picker (start/end dates)
  - Add Recharts Brush component for zoom
  - Filter data based on selected range
  - Quick select buttons (1H, 6H, 1D, 7D, 30D, All)
- [ ] Refactor

### Phase 4: Aggregation (TDD)
**Files to Create/Modify**:
- [ ] `src/lib/utils/chart-aggregation.ts` - Data aggregation utility
- [ ] `src/components/dashboard/widgets/charts/time-series-chart.tsx`
- [ ] `__tests__/lib/utils/chart-aggregation.test.tsx` - Aggregation tests

**Tasks**:
- [ ] Write failing tests (RED)
  - Test aggregation intervals: 1min, 5min, 15min, 1hr, 6hr, 1day
  - Test aggregation functions: avg, sum, min, max, count
  - Test data grouping by time bucket
- [ ] Implement aggregation (GREEN)
  - Create aggregation utility functions
  - Add aggregation selector to chart
  - Apply aggregation to data before rendering
  - Show aggregation in chart title/subtitle
- [ ] Refactor

### Phase 5: Export Functionality (TDD)
**Files to Create/Modify**:
- [ ] `src/lib/utils/chart-export.ts` - Export utility functions
- [ ] `src/components/dashboard/widgets/charts/time-series-chart.tsx`
- [ ] `__tests__/lib/utils/chart-export.test.tsx` - Export tests

**Tasks**:
- [ ] Write failing tests (RED)
  - Test PNG export
  - Test SVG export
  - Test CSV data export
  - Test export filename generation
- [ ] Implement export (GREEN)
  - PNG export using html2canvas
  - SVG export using chart SVG element
  - CSV export with headers and formatted data
  - Export button with dropdown menu
  - Download functionality
- [ ] Refactor

### Phase 6: Widget Wrapper Integration
**Files to Modify**:
- [ ] `src/components/dashboard/widgets/chart-widget.tsx` - Replace placeholder
- [ ] `src/components/dashboard/widgets/widget-factory.tsx` - Update widget config
- [ ] `__tests__/components/dashboard/widgets/chart-widget.test.tsx` - Tests

**Tasks**:
- [ ] Replace placeholder ChartWidget with TimeSeriesChart integration
- [ ] Add widget configuration panel for:
  - Chart type selection
  - Data source configuration
  - Aggregation settings
  - Time range defaults
  - Color customization
- [ ] Update widget factory to support chart configuration
- [ ] Test widget in dashboard context

### Phase 7: Demo & Documentation
**Files to Modify**:
- [ ] `src/app/dashboard/page.tsx` - Add chart widget examples

**Tasks**:
- [ ] Create demo dashboard with multiple chart types
- [ ] Add sample time-series data generator
- [ ] Test all chart types with real data
- [ ] Verify responsive behavior

---

## Test Strategy

### Unit Tests
**Test Project**: `__tests__/components/dashboard/widgets/charts/`

**Test Files to Create**:
- [ ] `time-series-chart.test.tsx` - Chart component tests
- [ ] `__tests__/lib/utils/chart-aggregation.test.tsx` - Aggregation logic
- [ ] `__tests__/lib/utils/chart-export.test.tsx` - Export functionality

**Test Scenarios**:
1. **Chart Rendering**:
   - [ ] Line chart renders with data
   - [ ] Bar chart renders with data
   - [ ] Area chart renders with data
   - [ ] Scatter chart renders with data
   - [ ] Step chart renders with data
   - [ ] Multiple series render correctly
   - [ ] Empty data shows message

2. **Interactive Features**:
   - [ ] Tooltip displays on hover
   - [ ] Legend items can be toggled
   - [ ] Brush zoom works
   - [ ] Time range selection filters data

3. **Aggregation**:
   - [ ] Data aggregates by time interval
   - [ ] Aggregation functions work (avg, sum, min, max)
   - [ ] Large datasets aggregate correctly

4. **Export**:
   - [ ] PNG export creates image
   - [ ] CSV export formats data correctly
   - [ ] Export includes chart title

5. **Widget Integration**:
   - [ ] ChartWidget wraps TimeSeriesChart
   - [ ] Configuration panel works
   - [ ] Widget saves/loads settings

### Integration Tests
- [ ] Chart widget works in dashboard grid
- [ ] Multiple charts can be added to dashboard
- [ ] Chart responds to dashboard resize
- [ ] Chart state persists in dashboard configuration

### Test Coverage Target
- **Minimum**: 80%
- **Target**: 90%+

---

## Acceptance Criteria → Test Mapping

| Acceptance Criteria | Test Coverage |
|---------------------|---------------|
| Chart types: line, bar, area, scatter, step | ✅ Unit tests for each chart type |
| Multiple series per chart | ✅ Multi-series rendering tests |
| Time range selection and zooming | ✅ Time range + brush component tests |
| Aggregation intervals configurable | ✅ Aggregation utility tests |
| Chart legends and axis labels | ✅ Legend and axis rendering tests |
| Export chart as image or data | ✅ PNG, SVG, CSV export tests |

---

## Mock Data Structure

```typescript
interface TimeSeriesDataPoint {
  timestamp: number | Date;
  value: number;
  seriesId?: string;
}

interface TimeSeriesData {
  seriesName: string;
  data: TimeSeriesDataPoint[];
  color?: string;
  unit?: string;
}

interface ChartConfiguration {
  title: string;
  subtitle?: string;
  chartType: 'line' | 'bar' | 'area' | 'scatter' | 'step';
  series: TimeSeriesData[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend: boolean;
  showGrid: boolean;
  aggregation?: {
    interval: '1min' | '5min' | '15min' | '1hr' | '6hr' | '1day';
    function: 'avg' | 'sum' | 'min' | 'max' | 'count';
  };
  timeRange?: {
    start: Date;
    end: Date;
  };
}
```

---

## Performance Considerations

- **Large Datasets**: Implement data aggregation/downsampling for >1000 points
- **Rendering**: Use Recharts' built-in optimization (ResponsiveContainer)
- **Memory**: Limit in-memory data points, paginate if needed
- **Export**: Use Web Workers for large image exports (future enhancement)

---

## Future Enhancements (Not in this story)

- Real-time streaming data updates (Story 4.9)
- Advanced statistical overlays (trendlines, moving averages)
- Annotations and markers (Story 4.10)
- Custom color themes
- Multi-axis charts
- Candlestick charts for specific use cases

---

## Notes

- Recharts is chosen over D3.js for faster implementation and better React integration
- This story focuses on client-side charting; backend Query.API will be enhanced in future stories
- Demo data will be generated client-side for now
- Production data fetching will be added when Query.API is implemented

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All tests passing (unit + integration)
- [ ] Code coverage >= 80%
- [ ] TypeScript types fully defined
- [ ] Component documented with JSDoc comments
- [ ] Demo dashboard updated with chart examples
- [ ] No console errors or warnings
- [ ] Responsive on mobile/tablet/desktop
- [ ] Accessibility: keyboard navigation, ARIA labels
- [ ] Story plan moved to `.agent/completed-stories/`
- [ ] Current state updated with completion status
- [ ] Committed with `[Story 4.2]` prefix
