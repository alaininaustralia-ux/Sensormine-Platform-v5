using System.Net.Http.Headers;
using System.Text.Json;

namespace Template.API.Services;

// DTOs for external API responses
public class SchemaDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Version { get; set; } = "1.0.0";
    public Dictionary<string, object> SchemaDefinition { get; set; } = new();
    public string? Description { get; set; }
}

public class SchemaListResponse
{
    public List<SchemaDto> Schemas { get; set; } = new();
    public int TotalCount { get; set; }
    public int Skip { get; set; }
    public int Take { get; set; }
}

public class DeviceTypeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? SchemaId { get; set; }
    public Dictionary<string, object>? CustomFields { get; set; }
    public List<FieldMappingDto>? FieldMappings { get; set; }
    public string? Icon { get; set; }
    public string? Color { get; set; }
}

public class FieldMappingDto
{
    public string FieldName { get; set; } = string.Empty;
    public string FriendlyName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Unit { get; set; }
    public FieldDataType DataType { get; set; }
    public bool IsQueryable { get; set; }
    public bool IsVisible { get; set; }
    public FieldSource FieldSource { get; set; }
}

public enum FieldDataType { String, Integer, Float, Boolean, DateTime }
public enum FieldSource { Schema, CustomField, System }

public class DashboardDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DashboardLayoutDto Layout { get; set; } = new();
    public List<WidgetDto>? Widgets { get; set; }
    public Dictionary<string, object>? Filters { get; set; }
}

public class DashboardLayoutDto
{
    public int Columns { get; set; } = 12;
    public int RowHeight { get; set; } = 60;
}

public class WidgetDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public WidgetPositionDto Position { get; set; } = new();
    public Dictionary<string, object> Config { get; set; } = new();
}

public class WidgetPositionDto
{
    public int X { get; set; }
    public int Y { get; set; }
    public int W { get; set; }
    public int H { get; set; }
}

public class AlertRuleDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Condition { get; set; } = string.Empty;
    public Guid? DeviceTypeId { get; set; }
    public int Severity { get; set; }
    public bool IsEnabled { get; set; }
}

public class AssetDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Equipment";
    public Guid? ParentId { get; set; }
    public string? Icon { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
    public Dictionary<string, object>? Location { get; set; }
}

// Service classes
public class SchemaRegistryService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<SchemaRegistryService> _logger;

    public SchemaRegistryService(HttpClient httpClient, ILogger<SchemaRegistryService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<List<SchemaDto>> GetSchemasAsync(Guid tenantId)
    {
        AddTenantHeader(tenantId);
        var response = await _httpClient.GetAsync("/api/schemas?take=1000");
        response.EnsureSuccessStatusCode();
        var listResponse = await response.Content.ReadFromJsonAsync<SchemaListResponse>();
        return listResponse?.Schemas ?? new();
    }

    public async Task<SchemaDto?> FindSchemaByNameAsync(Guid tenantId, string name)
    {
        AddTenantHeader(tenantId);
        var schemas = await GetSchemasAsync(tenantId);
        return schemas.FirstOrDefault(s => s.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<Guid> CreateSchemaAsync(Guid tenantId, Template.API.Models.SchemaResource schema)
    {
        AddTenantHeader(tenantId);
        var response = await _httpClient.PostAsJsonAsync("/api/schemas", schema);
        response.EnsureSuccessStatusCode();
        var created = await response.Content.ReadFromJsonAsync<SchemaDto>();
        return created?.Id ?? Guid.Empty;
    }

    public async Task UpdateSchemaAsync(Guid tenantId, Guid schemaId, Template.API.Models.SchemaResource schema)
    {
        AddTenantHeader(tenantId);
        var response = await _httpClient.PutAsJsonAsync($"/api/schemas/{schemaId}", schema);
        response.EnsureSuccessStatusCode();
    }

    private void AddTenantHeader(Guid tenantId)
    {
        _httpClient.DefaultRequestHeaders.Remove("X-Tenant-Id");
        _httpClient.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId.ToString());
    }
}

public class DeviceService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<DeviceService> _logger;

    public DeviceService(HttpClient httpClient, ILogger<DeviceService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<DeviceTypeDto?> GetDeviceTypeAsync(Guid tenantId, Guid deviceTypeId)
    {
        AddTenantHeader(tenantId);
        var response = await _httpClient.GetAsync($"/api/devicetype/{deviceTypeId}");
        if (!response.IsSuccessStatusCode) return null;
        return await response.Content.ReadFromJsonAsync<DeviceTypeDto>();
    }

    public async Task<DeviceTypeDto?> FindDeviceTypeByNameAsync(Guid tenantId, string name)
    {
        AddTenantHeader(tenantId);
        var response = await _httpClient.GetAsync("/api/devicetype");
        if (!response.IsSuccessStatusCode) return null;
        var deviceTypes = await response.Content.ReadFromJsonAsync<List<DeviceTypeDto>>() ?? new();
        return deviceTypes.FirstOrDefault(dt => dt.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<Guid> CreateDeviceTypeAsync(Guid tenantId, Template.API.Models.DeviceTypeResource deviceType, Guid? schemaId)
    {
        AddTenantHeader(tenantId);
        var dto = new { deviceType.Name, deviceType.Description, schemaId, deviceType.CustomFields, deviceType.FieldMappings };
        var response = await _httpClient.PostAsJsonAsync("/api/devicetype", dto);
        response.EnsureSuccessStatusCode();
        var created = await response.Content.ReadFromJsonAsync<DeviceTypeDto>();
        return created?.Id ?? Guid.Empty;
    }

    private void AddTenantHeader(Guid tenantId)
    {
        _httpClient.DefaultRequestHeaders.Remove("X-Tenant-Id");
        _httpClient.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId.ToString());
    }
}

public class DashboardService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<DashboardService> _logger;

    public DashboardService(HttpClient httpClient, ILogger<DashboardService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<DashboardDto?> GetDashboardAsync(Guid tenantId, Guid dashboardId)
    {
        AddTenantHeader(tenantId);
        var response = await _httpClient.GetAsync($"/api/dashboards/{dashboardId}");
        if (!response.IsSuccessStatusCode) return null;
        return await response.Content.ReadFromJsonAsync<DashboardDto>();
    }

    public async Task<DashboardDto?> FindDashboardByNameAsync(Guid tenantId, string name)
    {
        AddTenantHeader(tenantId);
        var response = await _httpClient.GetAsync("/api/dashboards");
        if (!response.IsSuccessStatusCode) return null;
        var dashboards = await response.Content.ReadFromJsonAsync<List<DashboardDto>>() ?? new();
        return dashboards.FirstOrDefault(d => d.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<Guid> CreateDashboardAsync(Guid tenantId, Template.API.Models.DashboardResource dashboard)
    {
        AddTenantHeader(tenantId);
        var response = await _httpClient.PostAsJsonAsync("/api/dashboards", dashboard);
        response.EnsureSuccessStatusCode();
        var created = await response.Content.ReadFromJsonAsync<DashboardDto>();
        return created?.Id ?? Guid.Empty;
    }

    private void AddTenantHeader(Guid tenantId)
    {
        _httpClient.DefaultRequestHeaders.Remove("X-Tenant-Id");
        _httpClient.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId.ToString());
    }
}

public class AlertsService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AlertsService> _logger;

    public AlertsService(HttpClient httpClient, ILogger<AlertsService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<AlertRuleDto?> GetAlertRuleAsync(Guid tenantId, Guid alertRuleId)
    {
        AddTenantHeader(tenantId);
        var response = await _httpClient.GetAsync($"/api/alert-rules/{alertRuleId}");
        if (!response.IsSuccessStatusCode) return null;
        return await response.Content.ReadFromJsonAsync<AlertRuleDto>();
    }

    public async Task<AlertRuleDto?> FindAlertRuleByNameAsync(Guid tenantId, string name)
    {
        AddTenantHeader(tenantId);
        var response = await _httpClient.GetAsync("/api/alert-rules");
        if (!response.IsSuccessStatusCode) return null;
        var alertRules = await response.Content.ReadFromJsonAsync<List<AlertRuleDto>>() ?? new();
        return alertRules.FirstOrDefault(ar => ar.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<Guid> CreateAlertRuleAsync(Guid tenantId, Template.API.Models.AlertRuleResource alertRule, Guid? deviceTypeId)
    {
        AddTenantHeader(tenantId);
        var dto = new { alertRule.Name, alertRule.Description, alertRule.Condition, deviceTypeId, alertRule.Severity, alertRule.IsEnabled };
        var response = await _httpClient.PostAsJsonAsync("/api/alert-rules", dto);
        response.EnsureSuccessStatusCode();
        var created = await response.Content.ReadFromJsonAsync<AlertRuleDto>();
        return created?.Id ?? Guid.Empty;
    }

    private void AddTenantHeader(Guid tenantId)
    {
        _httpClient.DefaultRequestHeaders.Remove("X-Tenant-Id");
        _httpClient.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId.ToString());
    }
}

public class DigitalTwinService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<DigitalTwinService> _logger;

    public DigitalTwinService(HttpClient httpClient, ILogger<DigitalTwinService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<AssetDto?> GetAssetAsync(Guid tenantId, Guid assetId)
    {
        AddTenantHeader(tenantId);
        var response = await _httpClient.GetAsync($"/api/assets/{assetId}");
        if (!response.IsSuccessStatusCode) return null;
        return await response.Content.ReadFromJsonAsync<AssetDto>();
    }

    public async Task<Guid> CreateAssetAsync(Guid tenantId, Template.API.Models.AssetResource asset, Guid? parentId)
    {
        AddTenantHeader(tenantId);
        var dto = new { asset.Name, asset.Type, parentId, asset.Icon, asset.Metadata, asset.Location };
        var response = await _httpClient.PostAsJsonAsync("/api/assets", dto);
        response.EnsureSuccessStatusCode();
        var created = await response.Content.ReadFromJsonAsync<AssetDto>();
        return created?.Id ?? Guid.Empty;
    }

    private void AddTenantHeader(Guid tenantId)
    {
        _httpClient.DefaultRequestHeaders.Remove("X-Tenant-Id");
        _httpClient.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId.ToString());
    }
}
