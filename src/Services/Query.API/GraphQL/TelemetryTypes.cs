namespace Query.API.GraphQL;

using HotChocolate.Types;

/// <summary>
/// GraphQL object type for telemetry data
/// </summary>
public class TelemetryDataType : ObjectType<TelemetryData>
{
    protected override void Configure(IObjectTypeDescriptor<TelemetryData> descriptor)
    {
        descriptor.Description("Time-series telemetry data from IoT devices");

        descriptor
            .Field(t => t.DeviceId)
            .Description("Unique device identifier");

        descriptor
            .Field(t => t.Timestamp)
            .Description("UTC timestamp of the measurement");

        descriptor
            .Field(t => t.TenantId)
            .Description("Tenant identifier for multi-tenancy");

        descriptor
            .Field(t => t.DeviceType)
            .Description("Type/category of the device");

        descriptor
            .Field(t => t.BatteryLevel)
            .Description("Battery level percentage (0-100)");

        descriptor
            .Field(t => t.SignalStrength)
            .Description("Signal strength indicator");

        descriptor
            .Field(t => t.Latitude)
            .Description("GPS latitude coordinate");

        descriptor
            .Field(t => t.Longitude)
            .Description("GPS longitude coordinate");

        descriptor
            .Field(t => t.Altitude)
            .Description("Altitude in meters");

        descriptor
            .Field(t => t.CustomFields)
            .Description("Device-specific sensor measurements (JSONB)");

        descriptor
            .Field(t => t.Quality)
            .Description("Data quality metadata");
    }
}

/// <summary>
/// Telemetry data model for GraphQL
/// </summary>
public class TelemetryData
{
    public Guid DeviceId { get; set; }
    public DateTime Timestamp { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public string DeviceType { get; set; } = string.Empty;
    public double? BatteryLevel { get; set; }
    public double? SignalStrength { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public double? Altitude { get; set; }
    public Dictionary<string, object>? CustomFields { get; set; }
    public Dictionary<string, string>? Quality { get; set; }
}

/// <summary>
/// GraphQL input type for telemetry queries
/// </summary>
public class TelemetryQueryInput
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public List<Guid>? DeviceIds { get; set; }
    public string? DeviceType { get; set; }
    public int? Limit { get; set; }
    public string? OrderBy { get; set; }
}

/// <summary>
/// Combined device metadata with latest telemetry
/// </summary>
public class DeviceWithTelemetry
{
    public Guid Id { get; set; }
    public Guid DeviceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid DeviceTypeId { get; set; }
    public string? DeviceTypeName { get; set; }
    public string? SerialNumber { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime? LastSeenAt { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
    public TelemetryData? LatestTelemetry { get; set; }
}

/// <summary>
/// GraphQL input for querying devices with telemetry
/// </summary>
public class DeviceWithTelemetryInput
{
    public Guid? DeviceTypeId { get; set; }
    public List<Guid>? DeviceIds { get; set; }
    public string? Status { get; set; }
    public int? Limit { get; set; }
}

/// <summary>
/// GraphQL input type for aggregate queries
/// </summary>
public class TelemetryAggregateInput
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public List<Guid>? DeviceIds { get; set; }
    public string? DeviceType { get; set; }
    public string Field { get; set; } = "value";
    public string AggregateFunction { get; set; } = "avg";
    public TimeSpan? GroupByInterval { get; set; }
    public List<string>? GroupByFields { get; set; }
}

/// <summary>
/// GraphQL result type for aggregate queries
/// </summary>
public class TelemetryAggregate
{
    public DateTime? Bucket { get; set; }
    public Guid? DeviceId { get; set; }
    public string? DeviceType { get; set; }
    public double? Value { get; set; }
    public long Count { get; set; }
}
