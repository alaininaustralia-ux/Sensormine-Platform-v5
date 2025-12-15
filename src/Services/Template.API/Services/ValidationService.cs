using Template.API.Models;
using TemplateModel = Template.API.Models.Template;

namespace Template.API.Services;

public class ValidationService
{
    private readonly ILogger<ValidationService> _logger;

    public ValidationService(ILogger<ValidationService> logger)
    {
        _logger = logger;
    }

    public Task<ValidationResult> ValidateTemplateAsync(TemplateModel template)
    {
        var result = new ValidationResult { IsValid = true };

        // Validate template metadata
        ValidateMetadata(template.Metadata, result);

        // Validate resources
        ValidateSchemas(template.Resources.Schemas, result);
        ValidateDeviceTypes(template.Resources.DeviceTypes, template.Resources.Schemas, result);
        ValidateDashboards(template.Resources.Dashboards, template.Resources.DeviceTypes, result);
        ValidateAlertRules(template.Resources.AlertRules, template.Resources.DeviceTypes, result);
        ValidateAssets(template.Resources.Assets, result);

        // Validate references
        ValidateReferences(template, result);

        result.IsValid = !result.Errors.Any();
        return Task.FromResult(result);
    }

    private void ValidateMetadata(TemplateMetadata metadata, ValidationResult result)
    {
        if (string.IsNullOrWhiteSpace(metadata.Name))
        {
            result.Errors.Add(new ValidationError
            {
                Code = "METADATA_NAME_REQUIRED",
                Message = "Template name is required"
            });
        }

        if (string.IsNullOrWhiteSpace(metadata.Version))
        {
            result.Errors.Add(new ValidationError
            {
                Code = "METADATA_VERSION_REQUIRED",
                Message = "Template version is required"
            });
        }

        if (!IsValidSemVer(metadata.Version))
        {
            result.Errors.Add(new ValidationError
            {
                Code = "METADATA_VERSION_INVALID",
                Message = "Template version must be valid semantic version (e.g., 1.0.0)"
            });
        }

        if (metadata.SchemaVersion != "1.0")
        {
            result.Errors.Add(new ValidationError
            {
                Code = "SCHEMA_VERSION_UNSUPPORTED",
                Message = $"Schema version {metadata.SchemaVersion} is not supported. Supported versions: 1.0"
            });
        }
    }

    private void ValidateSchemas(List<SchemaResource> schemas, ValidationResult result)
    {
        var localIds = new HashSet<string>();

        foreach (var schema in schemas)
        {
            if (string.IsNullOrWhiteSpace(schema.LocalId))
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "SCHEMA_LOCALID_REQUIRED",
                    Message = "Schema localId is required",
                    ResourceType = "Schema",
                    ResourceId = schema.Name
                });
            }
            else if (localIds.Contains(schema.LocalId))
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "SCHEMA_LOCALID_DUPLICATE",
                    Message = $"Duplicate localId: {schema.LocalId}",
                    ResourceType = "Schema",
                    ResourceId = schema.LocalId
                });
            }
            else
            {
                localIds.Add(schema.LocalId);
            }

            if (string.IsNullOrWhiteSpace(schema.Name))
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "SCHEMA_NAME_REQUIRED",
                    Message = "Schema name is required",
                    ResourceType = "Schema",
                    ResourceId = schema.LocalId
                });
            }

            if (schema.SchemaDefinition == null || !schema.SchemaDefinition.Any())
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "SCHEMA_DEFINITION_REQUIRED",
                    Message = "Schema definition is required",
                    ResourceType = "Schema",
                    ResourceId = schema.LocalId
                });
            }
        }
    }

    private void ValidateDeviceTypes(List<DeviceTypeResource> deviceTypes, List<SchemaResource> schemas, ValidationResult result)
    {
        var localIds = new HashSet<string>();
        var schemaIds = schemas.Select(s => s.LocalId).ToHashSet();

        foreach (var deviceType in deviceTypes)
        {
            if (string.IsNullOrWhiteSpace(deviceType.LocalId))
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "DEVICETYPE_LOCALID_REQUIRED",
                    Message = "Device type localId is required",
                    ResourceType = "DeviceType",
                    ResourceId = deviceType.Name
                });
            }
            else if (localIds.Contains(deviceType.LocalId))
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "DEVICETYPE_LOCALID_DUPLICATE",
                    Message = $"Duplicate localId: {deviceType.LocalId}",
                    ResourceType = "DeviceType",
                    ResourceId = deviceType.LocalId
                });
            }
            else
            {
                localIds.Add(deviceType.LocalId);
            }

            if (string.IsNullOrWhiteSpace(deviceType.Name))
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "DEVICETYPE_NAME_REQUIRED",
                    Message = "Device type name is required",
                    ResourceType = "DeviceType",
                    ResourceId = deviceType.LocalId
                });
            }

            // Validate schema reference
            if (!string.IsNullOrEmpty(deviceType.SchemaRef) && !schemaIds.Contains(deviceType.SchemaRef))
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "DEVICETYPE_SCHEMA_NOT_FOUND",
                    Message = $"Schema reference not found: {deviceType.SchemaRef}",
                    ResourceType = "DeviceType",
                    ResourceId = deviceType.LocalId
                });
            }
        }
    }

    private void ValidateDashboards(List<DashboardResource> dashboards, List<DeviceTypeResource> deviceTypes, ValidationResult result)
    {
        var localIds = new HashSet<string>();
        var deviceTypeIds = deviceTypes.Select(dt => dt.LocalId).ToHashSet();

        foreach (var dashboard in dashboards)
        {
            if (string.IsNullOrWhiteSpace(dashboard.LocalId))
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "DASHBOARD_LOCALID_REQUIRED",
                    Message = "Dashboard localId is required",
                    ResourceType = "Dashboard",
                    ResourceId = dashboard.Name
                });
            }
            else if (localIds.Contains(dashboard.LocalId))
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "DASHBOARD_LOCALID_DUPLICATE",
                    Message = $"Duplicate localId: {dashboard.LocalId}",
                    ResourceType = "Dashboard",
                    ResourceId = dashboard.LocalId
                });
            }
            else
            {
                localIds.Add(dashboard.LocalId);
            }

            // Validate widget references
            foreach (var widget in dashboard.Widgets)
            {
                if (widget.Config.TryGetValue("deviceTypeRef", out var deviceTypeRef)
                    && deviceTypeRef is string dtRef
                    && !string.IsNullOrEmpty(dtRef)
                    && !deviceTypeIds.Contains(dtRef))
                {
                    result.Warnings.Add(new ValidationWarning
                    {
                        Message = $"Widget references unknown device type: {dtRef}",
                        ResourceType = "Dashboard"
                    });
                }
            }
        }
    }

    private void ValidateAlertRules(List<AlertRuleResource> alertRules, List<DeviceTypeResource> deviceTypes, ValidationResult result)
    {
        var localIds = new HashSet<string>();
        var deviceTypeIds = deviceTypes.Select(dt => dt.LocalId).ToHashSet();

        foreach (var alertRule in alertRules)
        {
            if (string.IsNullOrWhiteSpace(alertRule.LocalId))
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "ALERTRULE_LOCALID_REQUIRED",
                    Message = "Alert rule localId is required",
                    ResourceType = "AlertRule",
                    ResourceId = alertRule.Name
                });
            }
            else if (localIds.Contains(alertRule.LocalId))
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "ALERTRULE_LOCALID_DUPLICATE",
                    Message = $"Duplicate localId: {alertRule.LocalId}",
                    ResourceType = "AlertRule",
                    ResourceId = alertRule.LocalId
                });
            }
            else
            {
                localIds.Add(alertRule.LocalId);
            }

            if (string.IsNullOrWhiteSpace(alertRule.Condition))
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "ALERTRULE_CONDITION_REQUIRED",
                    Message = "Alert rule condition is required",
                    ResourceType = "AlertRule",
                    ResourceId = alertRule.LocalId
                });
            }

            // Validate device type reference
            if (!string.IsNullOrEmpty(alertRule.DeviceTypeRef) && !deviceTypeIds.Contains(alertRule.DeviceTypeRef))
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "ALERTRULE_DEVICETYPE_NOT_FOUND",
                    Message = $"Device type reference not found: {alertRule.DeviceTypeRef}",
                    ResourceType = "AlertRule",
                    ResourceId = alertRule.LocalId
                });
            }
        }
    }

    private void ValidateAssets(List<AssetResource> assets, ValidationResult result)
    {
        var localIds = new HashSet<string>();

        foreach (var asset in assets)
        {
            if (string.IsNullOrWhiteSpace(asset.LocalId))
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "ASSET_LOCALID_REQUIRED",
                    Message = "Asset localId is required",
                    ResourceType = "Asset",
                    ResourceId = asset.Name
                });
            }
            else if (localIds.Contains(asset.LocalId))
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "ASSET_LOCALID_DUPLICATE",
                    Message = $"Duplicate localId: {asset.LocalId}",
                    ResourceType = "Asset",
                    ResourceId = asset.LocalId
                });
            }
            else
            {
                localIds.Add(asset.LocalId);
            }
        }

        // Check for circular references in parent-child relationships
        foreach (var asset in assets)
        {
            if (!string.IsNullOrEmpty(asset.ParentRef) && HasCircularReference(asset, assets))
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "ASSET_CIRCULAR_REFERENCE",
                    Message = "Circular reference detected in asset hierarchy",
                    ResourceType = "Asset",
                    ResourceId = asset.LocalId
                });
            }
        }
    }

    private bool HasCircularReference(AssetResource asset, List<AssetResource> allAssets)
    {
        var visited = new HashSet<string> { asset.LocalId };
        var current = asset;

        while (!string.IsNullOrEmpty(current.ParentRef))
        {
            if (visited.Contains(current.ParentRef))
                return true;

            visited.Add(current.ParentRef);
            current = allAssets.FirstOrDefault(a => a.LocalId == current.ParentRef);
            
            if (current == null)
                break;
        }

        return false;
    }

    private void ValidateReferences(TemplateModel template, ValidationResult result)
    {
        // Ensure all references in mappings exist
        var allLocalIds = new HashSet<string>();
        allLocalIds.UnionWith(template.Resources.Schemas.Select(s => s.LocalId));
        allLocalIds.UnionWith(template.Resources.DeviceTypes.Select(dt => dt.LocalId));
        allLocalIds.UnionWith(template.Resources.Dashboards.Select(d => d.LocalId));
        allLocalIds.UnionWith(template.Resources.AlertRules.Select(a => a.LocalId));
        allLocalIds.UnionWith(template.Resources.Assets.Select(a => a.LocalId));

        foreach (var (source, targets) in template.Mappings.References)
        {
            if (!allLocalIds.Contains(source))
            {
                result.Warnings.Add(new ValidationWarning
                {
                    Message = $"Mapping references unknown source: {source}"
                });
            }

            foreach (var target in targets)
            {
                if (!allLocalIds.Contains(target))
                {
                    result.Warnings.Add(new ValidationWarning
                    {
                        Message = $"Mapping references unknown target: {target}"
                    });
                }
            }
        }
    }

    private bool IsValidSemVer(string version)
    {
        if (string.IsNullOrWhiteSpace(version))
            return false;

        var parts = version.Split('.');
        if (parts.Length < 2 || parts.Length > 3)
            return false;

        return parts.All(p => int.TryParse(p, out _));
    }
}

