using Sensormine.Core.Models;
using Sensormine.Core.Repositories;
using Device.API.Services;
using System.Text.Json;

namespace Device.API.Services;

/// <summary>
/// Service for managing field mappings - combining schema fields, custom fields, and user-defined friendly names
/// </summary>
public interface IFieldMappingService
{
    /// <summary>
    /// Get all field mappings for a device type, merging schema fields, custom fields, and stored mappings
    /// </summary>
    Task<List<FieldMapping>> GetFieldMappingsForDeviceTypeAsync(Guid deviceTypeId, string tenantId);

    /// <summary>
    /// Synchronize field mappings for a device type based on its schema and custom fields
    /// </summary>
    Task SynchronizeFieldMappingsAsync(DeviceType deviceType, string tenantId);

    /// <summary>
    /// Update friendly names and metadata for field mappings
    /// </summary>
    Task<List<FieldMapping>> UpdateFieldMappingsAsync(Guid deviceTypeId, List<FieldMapping> updates, string tenantId);
}

public class FieldMappingService : IFieldMappingService
{
    private readonly IFieldMappingRepository _fieldMappingRepo;
    private readonly ISchemaRegistryClient _schemaRegistryClient;
    private readonly IDeviceTypeRepository _deviceTypeRepo;
    private readonly ILogger<FieldMappingService> _logger;

    public FieldMappingService(
        IFieldMappingRepository fieldMappingRepo,
        ISchemaRegistryClient schemaRegistryClient,
        IDeviceTypeRepository deviceTypeRepo,
        ILogger<FieldMappingService> logger)
    {
        _fieldMappingRepo = fieldMappingRepo;
        _schemaRegistryClient = schemaRegistryClient;
        _deviceTypeRepo = deviceTypeRepo;
        _logger = logger;
    }

    public async Task<List<FieldMapping>> GetFieldMappingsForDeviceTypeAsync(Guid deviceTypeId, string tenantId)
    {
        var deviceType = await _deviceTypeRepo.GetByIdAsync(deviceTypeId, tenantId);
        if (deviceType == null)
        {
            _logger.LogWarning("Device type {DeviceTypeId} not found", deviceTypeId);
            return new List<FieldMapping>();
        }

        // Get existing field mappings
        var existingMappings = (await _fieldMappingRepo.GetByDeviceTypeIdAsync(deviceTypeId, tenantId))
            .ToDictionary(fm => fm.FieldName, fm => fm);

        var allMappings = new List<FieldMapping>();
        int displayOrder = 0;

        // Add standard telemetry fields
        var standardFields = GetStandardFields();
        foreach (var field in standardFields)
        {
            if (existingMappings.TryGetValue(field.FieldName, out var existing))
            {
                allMappings.Add(existing);
            }
            else
            {
                field.DeviceTypeId = deviceTypeId;
                field.TenantId = Guid.Parse(tenantId);
                field.DisplayOrder = displayOrder++;
                allMappings.Add(field);
            }
        }

        // Add schema fields if schema is assigned
        if (deviceType.SchemaId.HasValue)
        {
            var schemaFields = await GetSchemaFieldsAsync(deviceType.SchemaId.Value);
            foreach (var field in schemaFields)
            {
                if (existingMappings.TryGetValue(field.FieldName, out var existing))
                {
                    allMappings.Add(existing);
                }
                else
                {
                    field.DeviceTypeId = deviceTypeId;
                    field.TenantId = Guid.Parse(tenantId);
                    field.DisplayOrder = displayOrder++;
                    allMappings.Add(field);
                }
            }
        }

        // Add custom fields
        foreach (var customField in deviceType.CustomFields ?? new List<CustomFieldDefinition>())
        {
            if (existingMappings.TryGetValue(customField.Name, out var existing))
            {
                allMappings.Add(existing);
            }
            else
            {
                var mapping = new FieldMapping
                {
                    DeviceTypeId = deviceTypeId,
                    TenantId = Guid.Parse(tenantId),
                    FieldName = customField.Name,
                    FieldSource = FieldSource.CustomField,
                    FriendlyName = customField.Label ?? customField.Name,
                    Description = customField.HelpText,
                    DataType = MapCustomFieldType(customField.Type.ToString()),
                    IsQueryable = true,
                    IsVisible = customField.Required,
                    DisplayOrder = displayOrder++,
                    Category = "Custom Fields"
                };
                allMappings.Add(mapping);
            }
        }

        return allMappings.OrderBy(m => m.DisplayOrder).ThenBy(m => m.FriendlyName).ToList();
    }

    public async Task SynchronizeFieldMappingsAsync(DeviceType deviceType, string tenantId)
    {
        var currentMappings = await GetFieldMappingsForDeviceTypeAsync(deviceType.Id, tenantId);
        var existingMappings = (await _fieldMappingRepo.GetByDeviceTypeIdAsync(deviceType.Id, tenantId))
            .ToDictionary(fm => fm.FieldName);

        var toCreate = new List<FieldMapping>();
        var toUpdate = new List<FieldMapping>();

        foreach (var mapping in currentMappings)
        {
            if (existingMappings.ContainsKey(mapping.FieldName))
            {
                // Update existing - preserve user customizations
                var existing = existingMappings[mapping.FieldName];
                existing.DataType = mapping.DataType;  // Update data type if it changed
                existing.FieldSource = mapping.FieldSource;
                toUpdate.Add(existing);
            }
            else
            {
                // Create new
                toCreate.Add(mapping);
            }
        }

        if (toCreate.Any())
        {
            await _fieldMappingRepo.CreateManyAsync(toCreate);
        }

        if (toUpdate.Any())
        {
            await _fieldMappingRepo.UpdateManyAsync(toUpdate);
        }

        _logger.LogInformation("Synchronized field mappings for device type {DeviceTypeId}: {Created} created, {Updated} updated",
            deviceType.Id, toCreate.Count, toUpdate.Count);
    }

    public async Task<List<FieldMapping>> UpdateFieldMappingsAsync(Guid deviceTypeId, List<FieldMapping> updates, string tenantId)
    {
        var existingMappings = (await _fieldMappingRepo.GetByDeviceTypeIdAsync(deviceTypeId, tenantId))
            .ToDictionary(fm => fm.FieldName);

        var updated = new List<FieldMapping>();

        foreach (var update in updates)
        {
            if (existingMappings.TryGetValue(update.FieldName, out var existing))
            {
                // Update user-editable fields
                existing.FriendlyName = update.FriendlyName;
                existing.Description = update.Description;
                existing.Unit = update.Unit;
                existing.IsVisible = update.IsVisible;
                existing.IsQueryable = update.IsQueryable;
                existing.DisplayOrder = update.DisplayOrder;
                existing.Category = update.Category;
                existing.Tags = update.Tags;
                existing.DefaultAggregation = update.DefaultAggregation;
                existing.FormatString = update.FormatString;
                existing.MinValue = update.MinValue;
                existing.MaxValue = update.MaxValue;

                await _fieldMappingRepo.UpdateAsync(existing);
                updated.Add(existing);
            }
        }

        return updated;
    }

    private List<FieldMapping> GetStandardFields()
    {
        return new List<FieldMapping>
        {
            new FieldMapping
            {
                FieldName = "battery_level",
                FieldSource = FieldSource.System,
                FriendlyName = "Battery Level",
                Description = "Device battery level percentage",
                Unit = "%",
                DataType = FieldDataType.Number,
                MinValue = 0,
                MaxValue = 100,
                IsQueryable = true,
                IsVisible = true,
                Category = "System",
                DefaultAggregation = "avg",
                SupportsAggregations = new List<string> { "avg", "min", "max", "last" }
            },
            new FieldMapping
            {
                FieldName = "signal_strength",
                FieldSource = FieldSource.System,
                FriendlyName = "Signal Strength",
                Description = "Device signal strength",
                Unit = "dBm",
                DataType = FieldDataType.Number,
                MinValue = -120,
                MaxValue = 0,
                IsQueryable = true,
                IsVisible = true,
                Category = "System",
                DefaultAggregation = "avg",
                SupportsAggregations = new List<string> { "avg", "min", "max", "last" }
            },
            new FieldMapping
            {
                FieldName = "latitude",
                FieldSource = FieldSource.System,
                FriendlyName = "Latitude",
                Description = "Device latitude coordinate",
                Unit = "°",
                DataType = FieldDataType.Number,
                IsQueryable = true,
                IsVisible = false,
                Category = "Location",
                DefaultAggregation = "last"
            },
            new FieldMapping
            {
                FieldName = "longitude",
                FieldSource = FieldSource.System,
                FriendlyName = "Longitude",
                Description = "Device longitude coordinate",
                Unit = "°",
                DataType = FieldDataType.Number,
                IsQueryable = true,
                IsVisible = false,
                Category = "Location",
                DefaultAggregation = "last"
            }
        };
    }

    private async Task<List<FieldMapping>> GetSchemaFieldsAsync(Guid schemaId)
    {
        try
        {
            var schema = await _schemaRegistryClient.GetSchemaAsync(schemaId);
            if (schema == null)
            {
                _logger.LogWarning("Schema {SchemaId} not found", schemaId);
                return new List<FieldMapping>();
            }

            // Parse schema definition (JSON Schema or Avro)
            var fields = new List<FieldMapping>();

            if (schema.SchemaType == "JsonSchema")
            {
                fields = ParseJsonSchemaFields(schema.SchemaDefinition);
            }
            else if (schema.SchemaType == "Avro")
            {
                fields = ParseAvroSchemaFields(schema.SchemaDefinition);
            }

            return fields;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching schema fields for schema {SchemaId}", schemaId);
            return new List<FieldMapping>();
        }
    }

    private List<FieldMapping> ParseJsonSchemaFields(JsonDocument schemaDefinition)
    {
        var fields = new List<FieldMapping>();

        try
        {
            if (schemaDefinition.RootElement.TryGetProperty("properties", out var properties))
            {
                foreach (var property in properties.EnumerateObject())
                {
                    var fieldName = property.Name;
                    var fieldDef = property.Value;

                    var mapping = new FieldMapping
                    {
                        FieldName = fieldName,
                        FieldSource = FieldSource.Schema,
                        FriendlyName = TitleCase(fieldName),
                        DataType = MapJsonSchemaType(fieldDef),
                        IsQueryable = true,
                        IsVisible = true,
                        Category = "Telemetry"
                    };

                    if (fieldDef.TryGetProperty("description", out var desc))
                    {
                        mapping.Description = desc.GetString();
                    }

                    if (fieldDef.TryGetProperty("unit", out var unit))
                    {
                        mapping.Unit = unit.GetString();
                    }

                    fields.Add(mapping);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing JSON schema fields");
        }

        return fields;
    }

    private List<FieldMapping> ParseAvroSchemaFields(JsonDocument schemaDefinition)
    {
        var fields = new List<FieldMapping>();

        try
        {
            if (schemaDefinition.RootElement.TryGetProperty("fields", out var avroFields))
            {
                foreach (var field in avroFields.EnumerateArray())
                {
                    var fieldName = field.GetProperty("name").GetString() ?? "";
                    var fieldType = field.GetProperty("type");

                    var mapping = new FieldMapping
                    {
                        FieldName = fieldName,
                        FieldSource = FieldSource.Schema,
                        FriendlyName = TitleCase(fieldName),
                        DataType = MapAvroType(fieldType),
                        IsQueryable = true,
                        IsVisible = true,
                        Category = "Telemetry"
                    };

                    if (field.TryGetProperty("doc", out var doc))
                    {
                        mapping.Description = doc.GetString();
                    }

                    fields.Add(mapping);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing Avro schema fields");
        }

        return fields;
    }

    private FieldDataType MapJsonSchemaType(JsonElement fieldDef)
    {
        if (fieldDef.TryGetProperty("type", out var typeEl))
        {
            var type = typeEl.GetString()?.ToLower();
            return type switch
            {
                "number" => FieldDataType.Number,
                "integer" => FieldDataType.Number,
                "string" => FieldDataType.String,
                "boolean" => FieldDataType.Boolean,
                "object" => FieldDataType.Object,
                "array" => FieldDataType.Array,
                _ => FieldDataType.String
            };
        }
        return FieldDataType.String;
    }

    private FieldDataType MapAvroType(JsonElement typeEl)
    {
        var type = typeEl.ValueKind == JsonValueKind.String 
            ? typeEl.GetString()?.ToLower()
            : typeEl.GetProperty("type").GetString()?.ToLower();

        return type switch
        {
            "int" => FieldDataType.Number,
            "long" => FieldDataType.Number,
            "float" => FieldDataType.Number,
            "double" => FieldDataType.Number,
            "string" => FieldDataType.String,
            "boolean" => FieldDataType.Boolean,
            "record" => FieldDataType.Object,
            "array" => FieldDataType.Array,
            _ => FieldDataType.String
        };
    }

    private FieldDataType MapCustomFieldType(string customFieldType)
    {
        return customFieldType.ToLower() switch
        {
            "text" => FieldDataType.String,
            "number" => FieldDataType.Number,
            "boolean" => FieldDataType.Boolean,
            "date" => FieldDataType.Timestamp,
            "datetime" => FieldDataType.Timestamp,
            _ => FieldDataType.String
        };
    }

    private string TitleCase(string input)
    {
        if (string.IsNullOrEmpty(input))
            return input;

        // Convert snake_case or camelCase to Title Case
        var words = System.Text.RegularExpressions.Regex.Replace(input, "([a-z])([A-Z])", "$1 $2");
        words = words.Replace("_", " ");
        return System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(words.ToLower());
    }
}
