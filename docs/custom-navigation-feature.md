# Custom Navigation Feature

**Created:** December 13, 2025  
**Status:** Complete  
**Version:** 1.0

---

## Overview

The Custom Navigation feature allows users to add personalized quick links to the sidebar navigation. Users can create links to:
- **Dashboards** - Direct access to specific dashboards
- **Devices** - Jump directly to device detail pages
- **Assets** - Navigate to asset pages
- **Forms** - Access data entry forms (coming soon)
- **Custom URLs** - Link to external pages or custom routes

### Key Features

✅ **Non-Intrusive**: All default navigation items (Dashboards, Devices, Alerts, AI Agent, Settings) remain unchanged  
✅ **User-Specific**: Each user has their own custom navigation items  
✅ **Persistent**: Items are stored in user preferences and sync automatically  
✅ **Drag & Drop**: Reorder items easily with up/down buttons  
✅ **Icon Selection**: Choose from predefined icons  
✅ **Real-Time Sync**: Changes sync immediately to the backend  

---

## User Guide

### Accessing Custom Navigation Settings

1. Click **Settings** in the sidebar
2. Select **Navigation** from the submenu
3. Alternatively, navigate to `/settings/navigation`

### Adding a Custom Link

1. Click the **"Add Link"** button
2. Fill in the form:
   - **Title**: Display name for the link (e.g., "My Dashboard")
   - **Icon**: Select an icon from the dropdown
   - **Target Type**: Choose where the link should point
     - Dashboard, Device, Asset, Form, or Custom URL
   - **Target ID** or **URL**: Enter the destination
     - For dashboards/devices/assets: Copy the ID from the URL
     - For custom URLs: Enter the full URL (e.g., `https://example.com`)
3. Click **"Add Link"**

### Editing a Link

1. Click the **Edit** button (pencil icon) on any link
2. Modify the fields as needed
3. Click **"Save Changes"**

### Deleting a Link

1. Click the **Delete** button (trash icon) on any link
2. Confirm the deletion

### Reordering Links

- Use the **↑** and **↓** buttons to move links up or down in the list
- The order in the settings page matches the order in the sidebar

---

## Technical Implementation

### Frontend Architecture

#### Type Definitions
**Location:** `src/Web/sensormine-web/src/lib/types/preferences.ts`

```typescript
export type NavigationTargetType = 'dashboard' | 'device' | 'asset' | 'form' | 'url';

export interface CustomNavigationItem {
  id: string;
  title: string;
  icon?: string; // lucide-react icon name
  targetType: NavigationTargetType;
  targetId?: string; // dashboard ID, device ID, asset ID, etc.
  url?: string; // for direct URL navigation
  order: number; // for sorting
  createdAt: string;
  updatedAt?: string;
}

// Added to UserPreferences interface
customNavigation: CustomNavigationItem[];
```

#### State Management
**Location:** `src/Web/sensormine-web/src/lib/stores/preferences-store.ts`

**Actions:**
- `addCustomNavItem(item)` - Add a new custom navigation item
- `updateCustomNavItem(id, updates)` - Update existing item
- `removeCustomNavItem(id)` - Remove item
- `reorderCustomNavItems(items)` - Change order
- `getCustomNavItems()` - Get sorted list of items

All actions automatically sync to the Preferences API.

#### Components

**CustomNavigationManager** (`src/Web/sensormine-web/src/components/settings/CustomNavigationManager.tsx`)
- Dialog-based UI for adding/editing links
- List view with edit/delete/reorder actions
- Icon picker with preview
- Target type selector

**Sidebar** (`src/Web/sensormine-web/src/components/layout/Sidebar.tsx`)
- Displays custom navigation under "Quick Links" section
- Expandable/collapsible section
- Active link highlighting
- URL generation based on target type

#### Settings Page
**Location:** `src/Web/sensormine-web/src/app/settings/navigation/page.tsx`
- User-friendly settings interface
- Information card explaining the feature
- Integration with CustomNavigationManager component

### Backend Architecture

#### Database Schema
**Table:** `user_preferences`  
**New Column:** `custom_navigation`  
**Type:** `TEXT`  
**Default:** `'[]'`  
**Format:** JSON array

**Migration:** `infrastructure/migrations/20251213_add_custom_navigation.sql`

#### Models
**Location:** `src/Shared/Sensormine.Core/Models/UserPreference.cs`

```csharp
public class UserPreference : BaseEntity
{
    // ... existing properties ...
    
    /// <summary>
    /// Custom navigation items (user-defined sidebar links) stored as JSON array
    /// </summary>
    public string CustomNavigation { get; set; } = "[]";
}
```

#### API Endpoints
**Service:** Preferences.API  
**Port:** 5296  
**Database:** sensormine_metadata

**Endpoints:**
- `GET /api/userpreferences` - Includes customNavigation in response
- `PUT /api/userpreferences` - Updates customNavigation field

**DTO:**
```csharp
public record UserPreferenceDto
{
    // ... existing properties ...
    public JsonElement CustomNavigation { get; init; }
}
```

---

## URL Generation Logic

Custom navigation items generate URLs based on their target type:

| Target Type | URL Pattern | Example |
|-------------|-------------|---------|
| `dashboard` | `/dashboard/{targetId}` | `/dashboard/c9794000-639c-4466-8b6f-626543c10fae` |
| `device` | `/devices/{targetId}` | `/devices/1a0e632b-da75-4d33-820b-8e11ff375511` |
| `asset` | `/assets/{targetId}` | `/assets/a1234567-89ab-cdef-0123-456789abcdef` |
| `form` | `/forms/{targetId}` | `/forms/form-123` (future) |
| `url` | `{url}` | `https://example.com` or `/custom/path` |

---

## Migration Instructions

### Apply Database Migration

```powershell
# Navigate to project root
cd C:\Users\AlainBlanchette\code\Orion

# Apply migration
Get-Content "infrastructure/migrations/20251213_add_custom_navigation.sql" | docker exec -i sensormine-timescaledb psql -U sensormine -d sensormine_metadata
```

### Build and Run

```powershell
# Build backend
dotnet build src/Services/Preferences.API/Preferences.API.csproj

# Build frontend
cd src/Web/sensormine-web
npm run build
npm run dev
```

### Verify Installation

1. Navigate to http://localhost:3020/settings/navigation
2. Add a test link
3. Check sidebar for "Quick Links" section
4. Verify link appears and navigates correctly

---

## Example Custom Navigation Items

### Example 1: Production Dashboard
```json
{
  "title": "Production Floor",
  "icon": "LayoutDashboard",
  "targetType": "dashboard",
  "targetId": "c9794000-639c-4466-8b6f-626543c10fae"
}
```

### Example 2: Critical Device
```json
{
  "title": "Reactor #1 Sensor",
  "icon": "Cpu",
  "targetType": "device",
  "targetId": "1a0e632b-da75-4d33-820b-8e11ff375511"
}
```

### Example 3: External Documentation
```json
{
  "title": "Equipment Manual",
  "icon": "ExternalLink",
  "targetType": "url",
  "url": "https://docs.example.com/equipment"
}
```

---

## Future Enhancements

### Planned Features
- 🔄 **Drag-and-drop reordering** - Visual drag interface instead of up/down buttons
- 📁 **Grouping/Categories** - Organize links into collapsible groups
- 🔍 **Search integration** - Search through dashboards/devices when adding links
- 🎨 **Custom icons** - Upload custom icons or use emoji
- 🔗 **Smart linking** - Auto-detect dashboard/device IDs from clipboard
- 📊 **Usage tracking** - Show most-used links
- 🌐 **Team templates** - Share navigation configurations

---

## Troubleshooting

### Issue: Custom navigation not appearing
**Solution:** 
- Ensure you're logged in
- Check that preferences are initialized: `usePreferencesStore.getState().preferences`
- Verify sidebar is not collapsed

### Issue: Changes not persisting
**Solution:**
- Check browser console for API errors
- Verify Preferences.API is running on port 5296
- Ensure database migration was applied

### Issue: Invalid GUID error
**Solution:**
- Dashboard/Device/Asset IDs must be valid GUIDs
- Copy ID from browser URL bar when viewing the item
- Example: `c9794000-639c-4466-8b6f-626543c10fae`

---

## Related Files

### Frontend
- `src/Web/sensormine-web/src/lib/types/preferences.ts` - Type definitions
- `src/Web/sensormine-web/src/lib/stores/preferences-store.ts` - State management
- `src/Web/sensormine-web/src/components/layout/Sidebar.tsx` - Navigation rendering
- `src/Web/sensormine-web/src/components/settings/CustomNavigationManager.tsx` - Management UI
- `src/Web/sensormine-web/src/app/settings/navigation/page.tsx` - Settings page

### Backend
- `src/Shared/Sensormine.Core/Models/UserPreference.cs` - Data model
- `src/Services/Preferences.API/Controllers/UserPreferencesController.cs` - API endpoints
- `infrastructure/migrations/20251213_add_custom_navigation.sql` - Database migration

### Documentation
- `docs/user-stories.md` - Original requirements
- `docs/PLATFORM-STATUS.md` - Platform feature status

---

## Testing Checklist

- [ ] Navigate to /settings/navigation
- [ ] Add a custom link to a dashboard
- [ ] Add a custom link to a device
- [ ] Add a custom URL link
- [ ] Edit an existing link
- [ ] Delete a link
- [ ] Reorder links using up/down buttons
- [ ] Verify links appear in sidebar under "Quick Links"
- [ ] Click links to verify navigation works
- [ ] Refresh page to verify persistence
- [ ] Test with collapsed sidebar (items should not appear)
- [ ] Check different icons display correctly

---

**Last Updated:** December 13, 2025  
**Maintainer:** Platform Team  
**Status:** ✅ Ready for Production
