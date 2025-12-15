namespace Template.API.Models;

public class SchemaResource
{
    public string LocalId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Version { get; set; } = "1.0.0";
    public Dictionary<string, object> SchemaDefinition { get; set; } = new();
    public string? Description { get; set; }
}

public class DeviceTypeResource
{
    public string LocalId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? SchemaRef { get; set; }
    public Dictionary<string, object>? CustomFields { get; set; }
    public List<FieldMappingResource> FieldMappings { get; set; } = new();
    public string? Icon { get; set; }
    public string? Color { get; set; }
}

public class FieldMappingResource
{
    public string FieldName { get; set; } = string.Empty;
    public string FriendlyName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Unit { get; set; }
    public string DataType { get; set; } = "String";
    public bool IsQueryable { get; set; } = true;
    public bool IsVisible { get; set; } = true;
    public string FieldSource { get; set; } = "Schema";
}

public class AssetResource
{
    public string LocalId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Equipment";
    public string? ParentRef { get; set; }
    public string? Icon { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
    public Dictionary<string, object>? Location { get; set; }
}

public class DashboardResource
{
    public string LocalId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DashboardLayout Layout { get; set; } = new();
    public List<WidgetResource> Widgets { get; set; } = new();
    public Dictionary<string, object>? Filters { get; set; }
}

public class DashboardLayout
{
    public int Columns { get; set; } = 12;
    public int RowHeight { get; set; } = 60;
}

public class WidgetResource
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public WidgetPosition Position { get; set; } = new();
    public Dictionary<string, object> Config { get; set; } = new();
}

public class WidgetPosition
{
    public int X { get; set; }
    public int Y { get; set; }
    public int W { get; set; }
    public int H { get; set; }
}

public class AlertRuleResource
{
    public string LocalId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Condition { get; set; } = string.Empty;
    public string? DeviceTypeRef { get; set; }
    public string? DeviceRef { get; set; }
    public int Severity { get; set; } = 1;
    public bool IsEnabled { get; set; } = true;
    public List<AlertAction> Actions { get; set; } = new();
    public int CooldownMinutes { get; set; } = 15;
}

public class AlertAction
{
    public string Type { get; set; } = string.Empty;
    public Dictionary<string, object> Config { get; set; } = new();
}

public class NexusConfigurationResource
{
    public string LocalId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Protocol { get; set; } = "MQTT";
    public Dictionary<string, object> Configuration { get; set; } = new();
    public string AuthType { get; set; } = "None";
    public bool IsEnabled { get; set; } = true;
}

public class NavigationResource
{
    public string LocalId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<NavigationItem> Items { get; set; } = new();
}

public class NavigationItem
{
    public string Label { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? DashboardRef { get; set; }
    public string? Icon { get; set; }
    public Dictionary<string, object>? Filter { get; set; }
}
