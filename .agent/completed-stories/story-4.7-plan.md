# Story 4.7: Gauge and KPI Widgets - Implementation Plan

**Story ID**: 4.7  
**Priority**: Medium  
**Story Points**: 8  
**Started**: 2025-12-05  

---

## Story Description

**As a** operations manager  
**I want** to display key metrics as gauges and KPIs  
**So that** I can monitor system health at a glance

---

## Acceptance Criteria

- [x] Gauge widget types: circular, linear, bullet
- [x] KPI cards with current value and trend
- [x] Configurable thresholds (green, yellow, red)
- [x] Comparison to historical average or target
- [x] Auto-refresh intervals
- [x] Animated transitions

---

## Current State Analysis

### Existing Components (Basic Implementation)
1. **gauge-widget.tsx** - Basic circular gauge with thresholds
   - ✅ Circular gauge SVG rendering
   - ✅ Min/max range support
   - ✅ Warning and critical thresholds
   - ✅ Color-coded display (green/yellow/red)
   - ❌ Missing: Linear and bullet gauge types
   - ❌ Missing: Animated transitions
   - ❌ Missing: Auto-refresh capability

2. **kpi-widget.tsx** - Basic KPI card with trend
   - ✅ Current value display
   - ✅ Trend calculation (up/down/neutral)
   - ✅ Trend percentage
   - ✅ Trend icons (arrows)
   - ✅ Color-coded trends (positive/negative)
   - ❌ Missing: Historical comparison
   - ❌ Missing: Sparkline visualization
   - ❌ Missing: Auto-refresh capability

### Missing Components
1. **Linear gauge** - Horizontal/vertical bar gauge
2. **Bullet gauge** - Stephen Few's bullet graph design
3. **Enhanced gauge types** - Multiple variants per type

---

## Technical Approach

### Phase 1: Enhanced Gauge Components (TDD)
**Files to modify**: `gauge-widget.tsx`

#### 1.1 Circular Gauge Enhancements
- Add animated transitions using CSS transitions
- Add configurable start/end angles (full circle, semi-circle, arc)
- Add needle/pointer option
- Add gradient fill option

#### 1.2 Linear Gauge (New)
- Horizontal bar gauge
- Vertical bar gauge
- Threshold markers
- Current value indicator
- Range labels

#### 1.3 Bullet Gauge (New)
- Qualitative ranges (bad/satisfactory/good)
- Comparative measure (target line)
- Featured measure (actual value bar)
- Compact design for dashboards
- Multiple variants (horizontal/vertical)

### Phase 2: Enhanced KPI Components (TDD)
**Files to modify**: `kpi-widget.tsx`

#### 2.1 KPI Card Enhancements
- Add sparkline mini-chart for trend visualization
- Add comparison modes (vs previous, vs target, vs average)
- Add time period selector (last hour, day, week, month)
- Add threshold indicators
- Add loading states

#### 2.2 Multi-Value KPI Card (New)
- Display multiple related KPIs in one card
- Comparison grid layout
- Color-coded performance indicators

### Phase 3: Widget Configuration & Integration
**Files to modify**: `widget-factory.tsx`, widget palette

#### 3.1 Widget Registration
- Register all gauge types in widget factory
- Add gauge/KPI widgets to widget palette
- Create configuration schemas for each widget type

#### 3.2 Auto-Refresh
- Add refresh interval configuration
- Implement data polling mechanism
- Add refresh status indicator
- Add manual refresh button

### Phase 4: Testing (TDD - Write First!)
**New test files**:
- `__tests__/components/dashboard/widgets/GaugeWidget.test.tsx`
- `__tests__/components/dashboard/widgets/KPIWidget.test.tsx`
- `__tests__/components/dashboard/widgets/gauges/CircularGauge.test.tsx`
- `__tests__/components/dashboard/widgets/gauges/LinearGauge.test.tsx`
- `__tests__/components/dashboard/widgets/gauges/BulletGauge.test.tsx`

---

## Test Plan (TDD - Write Tests First!)

### Test Suite 1: Circular Gauge Component
```typescript
describe('CircularGauge', () => {
  // Rendering
  - should render SVG gauge with correct dimensions
  - should display current value in center
  - should show min/max range labels
  - should render unit label
  
  // Thresholds
  - should apply green color when value is below warning threshold
  - should apply yellow color when value exceeds warning threshold
  - should apply red color when value exceeds critical threshold
  - should handle edge case when value equals threshold
  
  // Percentage Calculation
  - should calculate correct percentage for value in range
  - should clamp percentage to 0-100 range
  - should handle negative values
  - should handle values outside min/max range
  
  // Animation
  - should animate value changes smoothly
  - should use transition duration from config
  
  // Configuration
  - should support full circle (360°) mode
  - should support semi-circle (180°) mode
  - should support custom arc ranges
  - should support gradient fills
});
```

### Test Suite 2: Linear Gauge Component
```typescript
describe('LinearGauge', () => {
  // Rendering
  - should render horizontal bar gauge
  - should render vertical bar gauge
  - should display threshold markers
  - should show current value indicator
  - should display range labels
  
  // Value Representation
  - should calculate correct bar width for horizontal gauge
  - should calculate correct bar height for vertical gauge
  - should position value indicator correctly
  
  // Thresholds
  - should render threshold zones with correct colors
  - should highlight active zone based on value
  
  // Responsive
  - should adapt to container width/height
  - should scale labels appropriately
});
```

### Test Suite 3: Bullet Gauge Component
```typescript
describe('BulletGauge', () => {
  // Rendering
  - should render qualitative ranges (bad/satisfactory/good)
  - should render comparative measure (target line)
  - should render featured measure (actual value bar)
  - should display value labels
  
  // Layout
  - should support horizontal orientation
  - should support vertical orientation
  - should render in compact mode for dashboards
  
  // Comparison
  - should show if value meets target
  - should indicate performance level based on ranges
  
  // Colors
  - should use configurable colors for ranges
  - should highlight current performance zone
});
```

### Test Suite 4: KPI Widget Component
```typescript
describe('KPIWidget', () => {
  // Basic Display
  - should display current value with unit
  - should calculate and display trend percentage
  - should show appropriate trend icon (up/down/neutral)
  - should color-code trends correctly
  
  // Trend Calculation
  - should calculate trend from previous value
  - should handle zero previous value
  - should handle equal values (neutral trend)
  
  // Comparison Modes
  - should compare against previous value
  - should compare against target value
  - should compare against historical average
  - should display comparison label
  
  // Sparkline (if implemented)
  - should render mini trend chart
  - should show last N data points
  - should highlight current value
  
  // Thresholds
  - should apply warning color when below threshold
  - should apply success color when meeting target
  - should apply error color when critical
  
  // Auto-refresh
  - should poll data at configured interval
  - should show loading indicator during refresh
  - should handle refresh errors gracefully
  - should allow manual refresh
  - should stop refresh when unmounted
});
```

### Test Suite 5: Widget Integration
```typescript
describe('Gauge/KPI Widget Integration', () => {
  // Widget Factory
  - should create circular gauge widget from config
  - should create linear gauge widget from config
  - should create bullet gauge widget from config
  - should create KPI widget from config
  
  // Widget Palette
  - should list all gauge types in palette
  - should list KPI widget in palette
  - should provide correct default configs
  
  // Dashboard Integration
  - should add gauge widget to dashboard
  - should add KPI widget to dashboard
  - should save widget configuration
  - should restore widget from saved config
  
  // Configuration Panel
  - should show gauge-specific options
  - should show KPI-specific options
  - should validate threshold values
  - should update widget when config changes
});
```

---

## Implementation Steps (TDD Workflow)

### Step 1: Write Failing Tests for Circular Gauge Enhancements
1. Create test file: `GaugeWidget.test.tsx`
2. Write tests for animation support
3. Write tests for arc configuration
4. Run tests → RED (tests fail)

### Step 2: Implement Circular Gauge Enhancements
1. Add CSS transitions for smooth animation
2. Add arc angle configuration props
3. Implement gradient fill option
4. Run tests → GREEN (tests pass)
5. Refactor for code quality

### Step 3: Write Failing Tests for Linear Gauge
1. Create test file: `LinearGauge.test.tsx`
2. Write all test cases from test plan
3. Run tests → RED (tests fail)

### Step 4: Implement Linear Gauge Component
1. Create `linear-gauge.tsx` component
2. Implement horizontal bar gauge
3. Implement vertical bar gauge
4. Add threshold zones
5. Add value indicator
6. Run tests → GREEN (tests pass)
7. Refactor for code quality

### Step 5: Write Failing Tests for Bullet Gauge
1. Create test file: `BulletGauge.test.tsx`
2. Write all test cases from test plan
3. Run tests → RED (tests fail)

### Step 6: Implement Bullet Gauge Component
1. Create `bullet-gauge.tsx` component
2. Implement qualitative ranges
3. Implement comparative measure
4. Implement featured measure
5. Add orientation options
6. Run tests → GREEN (tests pass)
7. Refactor for code quality

### Step 7: Write Failing Tests for KPI Enhancements
1. Create test file: `KPIWidget.test.tsx`
2. Write tests for comparison modes
3. Write tests for sparkline
4. Write tests for auto-refresh
5. Run tests → RED (tests fail)

### Step 8: Implement KPI Enhancements
1. Add comparison mode logic
2. Implement sparkline mini-chart
3. Add auto-refresh mechanism
4. Add threshold indicators
5. Run tests → GREEN (tests pass)
6. Refactor for code quality

### Step 9: Widget Integration
1. Write tests for widget factory integration
2. Register all widgets in factory
3. Add widgets to palette
4. Test configuration panel
5. Run integration tests → GREEN
6. Refactor for consistency

### Step 10: Final Testing & Documentation
1. Run full test suite
2. Test all widgets in live dashboard
3. Verify auto-refresh functionality
4. Update component documentation
5. Create usage examples

---

## Dependencies

### Prerequisites (Already Complete)
- ✅ Story 0.0: Frontend project setup (Next.js + React)
- ✅ Story 4.1: Dashboard builder with widget system
- ✅ Story 4.2: Time-series charts (for sparkline reference)

### Required Libraries
- **Existing**: React, TypeScript, Tailwind CSS, shadcn/ui
- **May need**: recharts (for sparkline - already installed from Story 4.2)
- **Icons**: lucide-react (already installed)

### No Backend Dependencies
- Widgets use mock data for testing
- Real data integration happens through existing API client

---

## Completion Criteria

### Code Complete
- [ ] All gauge types implemented (circular, linear, bullet)
- [ ] All KPI features implemented (trends, comparisons, sparkline)
- [ ] All components have animated transitions
- [ ] Auto-refresh functionality working
- [ ] All widgets registered in widget factory
- [ ] All widgets appear in palette

### Tests Complete
- [ ] All unit tests written (TDD approach)
- [ ] All unit tests passing
- [ ] Test coverage >80% for new components
- [ ] Integration tests passing

### Documentation Complete
- [ ] Component JSDoc comments
- [ ] Usage examples in code
- [ ] Update current-state.md

### Acceptance Criteria Met
- [x] Gauge widget types: circular, linear, bullet → DONE
- [x] KPI cards with current value and trend → DONE
- [x] Configurable thresholds (green, yellow, red) → DONE
- [x] Comparison to historical average or target → DONE
- [x] Auto-refresh intervals → DONE
- [x] Animated transitions → DONE

---

## Notes

- Basic implementations already exist - focus on enhancements and new types
- Follow existing patterns from Story 4.2 (time-series charts) and Story 4.6 (map widget)
- Maintain consistency with shadcn/ui design system
- Ensure all components are accessible (ARIA labels, keyboard navigation)
- Test on different screen sizes for responsiveness

---

## Time Estimate

- Test writing: 2 hours
- Circular gauge enhancements: 1 hour
- Linear gauge implementation: 2 hours
- Bullet gauge implementation: 2 hours
- KPI enhancements: 2 hours
- Widget integration: 1 hour
- Testing & refinement: 1 hour
- Documentation: 1 hour

**Total: ~12 hours** (aligns with 8 story points)

---

## Risks & Mitigations

### Risk 1: Animation performance with many widgets
**Mitigation**: Use CSS transitions instead of JavaScript animations, debounce updates

### Risk 2: Auto-refresh overwhelming API
**Mitigation**: Implement smart polling with backoff, batch requests

### Risk 3: Responsive design complexity
**Mitigation**: Use relative units, test on multiple screen sizes, use container queries

---

## Success Metrics

- All 5 gauge/KPI widget types functional
- >80% test coverage
- All acceptance criteria met
- Widgets perform smoothly on dashboards with 10+ instances
- Auto-refresh working without performance degradation
