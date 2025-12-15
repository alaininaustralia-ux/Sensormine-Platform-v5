# 3D CAD Viewer Widget

A powerful dashboard widget for visualizing 3D CAD models with real-time sensor data integration.

## Features

### 🎨 Three Modes of Operation

1. **View Mode** (Default)
   - Display 3D model with live sensor data
   - Click on elements to see sensor readings
   - Color-coded elements based on data status
   - Read-only, optimized for monitoring

2. **Design Mode** (Edit Mode)
   - Visual inspection of sensor mappings
   - Hover over elements to see mapping status
   - Review which elements have sensors attached
   - Identify unmapped elements

3. **Configure Mode** (Edit Mode)
   - Map sensors to 3D elements
   - Associate device fields with model components
   - Set element names and descriptions
   - Save and manage configurations

### 🎯 Key Capabilities

- **3D Model Support**: Load STL and OBJ files
- **Sensor Integration**: Associate any sensor/field to model elements
- **Real-time Data**: Display live sensor readings on 3D elements
- **Color Coding**: Visual indicators for data status
  - Gray: No sensor attached
  - Green: Sensor attached with data
  - Orange: Selected element
- **Interactive**: Click elements to view detailed sensor data
- **Customizable**: Full control over colors, camera, and appearance

## Usage

### Basic Setup

```tsx
import { CAD3DViewerWidget } from '@/components/dashboard-v2/widgets';

<CAD3DViewerWidget
  id="cad-viewer-1"
  title="Equipment 3D View"
  description="Motor assembly with temperature sensors"
  config={{
    modelUrl: '/models/motor-assembly.stl',
    modelType: 'stl',
    backgroundColor: '#1a1a1a',
    gridEnabled: true,
    sensorMappings: [
      {
        elementId: 'mesh-1',
        elementName: 'Motor Housing',
        deviceId: 'temp-sensor-1',
        deviceName: 'Temperature Sensor 1',
        fieldName: 'temperature',
      }
    ]
  }}
  isEditMode={false}
/>
```

### Configuration Options

```typescript
interface CAD3DViewerConfig {
  // Model Settings
  modelUrl?: string;              // URL to 3D model file
  modelType?: 'stl' | 'obj';      // Model file format
  
  // Visual Settings
  backgroundColor?: string;        // Canvas background color
  gridEnabled?: boolean;          // Show/hide ground grid
  cameraPosition?: [number, number, number]; // Initial camera [x, y, z]
  
  // Color Theme
  defaultColor?: string;          // Color for unmapped elements
  highlightColor?: string;        // Color when element selected
  activeColor?: string;           // Color for mapped elements
  
  // Sensor Mappings
  sensorMappings?: SensorElementMapping[];
}
```

### Sensor Mapping Structure

```typescript
interface SensorElementMapping {
  elementId: string;        // Unique ID of 3D element
  elementName: string;      // Display name (e.g., "Motor Housing")
  deviceId: string;         // Associated device UUID
  deviceName: string;       // Device display name
  fieldName: string;        // Field to display (e.g., "temperature")
  
  // Optional color ranges for value-based coloring
  colorRanges?: {
    min: number;
    max: number;
    color: string;
  }[];
}
```

## Workflow

### For Dashboard Designers

1. **Add Widget to Dashboard**
   - Drag "CAD 3D Viewer" from widget palette
   - Position and resize as needed

2. **Upload 3D Model**
   - Switch to Design mode
   - Click "Upload Model" button
   - Select STL or OBJ file (max 50MB)

3. **Configure Sensor Mappings**
   - Switch to Configure mode
   - Click on a 3D element
   - Select device from dropdown
   - Choose field to display
   - Name the element
   - Click "Save Mapping"
   - Repeat for all elements

4. **Customize Appearance**
   - Open widget configuration panel
   - Adjust colors, camera position
   - Enable/disable grid
   - Set default view preferences

5. **Save Dashboard**
   - Switch back to View mode
   - Save dashboard
   - Publish when ready

### For End Users (Viewers)

1. **View Live Data**
   - Open dashboard in view mode
   - 3D model displays with color-coded elements
   - Green = sensor attached and active
   - Gray = no sensor data

2. **Inspect Sensor Data**
   - Click on any green element
   - Modal popup shows:
     - Current reading
     - Device name
     - Field name
     - Timestamp
     - Status

3. **Navigate 3D View**
   - Left-click + drag: Rotate camera
   - Right-click + drag: Pan camera
   - Scroll: Zoom in/out
   - Double-click element: View data

## Supported File Formats

### STL (Stereolithography)
- Binary or ASCII format
- Most common CAD export format
- Recommended for mechanical parts
- File extension: `.stl`

### OBJ (Wavefront Object)
- Text-based format
- Supports materials and textures
- Good for textured models
- File extension: `.obj`

## Performance Tips

1. **Optimize Model Files**
   - Keep polygon count reasonable (<100k triangles)
   - Simplify complex geometry
   - Remove hidden/internal faces

2. **Use Appropriate Level of Detail**
   - Dashboard context doesn't need CAD-level detail
   - Simplified models load faster
   - Focus on recognizable shapes

3. **Limit Number of Sensors**
   - 20-30 sensor mappings per model is ideal
   - Too many can clutter the interface
   - Group related sensors if possible

## Examples

### Industrial Motor Assembly

```tsx
<CAD3DViewerWidget
  title="Pump Motor Assembly"
  config={{
    modelUrl: '/models/pump-motor.stl',
    modelType: 'stl',
    backgroundColor: '#0d1117',
    defaultColor: '#6e7681',
    activeColor: '#2ea043',
    highlightColor: '#f85149',
    sensorMappings: [
      {
        elementId: 'motor-housing',
        elementName: 'Motor Housing',
        deviceId: 'temp-001',
        deviceName: 'Thermal Sensor A',
        fieldName: 'temperature'
      },
      {
        elementId: 'bearing-front',
        elementName: 'Front Bearing',
        deviceId: 'vib-001',
        deviceName: 'Vibration Sensor 1',
        fieldName: 'vibration_rms'
      }
    ]
  }}
/>
```

### HVAC System

```tsx
<CAD3DViewerWidget
  title="HVAC Air Handler"
  config={{
    modelUrl: '/models/air-handler.obj',
    modelType: 'obj',
    cameraPosition: [10, 5, 10],
    sensorMappings: [
      {
        elementId: 'supply-duct',
        elementName: 'Supply Air Duct',
        deviceId: 'temp-supply',
        deviceName: 'Supply Air Temp',
        fieldName: 'temperature'
      },
      {
        elementId: 'return-duct',
        elementName: 'Return Air Duct',
        deviceId: 'temp-return',
        deviceName: 'Return Air Temp',
        fieldName: 'temperature'
      }
    ]
  }}
/>
```

## Integration with Dashboard V2

This widget is fully integrated with Dashboard V2:

- ✅ Mode-aware (View/Design/Configure)
- ✅ Widget configuration panel support
- ✅ Asset hierarchy integration
- ✅ Device/field picker integration
- ✅ Real-time data updates
- ✅ Responsive layout
- ✅ Export/screenshot support

## Troubleshooting

### Model Won't Load

- Check file format (STL/OBJ only)
- Verify file size (<50MB)
- Ensure file is accessible via URL
- Check browser console for errors

### Elements Not Clickable

- Verify model has individual meshes
- Check that meshes have unique IDs
- Ensure you're in correct mode (View for data, Configure for setup)

### Sensor Data Not Showing

- Confirm sensor mapping is saved
- Check device is online and sending data
- Verify field name matches device schema
- Check browser console for API errors

## Future Enhancements

- [ ] Dynamic color ranges based on sensor values
- [ ] Animation support for moving parts
- [ ] Multi-model support (assemblies)
- [ ] Model annotations and labels
- [ ] Exploded view mode
- [ ] Cross-section cutting plane
- [ ] Measurement tools
- [ ] Model comparison mode

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+ (limited WebGL features)

## License

Part of the Sensormine Platform V5 - Internal Use Only
