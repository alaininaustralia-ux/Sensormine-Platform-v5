# Sensormine Platform - Architecture Documentation

> **📊 Database Architecture**: For detailed information about database design, dual-database strategy, and best practices, see [database-architecture.md](./database-architecture.md)

## System Architecture

### Overview
The Sensormine Platform v5 is a cloud-agnostic industrial IoT platform designed for high-throughput data ingestion, real-time processing, and advanced analytics at scale.

## Architectural Layers

### 1. Edge & Connectivity Layer
**Purpose**: Connect industrial devices and protocols to the platform

**Components**:
- **Edge.Gateway Service**
  - MQTT protocol support
  - OPC UA gateway functionality
  - Industrial protocol connectors
  - Device registration and authentication
  - Data normalization

**Key Features**:
- Multi-protocol support (MQTT, OPC UA, Modbus, etc.)
- Edge buffering and store-forward capability
- Device identity management
- Protocol translation

### 2. Ingestion Pipeline
**Purpose**: Reliable, scalable data ingestion with validation

**Components**:
- **Ingestion.Service**
  - Kafka consumer groups
  - Schema validation
  - Multi-tenant routing
  - Device identity resolution
  - Batch ingestion support

**Data Flow**:
```
Edge Gateway → Kafka Topic → Ingestion Service → Validation → Storage
```

**Key Features**:
- Horizontal scaling via Kafka partitions
- Schema-based validation
- Tenant isolation
- Dead letter queue for failed messages
- Metrics and monitoring

### 3. Stream Processing Layer
**Purpose**: Real-time data processing and ML inference

**Components**:
- **StreamProcessing.Service**
  - Real-time aggregations
  - ML inference pipeline (ONNX)
  - Rule evaluation
  - Anomaly detection
  - Data enrichment

**Processing Patterns**:
- Stateless transformations
- Windowed aggregations
- Pattern detection
- Event correlation

### 4. Storage Layer
**Purpose**: Persistent storage for different data types

**Storage Systems**:
| Data Type | Technology | Use Case |
|-----------|-----------|----------|
| Time-Series | TimescaleDB | Sensor data, measurements |
| Metadata | PostgreSQL | Devices, schemas, users |
| Cache | Redis | Session data, hot data |
| Objects | S3/MinIO | Video, CAD, Lidar files |
| Search | OpenSearch | Full-text search, logs |

**Repository Pattern**:
- Abstract storage implementations
- Cloud-agnostic interfaces
- Easy provider swapping

**Multi-Tenant Data Isolation**:
- All domain entities inherit from `BaseEntity` with `Guid TenantId`
- Database tables use `uuid` type for `tenant_id` columns
- Repository methods enforce tenant isolation via query filters
- See [database-tenant-id-migration.md](./database-tenant-id-migration.md) for details

**Database Architecture Decision (Option C - Hybrid Separation)**:
- **PostgreSQL (Port 5433)**: OLTP workloads - devices, schemas, users, assets, configurations
- **TimescaleDB (Port 5452)**: OLAP workloads - telemetry hypertables, time-series data
- **Rationale**: Independent scaling, optimized query performance, clear separation of concerns
- **Migration**: December 2025 - Migrated 7 assets from TimescaleDB to PostgreSQL
- See [option-c-implementation-summary.md](./option-c-implementation-summary.md) for complete details

### 5. API Layer
**Purpose**: Expose platform functionality via RESTful APIs

**Microservices**:

#### Device.API
- Device CRUD operations
- Device registration
- Metadata management
- Status monitoring

#### SchemaRegistry.API
- Schema registration and management (CRUD operations)
- Schema versioning and evolution
- Validation rules and enforcement
- **AI-Powered Schema Generation** (Anthropic Claude API)
  - Generate schemas from sample data (JSON/CSV/XML/TXT)
  - Confidence scoring and suggestions
  - File upload and text paste support
- **Centralized AI Metering** (via Sensormine.AI)
  - Track all AI API calls, tokens, and costs
  - Multi-tenant usage statistics
  - Provider-agnostic metering infrastructure

#### Query.API
- Time-series queries
- Aggregation queries
- Historical data retrieval
- Real-time data access

#### Alerts.API
- Alert rule configuration
- Notification management
- Alert history
- Escalation policies

#### DigitalTwin.API
- Digital twin state management
- 3D model associations
- Twin queries and updates
- Simulation support

#### VideoMetadata.API
- Video file metadata
- CAD file indexing
- Lidar point cloud metadata
- Object storage integration

#### ApiGateway
- Unified entry point
- Authentication/Authorization
- Rate limiting
- Request routing

### 6. Mobile Application Layer (.NET MAUI)
**Purpose**: Cross-platform mobile app for field technicians with offline-first capabilities

**Technology Stack**:
- .NET MAUI (.NET 8+)
- C# 12
- MVVM pattern (CommunityToolkit.Mvvm)
- SQLite for offline storage
- MSAL for Azure AD authentication

**Key Components**:

#### NFC Module
- **Purpose**: Near Field Communication for device interaction
- **Platform-Specific Implementations**:
  - iOS: CoreNFC framework
  - Android: Android.Nfc API
- **Capabilities**:
  - Read device ID, firmware, hardware info
  - Read diagnostics (battery, sensors, errors)
  - Write configuration to device
  - NDEF message parsing

#### Offline Storage Module
- **Local Database**: SQLite with Entity Framework Core
- **Cached Data**:
  - Device types and schemas
  - Configuration templates
  - Diagnostic history
  - Audit logs (pending sync)
- **Sync Queue**: Pending operations (create, update, delete)
- **Cache Strategy**: LRU eviction with 24-hour expiration

#### Sync Service
- **Background Sync**: Automatic sync when connectivity returns
- **Retry Logic**: Exponential backoff with Polly
- **Conflict Resolution**: Server wins with user notification
- **Priority Queue**:
  1. Audit logs (critical)
  2. Device provisioning/deprovisioning
  3. Configuration changes
  4. Diagnostic data
  5. Attachments (compressed)

#### Configuration Management
- **JSON Schema Validation**: Real-time validation against device type schemas
- **Template Library**: Pre-configured setups for common scenarios
- **Tabletop Configuration**: Offline provisioning without cloud connection
- **Bulk Operations**: Configure multiple devices in batch

#### Location Services
- **GPS Integration**: MAUI Geolocation API
- **Map Control**: MAUI Maps or Esri ArcGIS Runtime
- **Geocoding**: Address lookup via Google Maps or OpenStreetMap
- **Waypoints**: Saved locations for reuse

#### Security Module
- **Authentication**: MSAL with Azure AD / Entra ID
- **Biometric Auth**: Fingerprint, Face ID for app access
- **Secure Storage**: iOS Keychain, Android Keystore
- **Token Management**: Automatic refresh with secure storage
- **Audit Trail**: Local logging with cloud sync

**Mobile App Architecture**:
```
┌─────────────────────────────────────────┐
│         Mobile App (.NET MAUI)          │
├─────────────────────────────────────────┤
│  Views (XAML)                           │
│    ├─ Device List/Detail                │
│    ├─ NFC Scan Page                     │
│    ├─ Configuration Editor              │
│    ├─ Diagnostics View                  │
│    └─ Settings                          │
├─────────────────────────────────────────┤
│  ViewModels (MVVM)                      │
│    ├─ Device Management                 │
│    ├─ NFC Operations                    │
│    ├─ Configuration                     │
│    └─ Sync Status                       │
├─────────────────────────────────────────┤
│  Services                               │
│    ├─ NFC Service (platform-specific)   │
│    ├─ API Clients (Refit)              │
│    ├─ Database Context (EF Core)        │
│    ├─ Sync Service (Background)         │
│    ├─ Location Service                  │
│    └─ Auth Service (MSAL)               │
├─────────────────────────────────────────┤
│  Local Storage (SQLite)                 │
│    ├─ Devices Cache                     │
│    ├─ Schemas Cache                     │
│    ├─ Sync Queue                        │
│    ├─ Audit Logs                        │
│    └─ Diagnostic History                │
└─────────────────────────────────────────┘
            ↓ HTTPS (REST)
┌─────────────────────────────────────────┐
│      SensorMine Platform APIs           │
│  (Device.API, SchemaRegistry.API, etc)  │
└─────────────────────────────────────────┘
```

**Offline-First Workflow**:
1. User performs action (e.g., configure device via NFC)
2. Action executed against local SQLite database
3. Action added to sync queue
4. Background service monitors connectivity
5. When online, sync service pushes queued operations to platform APIs
6. Successful sync removes item from queue
7. Failed sync retries with exponential backoff

**Mobile Security Considerations**:
- All API calls use HTTPS (TLS 1.3)
- Certificate pinning for added security
- SQLite database encrypted using SQLCipher
- NFC write operations require authentication
- Screen capture disabled on sensitive pages
- Root/jailbreak detection with user warning
- Automatic logout after 15 minutes of inactivity

**Platform Requirements**:
- **iOS**: 14.0+, iPhone 7+ for NFC
- **Android**: 8.0 (API 26)+, NFC hardware required
- **Distribution**: App Store, Google Play, or Enterprise

### 7. Web Frontend Architecture
**Purpose**: Browser-based user interface for platform management and visualization

**Technology Stack:**
- **Framework**: Next.js 14 (App Router) + React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **State Management**: Zustand (lightweight, no boilerplate)
- **Data Fetching**: Native fetch with SWR for caching
- **Charts**: Recharts for data visualization
- **Maps**: Leaflet for GIS integration
- **Forms**: react-hook-form + zod validation
- **Tree Visualization**: react-arborist (for Digital Twin asset hierarchy)
- **Drag-and-Drop**: @dnd-kit/core

**Application Structure:**
```
src/Web/sensormine-web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/login              # Authentication pages
│   │   ├── dashboard/                # Dashboard builder & viewer
│   │   ├── devices/                  # Device management
│   │   ├── digital-twin/             # Asset hierarchy (NEW)
│   │   │   ├── page.tsx              # Main tree view
│   │   │   ├── [id]/page.tsx        # Asset detail
│   │   │   └── mappings/page.tsx    # Data point mapping editor
│   │   ├── schemas/                  # Schema registry
│   │   ├── settings/                 # Configuration
│   │   └── layout.tsx                # Root layout with nav
│   │
│   ├── components/                   # Reusable UI components
│   │   ├── ui/                       # shadcn/ui primitives
│   │   ├── dashboard/                # Dashboard widgets & builder
│   │   │   ├── builder/              # Drag-drop dashboard editor
│   │   │   └── widgets/              # Widget library (charts, tables, maps)
│   │   ├── devices/                  # Device-specific components
│   │   ├── digital-twin/             # Digital Twin UI (NEW)
│   │   │   ├── AssetTree.tsx         # Hierarchical tree view
│   │   │   ├── AssetTreeNode.tsx    # Tree node renderer
│   │   │   ├── AssetCreateDialog.tsx # Create asset modal
│   │   │   ├── AssetEditDialog.tsx   # Edit asset modal
│   │   │   ├── AssetDetailPanel.tsx  # Asset info panel
│   │   │   ├── AssetStateView.tsx    # Real-time state display
│   │   │   ├── AssetDeviceList.tsx   # Assigned devices table
│   │   │   ├── DeviceAssignDialog.tsx # Device assignment picker
│   │   │   ├── MappingEditor.tsx     # Schema → Asset mapper
│   │   │   ├── MappingList.tsx       # Mappings table
│   │   │   └── MappingForm.tsx       # Mapping CRUD form
│   │   └── schemas/                  # Schema editor components
│   │
│   ├── lib/                          # Utilities & API clients
│   │   ├── api/                      # Backend API clients
│   │   │   ├── devices.ts            # Device.API
│   │   │   ├── schemas.ts            # SchemaRegistry.API
│   │   │   ├── dashboards.ts         # Dashboard.API
│   │   │   ├── digital-twin.ts       # DigitalTwin.API (NEW)
│   │   │   ├── query.ts              # Query.API
│   │   │   └── widget-data.ts        # Widget data fetching
│   │   ├── config.ts                 # Service URLs
│   │   ├── types/                    # TypeScript interfaces
│   │   └── utils.ts                  # Helper functions
│   │
│   └── stores/                       # Zustand state stores
│       ├── dashboard-store.ts        # Dashboard state
│       ├── device-store.ts           # Device management
│       ├── digital-twin-store.ts     # Digital Twin state (NEW)
│       └── schema-store.ts           # Schema management
│
├── __tests__/                        # Vitest unit tests
├── public/                           # Static assets
└── package.json                      # Dependencies
```

**Frontend Architecture Patterns:**

#### 1. API Client Pattern
Each backend service has a dedicated API client with:
- Base URL configuration (environment-specific)
- Automatic tenant header injection (`X-Tenant-Id`)
- JWT token authentication
- Error handling and retry logic
- TypeScript interfaces for requests/responses

```typescript
// Example: digital-twin.ts
export async function getAssetTree(rootId: string): Promise<AssetTreeResponse> {
  const response = await fetch(`${DIGITAL_TWIN_URL}/api/assets/${rootId}/tree`, {
    headers: {
      'X-Tenant-Id': getCurrentTenantId(),
      'Authorization': `Bearer ${getAccessToken()}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch asset tree');
  return response.json();
}
```

#### 2. State Management with Zustand
- Lightweight alternative to Redux (no actions, reducers, middleware)
- Direct state mutation (uses Immer internally)
- Async actions with built-in loading/error states
- Persistence to sessionStorage/localStorage
- Selective component subscriptions (avoid re-renders)

```typescript
// Example: digital-twin-store.ts
interface DigitalTwinStore {
  assets: Asset[];
  selectedAsset: Asset | null;
  expandedNodes: Set<string>;
  isLoading: boolean;
  error: string | null;
  
  fetchAssets: () => Promise<void>;
  selectAsset: (id: string) => void;
  expandNode: (id: string) => void;
  createAsset: (data: CreateAssetRequest) => Promise<Asset>;
}

export const useDigitalTwinStore = create<DigitalTwinStore>((set, get) => ({
  assets: [],
  selectedAsset: null,
  expandedNodes: new Set(),
  isLoading: false,
  error: null,
  
  fetchAssets: async () => {
    set({ isLoading: true, error: null });
    try {
      const assets = await getAssets();
      set({ assets, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  selectAsset: (id) => {
    const asset = get().assets.find(a => a.id === id);
    set({ selectedAsset: asset });
  },
  
  // ... other actions
}));
```

#### 3. Component Composition
- Atomic design: atoms → molecules → organisms → pages
- shadcn/ui components for consistent UI (Button, Input, Dialog, Table, etc.)
- Custom domain components built on primitives
- Separation of concerns: presentational vs. container components
- Props validation with TypeScript interfaces

#### 4. Multi-Tenancy Frontend Pattern
- Current tenant context stored in auth store
- All API calls include `X-Tenant-Id` header
- Tenant switcher in header (admin users only)
- Tenant-specific branding (logo, colors) from config
- Data isolation enforced at API level (frontend just displays)

#### 5. Real-Time Updates
Three strategies based on use case:
- **Polling**: Simple, works everywhere (dashboard widgets, asset state)
- **WebSocket**: True real-time (device status, telemetry streaming)
- **Server-Sent Events (SSE)**: One-way real-time (notifications, alerts)

```typescript
// Polling example with SWR
import useSWR from 'swr';

const { data, error } = useSWR(
  `/api/assets/${assetId}/state`,
  fetcher,
  { refreshInterval: 5000 } // Poll every 5 seconds
);
```

#### 6. Error Handling Strategy
- API errors caught and displayed as toast notifications
- Validation errors shown inline on form fields
- Optimistic UI updates with rollback on failure
- Loading skeletons during data fetch
- Empty states with call-to-action buttons

**Digital Twin UI Architecture (Epic 13 Phase 2):**

The Digital Twin frontend integrates with DigitalTwin.API (port 5297) to provide:

**Asset Hierarchy Management:**
- **Tree Visualization**: react-arborist displays hierarchical asset structure (Site → Building → Equipment → Sensor)
- **CRUD Operations**: Create, read, update, delete assets with validation
- **Tree Navigation**: Expand/collapse nodes, search/filter, keyboard shortcuts
- **Drag-and-Drop**: Move assets by dragging to new parent nodes
- **Multi-Level Hierarchy**: Support up to 10 levels deep
- **Asset Types**: 7 types (Site, Building, Floor, Area, Zone, Equipment, Sensor, etc.)
- **Location Integration**: GPS coordinates with map picker (Leaflet)

**Device-to-Asset Assignment:**
- **Assignment Methods**: Drag device from list to asset node, or selection dialog
- **Validation**: Asset-device type compatibility, device availability check
- **Persistence**: Updates `device.asset_id` field via Device.API
- **Visualization**: Asset detail shows list of assigned devices with status
- **Real-Time Status**: WebSocket updates for device online/offline

**Data Point Mapping:**
- **Two-Panel Editor**: Schema JSON tree (left) + Asset tree (right)
- **Drag-Drop Mapping**: Drag JSON path ($.temperature) onto asset node
- **Mapping Configuration**: Label, unit, aggregation method, rollup settings, transform expression
- **Validation**: JSON path format, asset existence, no duplicates
- **Bulk Operations**: CSV import/export for mass mapping creation
- **SchemaRegistry Integration**: Fetches schemas and JSON structure dynamically

**Asset State Dashboard:**
- **Real-Time State**: Displays current asset state from telemetry (polled every 5s)
- **Alarm Status**: Color-coded by severity (Normal, Warning, Critical)
- **State History**: Timeline of state changes and alarm transitions
- **Aggregated Data**: Rollup metrics from child assets (average, sum, min, max)
- **Drill-Down**: Click metric to view raw telemetry charts

**Technical Implementation:**
- API Client: 16 methods (getAssets, createAsset, moveAsset, getMappings, etc.)
- Zustand Store: Manages assets, selected asset, expanded nodes, mappings, loading state
- Components: 11 components (AssetTree, dialogs, editors, lists)
- Pages: 3 routes (/digital-twin, /digital-twin/[id], /digital-twin/mappings)
- Dependencies: react-arborist (tree), @dnd-kit/core (drag-drop), react-leaflet (maps)

**Multi-Tenant Considerations:**
- Tenant isolation at API level (X-Tenant-Id header)
- Frontend only displays current tenant's assets
- Admin users can switch tenant context
- Cannot see or modify other tenants' assets
- Tree view filtered by tenant ID

**Performance Optimizations:**
- Tree virtualization: Only render visible nodes (1000+ assets load <500ms)
- Lazy loading: Load children on expand (not all descendants upfront)
- Pagination: Large asset lists show 50 per page
- Caching: Zustand stores frequently accessed assets
- Debounced search: Filter tree in <100ms
- Optimistic UI: Immediate updates, rollback on error

**Accessibility (WCAG 2.1 AA):**
- Keyboard navigation: Arrow keys, Enter, Escape
- Screen reader support: ARIA labels on tree nodes
- Focus management: Dialogs trap focus
- Color contrast: All text meets 4.5:1 ratio
- Tooltips: Help text on all form fields

**Mobile Responsiveness:**
- Tree view: Sidebar on desktop, full-screen on mobile/tablet
- Touch-friendly: Larger tap targets for tree nodes
- Adaptive layout: Stacks panels vertically on small screens
- Works on tablets for field use

For detailed Digital Twin UI requirements, see [digital-twin-ui-requirements.md](./digital-twin-ui-requirements.md)

### 8. AI & Semantic Layer
**Purpose**: ML inference, AI operations, and semantic search

**Components**:
- **Sensormine.AI Library**
  - **AI Metering Service** (✅ Implemented)
    - Centralized tracking of all AI API calls
    - Token usage measurement (input + output)
    - Cost calculation per provider/model
    - Duration and success/failure tracking
    - Multi-tenant usage statistics
    - Provider-agnostic design (Anthropic, OpenAI, etc.)
  - ONNX model inference
  - Embedding generation
  - Vector similarity search
  - Semantic query processing

**AI Integration Architecture**:
```
Service Layer (e.g., SchemaRegistry.API)
        ↓
AiMeteringService.CallAiAsync()
        ├─ Start timer & log call
        ├─ Execute AI provider API call
        ├─ Extract token counts
        ├─ Calculate cost
        ├─ Store metrics (tenant, provider, model, operation)
        └─ Return metered response
```

**AI Metering Endpoints**:
- `GET /api/aiusage/current` - Current tenant's AI usage
- `GET /api/aiusage/tenant/{id}` - Specific tenant's usage
- `GET /api/aiusage/all` - All tenants' usage statistics

**Capabilities**:
- AI-powered schema generation (Claude API)
- Anomaly detection models
- Predictive maintenance
- Natural language queries
- Context-aware search

## Multi-Tenancy Architecture

### Hierarchical Tenant Model
```
Platform (Root)
├── Tenant A (Organization)
│   ├── Sub-Tenant A1 (Site/Department)
│   ├── Sub-Tenant A2 (Site/Department)
│   └── Sub-Tenant A3 (Site/Department)
└── Tenant B (Organization)
    ├── Sub-Tenant B1 (Site/Department)
    └── Sub-Tenant B2 (Site/Department)
```

**Key Concepts**:
- **Parent Tenants**: Top-level organizations with billing and user management
- **Sub-Tenants**: Child organizations inheriting settings from parent
- **Inheritance**: Permissions, configurations, and policies cascade down
- **Isolation**: Data strictly isolated between tenant hierarchies

### Tenant Isolation Strategy

#### 1. Application Level
- Tenant ID (`TenantId`) and Parent Tenant ID (`ParentTenantId`) in all entities
- Row-level security filtering in all queries
- Tenant context injected via middleware
- Multi-tenant aware repository pattern
- Cross-tenant queries only for parent accessing sub-tenants

#### 2. Data Level
- **Database**: Shared schema with tenant_id discriminator
- **Partitioning**: Table partitions by tenant for large tables
- **Kafka**: Topic naming convention: `{environment}.{tenant}.{datatype}`
- **Object Storage**: Bucket per tenant or folder hierarchy
- **Redis**: Key prefix with tenant ID

#### 3. Resource Level
- **Kubernetes Namespaces**: Per tenant for enterprise customers
- **Resource Quotas**: CPU, memory, storage limits per tenant
- **Network Policies**: Isolate tenant workloads
- **Rate Limiting**: API throttling per tenant

#### 4. Tenant Configuration
- **Branding**: Custom logo, colors, domain per tenant
- **Features**: Feature flags per subscription plan
- **Integrations**: Tenant-specific external connections
- **Schemas**: Tenant-specific device schemas
- **Billing Settings**: Currency, tax rules, payment methods

## Security Architecture

### Authentication & Authorization
- JWT token-based authentication
- Role-Based Access Control (RBAC)
- API key authentication for devices
- OAuth 2.0 support

### Data Security
- TLS/SSL for all communications
- Encryption at rest for sensitive data
- Secrets management via Kubernetes Secrets
- Audit logging

### Network Security
- Service mesh (optional: Istio/Linkerd)
- Network policies
- API gateway rate limiting
- DDoS protection

## Billing & Metering Architecture

### Billing.API Microservice
**Purpose**: Handle all billing, metering, and payment operations

**Responsibilities**:
- Track resource consumption per tenant
- Generate usage-based invoices
- Integrate with Stripe for payments
- Manage subscriptions and plans
- Enforce resource quotas
- Process webhook events from Stripe

### Metering Infrastructure

#### Metered Resources
```
┌─────────────────────────────────────────────┐
│ Resource Type          │ Unit              │
├─────────────────────────────────────────────┤
│ Active Devices         │ per device/month  │
│ Data Ingestion         │ GB ingested       │
│ API Calls              │ per 1,000 calls   │
│ Time-Series Storage    │ GB/month          │
│ Object Storage         │ GB/month          │
│ Video Processing       │ hours processed   │
│ ML Inference           │ per 1,000 calls   │
│ Data Egress            │ GB transferred    │
└─────────────────────────────────────────────┘
```

#### Metering Collection Strategy
1. **Event-Based Metering**
   - Emit usage events to Kafka topic `metering.events`
   - StreamProcessing.Service aggregates in real-time
   - Store aggregated metrics in TimescaleDB

2. **Periodic Polling**
   - Background job queries resource counts (devices, storage)
   - Snapshot taken daily
   - Stored in `tenant_usage_snapshots` table

3. **API Gateway Metering**
   - API Gateway increments Redis counters per tenant
   - Periodic flush to database
   - Rate limiting based on plan quotas

#### Usage Data Model
```csharp
public class UsageRecord
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public DateTime Timestamp { get; set; }
    public string ResourceType { get; set; }  // "devices", "api_calls", etc.
    public decimal Quantity { get; set; }
    public string Unit { get; set; }
    public Dictionary<string, string> Metadata { get; set; }
}
```

### Stripe Integration

#### Architecture Overview
```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Billing.API │ ────▶│    Stripe    │ ────▶│   Webhooks   │
│              │      │              │      │   Handler    │
│  - Customers │      │  - Customers │      │              │
│  - Invoices  │      │  - Subscriptions   │      │
│  - Usage     │      │  - Invoices  │      └──────────────┘
└──────────────┘      │  - PaymentIntents  │
                      └──────────────┘
```

#### Stripe Components

**1. Customer Management**
- Create Stripe Customer for each tenant
- Store Stripe Customer ID in `tenants` table
- Sync tenant updates to Stripe

**2. Subscription Plans** (Stripe Products & Prices)
```
Free Tier
├── $0/month
├── 10 devices max
├── 1GB storage
└── 10,000 API calls/month

Pro Tier
├── $99/month (monthly) or $990/year (annual)
├── 100 devices
├── 50GB storage
├── 1M API calls/month
└── Email support

Enterprise Tier
├── Custom pricing
├── Unlimited devices
├── Custom storage
├── Unlimited API calls
└── Dedicated support
```

**3. Usage-Based Billing**
- Report usage to Stripe via Metering API
- Stripe calculates overage charges
- Invoices generated automatically on billing cycle

**4. Webhook Handling**
```csharp
public class StripeWebhookHandler
{
    // Handle payment events
    - payment_intent.succeeded
    - payment_intent.payment_failed
    
    // Handle subscription events
    - customer.subscription.created
    - customer.subscription.updated
    - customer.subscription.deleted
    - customer.subscription.trial_will_end
    
    // Handle invoice events
    - invoice.payment_succeeded
    - invoice.payment_failed
    - invoice.finalized
}
```

**5. Payment Flow**
```
Tenant Signs Up
    ↓
Create Stripe Customer
    ↓
Select Subscription Plan
    ↓
Add Payment Method (Stripe Elements)
    ↓
Create Subscription
    ↓
Activate Tenant Account
    ↓
Begin Metering Usage
    ↓
Monthly: Report Usage → Generate Invoice → Charge Card
```

### Quota Enforcement

#### Soft Limits (Warnings)
- Alert sent at 80% of quota
- Email and in-app notifications
- Grace period before hard limit

#### Hard Limits (Blocking)
- API returns 429 Too Many Requests
- Device provisioning blocked
- Data ingestion throttled
- Dashboard shows upgrade prompts

#### Implementation
```csharp
public class QuotaEnforcementMiddleware
{
    public async Task InvokeAsync(HttpContext context)
    {
        var tenant = await GetTenantFromContext(context);
        var quota = await GetQuotaForTenant(tenant.Id);
        var usage = await GetCurrentUsage(tenant.Id);
        
        if (usage.Devices >= quota.MaxDevices)
        {
            context.Response.StatusCode = 429;
            await context.Response.WriteAsync(
                "Device quota exceeded. Please upgrade your plan."
            );
            return;
        }
        
        await _next(context);
    }
}
```

### Sub-Tenant Billing Allocation

**Chargeback Model**: Parent tenant pays, costs allocated to sub-tenants
```
Parent Tenant Invoice: $500
├── Sub-Tenant A: $200 (40%)
├── Sub-Tenant B: $150 (30%)
└── Sub-Tenant C: $150 (30%)
```

**Allocation Strategies**:
1. **Direct**: Each sub-tenant's actual usage
2. **Proportional**: Based on device count or data volume
3. **Fixed**: Predetermined percentage or amount
4. **Showback**: Report costs without actual billing

**Implementation**:
- Track usage per sub-tenant separately
- Generate allocation reports monthly
- Parent can view consolidated or itemized costs
- Export to CSV for internal billing systems

## Scalability & Performance

### Horizontal Scaling
- Stateless service design
- Kafka partition scaling
- Database sharding support
- Object storage distribution

### Performance Optimizations
- Redis caching layer
- Database connection pooling
- Async/await throughout
- Batch processing for bulk operations

### High Availability
- Multi-replica deployments
- Health checks and auto-healing
- Circuit breakers
- Graceful degradation

## Observability

### Distributed Tracing
- OpenTelemetry instrumentation
- Jaeger for trace visualization
- Correlation IDs across services

### Metrics
- Prometheus-compatible metrics
- Custom business metrics
- Resource utilization tracking

### Logging
- Structured logging (JSON)
- Centralized log aggregation
- Log levels per environment
- Correlation with traces

### Health Checks
- Liveness probes
- Readiness probes
- Dependency health checks
- Graceful shutdown

## Deployment Architecture

### Local Development
```
Docker Compose
├── Kafka
├── MQTT Broker
├── TimescaleDB
├── PostgreSQL
├── Redis
├── MinIO
├── OpenSearch
└── Jaeger
```

### Production Kubernetes
```
Kubernetes Cluster
├── Ingress Controller
├── Microservices (Deployments)
├── StatefulSets (Databases)
├── ConfigMaps & Secrets
├── Persistent Volumes
├── Service Mesh (optional)
└── Monitoring Stack
```

### Cloud Providers
- **AWS**: EKS, MSK, RDS, S3, ElastiCache
- **Azure**: AKS, Event Hubs, Azure Database, Blob Storage
- **GCP**: GKE, Pub/Sub, Cloud SQL, Cloud Storage
- **On-Premises**: Self-managed Kubernetes

## Data Flow Examples

### Device Data Ingestion
```
Device → MQTT → Edge.Gateway → Kafka → Ingestion.Service 
  → Schema Validation → TimescaleDB → Query.API → Client
```

### Real-Time Alerting
```
TimescaleDB → StreamProcessing.Service → Alert Rule Evaluation 
  → Kafka (Alerts Topic) → Alerts.API → Notification Service → Email/SMS
```

### ML Inference Pipeline
```
Kafka → StreamProcessing.Service → ONNX Model → Inference Result 
  → Enriched Data → TimescaleDB
```

## Technology Decisions

### Why Microservices?
- Independent scaling of components
- Technology flexibility per service
- Fault isolation
- Team autonomy

### Why Kafka?
- High throughput message broker
- Event sourcing capability
- Replay and reprocessing support
- Strong ordering guarantees

### Why TimescaleDB?
- PostgreSQL-compatible (familiar SQL)
- Optimized for time-series data
- Automatic data retention policies
- Continuous aggregations

### Why .NET 8?
- High performance and low latency
- Cross-platform support
- Strong typing and tooling
- Active ecosystem

## Future Enhancements

- [ ] GraphQL API option
- [ ] Apache Flink integration for advanced stream processing
- [ ] Multi-region deployment support
- [ ] Advanced AI/ML model orchestration
- [ ] Real-time collaboration features
- [ ] Mobile SDK for device integration
- [ ] Edge computing capabilities
