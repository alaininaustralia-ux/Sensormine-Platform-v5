# Story 2.2: Schema Definition - Frontend Implementation Plan

**Story**: 2.2 - Schema Definition (Frontend)  
**Priority**: High  
**Story Points**: 13  
**Dependencies**: Story 2.2 Backend (✅ Complete)

---

## Overview

Implement a complete Schema Management UI that allows data engineers to create, edit, version, test, and manage JSON schemas for device data validation. The UI will integrate with the existing SchemaRegistry.API backend.

---

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 14 with App Router
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Forms**: React Hook Form + Zod validation
- **State Management**: Zustand (for schema editor state)
- **Code Editor**: Monaco Editor (for JSON Schema editing)
- **API Client**: Fetch API with TypeScript types
- **Testing**: Vitest + React Testing Library

### Component Structure
```
src/Web/sensormine-web/src/
├── app/
│   └── schemas/
│       ├── page.tsx                    # Schema list page
│       ├── new/
│       │   └── page.tsx                # Create schema wizard
│       ├── [id]/
│       │   ├── page.tsx                # Schema detail page
│       │   └── edit/
│       │       └── page.tsx            # Edit schema page
│       └── layout.tsx                  # Schemas layout
├── components/
│   └── schemas/
│       ├── schema-list.tsx             # Schema list with filters
│       ├── schema-card.tsx             # Schema card component
│       ├── schema-wizard/
│       │   ├── basic-info-step.tsx     # Step 1: Name, description, tags
│       │   ├── schema-editor-step.tsx  # Step 2: JSON Schema editor
│       │   ├── test-schema-step.tsx    # Step 3: Test with sample data
│       │   └── review-step.tsx         # Step 4: Review and create
│       ├── schema-editor.tsx           # Monaco editor wrapper
│       ├── schema-validator.tsx        # Live validation panel
│       ├── schema-version-list.tsx     # Version history
│       ├── schema-version-diff.tsx     # Compare versions
│       └── schema-test-panel.tsx       # Test schema component
└── lib/
    ├── api/
    │   └── schemas.ts                  # API client for schemas
    ├── types/
    │   └── schema.ts                   # TypeScript types
    └── stores/
        └── schema-store.ts             # Zustand store for editor state
```

---

## Implementation Phases

### Phase 1: API Client & Types (TDD)

**Files to Create:**
- `src/Web/sensormine-web/src/lib/types/schema.ts`
- `src/Web/sensormine-web/src/lib/api/schemas.ts`
- `src/Web/sensormine-web/__tests__/lib/api/schemas.test.ts`

**TypeScript Types:**
```typescript
export interface Schema {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  currentVersionId: string;
  status: 'Draft' | 'Active' | 'Deprecated' | 'Archived';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  currentVersion?: SchemaVersion;
  versions?: SchemaVersion[];
}

export interface SchemaVersion {
  id: string;
  schemaId: string;
  version: string;
  jsonSchema: string; // JSON string
  changeLog: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface CreateSchemaRequest {
  name: string;
  description: string;
  jsonSchema: string;
  changeLog: string;
  tags: string[];
}

export interface UpdateSchemaRequest {
  description?: string;
  jsonSchema: string;
  changeLog: string;
  tags?: string[];
}
```

**API Client Methods:**
```typescript
// GET /api/schemas
export async function getSchemas(params?: GetSchemasParams): Promise<SchemaListResponse>

// GET /api/schemas/{id}
export async function getSchema(id: string): Promise<Schema>

// POST /api/schemas
export async function createSchema(request: CreateSchemaRequest): Promise<Schema>

// PUT /api/schemas/{id}
export async function updateSchema(id: string, request: UpdateSchemaRequest): Promise<Schema>

// DELETE /api/schemas/{id}
export async function deleteSchema(id: string): Promise<void>

// GET /api/schemas/{id}/versions
export async function getSchemaVersions(schemaId: string): Promise<SchemaVersion[]>

// POST /api/schemas/validate
export async function validateData(schemaId: string, data: unknown): Promise<ValidationResult>
```

**Tests:**
- Mock API responses for all CRUD operations
- Test error handling (network errors, validation errors)
- Test pagination and filtering
- Test validation with valid/invalid data

---

### Phase 2: Schema List Page (TDD)

**Files to Create:**
- `src/Web/sensormine-web/src/app/schemas/page.tsx`
- `src/Web/sensormine-web/src/components/schemas/schema-list.tsx`
- `src/Web/sensormine-web/src/components/schemas/schema-card.tsx`
- `src/Web/sensormine-web/__tests__/components/schemas/schema-list.test.tsx`

**Features:**
- Display schemas in a grid/list view
- Search by schema name
- Filter by status (Draft, Active, Deprecated, Archived)
- Filter by tags (multi-select)
- Sort by name, created date, updated date
- Pagination (client-side or server-side)
- Create new schema button (navigates to wizard)
- Click schema card to view details

**UI Components:**
- `SchemaList` - Main list container with filters
- `SchemaCard` - Individual schema card showing:
  - Schema name and description
  - Current version badge
  - Status badge (color-coded)
  - Tags
  - Last updated timestamp
  - Actions menu (View, Edit, Delete)

**Tests:**
- Render schema list with mock data
- Search functionality filters schemas
- Status filter works correctly
- Tag filter works correctly
- Sort functionality works
- Pagination works
- Navigate to detail page on click
- Delete confirmation dialog

---

### Phase 3: Schema Detail Page (TDD)

**Files to Create:**
- `src/Web/sensormine-web/src/app/schemas/[id]/page.tsx`
- `src/Web/sensormine-web/src/components/schemas/schema-version-list.tsx`
- `src/Web/sensormine-web/src/components/schemas/schema-version-diff.tsx`
- `src/Web/sensormine-web/__tests__/components/schemas/schema-detail.test.tsx`

**Features:**
- Display schema metadata (name, description, tags, status)
- Show current version JSON Schema (formatted, read-only Monaco editor)
- Version history list with:
  - Version number (semantic versioning)
  - Change log
  - Created by and timestamp
  - Active/inactive badge
  - View version button
- Compare versions (side-by-side diff view)
- Edit schema button (navigates to edit page)
- Delete schema button (with confirmation)
- Test schema with sample data (inline test panel)

**UI Components:**
- Schema metadata card
- Current version display (Monaco editor, read-only)
- Version history table/list
- Version diff viewer (Monaco diff editor)
- Test panel (inline or modal)

**Tests:**
- Render schema detail with mock data
- Version history displays correctly
- Compare versions shows diff
- Test panel validates data correctly
- Edit navigation works
- Delete confirmation and API call

---

### Phase 4: Create Schema Wizard (TDD)

**Files to Create:**
- `src/Web/sensormine-web/src/app/schemas/new/page.tsx`
- `src/Web/sensormine-web/src/components/schemas/schema-wizard/basic-info-step.tsx`
- `src/Web/sensormine-web/src/components/schemas/schema-wizard/schema-editor-step.tsx`
- `src/Web/sensormine-web/src/components/schemas/schema-wizard/test-schema-step.tsx`
- `src/Web/sensormine-web/src/components/schemas/schema-wizard/review-step.tsx`
- `src/Web/sensormine-web/src/lib/stores/schema-store.ts`
- `src/Web/sensormine-web/__tests__/components/schemas/schema-wizard.test.tsx`

**Wizard Steps:**

**Step 1: Basic Information**
- Schema name (required, unique validation)
- Description (optional, textarea)
- Tags (multi-select or comma-separated input)
- Initial version number (default: 1.0.0)
- Next button (validates and proceeds)

**Step 2: JSON Schema Editor**
- Monaco Editor with JSON Schema syntax highlighting
- Live syntax validation (JSON parse errors)
- Schema validation (must be valid JSON Schema Draft 7)
- Template dropdown (start from template):
  - Empty schema
  - Simple sensor data (temperature, pressure)
  - Multi-sensor payload
  - Industrial equipment telemetry
- Example schemas for reference
- Previous/Next buttons

**Step 3: Test Schema**
- JSON editor for sample data input
- Validate button
- Validation result display:
  - Success message with green check
  - Error messages with line numbers and field paths
  - Warning messages (if applicable)
- Example valid/invalid data for testing
- Previous/Next buttons

**Step 4: Review and Create**
- Display all entered information:
  - Basic info summary
  - JSON Schema (formatted, read-only)
  - Test results (if tested)
- Change log input (required, what does this schema define?)
- Create button (submits to API)
- Previous button (go back to edit)

**State Management (Zustand):**
```typescript
interface SchemaWizardState {
  currentStep: number;
  basicInfo: { name: string; description: string; tags: string[] };
  jsonSchema: string;
  testData: string;
  validationResult: ValidationResult | null;
  setCurrentStep: (step: number) => void;
  setBasicInfo: (info: Partial<BasicInfo>) => void;
  setJsonSchema: (schema: string) => void;
  setTestData: (data: string) => void;
  setValidationResult: (result: ValidationResult | null) => void;
  reset: () => void;
}
```

**Tests:**
- Navigate through all wizard steps
- Validation errors prevent progression
- State persists between steps
- Template selection loads schema
- Test validation shows errors correctly
- Submit creates schema via API
- Cancel/back navigation works

---

### Phase 5: Edit Schema (Create New Version) (TDD)

**Files to Create:**
- `src/Web/sensormine-web/src/app/schemas/[id]/edit/page.tsx`
- `src/Web/sensormine-web/src/components/schemas/schema-editor.tsx`
- `src/Web/sensormine-web/__tests__/components/schemas/schema-editor.test.tsx`

**Features:**
- Load existing schema for editing
- Monaco Editor for JSON Schema
- Side-by-side diff view (original vs. edited)
- Automatic version increment suggestion:
  - Breaking changes → major version (2.0.0)
  - New optional fields → minor version (1.1.0)
  - Bug fixes/docs → patch version (1.0.1)
- Manual version number override
- Change log input (required, describe changes)
- Test new version with sample data
- Save button (creates new version)
- Cancel button (discards changes)

**Breaking Change Detection:**
```typescript
// Detect breaking changes in schema
function detectBreakingChanges(oldSchema: object, newSchema: object): string[] {
  // Removed required fields
  // Changed field types
  // Removed fields
  // Stricter validation rules
}
```

**Tests:**
- Load existing schema correctly
- Diff view shows changes
- Breaking change detection works
- Version increment logic correct
- Save creates new version
- Cancel discards changes

---

### Phase 6: Schema Test Panel Component (TDD)

**Files to Create:**
- `src/Web/sensormine-web/src/components/schemas/schema-test-panel.tsx`
- `src/Web/sensormine-web/__tests__/components/schemas/schema-test-panel.test.tsx`

**Features:**
- Reusable component for testing schemas
- JSON editor for sample data input
- Validate button
- Validation result display:
  - Success state (green, with checkmark)
  - Error state (red, with error details)
  - Field-level errors highlighted
- Example data dropdown (load sample valid/invalid data)
- Clear button

**Tests:**
- Render test panel with schema
- Validate valid data shows success
- Validate invalid data shows errors
- Error messages include field paths
- Example data loads correctly

---

## Acceptance Criteria Checklist

### Schema List View
- [ ] Display schemas in grid/list view
- [ ] Search by schema name works
- [ ] Filter by status (Draft, Active, Deprecated, Archived)
- [ ] Filter by tags (multi-select)
- [ ] Sort by name, created date, updated date
- [ ] Pagination works
- [ ] Create new schema button navigates to wizard
- [ ] Click schema card to view details

### Create Schema Wizard
- [ ] Step 1: Basic info form validates correctly
- [ ] Step 2: JSON Schema editor with syntax highlighting
- [ ] Step 2: Live syntax validation shows errors
- [ ] Step 2: Template dropdown loads example schemas
- [ ] Step 3: Test schema with sample data
- [ ] Step 3: Validation errors display clearly
- [ ] Step 4: Review shows all information
- [ ] Step 4: Create button submits and navigates to detail page
- [ ] State persists when navigating back
- [ ] Cancel button discards changes with confirmation

### Edit Schema Workflow
- [ ] Load existing schema for editing
- [ ] Side-by-side diff view shows changes
- [ ] Breaking change detection works
- [ ] Version increment suggestion is correct
- [ ] Manual version override works
- [ ] Change log is required
- [ ] Test new version before saving
- [ ] Save creates new version
- [ ] Cancel discards changes

### Schema Detail Page
- [ ] Display schema metadata correctly
- [ ] Show current version JSON Schema (formatted)
- [ ] Version history list shows all versions
- [ ] Version history includes change logs
- [ ] Compare versions shows side-by-side diff
- [ ] Edit button navigates to edit page
- [ ] Delete button shows confirmation dialog
- [ ] Delete button soft-deletes schema
- [ ] Test panel validates inline

### Schema Testing
- [ ] Test panel accepts JSON input
- [ ] Validate button calls API
- [ ] Success message displays for valid data
- [ ] Error messages display for invalid data
- [ ] Error messages include field paths and line numbers
- [ ] Example valid/invalid data available

### Responsive Design
- [ ] Mobile layout works (< 768px)
- [ ] Tablet layout works (768px - 1024px)
- [ ] Desktop layout works (> 1024px)
- [ ] Monaco editor is responsive

### Error Handling
- [ ] Network errors show toast notification
- [ ] API validation errors display in form
- [ ] Loading states show spinners
- [ ] Empty states show helpful messages
- [ ] 404 errors show "Schema not found" page

### Performance
- [ ] Schema list pagination prevents loading all schemas
- [ ] Monaco editor lazy loads
- [ ] Debounce search input
- [ ] Optimize re-renders with React.memo

---

## Testing Strategy

### Unit Tests (Vitest + React Testing Library)
- All components render correctly with mock data
- Form validation logic works
- API client methods handle success/error cases
- Zustand store actions update state correctly
- Breaking change detection logic works

### Integration Tests
- Full wizard flow creates schema
- Edit flow creates new version
- Delete flow soft-deletes schema
- Test panel validates data correctly

### E2E Tests (Optional - Playwright)
- Complete create schema workflow
- Complete edit schema workflow
- Complete delete schema workflow

---

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/schemas` | List all schemas with pagination |
| GET | `/api/schemas/{id}` | Get schema by ID |
| POST | `/api/schemas` | Create new schema |
| PUT | `/api/schemas/{id}` | Update schema (create new version) |
| DELETE | `/api/schemas/{id}` | Soft delete schema |
| GET | `/api/schemas/{id}/versions` | Get all versions for a schema |
| GET | `/api/schemas/{id}/versions/{versionId}` | Get specific version |
| POST | `/api/schemas/validate` | Validate data against schema |

---

## UI/UX Considerations

### Design System
- Use shadcn/ui components for consistency
- Follow existing color scheme from dashboard widgets
- Use Tailwind CSS utility classes
- Maintain responsive design principles

### User Feedback
- Toast notifications for CRUD operations
- Loading spinners for async operations
- Confirmation dialogs for destructive actions
- Success/error messages with context

### Accessibility
- Keyboard navigation support
- ARIA labels for screen readers
- Focus management in wizard
- Color contrast meets WCAG AA standards

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Responsive on mobile/tablet/desktop
- [ ] Accessible (keyboard navigation, screen readers)
- [ ] Committed with message: `[Story 2.2] Implement Schema Management UI`
- [ ] `.agent/current-state.md` updated
- [ ] Story plan moved to `.agent/completed-stories/`

---

## Estimated Timeline

- **Phase 1**: API Client & Types - 2 hours
- **Phase 2**: Schema List Page - 3 hours
- **Phase 3**: Schema Detail Page - 3 hours
- **Phase 4**: Create Schema Wizard - 5 hours
- **Phase 5**: Edit Schema - 3 hours
- **Phase 6**: Schema Test Panel - 2 hours
- **Testing & Bug Fixes**: 3 hours
- **Documentation & Cleanup**: 1 hour

**Total**: ~22 hours (13 story points)

---

## Next Steps After Completion

1. Update Story 1.3 (Device Configuration) to add schema selector
2. Update Story 4.1 (Dashboard Builder) to add schema-based widget data source
3. Implement schema validation in Ingestion.Service
4. Add schema metrics to monitoring dashboard
