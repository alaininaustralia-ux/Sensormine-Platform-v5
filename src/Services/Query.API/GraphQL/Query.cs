namespace Query.API.GraphQL;

using HotChocolate;
using Sensormine.Core.Interfaces;
using Sensormine.Storage.Interfaces;
using Sensormine.Core.Models;

/// <summary>
/// GraphQL Query root for telemetry data
/// </summary>
public class Query
{
    /// <summary>
    /// Query telemetry data with flexible filters
    /// </summary>
    [GraphQLDescription("Query time-series telemetry data")]
    public async Task<List<TelemetryData>> GetTelemetry(
        [Service] ITimeSeriesRepository repository,
        [Service] ITenantProvider tenantProvider,
        TelemetryQueryInput input)
    {
        var query = new TimeSeriesQuery
        {
            StartTime = input.StartTime,
            EndTime = input.EndTime,
            Limit = input.Limit,
            OrderBy = input.OrderBy ?? "time",
            Filters = new Dictionary<string, string>()
        };

        // Add device ID filter if specified
        if (input.DeviceIds != null && input.DeviceIds.Any())
        {
            // For multiple devices, we'll need to query each and combine
            // For now, support single device in filter
            query.Filters["deviceId"] = input.DeviceIds.First();
        }

        // Add device type filter if specified
        if (!string.IsNullOrEmpty(input.DeviceType))
        {
            query.Filters["deviceType"] = input.DeviceType;
        }

        var results = await repository.QueryAsync<TimeSeriesData>(
            "telemetry",
            query,
            CancellationToken.None);

        return results.Select(ts => new TelemetryData
        {
            DeviceId = ts.DeviceId,
            Timestamp = ts.Timestamp.UtcDateTime,
            TenantId = ts.TenantId.ToString(),
            DeviceType = ts.Tags?.GetValueOrDefault("device_type") ?? "unknown",
            BatteryLevel = ts.Values.TryGetValue("battery_level", out var battery) && battery is double b ? b : null,
            SignalStrength = ts.Values.TryGetValue("signal_strength", out var signal) && signal is double s ? s : null,
            Latitude = ts.Values.TryGetValue("latitude", out var lat) && lat is double la ? la : null,
            Longitude = ts.Values.TryGetValue("longitude", out var lon) && lon is double lo ? lo : null,
            Altitude = ts.Values.TryGetValue("altitude", out var alt) && alt is double al ? al : null,
            CustomFields = ts.Values,
            Quality = ts.Quality
        }).ToList();
    }

    /// <summary>
    /// Query aggregated telemetry data
    /// </summary>
    [GraphQLDescription("Query aggregated time-series data")]
    public async Task<List<TelemetryAggregate>> GetTelemetryAggregate(
        [Service] ITimeSeriesRepository repository,
        [Service] ITenantProvider tenantProvider,
        TelemetryAggregateInput input)
    {
        var query = new AggregateQuery
        {
            StartTime = input.StartTime,
            EndTime = input.EndTime,
            AggregateFunction = input.AggregateFunction,
            GroupByInterval = input.GroupByInterval,
            GroupByFields = input.GroupByFields?.ToArray(),
            Filters = new Dictionary<string, string>()
        };

        // Add device ID filter if specified
        if (input.DeviceIds != null && input.DeviceIds.Any())
        {
            query.Filters["deviceId"] = input.DeviceIds.First();
        }

        // Add device type filter if specified
        if (!string.IsNullOrEmpty(input.DeviceType))
        {
            query.Filters["deviceType"] = input.DeviceType;
        }

        // Add field to aggregate
        query.Filters["_field"] = input.Field;

        var results = await repository.QueryAggregateAsync<Sensormine.Storage.TimeSeries.AggregateResult>(
            "telemetry",
            query,
            CancellationToken.None);

        return results.Select(r => new TelemetryAggregate
        {
            Bucket = r.Bucket,
            DeviceId = r.DeviceId,
            Value = r.Value.HasValue ? (double)r.Value.Value : null,
            Count = r.Count
        }).ToList();
    }

    /// <summary>
    /// Get latest telemetry for a device
    /// </summary>
    [GraphQLDescription("Get the most recent telemetry reading for a device")]
    public async Task<TelemetryData?> GetLatestTelemetry(
        [Service] ITimeSeriesRepository repository,
        [Service] ITenantProvider tenantProvider,
        string deviceId)
    {
        var query = new TimeSeriesQuery
        {
            StartTime = DateTime.UtcNow.AddHours(-24),
            EndTime = DateTime.UtcNow,
            Limit = 1,
            OrderBy = "time",
            Filters = new Dictionary<string, string>
            {
                ["deviceId"] = deviceId
            }
        };

        var results = await repository.QueryAsync<TimeSeriesData>(
            "telemetry",
            query,
            CancellationToken.None);

        var latest = results.FirstOrDefault();
        if (latest == null)
            return null;

        return new TelemetryData
        {
            DeviceId = latest.DeviceId,
            Timestamp = latest.Timestamp.UtcDateTime,
            TenantId = latest.TenantId.ToString(),
            DeviceType = latest.Tags?.GetValueOrDefault("device_type") ?? "unknown",
            BatteryLevel = latest.Values.TryGetValue("battery_level", out var battery) && battery is double b ? b : null,
            SignalStrength = latest.Values.TryGetValue("signal_strength", out var signal) && signal is double s ? s : null,
            Latitude = latest.Values.TryGetValue("latitude", out var lat) && lat is double la ? la : null,
            Longitude = latest.Values.TryGetValue("longitude", out var lon) && lon is double lo ? lo : null,
            Altitude = latest.Values.TryGetValue("altitude", out var alt) && alt is double al ? al : null,
            CustomFields = latest.Values,
            Quality = latest.Quality
        };
    }

    /// <summary>
    /// Get devices with their latest telemetry data
    /// </summary>
    [GraphQLDescription("Get devices with their most recent telemetry readings")]
    public async Task<List<DeviceWithTelemetry>> GetDevicesWithTelemetry(
        [Service] ITimeSeriesRepository timeSeriesRepository,
        [Service] Sensormine.Storage.Repositories.IDeviceRepository deviceRepository,
        [Service] ITenantProvider tenantProvider,
        DeviceWithTelemetryInput input)
    {
        var tenantId = tenantProvider.GetTenantId();
        
        // Fetch devices from Device API based on filters
        var devices = await deviceRepository.SearchAsync(
            tenantId,
            deviceTypeId: input.DeviceTypeId,
            status: input.Status,
            searchTerm: null,
            page: 1,
            pageSize: input.Limit ?? 100);

        if (!devices.Any())
            return new List<DeviceWithTelemetry>();

        // If specific device IDs are requested, filter the results
        if (input.DeviceIds != null && input.DeviceIds.Any())
        {
            var deviceIdSet = new HashSet<string>(input.DeviceIds);
            devices = devices.Where(d => deviceIdSet.Contains(d.DeviceId)).ToList();
        }

        // Get latest telemetry for all devices in batch
        var deviceIds = devices.Select(d => d.DeviceId).ToList();
        var latestTelemetry = await timeSeriesRepository.GetLatestTelemetryForDevicesAsync(
            deviceIds,
            CancellationToken.None);

        // Combine device metadata with telemetry
        var result = devices.Select(device =>
        {
            var telemetryData = latestTelemetry.TryGetValue(device.DeviceId, out var telemetry)
                ? telemetry
                : null;

            return new DeviceWithTelemetry
            {
                Id = device.Id,
                DeviceId = device.DeviceId,
                Name = device.Name,
                DeviceTypeId = device.DeviceTypeId,
                DeviceTypeName = device.DeviceType?.Name,
                SerialNumber = device.SerialNumber,
                Status = device.Status,
                LastSeenAt = device.LastSeenAt?.UtcDateTime,
                Metadata = device.Metadata?.ToDictionary(kvp => kvp.Key, kvp => (object)kvp.Value),
                LatestTelemetry = telemetryData != null ? new TelemetryData
                {
                    DeviceId = device.DeviceId,
                    Timestamp = telemetryData.Timestamp,
                    TenantId = tenantId,
                    CustomFields = telemetryData.CustomFields
                } : null
            };
        }).ToList();

        return result;
    }
}
