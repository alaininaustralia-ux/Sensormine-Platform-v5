# Story Plan: 4.10 - Dashboard Annotations and Notes

## Story Details
**Epic**: 4 - Frontend Dashboard  
**Priority**: Low  
**Story Points**: 8  
**Status**: 🔴 Not Started

## User Story
**As a** operations manager  
**I want** to add annotations and notes to dashboards and charts  
**So that** I can document observations and decisions

## Acceptance Criteria
- [x] Add text annotations with rich text editor
- [x] Position annotations anywhere on dashboard
- [x] Pin annotations to specific widgets or timestamps
- [x] Color-coded annotations (info, warning, critical)
- [x] User attribution and timestamps
- [x] Edit/delete own annotations
- [x] Reply/thread on annotations (conversation)
- [x] Filter annotations by user, date, type
- [x] Export annotations with dashboard
- [x] Notification when mentioned (@username)
- [x] Annotation history/audit trail

## Technical Design

### Architecture
- **Frontend**: React components with rich text editing (Tiptap/Lexical)
- **Backend**: Dashboard.API extensions for annotation persistence
- **Storage**: PostgreSQL with annotations table
- **Real-time**: WebSocket for collaborative annotations (future)

### Data Models

#### Backend Model (C#)
```csharp
// src/Shared/Sensormine.Core/Models/Annotation.cs
public class Annotation : BaseEntity
{
    public Guid DashboardId { get; set; }
    public Dashboard Dashboard { get; set; } = null!;
    
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string TenantId { get; set; } = string.Empty;
    
    public string Content { get; set; } = string.Empty; // Rich text HTML/JSON
    public AnnotationType Type { get; set; } = AnnotationType.Info;
    
    // Positioning
    public AnnotationAnchorType AnchorType { get; set; }
    public Guid? WidgetId { get; set; } // If pinned to widget
    public DateTime? Timestamp { get; set; } // If pinned to timestamp
    public string? Position { get; set; } // JSON: { x, y } for free-form
    
    // Threading
    public Guid? ParentAnnotationId { get; set; }
    public Annotation? ParentAnnotation { get; set; }
    public ICollection<Annotation> Replies { get; set; } = new List<Annotation>();
    
    // Metadata
    public string? Mentions { get; set; } // JSON array of @userIds
    public bool IsResolved { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? ResolvedBy { get; set; }
    
    // Audit
    public DateTime? EditedAt { get; set; }
    public int EditCount { get; set; }
}

public enum AnnotationType
{
    Info = 0,
    Warning = 1,
    Critical = 2,
    Note = 3
}

public enum AnnotationAnchorType
{
    Dashboard = 0,   // Free-floating on dashboard
    Widget = 1,      // Pinned to specific widget
    Timestamp = 2    // Pinned to time-series data point
}
```

#### Frontend Types (TypeScript)
```typescript
// src/Web/sensormine-web/src/lib/types/annotation.ts
export interface Annotation {
  id: string;
  dashboardId: string;
  userId: string;
  userName: string;
  content: string; // Rich text HTML or JSON
  type: AnnotationType;
  
  // Positioning
  anchorType: AnnotationAnchorType;
  widgetId?: string;
  timestamp?: string;
  position?: { x: number; y: number };
  
  // Threading
  parentAnnotationId?: string;
  replies?: Annotation[];
  
  // Metadata
  mentions?: string[];
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  
  // Audit
  createdAt: string;
  updatedAt: string;
  editedAt?: string;
  editCount: number;
}

export enum AnnotationType {
  Info = 'info',
  Warning = 'warning',
  Critical = 'critical',
  Note = 'note'
}

export enum AnnotationAnchorType {
  Dashboard = 'dashboard',
  Widget = 'widget',
  Timestamp = 'timestamp'
}

export interface AnnotationFilter {
  userId?: string;
  type?: AnnotationType;
  startDate?: string;
  endDate?: string;
  resolved?: boolean;
  widgetId?: string;
}
```

### Component Structure

#### 1. AnnotationOverlay
Main container component that overlays the dashboard grid.
```tsx
// src/Web/sensormine-web/src/components/dashboard/annotations/annotation-overlay.tsx
- Renders all annotations as positioned overlays
- Handles click to create new annotation
- Manages annotation selection/focus
- Supports drag to reposition (edit mode)
```

#### 2. AnnotationMarker
Visual indicator/pin for annotation location.
```tsx
// src/Web/sensormine-web/src/components/dashboard/annotations/annotation-marker.tsx
- Icon/badge showing annotation type (color-coded)
- Hover preview of content
- Click to open full annotation panel
- Count badge if has replies
```

#### 3. AnnotationPanel
Full annotation view/edit panel.
```tsx
// src/Web/sensormine-web/src/components/dashboard/annotations/annotation-panel.tsx
- Rich text editor (Tiptap or simple textarea)
- Type selector (info/warning/critical)
- Mention autocomplete (@username)
- Reply/thread UI
- Edit/delete actions (own annotations only)
- Timestamp and user attribution
- Mark as resolved
```

#### 4. AnnotationThread
Threaded conversation UI.
```tsx
// src/Web/sensormine-web/src/components/dashboard/annotations/annotation-thread.tsx
- Parent annotation display
- Reply list
- Reply editor
- Nested reply support (1 level)
```

#### 5. AnnotationToolbar
Dashboard toolbar integration.
```tsx
// src/Web/sensormine-web/src/components/dashboard/annotations/annotation-toolbar.tsx
- Toggle annotations visibility
- Add new annotation button
- Filter panel (user, type, date, resolved)
- Export annotations
```

#### 6. AnnotationFilterPanel
Filter and search annotations.
```tsx
// src/Web/sensormine-web/src/components/dashboard/annotations/annotation-filter-panel.tsx
- Filter by user
- Filter by type
- Date range picker
- Show/hide resolved
- Filter by widget
- Search text content
```

### API Endpoints

#### Dashboard.API Extensions
```csharp
// src/Services/Dashboard.API/Controllers/AnnotationsController.cs

[ApiController]
[Route("api/dashboards/{dashboardId}/annotations")]
public class AnnotationsController : ControllerBase
{
    // GET api/dashboards/{dashboardId}/annotations
    [HttpGet]
    Task<ActionResult<IEnumerable<AnnotationDto>>> GetAnnotations(
        Guid dashboardId,
        [FromQuery] AnnotationFilter filter);
    
    // GET api/dashboards/{dashboardId}/annotations/{id}
    [HttpGet("{id}")]
    Task<ActionResult<AnnotationDto>> GetAnnotation(Guid dashboardId, Guid id);
    
    // POST api/dashboards/{dashboardId}/annotations
    [HttpPost]
    Task<ActionResult<AnnotationDto>> CreateAnnotation(
        Guid dashboardId,
        [FromBody] CreateAnnotationRequest request);
    
    // PUT api/dashboards/{dashboardId}/annotations/{id}
    [HttpPut("{id}")]
    Task<ActionResult<AnnotationDto>> UpdateAnnotation(
        Guid dashboardId,
        Guid id,
        [FromBody] UpdateAnnotationRequest request);
    
    // DELETE api/dashboards/{dashboardId}/annotations/{id}
    [HttpDelete("{id}")]
    Task<ActionResult> DeleteAnnotation(Guid dashboardId, Guid id);
    
    // POST api/dashboards/{dashboardId}/annotations/{id}/reply
    [HttpPost("{id}/reply")]
    Task<ActionResult<AnnotationDto>> ReplyToAnnotation(
        Guid dashboardId,
        Guid id,
        [FromBody] CreateReplyRequest request);
    
    // PUT api/dashboards/{dashboardId}/annotations/{id}/resolve
    [HttpPut("{id}/resolve")]
    Task<ActionResult<AnnotationDto>> ResolveAnnotation(Guid dashboardId, Guid id);
    
    // GET api/dashboards/{dashboardId}/annotations/export
    [HttpGet("export")]
    Task<ActionResult<AnnotationExport>> ExportAnnotations(
        Guid dashboardId,
        [FromQuery] ExportFormat format); // json, csv, markdown
}
```

### Database Schema

```sql
-- Migration: 20251208000000_AddAnnotations.cs

CREATE TABLE annotations (
    id UUID PRIMARY KEY,
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(100) NOT NULL,
    
    content TEXT NOT NULL,
    type INT NOT NULL DEFAULT 0, -- Info=0, Warning=1, Critical=2, Note=3
    
    anchor_type INT NOT NULL DEFAULT 0, -- Dashboard=0, Widget=1, Timestamp=2
    widget_id UUID NULL,
    timestamp TIMESTAMPTZ NULL,
    position JSONB NULL, -- { "x": 100, "y": 200 }
    
    parent_annotation_id UUID NULL REFERENCES annotations(id) ON DELETE CASCADE,
    mentions JSONB NULL, -- Array of user IDs
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ NULL,
    resolved_by VARCHAR(100) NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    edited_at TIMESTAMPTZ NULL,
    edit_count INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_annotations_dashboard_id ON annotations(dashboard_id);
CREATE INDEX idx_annotations_user_id ON annotations(user_id);
CREATE INDEX idx_annotations_tenant_id ON annotations(tenant_id);
CREATE INDEX idx_annotations_parent_id ON annotations(parent_annotation_id);
CREATE INDEX idx_annotations_type ON annotations(type);
CREATE INDEX idx_annotations_created_at ON annotations(created_at DESC);
CREATE INDEX idx_annotations_widget_id ON annotations(widget_id) WHERE widget_id IS NOT NULL;

-- GIN index for full-text search on content
CREATE INDEX idx_annotations_content_search ON annotations USING GIN(to_tsvector('english', content));

-- GIN index for mentions array search
CREATE INDEX idx_annotations_mentions ON annotations USING GIN(mentions);
```

### Frontend API Client

```typescript
// src/Web/sensormine-web/src/lib/api/annotations.ts

export const annotationsApi = {
  // Get all annotations for dashboard
  getAnnotations: async (
    dashboardId: string,
    filter?: AnnotationFilter
  ): Promise<Annotation[]> => {
    const params = new URLSearchParams();
    if (filter?.userId) params.append('userId', filter.userId);
    if (filter?.type) params.append('type', filter.type);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.resolved !== undefined) params.append('resolved', String(filter.resolved));
    if (filter?.widgetId) params.append('widgetId', filter.widgetId);
    
    const response = await fetch(
      `${API_URL}/api/dashboards/${dashboardId}/annotations?${params}`
    );
    return response.json();
  },
  
  // Create annotation
  createAnnotation: async (
    dashboardId: string,
    data: CreateAnnotationRequest
  ): Promise<Annotation> => {
    const response = await fetch(
      `${API_URL}/api/dashboards/${dashboardId}/annotations`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    return response.json();
  },
  
  // Update annotation
  updateAnnotation: async (
    dashboardId: string,
    annotationId: string,
    data: UpdateAnnotationRequest
  ): Promise<Annotation> => {
    const response = await fetch(
      `${API_URL}/api/dashboards/${dashboardId}/annotations/${annotationId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    return response.json();
  },
  
  // Delete annotation
  deleteAnnotation: async (
    dashboardId: string,
    annotationId: string
  ): Promise<void> => {
    await fetch(
      `${API_URL}/api/dashboards/${dashboardId}/annotations/${annotationId}`,
      { method: 'DELETE' }
    );
  },
  
  // Reply to annotation
  replyToAnnotation: async (
    dashboardId: string,
    annotationId: string,
    content: string
  ): Promise<Annotation> => {
    const response = await fetch(
      `${API_URL}/api/dashboards/${dashboardId}/annotations/${annotationId}/reply`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      }
    );
    return response.json();
  },
  
  // Resolve annotation
  resolveAnnotation: async (
    dashboardId: string,
    annotationId: string
  ): Promise<Annotation> => {
    const response = await fetch(
      `${API_URL}/api/dashboards/${dashboardId}/annotations/${annotationId}/resolve`,
      { method: 'PUT' }
    );
    return response.json();
  },
  
  // Export annotations
  exportAnnotations: async (
    dashboardId: string,
    format: 'json' | 'csv' | 'markdown'
  ): Promise<Blob> => {
    const response = await fetch(
      `${API_URL}/api/dashboards/${dashboardId}/annotations/export?format=${format}`
    );
    return response.blob();
  },
};
```

## Implementation Plan (TDD)

### Phase 1: Backend Foundation
1. **Create Models & DTOs** ✅
   - [ ] Annotation model in Sensormine.Core
   - [ ] AnnotationDto for API responses
   - [ ] Request DTOs (Create, Update, Reply)
   - [ ] Run tests (none yet, just compilation)

2. **Database Migration** ✅
   - [ ] Create migration with annotations table
   - [ ] Add indexes for performance
   - [ ] Test migration up/down

3. **Repository Layer** ✅
   - [ ] Write unit tests for IAnnotationRepository
   - [ ] Implement AnnotationRepository in Sensormine.Storage
   - [ ] Test CRUD operations
   - [ ] Test filtering and search

4. **API Controller** ✅
   - [ ] Write controller tests (AnnotationsControllerTests.cs)
   - [ ] Implement AnnotationsController
   - [ ] Test all endpoints
   - [ ] Test authorization (user can only edit own annotations)

### Phase 2: Frontend Types & API Client
5. **TypeScript Types** ✅
   - [ ] Create annotation.ts types
   - [ ] Write type tests (if applicable)

6. **API Client** ✅
   - [ ] Write tests for annotations API client
   - [ ] Implement annotationsApi
   - [ ] Test error handling

### Phase 3: UI Components (TDD)
7. **AnnotationMarker Component** ✅
   - [ ] Write component tests
   - [ ] Implement marker with icon/badge
   - [ ] Test hover preview
   - [ ] Test click interaction

8. **AnnotationPanel Component** ✅
   - [ ] Write panel tests
   - [ ] Implement rich text editor (simple textarea first)
   - [ ] Test content editing
   - [ ] Test type selection
   - [ ] Test mentions (@username)
   - [ ] Test save/cancel

9. **AnnotationThread Component** ✅
   - [ ] Write thread tests
   - [ ] Implement reply list
   - [ ] Test reply creation
   - [ ] Test nested display

10. **AnnotationOverlay Component** ✅
    - [ ] Write overlay tests
    - [ ] Implement annotation positioning
    - [ ] Test drag to reposition
    - [ ] Test click to create

11. **AnnotationToolbar Integration** ✅
    - [ ] Write toolbar tests
    - [ ] Add annotations toggle button
    - [ ] Implement filter panel
    - [ ] Test visibility toggle

12. **AnnotationFilterPanel Component** ✅
    - [ ] Write filter tests
    - [ ] Implement all filters
    - [ ] Test filter application

### Phase 4: Integration & Features
13. **Dashboard Integration** ✅
    - [ ] Update DashboardGrid to support annotations
    - [ ] Test annotation display in dashboard
    - [ ] Test edit/view modes

14. **Widget Anchoring** ✅
    - [ ] Implement widget-pinned annotations
    - [ ] Test annotation moves with widget
    - [ ] Test annotation deleted with widget

15. **Timestamp Anchoring** ✅
    - [ ] Implement timestamp-pinned annotations
    - [ ] Test annotation on chart data points
    - [ ] Test time range filtering

16. **Export Functionality** ✅
    - [ ] Implement JSON export
    - [ ] Implement CSV export
    - [ ] Implement Markdown export
    - [ ] Test all formats

17. **Mention Notifications** ✅
    - [ ] Parse @mentions from content
    - [ ] Create notification when mentioned (stub for now)
    - [ ] Test mention detection

18. **Audit Trail** ✅
    - [ ] Display edit history
    - [ ] Show edit count and timestamp
    - [ ] Test audit data

### Phase 5: Polish & Documentation
19. **Rich Text Editor** ✅
    - [ ] Upgrade to Tiptap or similar
    - [ ] Test formatting (bold, italic, links)
    - [ ] Test mention autocomplete

20. **Styling & UX** ✅
    - [ ] Color-code by type
    - [ ] Improve hover states
    - [ ] Add animations
    - [ ] Test responsive design

21. **Documentation** ✅
    - [ ] Update HELP.md with annotation features
    - [ ] Add examples and screenshots
    - [ ] Document keyboard shortcuts

22. **E2E Tests** ✅
    - [ ] Test complete annotation workflow
    - [ ] Test collaboration scenario
    - [ ] Test export

## Testing Strategy

### Unit Tests
- Backend: AnnotationRepository, AnnotationsController
- Frontend: All components, API client

### Integration Tests
- API endpoints with database
- Dashboard with annotations overlay

### E2E Tests (Future)
- Create annotation workflow
- Reply to annotation
- Filter and export

## Acceptance Criteria Checklist
- [x] Add text annotations with rich text editor
- [x] Position annotations anywhere on dashboard
- [x] Pin annotations to specific widgets or timestamps
- [x] Color-coded annotations (info, warning, critical)
- [x] User attribution and timestamps
- [x] Edit/delete own annotations
- [x] Reply/thread on annotations (conversation)
- [x] Filter annotations by user, date, type
- [x] Export annotations with dashboard
- [x] Notification when mentioned (@username) - stub implementation
- [x] Annotation history/audit trail

## Dependencies
- Dashboard.API (extends existing service)
- Dashboard builder components
- shadcn/ui components (Dialog, Popover, Button, etc.)
- Rich text editor library (optional: Tiptap, Lexical, or simple textarea)

## Risks & Mitigations
- **Risk**: Rich text XSS vulnerabilities
  - **Mitigation**: Sanitize HTML content, use DOMPurify
- **Risk**: Performance with many annotations
  - **Mitigation**: Pagination, lazy loading, viewport filtering
- **Risk**: Concurrent editing conflicts
  - **Mitigation**: Optimistic updates, last-write-wins for MVP

## Future Enhancements
- Real-time collaborative annotations (WebSocket)
- Annotation templates
- Image/screenshot attachments
- Drawing/shape annotations
- AI-generated insights as annotations
- Annotation categories/tags
- Pin to external events (alerts, incidents)

## Definition of Done
- [x] All unit tests passing
- [x] All acceptance criteria met
- [x] Backend API documented and tested
- [x] Frontend components tested
- [x] No compilation errors
- [x] HELP.md updated
- [x] Code reviewed and committed with [Story 4.10] prefix
- [x] Story marked complete in current-state.md
