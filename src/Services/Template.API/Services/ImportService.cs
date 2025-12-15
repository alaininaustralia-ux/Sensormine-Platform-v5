using Template.API.Models;
using TemplateModel = Template.API.Models.Template;

namespace Template.API.Services;

public class ImportService
{
    private readonly SchemaRegistryService _schemaService;
    private readonly DeviceService _deviceService;
    private readonly DashboardService _dashboardService;
    private readonly AlertsService _alertsService;
    private readonly DigitalTwinService _digitalTwinService;
    private readonly ILogger<ImportService> _logger;

    public ImportService(
        SchemaRegistryService schemaService,
        DeviceService deviceService,
        DashboardService dashboardService,
        AlertsService alertsService,
        DigitalTwinService digitalTwinService,
        ILogger<ImportService> logger)
    {
        _schemaService = schemaService;
        _deviceService = deviceService;
        _dashboardService = dashboardService;
        _alertsService = alertsService;
        _digitalTwinService = digitalTwinService;
        _logger = logger;
    }

    public async Task<ImportResult> ImportTemplateAsync(Guid tenantId, TemplateModel template, ImportOptions options)
    {
        _logger.LogInformation("Importing template {TemplateName} for tenant {TenantId}", 
            template.Metadata.Name, tenantId);

        var result = new ImportResult { Success = true };
        var idMap = new Dictionary<string, Guid>();

        // Use existing mappings if provided
        if (options.ExistingMappings != null)
        {
            foreach (var (localId, uuid) in options.ExistingMappings)
            {
                idMap[localId] = uuid;
            }
        }

        try
        {
            // Pass 1: Import base resources (schemas, assets)
            await ImportSchemasAsync(tenantId, template.Resources.Schemas, idMap, options, result);
            await ImportAssetsAsync(tenantId, template.Resources.Assets, idMap, options, result);

            // Pass 2: Import resources with dependencies (device types, nexus configs)
            await ImportDeviceTypesAsync(tenantId, template.Resources.DeviceTypes, idMap, options, result);

            // Pass 3: Import dependent resources (dashboards, alert rules)
            await ImportDashboardsAsync(tenantId, template.Resources.Dashboards, idMap, options, result);
            await ImportAlertRulesAsync(tenantId, template.Resources.AlertRules, idMap, options, result);

            result.Mappings = idMap;
            result.Success = !result.Errors.Any();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing template");
            result.Success = false;
            result.Errors.Add($"Import failed: {ex.Message}");
        }

        _logger.LogInformation("Import completed. Success: {Success}, Imported: {Count} resources", 
            result.Success, result.Imported.Schemas + result.Imported.DeviceTypes + result.Imported.Dashboards);

        return result;
    }

    public async Task<ImportPreview> PreviewImportAsync(Guid tenantId, TemplateModel template)
    {
        var preview = new ImportPreview();

        // Count resources
        preview.WillImport.Schemas = template.Resources.Schemas.Count;
        preview.WillImport.DeviceTypes = template.Resources.DeviceTypes.Count;
        preview.WillImport.Dashboards = template.Resources.Dashboards.Count;
        preview.WillImport.AlertRules = template.Resources.AlertRules.Count;
        preview.WillImport.Assets = template.Resources.Assets.Count;

        // Check for conflicts
        foreach (var schema in template.Resources.Schemas)
        {
            var existing = await _schemaService.FindSchemaByNameAsync(tenantId, schema.Name);
            if (existing != null)
            {
                preview.Conflicts.Add(new ConflictInfo
                {
                    ResourceType = "Schema",
                    ResourceName = schema.Name,
                    LocalId = schema.LocalId,
                    ConflictReason = "Schema with same name already exists"
                });
            }
        }

        foreach (var deviceType in template.Resources.DeviceTypes)
        {
            var existing = await _deviceService.FindDeviceTypeByNameAsync(tenantId, deviceType.Name);
            if (existing != null)
            {
                preview.Conflicts.Add(new ConflictInfo
                {
                    ResourceType = "DeviceType",
                    ResourceName = deviceType.Name,
                    LocalId = deviceType.LocalId,
                    ConflictReason = "Device type with same name already exists"
                });
            }
        }

        return preview;
    }

    private async Task ImportSchemasAsync(
        Guid tenantId, 
        List<SchemaResource> schemas, 
        Dictionary<string, Guid> idMap, 
        ImportOptions options, 
        ImportResult result)
    {
        foreach (var schema in schemas)
        {
            try
            {
                // Check for conflicts
                var existing = await _schemaService.FindSchemaByNameAsync(tenantId, schema.Name);
                
                if (existing != null)
                {
                    if (options.ConflictResolution == ConflictResolution.Skip)
                    {
                        if (!result.Skipped.ContainsKey("schemas"))
                            result.Skipped["schemas"] = new List<string>();
                        result.Skipped["schemas"].Add($"Schema already exists: {schema.Name}");
                        idMap[schema.LocalId] = existing.Id;
                        continue;
                    }
                    else if (options.ConflictResolution == ConflictResolution.Overwrite)
                    {
                        await _schemaService.UpdateSchemaAsync(tenantId, existing.Id, schema);
                        idMap[schema.LocalId] = existing.Id;
                        result.Imported.Schemas++;
                        continue;
                    }
                    else if (options.ConflictResolution == ConflictResolution.Rename)
                    {
                        schema.Name = $"{schema.Name} (Imported {DateTime.UtcNow:yyyyMMdd})";
                    }
                }

                // Create new schema
                var schemaId = await _schemaService.CreateSchemaAsync(tenantId, schema);
                idMap[schema.LocalId] = schemaId;
                result.Imported.Schemas++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing schema {SchemaName}", schema.Name);
                result.Errors.Add($"Failed to import schema '{schema.Name}': {ex.Message}");
            }
        }
    }

    private async Task ImportDeviceTypesAsync(
        Guid tenantId, 
        List<DeviceTypeResource> deviceTypes, 
        Dictionary<string, Guid> idMap, 
        ImportOptions options, 
        ImportResult result)
    {
        foreach (var deviceType in deviceTypes)
        {
            try
            {
                // Resolve schema reference
                Guid? schemaId = null;
                if (!string.IsNullOrEmpty(deviceType.SchemaRef) && idMap.ContainsKey(deviceType.SchemaRef))
                {
                    schemaId = idMap[deviceType.SchemaRef];
                }

                // Check for conflicts
                var existing = await _deviceService.FindDeviceTypeByNameAsync(tenantId, deviceType.Name);
                
                if (existing != null)
                {
                    if (options.ConflictResolution == ConflictResolution.Skip)
                    {
                        if (!result.Skipped.ContainsKey("deviceTypes"))
                            result.Skipped["deviceTypes"] = new List<string>();
                        result.Skipped["deviceTypes"].Add($"Device type already exists: {deviceType.Name}");
                        idMap[deviceType.LocalId] = existing.Id;
                        continue;
                    }
                    else if (options.ConflictResolution == ConflictResolution.Rename)
                    {
                        deviceType.Name = $"{deviceType.Name} (Imported {DateTime.UtcNow:yyyyMMdd})";
                    }
                }

                // Create device type
                var deviceTypeId = await _deviceService.CreateDeviceTypeAsync(tenantId, deviceType, schemaId);
                idMap[deviceType.LocalId] = deviceTypeId;
                result.Imported.DeviceTypes++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing device type {DeviceTypeName}", deviceType.Name);
                result.Errors.Add($"Failed to import device type '{deviceType.Name}': {ex.Message}");
            }
        }
    }

    private async Task ImportDashboardsAsync(
        Guid tenantId, 
        List<DashboardResource> dashboards, 
        Dictionary<string, Guid> idMap, 
        ImportOptions options, 
        ImportResult result)
    {
        foreach (var dashboard in dashboards)
        {
            try
            {
                // Remap widget references
                foreach (var widget in dashboard.Widgets)
                {
                    RemapWidgetReferences(widget, idMap);
                }

                // Check for conflicts
                var existing = await _dashboardService.FindDashboardByNameAsync(tenantId, dashboard.Name);
                
                if (existing != null)
                {
                    if (options.ConflictResolution == ConflictResolution.Skip)
                    {
                        if (!result.Skipped.ContainsKey("dashboards"))
                            result.Skipped["dashboards"] = new List<string>();
                        result.Skipped["dashboards"].Add($"Dashboard already exists: {dashboard.Name}");
                        idMap[dashboard.LocalId] = existing.Id;
                        continue;
                    }
                    else if (options.ConflictResolution == ConflictResolution.Rename)
                    {
                        dashboard.Name = $"{dashboard.Name} (Imported {DateTime.UtcNow:yyyyMMdd})";
                    }
                }

                // Create dashboard
                var dashboardId = await _dashboardService.CreateDashboardAsync(tenantId, dashboard);
                idMap[dashboard.LocalId] = dashboardId;
                result.Imported.Dashboards++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing dashboard {DashboardName}", dashboard.Name);
                result.Errors.Add($"Failed to import dashboard '{dashboard.Name}': {ex.Message}");
            }
        }
    }

    private async Task ImportAlertRulesAsync(
        Guid tenantId, 
        List<AlertRuleResource> alertRules, 
        Dictionary<string, Guid> idMap, 
        ImportOptions options, 
        ImportResult result)
    {
        foreach (var alertRule in alertRules)
        {
            try
            {
                // Resolve device type reference
                Guid? deviceTypeId = null;
                if (!string.IsNullOrEmpty(alertRule.DeviceTypeRef) && idMap.ContainsKey(alertRule.DeviceTypeRef))
                {
                    deviceTypeId = idMap[alertRule.DeviceTypeRef];
                }

                // Check for conflicts
                var existing = await _alertsService.FindAlertRuleByNameAsync(tenantId, alertRule.Name);
                
                if (existing != null)
                {
                    if (options.ConflictResolution == ConflictResolution.Skip)
                    {
                        if (!result.Skipped.ContainsKey("alertRules"))
                            result.Skipped["alertRules"] = new List<string>();
                        result.Skipped["alertRules"].Add($"Alert rule already exists: {alertRule.Name}");
                        idMap[alertRule.LocalId] = existing.Id;
                        continue;
                    }
                    else if (options.ConflictResolution == ConflictResolution.Rename)
                    {
                        alertRule.Name = $"{alertRule.Name} (Imported {DateTime.UtcNow:yyyyMMdd})";
                    }
                }

                // Create alert rule
                var alertRuleId = await _alertsService.CreateAlertRuleAsync(tenantId, alertRule, deviceTypeId);
                idMap[alertRule.LocalId] = alertRuleId;
                result.Imported.AlertRules++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing alert rule {AlertRuleName}", alertRule.Name);
                result.Errors.Add($"Failed to import alert rule '{alertRule.Name}': {ex.Message}");
            }
        }
    }

    private async Task ImportAssetsAsync(
        Guid tenantId, 
        List<AssetResource> assets, 
        Dictionary<string, Guid> idMap, 
        ImportOptions options, 
        ImportResult result)
    {
        // Sort assets by hierarchy level (roots first)
        var sortedAssets = TopologicalSortAssets(assets);

        foreach (var asset in sortedAssets)
        {
            try
            {
                // Resolve parent reference
                Guid? parentId = null;
                if (!string.IsNullOrEmpty(asset.ParentRef) && idMap.ContainsKey(asset.ParentRef))
                {
                    parentId = idMap[asset.ParentRef];
                }

                // Create asset
                var assetId = await _digitalTwinService.CreateAssetAsync(tenantId, asset, parentId);
                idMap[asset.LocalId] = assetId;
                result.Imported.Assets++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing asset {AssetName}", asset.Name);
                result.Errors.Add($"Failed to import asset '{asset.Name}': {ex.Message}");
            }
        }
    }

    private List<AssetResource> TopologicalSortAssets(List<AssetResource> assets)
    {
        var sorted = new List<AssetResource>();
        var visited = new HashSet<string>();

        void Visit(AssetResource asset)
        {
            if (visited.Contains(asset.LocalId))
                return;

            visited.Add(asset.LocalId);

            // Visit parent first
            if (!string.IsNullOrEmpty(asset.ParentRef))
            {
                var parent = assets.FirstOrDefault(a => a.LocalId == asset.ParentRef);
                if (parent != null)
                {
                    Visit(parent);
                }
            }

            sorted.Add(asset);
        }

        foreach (var asset in assets)
        {
            Visit(asset);
        }

        return sorted;
    }

    private void RemapWidgetReferences(WidgetResource widget, Dictionary<string, Guid> idMap)
    {
        // Remap deviceTypeRef to deviceTypeId
        if (widget.Config.TryGetValue("deviceTypeRef", out var deviceTypeRefObj)
            && deviceTypeRefObj is string deviceTypeRef
            && idMap.ContainsKey(deviceTypeRef))
        {
            widget.Config["deviceTypeId"] = idMap[deviceTypeRef].ToString();
            widget.Config.Remove("deviceTypeRef");
        }

        // Remap assetRef to assetId
        if (widget.Config.TryGetValue("assetRef", out var assetRefObj)
            && assetRefObj is string assetRef
            && idMap.ContainsKey(assetRef))
        {
            widget.Config["assetId"] = idMap[assetRef].ToString();
            widget.Config.Remove("assetRef");
        }
    }
}

