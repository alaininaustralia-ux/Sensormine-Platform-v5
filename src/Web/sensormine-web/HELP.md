# Sensormine Web Application - Developer Documentation

**Project**: Sensormine Platform v5 - Frontend Web Application  
**Framework**: Next.js 14 (App Router) + React 19 + TypeScript 5  
**Last Updated**: 2025-12-07

---

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+
- Backend services running (see root `docker-compose.yml`)

### Development Server
```bash
cd src/Web/sensormine-web
npm install
npm run dev
```

Application runs on: **http://localhost:3020**

### Build for Production
```bash
npm run build
npm run start
```

### Run Tests
```bash
npm test                # Run all tests
npx vitest              # Run tests in watch mode
npx vitest run         # Run once
```

---

## Project Structure

```
src/Web/sensormine-web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Auth-related pages
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── devices/           # Device management pages
│   │   ├── schemas/           # Schema management pages
│   │   ├── settings/          # Settings pages
│   │   │   ├── device-types/  # Device Type configuration
│   │   │   └── schemas/       # Schema registry
│   │   └── layout.tsx         # Root layout with navigation
│   │
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # shadcn/ui base components
│   │   ├── dashboard/        # Dashboard-specific components
│   │   │   ├── builder/      # Dashboard builder components
│   │   │   └── widgets/      # Dashboard widget library
│   │   ├── devices/          # Device management components
│   │   └── schemas/          # Schema editor components
│   │
│   ├── lib/                   # Utilities and API clients
│   │   ├── api/              # Backend API clients
│   │   │   ├── devices.ts    # Device.API client
│   │   │   ├── schemas.ts    # SchemaRegistry.API client
│   │   │   ├── dashboards.ts # Dashboard.API client
│   │   │   └── widget-data.ts # Query.API client (NEW)
│   │   ├── config.ts         # Service URLs and configuration
│   │   ├── types/            # TypeScript type definitions
│   │   └── utils.ts          # Helper functions
│   │
│   └── stores/               # Zustand state management
│       ├── dashboard-store.ts # Dashboard state
│       ├── device-store.ts   # Device state
│       └── schema-store.ts   # Schema state
│
├── __tests__/                # Vitest unit tests
├── public/                   # Static assets
├── .env.local                # Local environment variables
├── next.config.js            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies
```

---

## Environment Configuration

### `.env.local` File

```env
# Backend API URLs
NEXT_PUBLIC_DEVICE_API_URL=http://localhost:5293
NEXT_PUBLIC_SCHEMA_API_URL=http://localhost:5021
NEXT_PUBLIC_DASHBOARD_API_URL=http://localhost:5297
NEXT_PUBLIC_QUERY_API_URL=http://localhost:5079
NEXT_PUBLIC_SIMULATION_API_URL=http://localhost:5200

# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_REAL_TIME=false
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
```

**Important**: Next.js only loads environment variables at **startup**. You must restart the dev server after changing `.env.local`.

### Service Ports Reference

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3020 | Main web application |
| Device.API | 5293 | Device & Device Type management |
| SchemaRegistry.API | 5021 | Schema validation & AI generation |
| Dashboard.API | 5297 | Dashboard persistence |
| Query.API | 5079 | Time-series data queries ⭐ |
| Simulation.API | 5200 | Device simulator backend |
| Edge.Gateway | 1883 | MQTT broker |

---

## Features Implemented

### ✅ Device Type Management (Epic 1)
**Location**: `/settings/device-types`

**Features**:
- Device Type list with search and protocol filtering
- 4-step creation wizard:
  1. Basic Info (name, description, tags)
  2. Protocol Configuration (MQTT, HTTP, WebSocket, OPC UA, Modbus, BACnet, EtherNet/IP)
  3. Custom Fields & Tags (9 field types: Text, Number, Boolean, Date, DateTime, Select, MultiSelect, Email, URL)
  4. Alert Rule Templates (severity levels, conditions)
- Edit Device Type with version history
- Version history viewer with rollback capability
- Usage statistics (device counts by status)
- Audit logs with before/after state comparison
- Schema assignment dropdown

**API Client**: `lib/api/deviceTypes.ts`
- `create()`, `getById()`, `getAll()`, `update()`, `delete()`, `search()`
- `getVersionHistory()`, `rollback()`, `getUsageStats()`, `getAuditLogs()`, `validate()`

**Components**:
- `DeviceTypeList` - List view with filters
- `DeviceTypeForm` - 4-step wizard form
- `DeviceTypeEditor` - Edit page with tabs
- `VersionHistory`, `UsageStatistics`, `AuditLogs` - Supporting components

---

### ✅ Schema Management (Epic 2)
**Location**: `/settings/schemas`

**Features**:
- Schema list with search, type filter, and pagination
- 3-step creation wizard:
  1. Basic Info (name, version, description, tags)
  2. JSON Schema Editor with AI generation (⭐ NEW)
  3. Review and confirm
- AI-powered schema generation from sample data (JSON, CSV, XML, TXT)
- Confidence scoring (high/medium/low)
- Schema validation before save
- Version management
- Change log for updates

**API Client**: `lib/api/schemas.ts`
- `create()`, `getById()`, `getAll()`, `update()`, `delete()`, `search()`
- `generateSchema()` - AI-powered generation using Claude API

**Components**:
- `SchemaList` - List view with filters
- `SchemaEditor` - 3-step wizard with AI generator tab
- `SchemaGenerator` - File upload and AI generation UI

**AI Integration**:
- Backend: Anthropic Claude Haiku 4.5
- Metering: Centralized usage tracking (Sensormine.AI library)
- Privacy: API keys never exposed to frontend

---

### ✅ Device Registration (Epic 2)
**Location**: `/devices/new`

**Features**:
- Two-tab interface:
  1. **Single Device**: Manual registration with dynamic form
  2. **Bulk Upload**: CSV-based bulk registration
- Device Type selector (loads from Device.API)
- Dynamic custom fields based on selected Device Type
- Location fields (latitude, longitude, altitude)
- Metadata key-value pairs (add/remove dynamically)
- Form validation
- Success/failure reporting for bulk uploads

**Device List** (`/devices`):
- Real-time data from Device.API
- Device cards with type, status, last seen
- Search and filters
- Refresh button

**API Client**: `lib/api/devices.ts`
- `registerDevice()`, `bulkRegisterDevices()`
- `getDevices()`, `getDeviceById()`, `getDeviceByDeviceId()`
- `updateDevice()`, `deleteDevice()`
- `getDevicesByType()`, `getDeviceSchema()`

---

### ✅ Dashboard Builder (Epic 4)
**Location**: `/dashboard` (builder), `/dashboard/[id]` (viewer)

**Features**:
- Drag-and-drop dashboard builder using `react-grid-layout`
- Widget library with 7 widget types:
  1. **KPI Widget** - Single metric with trend indicator (⭐ ENHANCED)
  2. **Chart Widget** - Time-series line/bar/area charts (⭐ ENHANCED)
  3. **Pie Chart Widget** - Categorical distributions (⭐ ENHANCED)
  4. **Gauge Widget** - Circular/linear/bullet gauges
  5. **Map Widget** - Leaflet map with device markers and clustering
  6. **Table Widget** - Data tables with sorting/filtering
  7. **Text Widget** - Markdown-formatted text blocks
- Grid layout with responsive breakpoints
- Widget configuration panels
- Dashboard templates
- Dashboard persistence (PostgreSQL via Dashboard.API)
- Multi-tenant isolation
- Dashboard sharing (planned)

**Example Dashboard**: `/dashboard/example` - Showcase of all widgets

**API Client**: `lib/api/dashboards.ts`
- `create()`, `get()`, `list()`, `update()`, `delete()`, `search()`

**State Management**: `stores/dashboard-store.ts` (Zustand)
- Dashboard CRUD operations with optimistic updates
- Widget management (add, update, delete)
- Layout management
- Background sync with Dashboard.API

---

### ⭐ Query API Integration (NEW - Dec 7, 2025)
**API Client**: `lib/api/widget-data.ts`

**Purpose**: Connect dashboards to real-time and historical time-series data from TimescaleDB.

**Features**:
1. **KPI Data**:
   ```typescript
   queryApiClient.kpi({
     deviceId: "guid",
     field: "temperature",
     startTime: "ISO-8601",
     endTime: "ISO-8601",
     aggregation: "avg|sum|min|max|count",
     comparePreviousPeriod: true  // Optional trend comparison
   })
   ```
   Returns: `{ value, previousValue, changePercent, timeRange }`

2. **Time-Series Data** (Multi-field):
   ```typescript
   queryApiClient.timeSeries({
     deviceId: "guid",
     fields: [
       { name: "temperature", aggregations: ["avg", "min", "max"] },
       { name: "humidity", aggregations: ["avg"] }
     ],
     startTime: "ISO-8601",
     endTime: "ISO-8601",
     interval: "5m|15m|1h|6h|12h|1d"
   })
   ```
   Returns: Array of time-series data points with multiple fields/aggregations

3. **Categorical Data** (Grouped):
   ```typescript
   queryApiClient.categorical({
     deviceId: "guid",
     field: "temperature",
     groupBy: "device|location|tag:custom_field_name",
     startTime: "ISO-8601",
     endTime: "ISO-8601",
     aggregation: "avg|sum|min|max|count"
   })
   ```
   Returns: Array of `{ category, value, count }` for pie/bar charts

**Backend Endpoints** (Query.API - Port 5079):
- `GET /api/KpiData` - KPI with optional trend
- `POST /api/WidgetData/multi-field` - Multi-field aggregation
- `POST /api/WidgetData/categorical` - Categorical grouping
- `POST /api/WidgetData/percentiles` - Percentile calculations

**Enhanced Widgets Using Query API**:
- `KpiWidget` - Real-time KPI display with trend indicator (↑↓ percentage)
- `ChartWidget` - Multi-field time-series charts with configurable intervals
- `PieChartWidget` - Device/location distributions

**Data Flow**:
```
TimescaleDB (5,322 telemetry records)
  ↓
Query.API (5079)
  ↓
widget-data.ts API Client
  ↓
Dashboard Widgets (React components)
```

---

## Technology Stack Details

### Core Framework
- **Next.js 14**: App Router with Server Components
- **React 19**: Functional components with hooks
- **TypeScript 5**: Strict mode enabled
- **Tailwind CSS 4**: Utility-first styling

### UI Components
- **shadcn/ui**: Pre-built components using Radix UI primitives
  - Button, Input, Select, Dialog, Dropdown, Table, Card, Badge, etc.
  - Located in: `src/components/ui/`
  - Styled with Tailwind CSS
  - Fully accessible (WCAG 2.1 AA)

### State Management
- **Zustand**: Lightweight state management
  - Dashboard state: `stores/dashboard-store.ts`
  - Device state: `stores/device-store.ts`
  - Schema state: `stores/schema-store.ts`

### Data Visualization
- **Recharts**: React charting library for time-series and KPIs
- **Leaflet**: Maps with clustering and geofences
- **react-grid-layout**: Drag-and-drop dashboard builder

### Testing
- **Vitest**: Unit test framework
- **React Testing Library**: Component testing
- **Playwright**: End-to-end testing (optional)

### Build Tools
- **Turbopack**: Development server (Next.js 14 default)
- **Webpack**: Production builds
- **PostCSS**: CSS processing with Tailwind

---

## API Client Architecture

### Design Pattern
All API clients follow a consistent pattern:

```typescript
// lib/api/example.ts
import { config } from '@/lib/config';

const BASE_URL = config.services.exampleApi;

export const exampleApi = {
  async create(data: CreateDto): Promise<Entity> {
    const response = await fetch(`${BASE_URL}/api/Example`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Tenant-Id': 'current-tenant-id',  // TODO: JWT auth
        'X-User-Id': 'current-user-id'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`Failed: ${response.statusText}`);
    return response.json();
  },
  
  async getById(id: string): Promise<Entity> {
    const response = await fetch(`${BASE_URL}/api/Example/${id}`);
    if (!response.ok) throw new Error(`Failed: ${response.statusText}`);
    return response.json();
  },
  
  // ... other CRUD methods
};
```

### Error Handling
- All API calls use try/catch blocks
- Errors are logged to console
- User-friendly toast notifications using `sonner`
- Loading states displayed during async operations

### Type Safety
- All DTOs defined in TypeScript interfaces
- Request/response types match backend C# DTOs
- Strict null checks enabled

---

## Common Development Tasks

### Adding a New API Client

1. **Create API client file**:
   ```typescript
   // lib/api/my-service.ts
   import { config } from '@/lib/config';
   
   const BASE_URL = config.services.myService;
   
   export const myServiceApi = {
     async getSomething(id: string): Promise<MyDto> {
       const response = await fetch(`${BASE_URL}/api/MySomething/${id}`);
       if (!response.ok) throw new Error('Failed');
       return response.json();
     }
   };
   ```

2. **Add service URL to config**:
   ```typescript
   // lib/config.ts
   export const config = {
     services: {
       // ...existing services
       myService: process.env.NEXT_PUBLIC_MY_SERVICE_URL || 'http://localhost:5xxx'
     }
   };
   ```

3. **Add to .env.local**:
   ```env
   NEXT_PUBLIC_MY_SERVICE_URL=http://localhost:5xxx
   ```

4. **Restart dev server** to load new environment variable

### Adding a New Dashboard Widget

1. **Create widget component**:
   ```tsx
   // components/dashboard/widgets/my-widget.tsx
   export function MyWidget({ widgetId, config }: WidgetProps) {
     return (
       <div className="h-full flex flex-col">
         {/* Widget content */}
       </div>
     );
   }
   ```

2. **Add to widget registry**:
   ```typescript
   // components/dashboard/widget-registry.ts
   import { MyWidget } from './widgets/my-widget';
   
   export const widgetRegistry = {
     // ...existing widgets
     'my-widget': MyWidget
   };
   ```

3. **Add widget config interface**:
   ```typescript
   // lib/types/dashboard-types.ts
   export interface MyWidgetConfig {
     title: string;
     // ...other config
   }
   ```

### Adding a New Page Route

1. **Create page directory**:
   ```
   src/app/my-feature/page.tsx
   ```

2. **Add page component**:
   ```tsx
   // app/my-feature/page.tsx
   export default function MyFeaturePage() {
     return (
       <div className="container mx-auto p-6">
         <h1>My Feature</h1>
       </div>
     );
   }
   ```

3. **Add to navigation** (if needed):
   ```tsx
   // components/nav/sidebar.tsx
   const navItems = [
     // ...existing items
     { href: '/my-feature', label: 'My Feature', icon: MyIcon }
   ];
   ```

---

## Troubleshooting

### Issue: API calls return 404 errors
**Solution**: 
1. Verify backend service is running (check port)
2. Check `.env.local` has correct service URL
3. Restart Next.js dev server after changing `.env.local`
4. Verify API endpoint path matches backend controller route

### Issue: CORS errors in browser console
**Solution**:
1. Check backend service has CORS configured for `http://localhost:3020`
2. Verify `appsettings.Development.json` includes frontend origin
3. Restart backend service after CORS configuration changes

### Issue: Changes to .env.local not working
**Solution**:
- Next.js only loads environment variables at startup
- Stop dev server (Ctrl+C) and run `npm run dev` again
- Clear browser cache if still not working

### Issue: TypeScript errors after pulling new code
**Solution**:
```bash
npm install            # Install new dependencies
rm -rf .next           # Clear Next.js cache
npm run dev            # Restart dev server
```

### Issue: Widget data not displaying
**Solution**:
1. Check Query.API is running on port 5079
2. Check TimescaleDB has data (use psql or pgAdmin)
3. Open browser DevTools → Network tab to see API responses
4. Verify filter keys match repository expectations (`"_field"` not `"metric_name"`)

### Issue: Dashboard layout not saving
**Solution**:
1. Check Dashboard.API is running on port 5297
2. Check PostgreSQL `dashboards` table exists
3. Verify `dashboard-store.ts` is syncing to backend
4. Check browser console for API errors

---

## Performance Optimization

### Best Practices Implemented
1. **Server Components**: Use RSC where possible to reduce client bundle
2. **Code Splitting**: Dynamic imports for heavy components
3. **Image Optimization**: Next.js Image component with lazy loading
4. **Debouncing**: Search inputs debounced (300ms)
5. **Memoization**: React.memo() on expensive components
6. **Polling Optimization**: Reduced from 5s to 30s where appropriate

### Bundle Size
- Check bundle size: `npm run build`
- Analyze: `npm install @next/bundle-analyzer` and configure

---

## Testing Strategy

### Unit Tests (Vitest)
```bash
npm test                     # Run all tests
npx vitest                   # Watch mode
npx vitest run              # Run once
npx vitest --coverage       # With coverage report
```

**Test files location**: `__tests__/` directory

**Example test**:
```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/my-component';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Integration Tests
- Use Playwright for end-to-end testing
- Test critical user flows (device registration, dashboard creation)

---

## Deployment

### Production Build
```bash
npm run build
npm run start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

### Environment Variables (Production)
- Set all `NEXT_PUBLIC_*` variables
- Use secrets management (Azure Key Vault, AWS Secrets Manager)
- Never commit `.env.local` or `.env.production`

---

## Contributing Guidelines

### Code Style
- Follow TypeScript strict mode
- Use ESLint configuration (run `npm run lint`)
- Use Prettier for formatting
- Component names: PascalCase
- Function names: camelCase
- Constants: UPPER_SNAKE_CASE

### Commit Messages
- Use conventional commits format
- Examples:
  - `feat: add KPI widget with trend indicator`
  - `fix: resolve filter key mismatch in Query API`
  - `docs: update HELP.md with Query API integration`

### Pull Request Process
1. Create feature branch from `main`
2. Implement feature with tests
3. Run linter and tests locally
4. Update HELP.md if adding new features
5. Submit PR with clear description
6. Address review comments

---

## Resources

### Documentation
- Next.js: https://nextjs.org/docs
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com
- Recharts: https://recharts.org/en-US/api

### Internal Documentation
- Architecture: `docs/architecture.md`
- User Stories: `docs/user-stories.md`
- Tech Stack: `docs/technology-stack.md`
- Current State: `.agent/current-state.md`

### Support
- GitHub Issues: https://github.com/alaininaustralia-ux/Sensormine-Platform-v5/issues
- Team Chat: [Your communication platform]

---

**Last Updated**: 2025-12-07  
**Version**: 1.2.0  
**Maintainers**: Sensormine Platform Team
