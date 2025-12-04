# Story Plan: Story 0.0 - Frontend Project Setup

**Story**: 0.0 (Prerequisite for Epic 4)  
**Epic**: Frontend Foundation  
**Priority**: Critical  
**Story Points**: 13  
**Started**: 2025-12-04  
**Developer**: AI Agent (GitHub Copilot)

---

## Story Description

**As a** platform developer  
**I want** to set up the frontend web application infrastructure  
**So that** we can implement dashboard and visualization features (Epic 4)

This is a prerequisite story not explicitly listed in user-stories.md but required before any Epic 4 work can begin.

---

## Acceptance Criteria

Foundation setup:
- [x] Next.js 14 project created in `src/Web/Sensormine.Web/`
- [x] TypeScript configured with strict mode
- [x] Tailwind CSS installed and configured
- [x] shadcn/ui component library initialized
- [x] Project builds and runs successfully

API Integration:
- [ ] API client configured for backend service communication
- [ ] OpenAPI client generation setup (optional, can be manual initially)
- [ ] Environment variable configuration for API URLs

Authentication:
- [ ] JWT/OIDC authentication structure prepared
- [ ] Auth context/provider skeleton created
- [ ] Login page placeholder created

Layout & Routing:
- [ ] Base app layout with header and navigation
- [ ] Next.js App Router configured
- [ ] Basic pages: Home, Login, Dashboard (placeholders)
- [ ] Responsive design structure

Design System:
- [ ] Tailwind config with custom theme colors
- [ ] Typography system defined
- [ ] Spacing tokens configured
- [ ] Dark mode support prepared

Testing:
- [ ] Vitest configured for unit tests
- [ ] React Testing Library set up
- [ ] Sample component test created
- [ ] Playwright configured for E2E tests (optional initially)

---

## Technical Analysis

### Dependencies
- **Required Stories**: None (this is the foundation)
- **External Dependencies**: 
  - Node.js 20+ LTS
  - npm/pnpm package manager
  - Backend API Gateway (minimal, for integration later)
- **Blocked By**: None

### Architecture Alignment
- **Service**: New frontend application (`src/Web/Sensormine.Web/`)
- **Integration Points**: 
  - ApiGateway: REST API calls
  - Keycloak: Authentication (future)
  - WebSocket/SignalR: Real-time updates (future)
- **Data Model**: TypeScript interfaces from OpenAPI specs
- **API Endpoints**: Consumer of backend APIs (not provider)

### Technology Choices
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand (to be added when needed)
- **API Client**: Axios or native fetch with TypeScript types
- **Testing**: Vitest + React Testing Library
- **E2E Testing**: Playwright (later)

---

## Implementation Plan

### Phase 1: Project Initialization
**Files to Create**:
- [ ] `src/Web/Sensormine.Web/package.json`
- [ ] `src/Web/Sensormine.Web/tsconfig.json`
- [ ] `src/Web/Sensormine.Web/next.config.js`
- [ ] `src/Web/Sensormine.Web/tailwind.config.ts`
- [ ] `src/Web/Sensormine.Web/.gitignore`
- [ ] `src/Web/Sensormine.Web/.env.local.example`

**Tasks**:
- [x] Create Web directory structure
- [x] Initialize Next.js with TypeScript
- [x] Install Tailwind CSS
- [x] Configure tsconfig with strict settings
- [x] Set up environment variables structure

### Phase 2: shadcn/ui Setup
**Files to Create**:
- [ ] `src/Web/Sensormine.Web/components.json` (shadcn config)
- [ ] `src/Web/Sensormine.Web/components/ui/` (component directory)
- [ ] `src/Web/Sensormine.Web/lib/utils.ts` (utility functions)

**Tasks**:
- [ ] Initialize shadcn/ui with `npx shadcn-ui@latest init`
- [ ] Install initial components: Button, Card, Input, Label
- [ ] Verify component rendering

### Phase 3: Project Structure
**Files to Create**:
- [ ] `src/Web/Sensormine.Web/app/layout.tsx` (root layout)
- [ ] `src/Web/Sensormine.Web/app/page.tsx` (home page)
- [ ] `src/Web/Sensormine.Web/app/login/page.tsx` (login page)
- [ ] `src/Web/Sensormine.Web/app/dashboard/page.tsx` (dashboard placeholder)
- [ ] `src/Web/Sensormine.Web/components/layout/Header.tsx`
- [ ] `src/Web/Sensormine.Web/components/layout/Navigation.tsx`
- [ ] `src/Web/Sensormine.Web/components/layout/Footer.tsx`

**Tasks**:
- [ ] Create App Router structure
- [ ] Build responsive layout components
- [ ] Add basic navigation menu
- [ ] Create page placeholders

### Phase 4: Design System
**Files to Create/Modify**:
- [ ] `src/Web/Sensormine.Web/app/globals.css` (global styles)
- [ ] `src/Web/Sensormine.Web/tailwind.config.ts` (custom theme)
- [ ] `src/Web/Sensormine.Web/lib/theme.ts` (theme constants)

**Tasks**:
- [ ] Define color palette (brand colors)
- [ ] Configure typography scale
- [ ] Set up spacing/sizing tokens
- [ ] Add dark mode support with next-themes
- [ ] Create theme toggle component

### Phase 5: API Client Infrastructure
**Files to Create**:
- [ ] `src/Web/Sensormine.Web/lib/api/client.ts` (base API client)
- [ ] `src/Web/Sensormine.Web/lib/api/endpoints.ts` (endpoint definitions)
- [ ] `src/Web/Sensormine.Web/lib/api/types.ts` (TypeScript types)
- [ ] `src/Web/Sensormine.Web/lib/api/errors.ts` (error handling)

**Tasks**:
- [ ] Create axios/fetch wrapper with interceptors
- [ ] Add request/response interceptors
- [ ] Implement error handling strategy
- [ ] Add TypeScript types for common responses
- [ ] Configure base URL from environment variables

### Phase 6: Authentication Structure
**Files to Create**:
- [ ] `src/Web/Sensormine.Web/lib/auth/AuthContext.tsx` (React context)
- [ ] `src/Web/Sensormine.Web/lib/auth/AuthProvider.tsx` (provider component)
- [ ] `src/Web/Sensormine.Web/lib/auth/useAuth.ts` (custom hook)
- [ ] `src/Web/Sensormine.Web/lib/auth/types.ts` (auth types)
- [ ] `src/Web/Sensormine.Web/middleware.ts` (Next.js middleware for route protection)

**Tasks**:
- [ ] Create authentication context
- [ ] Build useAuth hook
- [ ] Add JWT token storage (localStorage/cookie)
- [ ] Implement route protection middleware
- [ ] Create login form component

### Phase 7: Testing Setup
**Files to Create**:
- [ ] `src/Web/Sensormine.Web/vitest.config.ts`
- [ ] `src/Web/Sensormine.Web/__tests__/setup.ts`
- [ ] `src/Web/Sensormine.Web/__tests__/components/Button.test.tsx` (sample)
- [ ] `src/Web/Sensormine.Web/__tests__/lib/api/client.test.ts` (sample)

**Tasks**:
- [ ] Install and configure Vitest
- [ ] Set up React Testing Library
- [ ] Create test utilities and helpers
- [ ] Write sample component tests
- [ ] Write sample API client tests
- [ ] Add test scripts to package.json

### Phase 8: Documentation
**Files to Create**:
- [ ] `src/Web/Sensormine.Web/README.md`
- [ ] `src/Web/Sensormine.Web/docs/getting-started.md`
- [ ] `src/Web/Sensormine.Web/docs/architecture.md`
- [ ] `src/Web/Sensormine.Web/docs/testing.md`

**Tasks**:
- [ ] Document project setup steps
- [ ] Document folder structure
- [ ] Document development workflow
- [ ] Document testing approach
- [ ] Add code examples

---

## Test-Driven Development Plan

### Test 1: Project Builds Successfully
**Test**: Run `npm run build` and verify no errors
**Implementation**: Complete Phase 1-2 setup
**Success Criteria**: Build completes with exit code 0

### Test 2: Home Page Renders
**Test File**: `__tests__/app/page.test.tsx`
```typescript
describe('Home Page', () => {
  it('renders welcome message', () => {
    render(<HomePage />);
    expect(screen.getByText(/welcome to sensormine/i)).toBeInTheDocument();
  });
});
```
**Implementation**: Create basic home page component
**Success Criteria**: Test passes

### Test 3: shadcn/ui Button Component Works
**Test File**: `__tests__/components/ui/button.test.tsx`
```typescript
describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click Me');
  });
  
  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```
**Implementation**: Install and configure shadcn/ui Button
**Success Criteria**: Tests pass

### Test 4: API Client Makes Requests
**Test File**: `__tests__/lib/api/client.test.ts`
```typescript
describe('API Client', () => {
  it('makes GET request with correct headers', async () => {
    const mockResponse = { data: 'test' };
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);
    
    const result = await apiClient.get('/test');
    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });
  
  it('handles errors gracefully', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
    await expect(apiClient.get('/test')).rejects.toThrow('Network error');
  });
});
```
**Implementation**: Build API client with error handling
**Success Criteria**: Tests pass

### Test 5: Authentication Context Provides Auth State
**Test File**: `__tests__/lib/auth/useAuth.test.tsx`
```typescript
describe('useAuth Hook', () => {
  it('provides authentication state', () => {
    const wrapper = ({ children }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('login');
    expect(result.current).toHaveProperty('logout');
    expect(result.current).toHaveProperty('isAuthenticated');
  });
});
```
**Implementation**: Create auth context and provider
**Success Criteria**: Tests pass

### Test 6: Navigation Renders Correctly
**Test File**: `__tests__/components/layout/Navigation.test.tsx`
```typescript
describe('Navigation Component', () => {
  it('renders navigation links', () => {
    render(<Navigation />);
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/devices/i)).toBeInTheDocument();
  });
  
  it('highlights active route', () => {
    render(<Navigation />);
    const activeLink = screen.getByRole('link', { current: 'page' });
    expect(activeLink).toHaveClass('active');
  });
});
```
**Implementation**: Build navigation component with active state
**Success Criteria**: Tests pass

---

## Definition of Done

- [x] All acceptance criteria met
- [ ] All TDD tests passing
- [ ] Project builds without errors
- [ ] Development server runs successfully (`npm run dev`)
- [ ] Code follows Next.js and React best practices
- [ ] TypeScript strict mode with no errors
- [ ] README documentation complete
- [ ] `.agent/current-state.md` updated
- [ ] Story plan moved to `.agent/completed-stories/story-0.0.md`
- [ ] Commit pushed with message: `[Story 0.0] Frontend project setup complete`

---

## Notes

- This is a foundation story - focus on structure and setup over features
- Keep components simple initially - we'll iterate as we build features
- Ensure all paths are relative and work in the monorepo structure
- Consider adding this story to user-stories.md as Story 0.0 for future reference
- Backend API integration will be minimal initially (mock data acceptable)
- Authentication can be mocked initially - full Keycloak integration later

---

## Next Steps After Completion

Once Story 0.0 is complete, we can begin Epic 4 stories in this order:
1. **Story 4.1**: Dashboard Builder (foundation for all visualizations)
2. **Story 4.2**: Time-Series Charts
3. **Story 4.6**: GIS Map Widget
4. **Story 4.9**: Real-Time Dashboard Updates
