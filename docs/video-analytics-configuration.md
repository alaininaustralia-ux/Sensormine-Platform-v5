# Video Analytics Configuration

## Overview

The Video Analytics Configuration feature allows users to configure camera streams or video files from Azure Blob Storage, apply AI processing models, and integrate them as selectable devices in dashboards.

## Features

### Video Source Types
- **RTSP Stream**: Connect to live camera feeds via RTSP protocol
- **Azure Blob Storage**: Process video files stored in Azure containers
- **HLS Stream**: HTTP Live Streaming support
- **WebRTC**: Real-time communication streams

### Processing Models
1. **Object Detection**: Detect and classify objects (people, vehicles, equipment)
2. **Person Detection**: Specialized model for detecting people with high accuracy
3. **Vehicle Detection**: Detect and classify vehicles (cars, trucks, forklifts)
4. **Behavior Analysis**: Analyze human behavior patterns (running, falling, loitering)
5. **Near-Miss Detection**: Detect near-miss safety events in industrial environments
6. **Custom Model**: Upload and deploy your own ONNX model

## Architecture

### Frontend (`src/Web/sensormine-web/`)
```
src/
├── app/settings/video-analytics/
│   ├── page.tsx                 # List all configurations
│   ├── new/page.tsx             # Create new configuration
│   └── [id]/page.tsx            # Edit existing configuration
├── components/video-analytics/
│   └── VideoAnalyticsForm.tsx   # Configuration form with dynamic fields
└── lib/
    ├── types/video-analytics.ts # TypeScript types and interfaces
    └── api/videoAnalytics.ts    # API client functions
```

### Backend (`src/Services/VideoMetadata.API/`)
```
VideoMetadata.API/
├── Controllers/
│   └── VideoAnalyticsController.cs   # REST API endpoints
├── Models/
│   └── VideoAnalyticsConfiguration.cs # Entity model
├── DTOs/
│   └── VideoAnalyticsDTOs.cs         # Request/response DTOs
├── Data/
│   └── VideoMetadataDbContext.cs     # EF Core DbContext
└── Program.cs                         # Service configuration
```

### Database
**Table**: `video_analytics_configurations`  
**Database**: `sensormine_metadata`  
**Port**: 5452 (TimescaleDB container)

## API Endpoints

### Base URL: `http://localhost:5298/api/video-analytics`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all configurations (with pagination) |
| GET | `/{id}` | Get configuration by ID |
| POST | `/` | Create new configuration |
| PUT | `/{id}` | Update existing configuration |
| DELETE | `/{id}` | Delete configuration |
| POST | `/{id}/enable` | Enable configuration |
| POST | `/{id}/disable` | Disable configuration |
| GET | `/{id}/health` | Get stream health status |
| POST | `/test-connection` | Test connection to video source |

## Usage

### 1. Access the Configuration Page
Navigate to **Settings > Video Analytics** in the sidebar.

### 2. Create a New Configuration
1. Click "Add Configuration"
2. Enter a name and optional description
3. Select video source type (RTSP, Azure Blob, etc.)
4. Configure source-specific settings:
   - **RTSP**: URL, username, password
   - **Azure Blob**: Container name, blob path, SAS token
5. Select processing model (Object Detection, Person Detection, etc.)
6. Configure model-specific parameters:
   - Confidence threshold
   - Max detections per frame
   - Detection classes
7. Click "Test Connection" to verify setup
8. Click "Create" to save

### 3. Enable/Disable Configurations
Use the Play/Pause button in the list view to enable or disable configurations.

### 4. Dashboard Integration
Once a configuration is enabled and a `device_id` is generated, it will appear as a selectable device in dashboard widgets.

## Example Configuration

### RTSP Camera with Object Detection
```json
{
  "name": "Main Entrance Camera",
  "description": "Monitor main entrance for people and vehicles",
  "sourceType": "rtsp",
  "sourceConfig": {
    "url": "rtsp://192.168.1.100:554/stream1",
    "username": "admin",
    "password": "***",
    "resolution": "1920x1080",
    "fps": 30
  },
  "processingModel": "object-detection",
  "modelConfiguration": {
    "confidenceThreshold": 0.7,
    "classes": ["person", "vehicle"],
    "maxDetections": 50,
    "enableTracking": true
  },
  "enabled": true
}
```

### Azure Blob with Custom Model
```json
{
  "name": "Archived Footage Analysis",
  "description": "Process archived safety footage",
  "sourceType": "azure-blob",
  "sourceConfig": {
    "containerName": "safety-videos",
    "blobPath": "2025/12/incident-001.mp4",
    "sasToken": "sp=r&st=2025-12-12..."
  },
  "processingModel": "custom",
  "modelConfiguration": {
    "modelUrl": "https://models.example.com/safety-v2.onnx",
    "inputShape": [1, 3, 640, 640],
    "outputShape": [1, 25200, 85],
    "customParameters": {
      "nmsThreshold": 0.45,
      "iouThreshold": 0.5
    }
  },
  "enabled": true
}
```

## Database Schema

```sql
CREATE TABLE video_analytics_configurations (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    source_type VARCHAR(50) NOT NULL,
    source_config JSONB NOT NULL,
    processing_model VARCHAR(100) NOT NULL,
    model_configuration JSONB NOT NULL,
    enabled BOOLEAN DEFAULT true,
    device_id UUID,
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    created_by VARCHAR(255)
);
```

## Setup Instructions

### 1. Apply Database Migration
```bash
docker exec -i sensormine-timescaledb psql -U sensormine -d sensormine_metadata < infrastructure/migrations/20251212_add_video_analytics_configurations.sql
```

### 2. Build and Run Backend
```bash
cd src/Services/VideoMetadata.API
dotnet restore
dotnet build
dotnet run
```

### 3. Run Frontend
```bash
cd src/Web/sensormine-web
npm install
npm run dev
```

### 4. Access the UI
- Frontend: http://localhost:3020/settings/video-analytics
- API Swagger: http://localhost:5298/swagger

## Future Enhancements

1. **Real-time Stream Processing**: Integrate with StreamProcessing.Service for live inference
2. **Video Playback**: Display video feeds with overlays in dashboard widgets
3. **Alert Integration**: Trigger alerts based on detection events
4. **Model Marketplace**: Browse and install pre-trained models
5. **Performance Metrics**: Track inference latency, FPS, and GPU utilization
6. **Batch Processing**: Process multiple videos in parallel
7. **Export Results**: Export detection data as CSV/JSON

## Related Documentation

- [APPLICATION.md](../../docs/APPLICATION.md) - Overall application architecture
- [DATABASE.md](../../docs/DATABASE.md) - Database schema details
- [user-stories.md](../../docs/user-stories.md) - Epic 3: Video Processing & AI/ML Analytics

## API Examples

### Create Configuration
```bash
curl -X POST http://localhost:5298/api/video-analytics \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "name": "Warehouse Camera 1",
    "sourceType": "rtsp",
    "sourceConfig": {
      "url": "rtsp://camera1.local:554/stream"
    },
    "processingModel": "object-detection",
    "modelConfiguration": {
      "confidenceThreshold": 0.6,
      "classes": ["person", "forklift"],
      "maxDetections": 30,
      "enableTracking": true
    }
  }'
```

### List All Configurations
```bash
curl http://localhost:5298/api/video-analytics?page=1&pageSize=20 \
  -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000001"
```

### Enable Configuration
```bash
curl -X POST http://localhost:5298/api/video-analytics/{id}/enable \
  -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000001"
```

---

**Created**: December 12, 2025  
**Version**: 1.0  
**Status**: Ready for Testing
