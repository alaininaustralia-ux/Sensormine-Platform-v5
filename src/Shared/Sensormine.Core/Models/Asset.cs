namespace Sensormine.Core.Models;

/// <summary>
/// Represents an asset in the digital twin hierarchy
/// </summary>
public class Asset : BaseEntity
{
    /// <summary>
    /// Parent asset ID (null for root-level assets)
    /// </summary>
    public Guid? ParentId { get; set; }

    /// <summary>
    /// Parent asset navigation property
    /// </summary>
    public Asset? Parent { get; set; }

    /// <summary>
    /// Asset name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Asset description
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Asset type classification
    /// </summary>
    public AssetType AssetType { get; set; }

    /// <summary>
    /// Asset category (Facility, Equipment, Geography)
    /// </summary>
    public AssetCategory Category { get; set; } = AssetCategory.Equipment;

    /// <summary>
    /// Materialized path for efficient hierarchical queries (LTREE format)
    /// </summary>
    public string Path { get; set; } = string.Empty;

    /// <summary>
    /// Depth level in hierarchy (0 = root)
    /// </summary>
    public int Level { get; set; }

    /// <summary>
    /// Custom metadata as key-value pairs
    /// </summary>
    public Dictionary<string, object> Metadata { get; set; } = new();

    /// <summary>
    /// Primary image URL for the asset
    /// </summary>
    public string? PrimaryImageUrl { get; set; }

    /// <summary>
    /// Additional image URLs (gallery)
    /// </summary>
    public List<string> ImageUrls { get; set; } = new();

    /// <summary>
    /// Document attachments (name -> URL)
    /// </summary>
    public Dictionary<string, string> Documents { get; set; } = new();

    /// <summary>
    /// Custom icon name for the asset (e.g., "factory", "server", "thermometer")
    /// If null, uses default icon based on AssetType
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// GPS coordinates (latitude, longitude)
    /// </summary>
    public GeoLocation? Location { get; set; }

    /// <summary>
    /// Geographic data for geography-type assets
    /// </summary>
    public GeographicData? GeographicData { get; set; }

    /// <summary>
    /// URL to CAD drawing file (for equipment/facility assets)
    /// </summary>
    public string? CadDrawingUrl { get; set; }

    /// <summary>
    /// Current asset status
    /// </summary>
    public AssetStatus Status { get; set; } = AssetStatus.Active;

    /// <summary>
    /// User who created the asset
    /// </summary>
    public string? CreatedBy { get; set; }

    /// <summary>
    /// User who last updated the asset
    /// </summary>
    public string? UpdatedBy { get; set; }

    /// <summary>
    /// Child assets collection
    /// </summary>
    public virtual ICollection<Asset> Children { get; set; } = new List<Asset>();

    /// <summary>
    /// Current state of the asset
    /// </summary>
    public virtual AssetState? CurrentState { get; set; }

    /// <summary>
    /// Data point mappings associated with this asset
    /// </summary>
    public virtual ICollection<DataPointMapping> DataPointMappings { get; set; } = new List<DataPointMapping>();
}

/// <summary>
/// Asset type classification
/// </summary>
public enum AssetType
{
    Site,
    Building,
    Floor,
    Area,
    Zone,
    Equipment,
    Subsystem,
    Component,
    Subcomponent,
    Sensor
}

/// <summary>
/// Asset category classification
/// </summary>
public enum AssetCategory
{
    Facility,
    Equipment,
    Geography
}

/// <summary>
/// Asset operational status
/// </summary>
public enum AssetStatus
{
    Active,
    Inactive,
    Maintenance,
    Decommissioned
}

/// <summary>
/// Geographic location
/// </summary>
public class GeoLocation
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double? Altitude { get; set; }
}

/// <summary>
/// Geographic data for geography-type assets
/// </summary>
public class GeographicData
{
    public string? Country { get; set; }
    public string? State { get; set; }
    public string? Council { get; set; }
    public string? City { get; set; }
    public GeofenceData? Geofence { get; set; }
}

/// <summary>
/// Geofence definition (polygon boundary)
/// </summary>
public class GeofenceData
{
    public string Type { get; set; } = "Polygon"; // GeoJSON type
    public List<GeoLocation> Coordinates { get; set; } = new();
    public double? Radius { get; set; } // For circular geofences
}
