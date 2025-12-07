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

    // Device Management
    public DbSet<Device> Devices { get; set; } = null!;

    // User Preferences & Site Configuration
    public DbSet<UserPreference> UserPreferences { get; set; } = null!;
    public DbSet<SiteConfiguration> SiteConfigurations { get; set; } = null!;

    // Dashboard Management
    public DbSet<Dashboard> Dashboards { get; set; } = null!;

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

            entity.Property(e => e.IsDeleted)
                .HasColumnName("is_deleted")
                .HasDefaultValue(false);

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
}
