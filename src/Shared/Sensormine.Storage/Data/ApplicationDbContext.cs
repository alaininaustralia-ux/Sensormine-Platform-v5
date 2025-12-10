using Microsoft.EntityFrameworkCore;
using Sensormine.Core.Models;

namespace Sensormine.Storage.Data;

/// <summary>
/// Main database context for the Sensormine platform
/// </summary>
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Schema Management
    public DbSet<Schema> Schemas { get; set; } = null!;
    public DbSet<SchemaVersion> SchemaVersions { get; set; } = null!;

    // Device Type Management
    public DbSet<DeviceType> DeviceTypes { get; set; } = null!;
    public DbSet<DeviceTypeVersion> DeviceTypeVersions { get; set; } = null!;
    public DbSet<DeviceTypeAuditLog> DeviceTypeAuditLogs { get; set; } = null!;
    public DbSet<FieldMapping> FieldMappings { get; set; } = null!;

    // Device Management
    public DbSet<Device> Devices { get; set; } = null!;

    // User Preferences & Site Configuration
    public DbSet<UserPreference> UserPreferences { get; set; } = null!;
    public DbSet<SiteConfiguration> SiteConfigurations { get; set; } = null!;

    // Dashboard Management
    public DbSet<Dashboard> Dashboards { get; set; } = null!;

    // Alert Management
    public DbSet<AlertRule> AlertRules { get; set; } = null!;
    public DbSet<AlertInstance> AlertInstances { get; set; } = null!;
    public DbSet<AlertDeliveryChannel> AlertDeliveryChannels { get; set; } = null!;

    // Digital Twin Management
    public DbSet<Asset> Assets { get; set; } = null!;
    public DbSet<AssetState> AssetStates { get; set; } = null!;
    public DbSet<DataPointMapping> DataPointMappings { get; set; } = null!;
    public DbSet<AssetRollupConfig> AssetRollupConfigs { get; set; } = null!;
    public DbSet<AssetRollupData> AssetRollupData { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureSchemaEntities(modelBuilder);
        ConfigureDeviceTypeEntities(modelBuilder);
        ConfigureDeviceTypeVersioningEntities(modelBuilder);
        ConfigureDeviceEntities(modelBuilder);
        ConfigureUserPreferenceEntities(modelBuilder);
        ConfigureSiteConfigurationEntities(modelBuilder);
        ConfigureDashboardEntities(modelBuilder);
        ConfigureAlertEntities(modelBuilder);
        ConfigureAssetEntities(modelBuilder);
    }

    private void ConfigureSchemaEntities(ModelBuilder modelBuilder)
    {
        // Schema Configuration
        modelBuilder.Entity<Schema>(entity =>
        {
            entity.ToTable("schemas");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedNever();

            entity.Property(e => e.Name)
                .HasColumnName("name")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(e => e.Description)
                .HasColumnName("description")
                .HasMaxLength(1000);

            entity.Property(e => e.TenantId)
                .HasColumnName("tenant_id")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at");

            entity.Property(e => e.CreatedBy)
                .HasColumnName("created_by")
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(e => e.UpdatedBy)
                .HasColumnName("updated_by")
                .HasMaxLength(255);

            entity.Property(e => e.IsDeleted)
                .HasColumnName("is_deleted")
                .HasDefaultValue(false);

            entity.Property(e => e.DeletedAt)
                .HasColumnName("deleted_at");

            // Indexes
            entity.HasIndex(e => new { e.TenantId, e.Name })
                .HasDatabaseName("ix_schemas_tenant_name")
                .IsUnique()
                .HasFilter("is_deleted = false");

            entity.HasIndex(e => e.TenantId)
                .HasDatabaseName("ix_schemas_tenant");

            entity.HasIndex(e => e.IsDeleted)
                .HasDatabaseName("ix_schemas_deleted");

            // Relationships
            entity.HasMany(e => e.Versions)
                .WithOne(v => v.Schema)
                .HasForeignKey(v => v.SchemaId)
                .OnDelete(DeleteBehavior.Cascade);

            // Query filter for soft delete
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // SchemaVersion Configuration
        modelBuilder.Entity<SchemaVersion>(entity =>
        {
            entity.ToTable("schema_versions");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedNever();

            entity.Property(e => e.SchemaId)
                .HasColumnName("schema_id")
                .IsRequired();

            entity.Property(e => e.Version)
                .HasColumnName("version")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.JsonSchema)
                .HasColumnName("json_schema")
                .HasColumnType("text")
                .IsRequired();

            entity.Property(e => e.Status)
                .HasColumnName("status")
                .HasConversion<string>()
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.IsDefault)
                .HasColumnName("is_default")
                .HasDefaultValue(false);

            entity.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(e => e.TenantId)
                .HasColumnName("tenant_id")
                .HasMaxLength(100)
                .IsRequired();

            // Store DeviceTypes as JSON array
            entity.Property(e => e.DeviceTypes)
                .HasColumnName("device_types")
                .HasColumnType("jsonb");

            // Indexes
            entity.HasIndex(e => new { e.SchemaId, e.Version })
                .HasDatabaseName("ix_schema_versions_schema_version")
                .IsUnique();

            entity.HasIndex(e => new { e.SchemaId, e.IsDefault })
                .HasDatabaseName("ix_schema_versions_schema_default")
                .HasFilter("is_default = true");

            entity.HasIndex(e => e.Status)
                .HasDatabaseName("ix_schema_versions_status");

            entity.HasIndex(e => e.TenantId)
                .HasDatabaseName("ix_schema_versions_tenant");
        });
    }

    private void ConfigureDeviceTypeEntities(ModelBuilder modelBuilder)
    {
        // DeviceType Configuration
        modelBuilder.Entity<DeviceType>(entity =>
        {
            entity.ToTable("device_types");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            entity.Property(e => e.TenantId)
                .HasColumnName("tenant_id")
                .IsRequired();

            entity.Property(e => e.Name)
                .HasColumnName("name")
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(e => e.Description)
                .HasColumnName("description")
                .HasColumnType("text");

            entity.Property(e => e.Protocol)
                .HasColumnName("protocol")
                .HasConversion<string>()
                .HasMaxLength(50)
                .IsRequired();

            // Store ProtocolConfig as JSONB
            entity.Property(e => e.ProtocolConfig)
                .HasColumnName("protocol_config")
                .HasColumnType("jsonb")
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<ProtocolConfig>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new ProtocolConfig())
                .IsRequired();

            entity.Property(e => e.SchemaId)
                .HasColumnName("schema_id");

            // Store CustomFields as JSONB array
            entity.Property(e => e.CustomFields)
                .HasColumnName("custom_fields")
                .HasColumnType("jsonb")
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<List<CustomFieldDefinition>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<CustomFieldDefinition>());

            // Store AlertTemplates as JSONB array
            entity.Property(e => e.AlertTemplates)
                .HasColumnName("alert_templates")
                .HasColumnType("jsonb")
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<List<AlertRuleTemplate>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<AlertRuleTemplate>());

            // Store Tags as PostgreSQL array
            entity.Property(e => e.Tags)
                .HasColumnName("tags")
                .HasColumnType("text[]");

            entity.Property(e => e.IsActive)
                .HasColumnName("is_active")
                .HasDefaultValue(true);

            entity.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at")
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasColumnName("created_by")
                .HasMaxLength(255);

            // Indexes
            entity.HasIndex(e => e.TenantId)
                .HasDatabaseName("ix_device_types_tenant");

            entity.HasIndex(e => new { e.TenantId, e.Name })
                .HasDatabaseName("ix_device_types_tenant_name")
                .IsUnique()
                .HasFilter("is_active = true");

            entity.HasIndex(e => e.Protocol)
                .HasDatabaseName("ix_device_types_protocol");

            entity.HasIndex(e => e.Tags)
                .HasDatabaseName("ix_device_types_tags")
                .HasMethod("gin");

            entity.HasIndex(e => e.IsActive)
                .HasDatabaseName("ix_device_types_active");

            // SchemaId is a logical reference only - no FK constraint (microservices pattern)
            // Schema validation happens at application level via SchemaRegistry.API
            entity.Property(e => e.SchemaId)
                .IsRequired(false);

            // Query filter for soft delete (only show active by default)
            entity.HasQueryFilter(e => e.IsActive);
        });

        // FieldMapping Configuration
        modelBuilder.Entity<FieldMapping>(entity =>
        {
            entity.ToTable("field_mappings");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            entity.Property(e => e.TenantId)
                .HasColumnName("tenant_id")
                .IsRequired();

            entity.Property(e => e.DeviceTypeId)
                .HasColumnName("device_type_id")
                .IsRequired();

            entity.Property(e => e.FieldName)
                .HasColumnName("field_name")
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(e => e.FieldSource)
                .HasColumnName("field_source")
                .HasConversion<string>()
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.FriendlyName)
                .HasColumnName("friendly_name")
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(e => e.Description)
                .HasColumnName("description")
                .HasColumnType("text");

            entity.Property(e => e.Unit)
                .HasColumnName("unit")
                .HasMaxLength(50);

            entity.Property(e => e.DataType)
                .HasColumnName("data_type")
                .HasConversion<string>()
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.MinValue)
                .HasColumnName("min_value");

            entity.Property(e => e.MaxValue)
                .HasColumnName("max_value");

            entity.Property(e => e.IsQueryable)
                .HasColumnName("is_queryable")
                .HasDefaultValue(true);

            entity.Property(e => e.IsVisible)
                .HasColumnName("is_visible")
                .HasDefaultValue(true);

            entity.Property(e => e.DisplayOrder)
                .HasColumnName("display_order")
                .HasDefaultValue(0);

            entity.Property(e => e.Category)
                .HasColumnName("category")
                .HasMaxLength(100);

            entity.Property(e => e.Tags)
                .HasColumnName("tags")
                .HasColumnType("text[]");

            entity.Property(e => e.DefaultAggregation)
                .HasColumnName("default_aggregation")
                .HasMaxLength(50);

            entity.Property(e => e.SupportsAggregations)
                .HasColumnName("supports_aggregations")
                .HasColumnType("text[]");

            entity.Property(e => e.FormatString)
                .HasColumnName("format_string")
                .HasMaxLength(100);

            entity.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at")
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasColumnName("created_by")
                .HasMaxLength(255);

            // Indexes
            entity.HasIndex(e => e.TenantId)
                .HasDatabaseName("ix_field_mappings_tenant");

            entity.HasIndex(e => e.DeviceTypeId)
                .HasDatabaseName("ix_field_mappings_device_type");

            entity.HasIndex(e => new { e.DeviceTypeId, e.FieldName })
                .HasDatabaseName("ix_field_mappings_device_type_field_name")
                .IsUnique();

            entity.HasIndex(e => e.IsQueryable)
                .HasDatabaseName("ix_field_mappings_queryable");

            // Foreign key relationship
            entity.HasOne(e => e.DeviceType)
                .WithMany()
                .HasForeignKey(e => e.DeviceTypeId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private void ConfigureDeviceTypeVersioningEntities(ModelBuilder modelBuilder)
    {
        // DeviceTypeVersion Configuration
        modelBuilder.Entity<DeviceTypeVersion>(entity =>
        {
            entity.ToTable("device_type_versions");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedNever();

            entity.Property(e => e.DeviceTypeId)
                .HasColumnName("device_type_id")
                .IsRequired();

            entity.Property(e => e.Version)
                .HasColumnName("version")
                .IsRequired();

            entity.Property(e => e.VersionData)
                .HasColumnName("version_data")
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(e => e.ChangeSummary)
                .HasColumnName("change_summary")
                .HasColumnType("text");

            entity.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasColumnName("created_by")
                .HasMaxLength(255)
                .IsRequired();

            // Indexes
            entity.HasIndex(e => e.DeviceTypeId)
                .HasDatabaseName("ix_device_type_versions_device_type");

            entity.HasIndex(e => new { e.DeviceTypeId, e.Version })
                .HasDatabaseName("ix_device_type_versions_device_type_version")
                .IsUnique();

            // Foreign key
            entity.HasOne<DeviceType>()
                .WithMany()
                .HasForeignKey(e => e.DeviceTypeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // DeviceTypeAuditLog Configuration
        modelBuilder.Entity<DeviceTypeAuditLog>(entity =>
        {
            entity.ToTable("device_type_audit_logs");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedNever();

            entity.Property(e => e.DeviceTypeId)
                .HasColumnName("device_type_id")
                .IsRequired();

            entity.Property(e => e.TenantId)
                .HasColumnName("tenant_id")
                .IsRequired();

            entity.Property(e => e.Action)
                .HasColumnName("action")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.OldValue)
                .HasColumnName("old_value")
                .HasColumnType("jsonb");

            entity.Property(e => e.NewValue)
                .HasColumnName("new_value")
                .HasColumnType("jsonb");

            entity.Property(e => e.ChangeSummary)
                .HasColumnName("change_summary")
                .HasColumnType("text");

            entity.Property(e => e.Timestamp)
                .HasColumnName("timestamp")
                .IsRequired();

            entity.Property(e => e.UserId)
                .HasColumnName("user_id")
                .HasMaxLength(255)
                .IsRequired();

            // Indexes
            entity.HasIndex(e => e.DeviceTypeId)
                .HasDatabaseName("ix_device_type_audit_logs_device_type");

            entity.HasIndex(e => e.TenantId)
                .HasDatabaseName("ix_device_type_audit_logs_tenant");

            entity.HasIndex(e => e.Timestamp)
                .HasDatabaseName("ix_device_type_audit_logs_timestamp")
                .IsDescending();

            entity.HasIndex(e => e.Action)
                .HasDatabaseName("ix_device_type_audit_logs_action");

            // Foreign key
            entity.HasOne<DeviceType>()
                .WithMany()
                .HasForeignKey(e => e.DeviceTypeId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private void ConfigureDeviceEntities(ModelBuilder modelBuilder)
    {
        // Device Configuration
        modelBuilder.Entity<Device>(entity =>
        {
            entity.ToTable("devices");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedNever();

            entity.Property(e => e.TenantId)
                .HasColumnName("tenant_id")
                .IsRequired();

            entity.Property(e => e.DeviceId)
                .HasColumnName("device_id")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(e => e.Name)
                .HasColumnName("name")
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(e => e.DeviceTypeId)
                .HasColumnName("device_type_id")
                .IsRequired();

            entity.Property(e => e.SerialNumber)
                .HasColumnName("serial_number")
                .HasMaxLength(100);

            entity.Property(e => e.AssetId)
                .HasColumnName("asset_id");

            entity.Property(e => e.CustomFieldValues)
                .HasColumnName("custom_field_values")
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(e => e.Location)
                .HasColumnName("location")
                .HasColumnType("jsonb");

            entity.Property(e => e.Metadata)
                .HasColumnName("metadata")
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(e => e.Status)
                .HasColumnName("status")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.LastSeenAt)
                .HasColumnName("last_seen_at");

            entity.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at")
                .IsRequired();

            // Indexes
            entity.HasIndex(e => e.DeviceId)
                .HasDatabaseName("ix_devices_device_id")
                .IsUnique();

            entity.HasIndex(e => e.DeviceTypeId)
                .HasDatabaseName("ix_devices_device_type_id");

            entity.HasIndex(e => e.TenantId)
                .HasDatabaseName("ix_devices_tenant_id");

            entity.HasIndex(e => e.SerialNumber)
                .HasDatabaseName("ix_devices_serial_number");

            entity.HasIndex(e => e.Status)
                .HasDatabaseName("ix_devices_status");

            entity.HasIndex(e => e.LastSeenAt)
                .HasDatabaseName("ix_devices_last_seen_at");

            // Foreign key to DeviceType
            entity.HasOne(e => e.DeviceType)
                .WithMany()
                .HasForeignKey(e => e.DeviceTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private void ConfigureUserPreferenceEntities(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserPreference>(entity =>
        {
            entity.ToTable("user_preferences");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedNever();

            entity.Property(e => e.TenantId)
                .HasColumnName("tenant_id")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(e => e.UserId)
                .HasColumnName("user_id")
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(e => e.DisplayPreferences)
                .HasColumnName("display_preferences")
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(e => e.NotificationPreferences)
                .HasColumnName("notification_preferences")
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(e => e.DashboardPreferences)
                .HasColumnName("dashboard_preferences")
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(e => e.DataPreferences)
                .HasColumnName("data_preferences")
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(e => e.Favorites)
                .HasColumnName("favorites")
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(e => e.RecentlyViewed)
                .HasColumnName("recently_viewed")
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at")
                .IsRequired();

            // Unique index on tenant_id + user_id
            entity.HasIndex(e => new { e.TenantId, e.UserId })
                .IsUnique()
                .HasDatabaseName("ix_user_preferences_tenant_user");

            entity.HasIndex(e => e.UserId)
                .HasDatabaseName("ix_user_preferences_user");
        });
    }

    private void ConfigureSiteConfigurationEntities(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SiteConfiguration>(entity =>
        {
            entity.ToTable("site_configurations");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedNever();

            entity.Property(e => e.TenantId)
                .HasColumnName("tenant_id")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(e => e.ConfigKey)
                .HasColumnName("config_key")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.SiteSettings)
                .HasColumnName("site_settings")
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(e => e.Features)
                .HasColumnName("features")
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(e => e.Limits)
                .HasColumnName("limits")
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(e => e.Defaults)
                .HasColumnName("defaults")
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(e => e.Integrations)
                .HasColumnName("integrations")
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at")
                .IsRequired();

            entity.Property(e => e.UpdatedBy)
                .HasColumnName("updated_by")
                .HasMaxLength(255)
                .IsRequired();

            // Unique index on tenant_id + config_key
            entity.HasIndex(e => new { e.TenantId, e.ConfigKey })
                .IsUnique()
                .HasDatabaseName("ix_site_configurations_tenant_key");
        });
    }

    private void ConfigureDashboardEntities(ModelBuilder modelBuilder)
    {
        // Dashboard Configuration
        modelBuilder.Entity<Dashboard>(entity =>
        {
            entity.ToTable("dashboards");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            entity.Property(e => e.UserId)
                .HasColumnName("user_id")
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(e => e.TenantId)
                .HasColumnName("tenant_id")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(e => e.Name)
                .HasColumnName("name")
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(e => e.Description)
                .HasColumnName("description")
                .HasMaxLength(1000);

            entity.Property(e => e.Layout)
                .HasColumnName("layout")
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(e => e.Widgets)
                .HasColumnName("widgets")
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(e => e.IsTemplate)
                .HasColumnName("is_template")
                .IsRequired();

            entity.Property(e => e.TemplateCategory)
                .HasColumnName("template_category")
                .HasMaxLength(50);

            entity.Property(e => e.SharedWith)
                .HasColumnName("shared_with")
                .HasColumnType("jsonb");

            entity.Property(e => e.Tags)
                .HasColumnName("tags")
                .HasColumnType("jsonb");

            entity.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at")
                .IsRequired();

            entity.Property(e => e.IsDeleted)
                .HasColumnName("is_deleted")
                .IsRequired();

            entity.Property(e => e.ParentDashboardId)
                .HasColumnName("parent_dashboard_id");

            entity.Property(e => e.DisplayOrder)
                .HasColumnName("display_order")
                .HasDefaultValue(0)
                .IsRequired();

            entity.Property(e => e.DashboardType)
                .HasColumnName("dashboard_type")
                .HasConversion<int>()
                .IsRequired();

            // Self-referencing relationship for hierarchy
            entity.HasOne(e => e.ParentDashboard)
                .WithMany(e => e.SubPages)
                .HasForeignKey(e => e.ParentDashboardId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent cascading deletes

            // Indexes for performance
            entity.HasIndex(e => new { e.TenantId, e.UserId })
                .HasDatabaseName("ix_dashboards_tenant_user");

            entity.HasIndex(e => e.TenantId)
                .HasDatabaseName("ix_dashboards_tenant");

            entity.HasIndex(e => e.UserId)
                .HasDatabaseName("ix_dashboards_user");

            entity.HasIndex(e => e.IsTemplate)
                .HasDatabaseName("ix_dashboards_is_template");

            entity.HasIndex(e => e.ParentDashboardId)
                .HasDatabaseName("ix_dashboards_parent");

            entity.HasIndex(e => new { e.TenantId, e.ParentDashboardId })
                .HasDatabaseName("ix_dashboards_tenant_parent");
        });
    }

    private void ConfigureAlertEntities(ModelBuilder modelBuilder)
    {
        // AlertRule Configuration
        modelBuilder.Entity<AlertRule>(entity =>
        {
            entity.ToTable("alert_rules");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            entity.Property(e => e.TenantId)
                .HasColumnName("tenant_id")
                .IsRequired();

            entity.Property(e => e.Name)
                .HasColumnName("name")
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(e => e.Description)
                .HasColumnName("description")
                .HasColumnType("text");

            entity.Property(e => e.Severity)
                .HasColumnName("severity")
                .HasConversion<string>()
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.TargetType)
                .HasColumnName("target_type")
                .HasConversion<string>()
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.DeviceTypeIds)
                .HasColumnName("device_type_ids")
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(e => e.DeviceIds)
                .HasColumnName("device_ids")
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(e => e.Conditions)
                .HasColumnName("conditions")
                .HasColumnType("jsonb")
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => System.Text.Json.JsonSerializer.Deserialize<List<AlertCondition>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<AlertCondition>())
                .IsRequired();

            entity.Property(e => e.ConditionLogic)
                .HasColumnName("condition_logic")
                .HasMaxLength(10)
                .IsRequired();

            entity.Property(e => e.TimeWindowSeconds)
                .HasColumnName("time_window_seconds")
                .IsRequired();

            entity.Property(e => e.EvaluationFrequencySeconds)
                .HasColumnName("evaluation_frequency_seconds")
                .IsRequired();

            entity.Property(e => e.DeliveryChannels)
                .HasColumnName("delivery_channels")
                .HasColumnType("text[]");

            entity.Property(e => e.Recipients)
                .HasColumnName("recipients")
                .HasColumnType("text[]");

            entity.Property(e => e.IsEnabled)
                .HasColumnName("is_enabled")
                .HasDefaultValue(true);

            entity.Property(e => e.EscalationRule)
                .HasColumnName("escalation_rule")
                .HasColumnType("jsonb")
                .HasConversion(
                    v => v != null ? System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null) : null,
                    v => v != null ? System.Text.Json.JsonSerializer.Deserialize<EscalationRule>(v, (System.Text.Json.JsonSerializerOptions?)null) : null);

            entity.Property(e => e.CooldownMinutes)
                .HasColumnName("cooldown_minutes")
                .IsRequired();

            entity.Property(e => e.Tags)
                .HasColumnName("tags")
                .HasColumnType("text[]");

            entity.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at")
                .IsRequired();

            // Indexes
            entity.HasIndex(e => e.TenantId)
                .HasDatabaseName("ix_alert_rules_tenant");

            entity.HasIndex(e => new { e.TenantId, e.Name })
                .HasDatabaseName("ix_alert_rules_tenant_name");

            entity.HasIndex(e => e.IsEnabled)
                .HasDatabaseName("ix_alert_rules_enabled");

            entity.HasIndex(e => e.TargetType)
                .HasDatabaseName("ix_alert_rules_target_type");

            entity.HasIndex(e => e.Tags)
                .HasDatabaseName("ix_alert_rules_tags")
                .HasMethod("gin");
        });

        // AlertInstance Configuration
        modelBuilder.Entity<AlertInstance>(entity =>
        {
            entity.ToTable("alert_instances");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            entity.Property(e => e.TenantId)
                .HasColumnName("tenant_id")
                .IsRequired();

            entity.Property(e => e.AlertRuleId)
                .HasColumnName("alert_rule_id")
                .IsRequired();

            entity.Property(e => e.DeviceId)
                .HasColumnName("device_id")
                .IsRequired();

            entity.Property(e => e.Severity)
                .HasColumnName("severity")
                .HasConversion<string>()
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.Status)
                .HasColumnName("status")
                .HasConversion<string>()
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.Message)
                .HasColumnName("message")
                .HasColumnType("text")
                .IsRequired();

            entity.Property(e => e.Details)
                .HasColumnName("details")
                .HasColumnType("text")
                .IsRequired();

            entity.Property(e => e.FieldValues)
                .HasColumnName("field_values")
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(e => e.TriggeredAt)
                .HasColumnName("triggered_at")
                .IsRequired();

            entity.Property(e => e.AcknowledgedAt)
                .HasColumnName("acknowledged_at");

            entity.Property(e => e.AcknowledgedBy)
                .HasColumnName("acknowledged_by")
                .HasMaxLength(255);

            entity.Property(e => e.AcknowledgmentNotes)
                .HasColumnName("acknowledgment_notes")
                .HasColumnType("text");

            entity.Property(e => e.ResolvedAt)
                .HasColumnName("resolved_at");

            entity.Property(e => e.ResolutionNotes)
                .HasColumnName("resolution_notes")
                .HasColumnType("text");

            entity.Property(e => e.IsEscalated)
                .HasColumnName("is_escalated")
                .HasDefaultValue(false);

            entity.Property(e => e.EscalatedAt)
                .HasColumnName("escalated_at");

            entity.Property(e => e.NotificationCount)
                .HasColumnName("notification_count")
                .HasDefaultValue(0);

            entity.Property(e => e.LastNotificationAt)
                .HasColumnName("last_notification_at");

            entity.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at")
                .IsRequired();

            // Indexes
            entity.HasIndex(e => e.TenantId)
                .HasDatabaseName("ix_alert_instances_tenant");

            entity.HasIndex(e => e.AlertRuleId)
                .HasDatabaseName("ix_alert_instances_rule");

            entity.HasIndex(e => e.DeviceId)
                .HasDatabaseName("ix_alert_instances_device");

            entity.HasIndex(e => e.Status)
                .HasDatabaseName("ix_alert_instances_status");

            entity.HasIndex(e => e.Severity)
                .HasDatabaseName("ix_alert_instances_severity");

            entity.HasIndex(e => e.TriggeredAt)
                .HasDatabaseName("ix_alert_instances_triggered_at")
                .IsDescending();

            // Foreign keys
            entity.HasOne(e => e.AlertRule)
                .WithMany()
                .HasForeignKey(e => e.AlertRuleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Device)
                .WithMany()
                .HasForeignKey(e => e.DeviceId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // AlertDeliveryChannel Configuration
        modelBuilder.Entity<AlertDeliveryChannel>(entity =>
        {
            entity.ToTable("alert_delivery_channels");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            entity.Property(e => e.TenantId)
                .HasColumnName("tenant_id")
                .IsRequired();

            entity.Property(e => e.Name)
                .HasColumnName("name")
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(e => e.Description)
                .HasColumnName("description")
                .HasColumnType("text");

            entity.Property(e => e.Type)
                .HasColumnName("type")
                .HasConversion<string>()
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.IsEnabled)
                .HasColumnName("is_enabled")
                .HasDefaultValue(true);

            entity.Property(e => e.Configuration)
                .HasColumnName("configuration")
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(e => e.MessageTemplate)
                .HasColumnName("message_template")
                .HasColumnType("text");

            entity.Property(e => e.UseDefaultTemplate)
                .HasColumnName("use_default_template")
                .HasDefaultValue(true);

            entity.Property(e => e.Tags)
                .HasColumnName("tags")
                .HasColumnType("text[]");

            entity.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at")
                .IsRequired();

            // Indexes
            entity.HasIndex(e => e.TenantId)
                .HasDatabaseName("ix_alert_delivery_channels_tenant");

            entity.HasIndex(e => new { e.TenantId, e.Name })
                .HasDatabaseName("ix_alert_delivery_channels_tenant_name")
                .IsUnique();

            entity.HasIndex(e => e.Type)
                .HasDatabaseName("ix_alert_delivery_channels_type");

            entity.HasIndex(e => e.IsEnabled)
                .HasDatabaseName("ix_alert_delivery_channels_enabled");
        });
    }

    private void ConfigureAssetEntities(ModelBuilder modelBuilder)
    {
        // Asset Configuration
        modelBuilder.Entity<Asset>(entity =>
        {
            entity.ToTable("assets");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedNever();

            entity.Property(e => e.TenantId)
                .HasColumnName("tenant_id")
                .HasColumnType("uuid")
                .IsRequired();

            entity.Property(e => e.ParentId)
                .HasColumnName("parent_id");

            entity.Property(e => e.Name)
                .HasColumnName("name")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(e => e.Description)
                .HasColumnName("description")
                .HasColumnType("text");

            entity.Property(e => e.AssetType)
                .HasColumnName("asset_type")
                .HasConversion<string>()
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.Path)
                .HasColumnName("path")
                .HasColumnType("ltree")
                .IsRequired();

            entity.Property(e => e.Level)
                .HasColumnName("level")
                .IsRequired();

            entity.Property(e => e.PrimaryImageUrl)
                .HasColumnName("primary_image_url")
                .HasMaxLength(2000);

            entity.Property(e => e.ImageUrls)
                .HasColumnName("image_urls")
                .HasColumnType("jsonb");

            // Ignore dictionary properties - stored as JSONB in database but not directly mapped in EF
            entity.Ignore(e => e.Metadata);
            entity.Ignore(e => e.Documents);

            entity.Property(e => e.Icon)
                .HasColumnName("icon")
                .HasMaxLength(100);

            entity.Property(e => e.Status)
                .HasColumnName("status")
                .HasConversion<string>()
                .HasMaxLength(50)
                .HasDefaultValue(AssetStatus.Active);

            entity.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at")
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasColumnName("created_by")
                .HasMaxLength(100);

            entity.Property(e => e.UpdatedBy)
                .HasColumnName("updated_by")
                .HasMaxLength(100);

            entity.Property(e => e.Category)
                .HasColumnName("category")
                .HasConversion<string>()
                .HasMaxLength(50)
                .HasDefaultValue(AssetCategory.Equipment);

            entity.Property(e => e.CadDrawingUrl)
                .HasColumnName("cad_drawing_url")
                .HasMaxLength(2000);

            // Location stored as PostGIS geography(point) in database, ignore in EF
            // Applications should query/update this using PostGIS functions directly
            entity.Ignore(e => e.Location);

            // GeographicData and GeofenceData as owned types (stored as JSONB)
            entity.OwnsOne(e => e.GeographicData, geo =>
            {
                geo.ToJson("geographic_data");
                geo.Property(g => g.Country).HasMaxLength(100);
                geo.Property(g => g.State).HasMaxLength(100);
                geo.Property(g => g.Council).HasMaxLength(100);
                geo.Property(g => g.City).HasMaxLength(100);
                
                geo.OwnsOne(g => g.Geofence, fence =>
                {
                    fence.Property(f => f.Type).HasMaxLength(50);
                    fence.OwnsMany(f => f.Coordinates);
                });
            });

            // Self-referencing relationship
            entity.HasOne(e => e.Parent)
                .WithMany(e => e.Children)
                .HasForeignKey(e => e.ParentId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes
            entity.HasIndex(e => e.TenantId)
                .HasDatabaseName("idx_assets_tenant");

            entity.HasIndex(e => e.ParentId)
                .HasDatabaseName("idx_assets_parent");

            entity.HasIndex(e => e.Path)
                .HasDatabaseName("idx_assets_path");

            entity.HasIndex(e => e.AssetType)
                .HasDatabaseName("idx_assets_type");

            entity.HasIndex(e => e.Status)
                .HasDatabaseName("idx_assets_status");

            entity.HasIndex(e => e.Level)
                .HasDatabaseName("idx_assets_level");

            entity.HasIndex(e => new { e.TenantId, e.ParentId, e.Name })
                .HasDatabaseName("unique_asset_name_per_parent")
                .IsUnique();
        });

        // AssetState Configuration
        modelBuilder.Entity<AssetState>(entity =>
        {
            entity.ToTable("asset_states");

            entity.HasKey(e => e.AssetId);

            entity.Property(e => e.AssetId)
                .HasColumnName("asset_id");

            entity.Property(e => e.TenantId)
                .HasColumnName("tenant_id")
                .HasColumnType("uuid")
                .HasConversion<Guid>()
                .IsRequired();

            entity.Property(e => e.State)
                .HasColumnName("state")
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(e => e.CalculatedMetrics)
                .HasColumnName("calculated_metrics")
                .HasColumnType("jsonb");

            entity.Property(e => e.AlarmStatus)
                .HasColumnName("alarm_status")
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.Property(e => e.AlarmCount)
                .HasColumnName("alarm_count")
                .HasDefaultValue(0);

            entity.Property(e => e.LastUpdateTime)
                .HasColumnName("last_update_time")
                .IsRequired();

            entity.Property(e => e.LastUpdateDeviceId)
                .HasColumnName("last_update_device_id")
                .HasMaxLength(200);

            // Relationship - AssetState to Asset (one-to-one)
            entity.HasOne(e => e.Asset)
                .WithOne(a => a.CurrentState)
                .HasForeignKey<AssetState>(e => e.AssetId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes
            entity.HasIndex(e => e.TenantId)
                .HasDatabaseName("idx_asset_states_tenant");

            entity.HasIndex(e => e.AlarmStatus)
                .HasDatabaseName("idx_asset_states_alarm");

            entity.HasIndex(e => e.LastUpdateTime)
                .HasDatabaseName("idx_asset_states_last_update");
        });

        // DataPointMapping Configuration
        modelBuilder.Entity<DataPointMapping>(entity =>
        {
            entity.ToTable("data_point_mappings");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedNever();

            entity.Property(e => e.TenantId)
                .HasColumnName("tenant_id")
                .HasColumnType("uuid")
                .HasConversion<Guid>()
                .IsRequired();

            entity.Property(e => e.SchemaId)
                .HasColumnName("schema_id")
                .IsRequired();

            entity.Property(e => e.SchemaVersion)
                .HasColumnName("schema_version")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.JsonPath)
                .HasColumnName("json_path")
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(e => e.AssetId)
                .HasColumnName("asset_id")
                .IsRequired();

            entity.Property(e => e.Label)
                .HasColumnName("label")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(e => e.Description)
                .HasColumnName("description")
                .HasColumnType("text");

            entity.Property(e => e.Unit)
                .HasColumnName("unit")
                .HasMaxLength(50);

            entity.Property(e => e.AggregationMethod)
                .HasColumnName("aggregation_method")
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.Property(e => e.RollupEnabled)
                .HasColumnName("rollup_enabled")
                .HasDefaultValue(true);

            entity.Property(e => e.TransformExpression)
                .HasColumnName("transform_expression")
                .HasColumnType("text");

            entity.Property(e => e.Metadata)
                .HasColumnName("metadata")
                .HasColumnType("jsonb");

            entity.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at")
                .IsRequired();

            // Relationship removed - Navigation property Asset no longer exists to avoid AssetId1 shadow column issue
            // Foreign key relationship is still enforced at database level
            // entity.HasOne(e => e.Asset)
            //     .WithMany()
            //     .HasForeignKey(e => e.AssetId)
            //     .OnDelete(DeleteBehavior.Cascade);

            // Indexes
            entity.HasIndex(e => e.TenantId)
                .HasDatabaseName("idx_mappings_tenant");

            entity.HasIndex(e => e.SchemaId)
                .HasDatabaseName("idx_mappings_schema");

            entity.HasIndex(e => e.AssetId)
                .HasDatabaseName("idx_mappings_asset");

            entity.HasIndex(e => e.JsonPath)
                .HasDatabaseName("idx_mappings_json_path");

            entity.HasIndex(e => new { e.TenantId, e.SchemaId, e.JsonPath, e.AssetId })
                .HasDatabaseName("unique_mapping")
                .IsUnique();
        });

        // AssetRollupConfig Configuration
        modelBuilder.Entity<AssetRollupConfig>(entity =>
        {
            entity.ToTable("asset_rollup_configs");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedNever();

            entity.Property(e => e.TenantId)
                .HasColumnName("tenant_id")
                .HasColumnType("uuid")
                .HasConversion<Guid>()
                .IsRequired();

            entity.Property(e => e.AssetId)
                .HasColumnName("asset_id")
                .IsRequired();

            entity.Property(e => e.MetricName)
                .HasColumnName("metric_name")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(e => e.AggregationMethod)
                .HasColumnName("aggregation_method")
                .HasConversion<string>()
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.RollupInterval)
                .HasColumnName("rollup_interval")
                .HasColumnType("interval");

            entity.Property(e => e.IncludeChildren)
                .HasColumnName("include_children")
                .HasDefaultValue(true);

            entity.Property(e => e.WeightFactor)
                .HasColumnName("weight_factor")
                .HasColumnType("numeric(10,4)")
                .HasDefaultValue(1.0m);

            entity.Property(e => e.FilterExpression)
                .HasColumnName("filter_expression")
                .HasColumnType("text");

            entity.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at")
                .IsRequired();

            // Relationship
            entity.HasOne(e => e.Asset)
                .WithMany()
                .HasForeignKey(e => e.AssetId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes
            entity.HasIndex(e => e.TenantId)
                .HasDatabaseName("idx_rollup_configs_tenant");

            entity.HasIndex(e => e.AssetId)
                .HasDatabaseName("idx_rollup_configs_asset");

            entity.HasIndex(e => new { e.TenantId, e.AssetId, e.MetricName })
                .HasDatabaseName("unique_rollup")
                .IsUnique();
        });

        // AssetRollupData Configuration (TimescaleDB hypertable)
        modelBuilder.Entity<AssetRollupData>(entity =>
        {
            entity.ToTable("asset_rollup_data");

            entity.HasKey(e => new { e.AssetId, e.MetricName, e.Time });

            entity.Property(e => e.AssetId)
                .HasColumnName("asset_id");

            entity.Property(e => e.TenantId)
                .HasColumnName("tenant_id")
                .HasColumnType("uuid")
                .HasConversion<Guid>()
                .IsRequired();

            entity.Property(e => e.MetricName)
                .HasColumnName("metric_name")
                .HasMaxLength(200);

            entity.Property(e => e.Time)
                .HasColumnName("time");

            entity.Property(e => e.Value)
                .HasColumnName("value");

            entity.Property(e => e.SampleCount)
                .HasColumnName("sample_count");

            entity.Property(e => e.Metadata)
                .HasColumnName("metadata")
                .HasColumnType("jsonb");

            // Indexes
            entity.HasIndex(e => e.Time)
                .HasDatabaseName("asset_rollup_data_time_idx");

            entity.HasIndex(e => new { e.AssetId, e.Time })
                .HasDatabaseName("idx_rollup_data_asset");

            entity.HasIndex(e => new { e.MetricName, e.Time })
                .HasDatabaseName("idx_rollup_data_metric");

            entity.HasIndex(e => new { e.TenantId, e.Time })
                .HasDatabaseName("idx_rollup_data_tenant");
        });
    }
}
