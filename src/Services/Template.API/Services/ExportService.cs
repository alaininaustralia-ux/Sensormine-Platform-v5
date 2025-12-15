using System.Text.Json;
using Template.API.Models;
using TemplateModel = Template.API.Models.Template;

namespace Template.API.Services;

public class ExportService
{
    private readonly SchemaRegistryService _schemaService;
    private readonly DeviceService _deviceService;
    private readonly DashboardService _dashboardService;
    private readonly AlertsService _alertsService;
    private readonly DigitalTwinService _digitalTwinService;
    private readonly ILogger<ExportService> _logger;

    public ExportService(
        SchemaRegistryService schemaService,
        DeviceService deviceService,
        DashboardService dashboardService,
        AlertsService alertsService,
        DigitalTwinService digitalTwinService,
        ILogger<ExportService> logger)
    {
        _schemaService = schemaService;
        _deviceService = deviceService;
        _dashboardService = dashboardService;
        _alertsService = alertsService;
        _digitalTwinService = digitalTwinService;
        _logger = logger;
    }

    public async Task<TemplateModel> ExportTemplateAsync(Guid tenantId, ExportRequest request)
    {
        _logger.LogInformation("Exporting template for tenant {TenantId}", tenantId);

        var template = new TemplateModel
        {
            Metadata = new TemplateMetadata
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description,
                Author = request.Author,
                AuthorEmail = request.AuthorEmail,
                Tags = request.Tags,
                Category = request.Category,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                SchemaVersion = "1.0",
                Version = "1.0.0"
            }
        };

        var localIdMap = new Dictionary<Guid, string>();
        int schemaCounter = 1;
        int deviceTypeCounter = 1;
        int dashboardCounter = 1;
        int alertCounter = 1;
        int assetCounter = 1;

        // Export Schemas (if requested)
        if (request.IncludeResources.Schemas)
        {
            var schemas = await _schemaService.GetSchemasAsync(tenantId);
            foreach (var schema in schemas)
            {
                var localId = $"schema_{schemaCounter++}";
                localIdMap[schema.Id] = localId;

                template.Resources.Schemas.Add(new SchemaResource
                {
                    LocalId = localId,
                    Name = schema.Name,
                    Version = schema.Version,
                    SchemaDefinition = schema.SchemaDefinition,
                    Description = schema.Description
                });
            }
        }

        // Export Device Types
        foreach (var deviceTypeId in request.IncludeResources.DeviceTypeIds)
        {
            var deviceType = await _deviceService.GetDeviceTypeAsync(tenantId, deviceTypeId);
            if (deviceType == null) continue;

            var localId = $"deviceType_{deviceTypeCounter++}";
            localIdMap[deviceType.Id] = localId;

            var schemaRef = deviceType.SchemaId.HasValue && localIdMap.ContainsKey(deviceType.SchemaId.Value)
                ? localIdMap[deviceType.SchemaId.Value]
                : null;

            template.Resources.DeviceTypes.Add(new DeviceTypeResource
            {
                LocalId = localId,
                Name = deviceType.Name,
                Description = deviceType.Description,
                SchemaRef = schemaRef,
                CustomFields = deviceType.CustomFields,
                FieldMappings = deviceType.FieldMappings?.Select(fm => new FieldMappingResource
                {
                    FieldName = fm.FieldName,
                    FriendlyName = fm.FriendlyName,
                    Description = fm.Description,
                    Unit = fm.Unit,
                    DataType = fm.DataType.ToString(),
                    IsQueryable = fm.IsQueryable,
                    IsVisible = fm.IsVisible,
                    FieldSource = fm.FieldSource.ToString()
                }).ToList() ?? new(),
                Icon = deviceType.Icon,
                Color = deviceType.Color
            });
        }

        // Export Dashboards
        foreach (var dashboardId in request.IncludeResources.DashboardIds)
        {
            var dashboard = await _dashboardService.GetDashboardAsync(tenantId, dashboardId);
            if (dashboard == null) continue;

            var localId = $"dashboard_{dashboardCounter++}";
            localIdMap[dashboard.Id] = localId;

            template.Resources.Dashboards.Add(new DashboardResource
            {
                LocalId = localId,
                Name = dashboard.Name,
                Description = dashboard.Description,
                Layout = new DashboardLayout
                {
                    Columns = dashboard.Layout.Columns,
                    RowHeight = dashboard.Layout.RowHeight
                },
                Widgets = dashboard.Widgets?.Select(w => new WidgetResource
                {
                    Id = w.Id,
                    Type = w.Type,
                    Position = new WidgetPosition
                    {
                        X = w.Position.X,
                        Y = w.Position.Y,
                        W = w.Position.W,
                        H = w.Position.H
                    },
                    Config = RemapWidgetConfig(w.Config, localIdMap)
                }).ToList() ?? new(),
                Filters = dashboard.Filters
            });
        }

        // Export Alert Rules
        foreach (var alertRuleId in request.IncludeResources.AlertRuleIds)
        {
            var alertRule = await _alertsService.GetAlertRuleAsync(tenantId, alertRuleId);
            if (alertRule == null) continue;

            var localId = $"alert_{alertCounter++}";
            localIdMap[alertRule.Id] = localId;

            var deviceTypeRef = alertRule.DeviceTypeId.HasValue && localIdMap.ContainsKey(alertRule.DeviceTypeId.Value)
                ? localIdMap[alertRule.DeviceTypeId.Value]
                : null;

            template.Resources.AlertRules.Add(new AlertRuleResource
            {
                LocalId = localId,
                Name = alertRule.Name,
                Description = alertRule.Description,
                Condition = alertRule.Condition,
                DeviceTypeRef = deviceTypeRef,
                Severity = alertRule.Severity,
                IsEnabled = alertRule.IsEnabled,
                Actions = new List<AlertAction>(),
                CooldownMinutes = 15
            });
        }

        // Export Assets
        foreach (var assetId in request.IncludeResources.AssetIds)
        {
            var asset = await _digitalTwinService.GetAssetAsync(tenantId, assetId);
            if (asset == null) continue;

            var localId = $"asset_{assetCounter++}";
            localIdMap[asset.Id] = localId;

            var parentRef = asset.ParentId.HasValue && localIdMap.ContainsKey(asset.ParentId.Value)
                ? localIdMap[asset.ParentId.Value]
                : null;

            template.Resources.Assets.Add(new AssetResource
            {
                LocalId = localId,
                Name = asset.Name,
                Type = asset.Type,
                ParentRef = parentRef,
                Icon = asset.Icon,
                Metadata = asset.Metadata,
                Location = asset.Location
            });
        }

        // Build reference mappings
        template.Mappings.References = BuildReferenceMappings(template);

        _logger.LogInformation("Exported template with {SchemaCount} schemas, {DeviceTypeCount} device types",
            template.Resources.Schemas.Count, template.Resources.DeviceTypes.Count);

        return template;
    }

    private Dictionary<string, object> RemapWidgetConfig(Dictionary<string, object> config, Dictionary<Guid, string> localIdMap)
    {
        // Remap device type IDs and asset IDs in widget config to local IDs
        var remappedConfig = new Dictionary<string, object>(config);

        if (config.TryGetValue("deviceTypeId", out var deviceTypeIdObj) 
            && deviceTypeIdObj is string deviceTypeIdStr 
            && Guid.TryParse(deviceTypeIdStr, out var deviceTypeId)
            && localIdMap.ContainsKey(deviceTypeId))
        {
            remappedConfig["deviceTypeRef"] = localIdMap[deviceTypeId];
            remappedConfig.Remove("deviceTypeId");
        }

        if (config.TryGetValue("assetId", out var assetIdObj)
            && assetIdObj is string assetIdStr
            && Guid.TryParse(assetIdStr, out var assetId)
            && localIdMap.ContainsKey(assetId))
        {
            remappedConfig["assetRef"] = localIdMap[assetId];
            remappedConfig.Remove("assetId");
        }

        return remappedConfig;
    }

    private Dictionary<string, List<string>> BuildReferenceMappings(TemplateModel template)
    {
        var references = new Dictionary<string, List<string>>();

        // Schema → Device Types
        foreach (var schema in template.Resources.Schemas)
        {
            var referencedBy = template.Resources.DeviceTypes
                .Where(dt => dt.SchemaRef == schema.LocalId)
                .Select(dt => dt.LocalId)
                .ToList();

            if (referencedBy.Any())
            {
                references[schema.LocalId] = referencedBy;
            }
        }

        // Device Types → Dashboards & Alerts
        foreach (var deviceType in template.Resources.DeviceTypes)
        {
            var referencedBy = new List<string>();

            referencedBy.AddRange(template.Resources.Dashboards
                .Where(d => d.Widgets.Any(w => 
                    w.Config.TryGetValue("deviceTypeRef", out var refObj) && refObj?.ToString() == deviceType.LocalId))
                .Select(d => d.LocalId));

            referencedBy.AddRange(template.Resources.AlertRules
                .Where(a => a.DeviceTypeRef == deviceType.LocalId)
                .Select(a => a.LocalId));

            if (referencedBy.Any())
            {
                references[deviceType.LocalId] = referencedBy;
            }
        }

        return references;
    }
}
