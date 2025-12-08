# Azure Storage Account Module

This module creates an Azure Storage Account with blob containers for object storage, configured with private network access and lifecycle management.

## Features

- **Blob Storage**: Optimized for unstructured data (videos, CAD files, LiDAR data)
- **Private Network Access**: Private endpoint for secure connectivity
- **Lifecycle Management**: Automatic tiering and deletion policies
- **Versioning**: Blob versioning for data protection
- **Encryption**: Server-side encryption with Microsoft-managed keys
- **Soft Delete**: 30-day soft delete for blobs and containers
- **CORS Configuration**: Configurable for web app access

## Usage

```hcl
module "storage" {
  source = "./modules/storage"
  
  resource_group_name  = azurerm_resource_group.main.name
  location             = azurerm_resource_group.main.location
  storage_account_name = "stsensormineprod"
  subnet_id            = azurerm_subnet.services.id
  
  account_tier             = "Standard"
  account_replication_type = "GRS"
  
  containers = [
    "videos",
    "cad-models",
    "lidar-data",
    "exports"
  ]
  
  tags = {
    Environment = "production"
    Project     = "Sensormine"
  }
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| resource_group_name | Name of the resource group | string | - | yes |
| location | Azure region | string | - | yes |
| storage_account_name | Name of the storage account (3-24 lowercase alphanumeric) | string | - | yes |
| subnet_id | Subnet ID for private endpoint | string | - | yes |
| account_tier | Storage account tier (Standard or Premium) | string | Standard | no |
| account_replication_type | Replication type (LRS, GRS, RAGRS, ZRS, GZRS, RAGZRS) | string | GRS | no |
| containers | List of container names to create | list(string) | [] | no |
| tags | Resource tags | map(string) | {} | no |

## Outputs

| Name | Description |
|------|-------------|
| storage_account_id | The ID of the storage account |
| storage_account_name | The name of the storage account |
| primary_blob_endpoint | Blob storage endpoint URL |
| connection_string | Primary connection string (sensitive) |
| container_names | List of created containers |

## Performance Tiers

### Standard Tier
- **Hot**: Frequently accessed data
- **Cool**: Infrequently accessed (30+ days)
- **Archive**: Rarely accessed (180+ days)
- **Costs**: Optimized for large storage volumes

### Premium Tier
- **Premium Block Blobs**: Low latency, high throughput
- **Premium Page Blobs**: For VHDs and disk storage
- **Premium Files**: High-performance file shares
- **Costs**: Higher cost, predictable performance

## Replication Options

| Type | Description | Durability | Cost |
|------|-------------|------------|------|
| LRS | Locally redundant (3 copies in same datacenter) | 99.999999999% | Lowest |
| ZRS | Zone redundant (3 copies across AZs) | 99.9999999999% | Low |
| GRS | Geo-redundant (LRS + async copy to paired region) | 99.99999999999999% | Medium |
| GZRS | Geo-zone redundant (ZRS + async copy to paired region) | 99.99999999999999% | High |
| RAGRS | Read-access GRS (GRS + read from secondary) | 99.99999999999999% | Medium-High |
| RAGZRS | Read-access GZRS (GZRS + read from secondary) | 99.99999999999999% | Highest |

## Recommended Configurations

### Development
```hcl
account_tier             = "Standard"
account_replication_type = "LRS"
access_tier              = "Hot"
```

### Production
```hcl
account_tier             = "Standard"
account_replication_type = "GRS"  # or GZRS for higher availability
access_tier              = "Hot"
```

### Archive/Backup
```hcl
account_tier             = "Standard"
account_replication_type = "RAGRS"
access_tier              = "Cool"  # with lifecycle to Archive
```

## Use Cases in Sensormine Platform

1. **Video Storage**: Store surveillance video files from IoT devices
2. **CAD Models**: Store 3D facility models and floor plans
3. **LiDAR Data**: Store point cloud data for 3D visualization
4. **Export Files**: Store CSV, JSON, and PDF exports from analytics
5. **Backup Storage**: Database backups, configuration backups
6. **Static Website**: Host static web content (optional)

## Lifecycle Management

Automatically tier or delete blobs based on age:

```hcl
# Example lifecycle rule (add to module)
resource "azurerm_storage_management_policy" "lifecycle" {
  storage_account_id = azurerm_storage_account.main.id

  rule {
    name    = "move-to-cool"
    enabled = true
    filters {
      blob_types = ["blockBlob"]
    }
    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than = 30
        tier_to_archive_after_days_since_modification_greater_than = 180
        delete_after_days_since_modification_greater_than = 365
      }
    }
  }
}
```

## Connecting to Blob Storage

### From .NET Application

```csharp
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

// Using connection string
var connectionString = builder.Configuration.GetConnectionString("Storage");
var blobServiceClient = new BlobServiceClient(connectionString);

// Get container
var containerClient = blobServiceClient.GetBlobContainerClient("videos");

// Upload blob
using var stream = File.OpenRead("video.mp4");
await containerClient.UploadBlobAsync("2024/01/video-001.mp4", stream);

// Download blob
var blobClient = containerClient.GetBlobClient("2024/01/video-001.mp4");
await blobClient.DownloadToAsync("downloaded-video.mp4");

// List blobs
await foreach (var blob in containerClient.GetBlobsAsync())
{
    Console.WriteLine($"Blob: {blob.Name}, Size: {blob.Properties.ContentLength}");
}

// Delete blob
await blobClient.DeleteAsync();
```

### Using Azure SDK with Dependency Injection

```csharp
// In Program.cs
builder.Services.AddSingleton(x => 
    new BlobServiceClient(
        builder.Configuration.GetConnectionString("Storage")));

// In controller or service
public class VideoService
{
    private readonly BlobServiceClient _blobClient;
    
    public VideoService(BlobServiceClient blobClient)
    {
        _blobClient = blobClient;
    }
    
    public async Task<Uri> UploadVideoAsync(Stream videoStream, string deviceId, string fileName)
    {
        var containerClient = _blobClient.GetBlobContainerClient("videos");
        var blobName = $"{deviceId}/{DateTime.UtcNow:yyyy/MM/dd}/{fileName}";
        var blobClient = containerClient.GetBlobClient(blobName);
        
        await blobClient.UploadAsync(videoStream, new BlobHttpHeaders
        {
            ContentType = "video/mp4"
        });
        
        return blobClient.Uri;
    }
}
```

### Using Azure CLI

```bash
# Upload file
az storage blob upload \
  --account-name stsensormineprod \
  --container-name videos \
  --name 2024/01/video-001.mp4 \
  --file ./video.mp4

# Download file
az storage blob download \
  --account-name stsensormineprod \
  --container-name videos \
  --name 2024/01/video-001.mp4 \
  --file ./downloaded-video.mp4

# List blobs
az storage blob list \
  --account-name stsensormineprod \
  --container-name videos \
  --output table

# Generate SAS token
az storage blob generate-sas \
  --account-name stsensormineprod \
  --container-name videos \
  --name 2024/01/video-001.mp4 \
  --permissions r \
  --expiry 2024-12-31T23:59Z
```

## Private Network Access

This module configures a private endpoint:

1. **No Public Access**: Public blob access disabled by default
2. **Private Endpoint**: Dedicated private IP in your subnet
3. **Private DNS**: Automatic DNS resolution within VNet
4. **Blob Service**: Only blob service is exposed (optional: file, queue, table)

## Security Features

1. **Encryption at Rest**: All data encrypted with Microsoft-managed keys
2. **Encryption in Transit**: HTTPS required for all connections
3. **Soft Delete**: 30-day recovery period for deleted blobs
4. **Versioning**: Optional blob versioning for critical data
5. **Access Keys**: Secure in Azure Key Vault
6. **Managed Identity**: Use for Azure service authentication
7. **SAS Tokens**: Time-limited, permission-scoped access

## Monitoring and Diagnostics

Key metrics to monitor:

- **Availability**: Monitor service uptime (target: 99.9%)
- **Latency**: E2E latency, server latency
- **Transactions**: Total requests, success rate
- **Ingress/Egress**: Data transferred in/out
- **Capacity**: Total storage used
- **Blob Count**: Number of blobs per container

## Performance Optimization

1. **CDN**: Use Azure CDN for frequently accessed content
2. **Concurrent Uploads**: Use parallel uploads for large files
3. **Block Size**: Optimize block size for large files (4-8 MB)
4. **Read Replicas**: Use RAGRS for read-heavy workloads
5. **Compression**: Compress files before upload
6. **Caching**: Cache blob metadata in Redis

## Cost Optimization

1. **Lifecycle Policies**: Auto-tier to cool/archive
2. **Access Tier**: Choose appropriate tier for workload
3. **Replication**: Use LRS for non-critical data
4. **Reserved Capacity**: 1-year or 3-year commitments
5. **Delete Unused**: Clean up old exports and backups
6. **Monitor Egress**: Minimize cross-region data transfer

## Storage Cost Comparison (per GB/month)

| Tier | Hot | Cool | Archive |
|------|-----|------|---------|
| **LRS** | $0.018 | $0.010 | $0.002 |
| **GRS** | $0.036 | $0.020 | $0.004 |
| **RAGRS** | $0.045 | $0.025 | $0.005 |

**Egress Costs** (first 100 TB/month):
- Within region: Free
- Cross-region: $0.087/GB
- Internet egress: $0.087/GB

## Backup and Recovery

```bash
# Enable soft delete
az storage account blob-service-properties update \
  --account-name stsensormineprod \
  --enable-delete-retention true \
  --delete-retention-days 30

# Restore soft-deleted blob
az storage blob undelete \
  --account-name stsensormineprod \
  --container-name videos \
  --name 2024/01/video-001.mp4

# Enable versioning
az storage account blob-service-properties update \
  --account-name stsensormineprod \
  --enable-versioning true
```

## CORS Configuration

For web app access:

```hcl
resource "azurerm_storage_account" "main" {
  # ... other configuration ...
  
  blob_properties {
    cors_rule {
      allowed_origins    = ["https://app.sensormine.com"]
      allowed_methods    = ["GET", "HEAD", "POST", "PUT"]
      allowed_headers    = ["*"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
  }
}
```

## References

- [Azure Blob Storage Documentation](https://docs.microsoft.com/en-us/azure/storage/blobs/)
- [Best Practices](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blob-scalability-targets)
- [Lifecycle Management](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-lifecycle-management-concepts)
- [Performance Tuning](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-performance-checklist)
