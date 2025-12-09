# Bookmarks and Navigation History Feature

## Overview

The Bookmarks and Navigation History feature provides users with a personalized navigation experience, allowing them to bookmark frequently accessed pages and track their browsing history within the Sensormine platform.

## Features

### 1. Bookmarking System
- **Bookmark Button**: Located in the header, allows users to bookmark the current page
- **Bookmark Icon**: Displays a filled yellow star when the current page is bookmarked
- **Toggle Functionality**: Click to add/remove bookmark for current page
- **Persistent Storage**: Bookmarks are stored in browser localStorage

### 2. Navigation History
- **Automatic Tracking**: All page visits are automatically tracked
- **Recent Pages**: Shows the 10 most recently visited pages
- **Smart Filtering**: Excludes login pages and homepage from tracking
- **Timestamp Tracking**: Records when each page was visited

### 3. Homepage Display
For authenticated users, the homepage displays:
- **Bookmarks Section**: Grid of bookmarked pages with icons and links
- **Recently Visited Section**: Grid of recently visited pages with time-ago indicators
- **Quick Actions**: Quick access cards to main platform features

### 4. Sidebar Integration
- **Bookmarks Section**: Collapsible section in the left sidebar
- **Icon Display**: Each bookmark shows appropriate icon based on page type
- **Active State**: Currently active page is highlighted
- **Auto-Refresh**: Bookmarks list updates when navigating or toggling bookmarks

## Architecture

### Components

#### `BookmarkButton.tsx`
Location: `src/components/layout/BookmarkButton.tsx`

Toggle button component that:
- Displays bookmark icon (filled when bookmarked)
- Handles bookmark add/remove on click
- Hides on excluded pages (home, login, register)
- Forces re-render to update UI state

```tsx
<BookmarkButton />
```

#### `Sidebar.tsx` (Enhanced)
Location: `src/components/layout/Sidebar.tsx`

Enhanced to include:
- Icon mapping for bookmark display
- Bookmarks state management
- Collapsible bookmarks section
- Dynamic bookmark list rendering

#### `Header.tsx` (Enhanced)
Location: `src/components/layout/Header.tsx`

Updated to include:
- BookmarkButton component between Help and Notifications
- Maintains consistent icon button styling

#### `page.tsx` (Home) (Enhanced)
Location: `src/app/page.tsx`

Displays personalized content for authenticated users:
- Bookmarks grid with cards
- Recent pages grid with time indicators
- Quick actions section
- Falls back to public landing page for unauthenticated users

### Services

#### `bookmarks.ts`
Location: `src/lib/bookmarks.ts`

Core service providing:

**Data Types:**
- `BookmarkItem`: Bookmark with id, title, href, icon, addedAt
- `RecentPage`: Recent page with id, title, href, icon, visitedAt

**Functions:**
- `getBookmarks()`: Retrieve all bookmarks
- `addBookmark(bookmark)`: Add a new bookmark
- `removeBookmark(href)`: Remove bookmark by URL
- `isBookmarked(href)`: Check if page is bookmarked
- `toggleBookmark(bookmark)`: Toggle bookmark state
- `getRecentPages()`: Retrieve recent pages (max 10)
- `addRecentPage(page)`: Add page to history
- `clearRecentPages()`: Clear all recent pages
- `getPageMetadata(pathname)`: Get title and icon for a page

**Storage Keys:**
- `sensormine_bookmarks`: localStorage key for bookmarks
- `sensormine_recent_pages`: localStorage key for recent pages

### Hooks

#### `useNavigationTracking.ts`
Location: `src/hooks/useNavigationTracking.ts`

Custom React hook that:
- Monitors pathname changes via Next.js `usePathname`
- Automatically adds visited pages to recent history
- Excludes login pages and homepage
- Integrated in `AppLayout` component

```tsx
// Usage in AppLayout
useNavigationTracking();
```

## Data Storage

### LocalStorage Schema

**Bookmarks:**
```json
{
  "sensormine_bookmarks": [
    {
      "id": "uuid-v4",
      "title": "Dashboard",
      "href": "/dashboard",
      "icon": "LayoutDashboard",
      "addedAt": "2025-12-09T10:30:00.000Z"
    }
  ]
}
```

**Recent Pages:**
```json
{
  "sensormine_recent_pages": [
    {
      "id": "uuid-v4",
      "title": "Devices",
      "href": "/devices",
      "icon": "Cpu",
      "visitedAt": "2025-12-09T12:45:00.000Z"
    }
  ]
}
```

## Page Metadata Mapping

The system maintains a mapping of paths to metadata:

| Path | Title | Icon |
|------|-------|------|
| `/dashboard` | Dashboard | LayoutDashboard |
| `/devices` | Devices | Cpu |
| `/alerts` | Alerts | Bell |
| `/charts` | Charts | LineChart |
| `/settings/*` | Various | Settings |

## User Workflows

### Adding a Bookmark
1. Navigate to any page in the platform
2. Click the bookmark icon in the header
3. Icon fills with yellow to indicate bookmarked state
4. Bookmark appears in sidebar and homepage

### Removing a Bookmark
1. Navigate to a bookmarked page
2. Click the filled bookmark icon in the header
3. Icon becomes outlined to indicate removed
4. Bookmark removed from sidebar and homepage

### Viewing Recent Pages
1. Navigate to homepage (`/`)
2. Scroll to "Recently Visited" section
3. See up to 6 most recent pages with time indicators
4. Click any card to navigate to that page

### Accessing Bookmarks
**Option 1: Homepage**
- Navigate to homepage
- View "Bookmarks" section
- Click any bookmark card

**Option 2: Sidebar**
- Look at left sidebar below main navigation
- Expand/collapse "Bookmarks" section
- Click any bookmark link

## UI Components

### Bookmark Button States
- **Default**: Outlined bookmark icon, gray color
- **Bookmarked**: Filled bookmark icon, yellow color
- **Hover**: Slight opacity change for feedback

### Homepage Cards
- **Bookmark Cards**: Icon, title, path display
- **Recent Cards**: Icon, title, time-ago display
- **Hover Effect**: Shadow increase on hover
- **Responsive**: Grid adapts to screen size

### Sidebar Bookmarks
- **Section Header**: Bookmark icon + "Bookmarks" label
- **Collapsible**: Chevron icon to expand/collapse
- **Individual Items**: Icon + title, truncated if long
- **Active State**: Highlighted when on current page

## Styling

### Colors
- **Bookmark Active**: `fill-yellow-500 text-yellow-500`
- **Sidebar Bookmark**: `text-blue-100` with hover effects
- **Active Page**: `bg-white/10 text-white font-medium`

### Layout
- **Header Button**: `size="icon"` ghost variant
- **Sidebar Section**: Border-top separator, pt-4 spacing
- **Homepage Grid**: Responsive 2-3 columns

## Best Practices

### For Users
1. Bookmark frequently accessed pages for quick access
2. Use homepage as personal dashboard when logged in
3. Check recent pages to resume previous work
4. Bookmarks are browser-specific (not synced across devices)

### For Developers
1. Update `getPageMetadata()` when adding new routes
2. Use consistent icon naming (lucide-react icons)
3. Test bookmark functionality on new pages
4. Consider localStorage limits (typically 5-10MB)

## Future Enhancements

### Potential Features
- **Bookmark Folders**: Organize bookmarks into categories
- **Bookmark Sync**: Sync bookmarks across devices via API
- **Search Bookmarks**: Quick search within bookmarks
- **Export/Import**: Backup and restore bookmarks
- **Bookmark Tags**: Tag bookmarks for better organization
- **Recent Page Search**: Search within navigation history
- **Most Visited**: Show most frequently visited pages
- **Bookmark Sharing**: Share bookmark collections with team

### Backend Integration
- Store bookmarks and history in database per user
- Sync across devices when user logs in
- Analytics on popular pages and user navigation patterns
- Recommended pages based on usage patterns

## Troubleshooting

### Bookmarks Not Appearing
1. Check browser localStorage is enabled
2. Verify no browser extensions are blocking storage
3. Check browser console for errors
4. Clear localStorage and try again

### Navigation Not Tracked
1. Verify `useNavigationTracking` is called in AppLayout
2. Check pathname is not in EXCLUDED_PATHS
3. Ensure user is authenticated
4. Check browser console for errors

### Icons Not Displaying
1. Verify icon name matches lucide-react exports
2. Check iconMap includes the icon
3. Update getPageMetadata with correct icon name
4. Fallback to File icon if not found

## Technical Notes

### Performance Considerations
- LocalStorage operations are synchronous (blocking)
- Bookmark list re-renders on pathname changes
- Consider lazy loading for large bookmark lists
- Use React.memo() if performance issues arise

### Browser Compatibility
- Requires localStorage support (all modern browsers)
- Uses crypto.randomUUID() (polyfill needed for older browsers)
- Next.js usePathname requires App Router (Next.js 13+)

### Testing Considerations
- Mock localStorage in unit tests
- Test bookmark add/remove operations
- Verify navigation tracking on route changes
- Test UI state updates after bookmark actions

## Related Documentation
- [Technology Stack](./technology-stack.md) - Frontend framework details
- [Architecture](./architecture.md) - Frontend architecture overview
- [Development Guide](./development.md) - Setup and development workflow
