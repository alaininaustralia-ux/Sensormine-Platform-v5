# 3D CAD Viewer Widget - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Import the Widget

```tsx
import { CAD3DViewerWidget } from '@/components/dashboard-v2/widgets';
```

### 2. Use in Your Dashboard

```tsx
<CAD3DViewerWidget
  id="my-cad-viewer"
  title="Equipment View"
  description="3D model with sensors"
  config={{
    modelType: 'stl',
    gridEnabled: true,
    backgroundColor: '#1a1a1a',
  }}
  isEditMode={false}
/>
```

### 3. Add to Widget Palette

```tsx
// In widget-palette.tsx
{
  id: 'cad-3d-viewer',
  type: 'cad-3d-viewer',
  name: '3D CAD Viewer',
  description: 'Interactive 3D model with sensor data',
  icon: Cube, // from lucide-react
  category: 'visualization',
}
```

### 4. Add to Widget Factory

```tsx
// In widget-factory.tsx
case 'cad-3d-viewer':
  return (
    <CAD3DViewerWidget
      {...baseProps}
      config={widget.config}
    />
  );
```

### 5. Add to Config Dialog

```tsx
// In widget-config-dialog.tsx
import { CAD3DViewerWidgetConfig } from './widget-configs';

case 'cad-3d-viewer':
  return (
    <CAD3DViewerWidgetConfig
      config={config}
      onChange={onChange}
    />
  );
```

## 📝 Common Tasks

### Upload a Model

```tsx
// User flow:
// 1. Switch to Design mode
// 2. Click "Upload Model" button
// 3. Select .stl or .obj file
// 4. Model appears in 3D view
```

### Map a Sensor

```tsx
// User flow:
// 1. Switch to Configure mode
// 2. Click on 3D element
// 3. Enter element name
// 4. Select device from dropdown
// 5. Select field from dropdown
// 6. Click "Save Mapping"
```

### View Sensor Data

```tsx
// User flow:
// 1. In View mode (default)
// 2. Click on green element
// 3. Modal shows sensor reading
// 4. Close modal
```

## 🎨 Customize Colors

```tsx
config={{
  defaultColor: '#6e7681',    // Gray - no sensor
  activeColor: '#2ea043',     // Green - has sensor
  highlightColor: '#f85149',  // Red - selected
  backgroundColor: '#0d1117'  // Dark background
}}
```

## 📦 File Format Support

### STL Files
- Binary or ASCII
- Most CAD programs export this
- Recommended for mechanical parts

### OBJ Files
- Text-based
- Supports materials
- Good for textured models

## 🔧 API Integration

### Get Devices

```tsx
// TODO: Replace mock data
const devices = await fetch('/api/devices?tenantId=' + tenantId);
```

### Get Sensor Data

```tsx
// TODO: Replace mock data
const data = await fetch(`/api/query/devices/${deviceId}/latest?field=${fieldName}`);
```

## 💡 Pro Tips

1. **Keep models simple** - Under 100k triangles
2. **Name elements clearly** - "Motor Housing" not "mesh-1"
3. **Group related sensors** - One model per logical unit
4. **Test in View mode** - Ensure data displays correctly
5. **Use consistent colors** - Match your brand/theme

## 🐛 Common Issues

### Model Won't Load
- Check file format (.stl or .obj)
- Verify file size (<50MB)
- Check browser console for errors

### Elements Not Clickable
- Ensure you're in correct mode
- View mode: See data
- Configure mode: Set up mappings

### Sensor Data Not Showing
- Verify mapping is saved
- Check device is online
- Confirm field name matches

## 📚 Learn More

- See `cad-3d-viewer-widget.README.md` for full documentation
- Check `cad-3d-viewer-demo.tsx` for examples
- Review `cad-3d-viewer-widget-implementation.md` for details

## 🎯 Need Help?

**Documentation:**
- Full README: `/src/components/dashboard-v2/widgets/cad-3d-viewer-widget.README.md`
- Demo: `/src/components/dashboard-v2/widgets/cad-3d-viewer-demo.tsx`
- Implementation: `/docs/cad-3d-viewer-widget-implementation.md`

**Code Examples:**
- Basic usage in demo component
- Industrial motor example
- HVAC system example

**Key Files:**
- Widget: `src/components/dashboard-v2/widgets/cad-3d-viewer-widget.tsx`
- Config: `src/components/dashboard-v2/builder/widget-configs/cad-3d-viewer-widget-config.tsx`
- Types: `src/lib/types/dashboard-v2.ts`

Happy coding! 🚀
