# Dashboard V1 Archive - December 11, 2025

This directory contains the original dashboard implementation that has been archived as part of a complete redesign.

## Archived Components

- **app-dashboard/**: All dashboard page routes and layouts
- **components-dashboard/**: All React components for dashboard widgets and UI
- **lib-dashboard/**: Dashboard utility functions and helpers
- **dashboard-store.ts**: Zustand store for dashboard state management
- **dashboard-types.ts**: TypeScript type definitions
- **dashboard-templates.ts**: Pre-built dashboard templates
- **dashboards-api.ts**: API client for Dashboard.API communication
- **tests/**: All unit and integration tests

## Reason for Archive

Complete redesign of dashboard designer with new requirements:
- Mode-based editing (View/Design/Configure)
- Digital twin integration for filtering
- Device type-based field mapping
- Enhanced widget catalog with 3D assets and maps
- Widget interaction and linking system
- Template and publishing capabilities

## Original Implementation Details

- Framework: Next.js 16 + React 19
- State Management: Zustand
- Grid Layout: react-grid-layout
- Charts: Recharts
- Maps: react-leaflet

See .agent/completed-stories/story-4.* for original implementation documentation.
