# File Storage Implementation

**Last Updated:** December 12, 2025  
**Status:** Implemented  
**Storage Type:** Local Disk (Abstracted for Future Cloud Migration)

---

## 🎯 Overview

Implemented a flexible file storage system for CAD models (STL, OBJ) and other large files with an abstraction layer that allows switching to cloud storage (S3, Azure Blob, etc.) in the future.

---

## 🏗️ Architecture

### Storage Abstraction Layer

**Interface:** `IFileStorageService` (in `Sensormine.Core`)

Provides storage-agnostic methods:
- `UploadFileAsync()` - Upload files with metadata
- `DownloadFileAsync()` - Download files as streams
- `DeleteFileAsync()` - Remove files
- `GetFileInfoAsync()` - Get metadata without downloading
- `FileExistsAsync()` - Check file existence
- `GetFileUrlAsync()` - Get public/signed URLs

### Local Disk Implementation

**Class:** `LocalFileStorageService` (in `Sensormine.Storage`)

**Storage Structure:**
```
./data/files/
├── {tenantId}/
│   ├── cad-models/
│   │   ├── {fileId}.stl
│   │   ├── {fileId}.meta.json
│   │   ├── {fileId2}.obj
│   │   └── {fileId2}.meta.json
│   ├── images/
│   └── documents/
```

**Features:**
- Multi-tenant isolation (separate folders per tenant)
- Category-based organization
- Metadata stored as JSON sidecar files
- Configurable file size limits
- Extension whitelist validation
- Public URL generation

---

## 📡 API Endpoints

**Service:** Dashboard.API (Port 5299)  
**Base Path:** `/api/files`

### Upload File
```http
POST /api/files/upload?category=cad-models
Headers:
  X-Tenant-Id: {tenantId}
  Content-Type: multipart/form-data

Body: FormData with 'file' field

Response: {
  "fileId": "a1b2c3d4e5f6g7h8",
  "fileName": "model.stl",
  "fileSize": 15728640,
  "contentType": "model/stl",
  "category": "cad-models",
  "uploadedAt": "2025-12-12T10:30:00Z",
  "url": "http://localhost:5299/api/files/a1b2c3d4e5f6g7h8"
}
```

### Download File
```http
GET /api/files/{fileId}
Headers:
  X-Tenant-Id: {tenantId}

Response: Binary stream with Content-Type and filename
```

### Get File Info
```http
GET /api/files/{fileId}/info
Headers:
  X-Tenant-Id: {tenantId}

Response: {
  "fileId": "a1b2c3d4e5f6g7h8",
  "originalFileName": "model.stl",
  "contentType": "model/stl",
  "fileSizeBytes": 15728640,
  "tenantId": "...",
  "category": "cad-models",
  "storagePath": "./data/files/.../model.stl",
  "uploadedAt": "2025-12-12T10:30:00Z",
  "publicUrl": "http://localhost:5200/api/files/a1b2c3d4e5f6g7h8"
}
```

### Delete File
```http
DELETE /api/files/{fileId}
Headers:
  X-Tenant-Id: {tenantId}

Response: 204 No Content
```

### Get Public URL
```http
GET /api/files/{fileId}/url?expiresInMinutes=60
Headers:
  X-Tenant-Id: {tenantId}

Response: {
  "fileId": "a1b2c3d4e5f6g7h8",
  "url": "http://localhost:5299/api/files/a1b2c3d4e5f6g7h8",
  "expiresAt": "2025-12-12T11:30:00Z"
}
```

---

## ⚙️ Configuration

**File:** `appsettings.json` (Dashboard.API)

```json
{
  "FileStorage": {
    "Local": {
      "BasePath": "./data/files",
      "MaxFileSizeBytes": 104857600,
      "AllowedExtensions": [
        ".stl", ".obj", ".step", ".stp", 
        ".iges", ".igs", ".gltf", ".glb", 
        ".fbx", ".dae", ".3ds"
      ],
      "EnablePublicUrls": true,
      "PublicUrlBase": "http://localhost:5200"
    }
  }
}
```

**Options:**
- `BasePath` - Root directory for file storage (default: `./data/files`)
- `MaxFileSizeBytes` - Maximum file size (default: 100 MB)
- `AllowedExtensions` - Whitelist of allowed file extensions
- `EnablePublicUrls` - Enable public URL generation
- `PublicUrlBase` - Base URL for constructing file URLs

---

## 🔐 Security Features

### Multi-Tenancy
- Files stored in tenant-specific directories
- Tenant ID validation on all operations
- No cross-tenant file access

### File Validation
- Extension whitelist enforcement
- File size limit checks
- MIME type validation

### Access Control
- Requires `X-Tenant-Id` header on all requests
- Future: Add JWT authentication
- Future: Add role-based permissions

---

## 🚀 Frontend Integration

**Component:** `cad-3d-viewer-widget-config.tsx`

**Upload Implementation:**
```typescript
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    'http://localhost:5299/api/files/upload?category=cad-models',
    {
      method: 'POST',
      headers: { 'X-Tenant-Id': tenantId },
      body: formData,
    }
  );

  const result = await response.json();
  
  // Update widget config with file URL
  onChange({
    ...config,
    modelUrl: result.url,
    modelType: 'stl' // or 'obj'
  });
};
```

---

## 🔄 Future Cloud Migration Path

### Azure Blob Storage Implementation

Create `AzureBlobStorageService : IFileStorageService`:

```csharp
public class AzureBlobStorageService : IFileStorageService
{
    private readonly BlobServiceClient _blobClient;
    
    public async Task<StoredFileInfo> UploadFileAsync(...)
    {
        var containerClient = _blobClient.GetBlobContainerClient(category);
        var blobClient = containerClient.GetBlobClient(fileId);
        await blobClient.UploadAsync(stream, ...);
        // Return StoredFileInfo with Azure URL
    }
    
    // ... implement other methods
}
```

**Configuration:**
```json
{
  "FileStorage": {
    "Provider": "AzureBlob", // or "Local", "S3"
    "AzureBlob": {
      "ConnectionString": "...",
      "ContainerName": "cad-models",
      "MaxFileSizeBytes": 104857600
    }
  }
}
```

**Registration:**
```csharp
if (config.Provider == "AzureBlob")
{
    services.AddSingleton<IFileStorageService, AzureBlobStorageService>();
}
else
{
    services.AddSingleton<IFileStorageService, LocalFileStorageService>();
}
```

### AWS S3 Implementation

Similar pattern:
- Create `S3FileStorageService : IFileStorageService`
- Configure S3 client
- Implement upload/download/delete using AWS SDK
- Generate pre-signed URLs for downloads

---

## 📝 Usage Examples

### Upload from Frontend
```typescript
// CAD model upload in dashboard widget
const file = event.target.files[0];
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/files/upload?category=cad-models', {
  method: 'POST',
  headers: { 'X-Tenant-Id': tenantId },
  body: formData
});

const { fileId, url } = await response.json();
```

### Backend Download
```csharp
// In a service/controller
var (stream, info) = await _fileStorage.DownloadFileAsync(fileId, tenantId);

// Stream to response
return File(stream, info.ContentType, info.OriginalFileName);
```

### Backend Upload
```csharp
// In a service
using var stream = file.OpenReadStream();
var fileInfo = await _fileStorage.UploadFileAsync(
    stream,
    file.FileName,
    file.ContentType,
    tenantId,
    "cad-models"
);
```

---

## 🧪 Testing

### Manual Testing
```powershell
# Upload a file
$file = Get-Item "model.stl"
$formData = @{
    file = $file
}

Invoke-RestMethod -Uri \"http://localhost:5299/api/files/upload?category=cad-models\" `
    -Method POST `
    -Headers @{"X-Tenant-Id"="00000000-0000-0000-0000-000000000001"} `
    -Form $formData

# Download a file
Invoke-RestMethod -Uri \"http://localhost:5299/api/files/{fileId}\" `
    -Method GET `
    -Headers @{"X-Tenant-Id"="00000000-0000-0000-0000-000000000001"} `
    -OutFile "downloaded.stl"
```

---

## 📊 Performance Considerations

### File Size Limits
- Default: 100 MB per file
- Configurable via `MaxFileSizeBytes`
- Consider chunked uploads for very large files

### Disk Space Management
- Monitor `./data/files/` directory size
- Implement cleanup policies for old files
- Consider file compression for archives

### Streaming
- Files are streamed (not loaded into memory)
- Efficient for large CAD models
- Uses 4 KB buffer size

---

## 🔍 Troubleshooting

### File Not Found
**Problem:** `FileNotFoundException` when downloading  
**Solution:** Check metadata file exists and storage path is correct

### Permission Denied
**Problem:** Cannot write to `./data/files/`  
**Solution:** Ensure application has write permissions to storage directory

### File Size Exceeded
**Problem:** Upload rejected with "exceeds maximum"  
**Solution:** Adjust `MaxFileSizeBytes` in appsettings.json or compress file

### Extension Not Allowed
**Problem:** Upload rejected with "not allowed"  
**Solution:** Add extension to `AllowedExtensions` array in config

---

## 📚 Related Documentation

- **[cad-3d-viewer-widget-implementation.md](./cad-3d-viewer-widget-implementation.md)** - Widget that uses this storage
- **[APPLICATION.md](./APPLICATION.md)** - Overall application architecture
- **[INFRASTRUCTURE.md](./INFRASTRUCTURE.md)** - Infrastructure setup

---

**Next Steps:**
1. ✅ Implement local file storage
2. ✅ Add upload API endpoints
3. ✅ Integrate with CAD 3D Viewer widget
4. ⏳ Add authentication/authorization
5. ⏳ Implement cloud storage providers (Azure/S3)
6. ⏳ Add file cleanup/retention policies
7. ⏳ Add file versioning support

---

**Last Review:** December 12, 2025  
**Owner:** Platform Team
