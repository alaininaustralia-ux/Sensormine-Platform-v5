using Microsoft.EntityFrameworkCore;
using NexusConfiguration.API.Models;

namespace NexusConfiguration.API.Data;

public class NexusConfigurationDbContext : DbContext
{
    public NexusConfigurationDbContext(DbContextOptions<NexusConfigurationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Models.NexusConfiguration> NexusConfigurations { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Models.NexusConfiguration>(entity =>
        {
            entity.ToTable("nexus_configurations");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasColumnName("description").HasMaxLength(1000);
            entity.Property(e => e.TenantId).HasColumnName("tenant_id").IsRequired();
            entity.Property(e => e.DeviceTypeId).HasColumnName("device_type_id");
            entity.Property(e => e.SchemaId).HasColumnName("schema_id");
            entity.Property(e => e.SourceDocument).HasColumnName("source_document").HasColumnType("jsonb");
            entity.Property(e => e.ProbeConfigurations).HasColumnName("probe_configurations").HasColumnType("jsonb");
            entity.Property(e => e.SchemaFieldMappings).HasColumnName("schema_field_mappings").HasColumnType("jsonb");
            entity.Property(e => e.CommunicationSettings).HasColumnName("communication_settings").HasColumnType("jsonb");
            entity.Property(e => e.CustomLogic).HasColumnName("custom_logic").HasMaxLength(50000);
            entity.Property(e => e.CustomLogicLanguage).HasColumnName("custom_logic_language").HasMaxLength(50);
            entity.Property(e => e.AlertRuleTemplates).HasColumnName("alert_rule_templates").HasColumnType("jsonb");
            entity.Property(e => e.Tags).HasColumnName("tags").HasColumnType("jsonb");
            entity.Property(e => e.Status).HasColumnName("status").IsRequired().HasMaxLength(50);
            entity.Property(e => e.IsTemplate).HasColumnName("is_template");
            entity.Property(e => e.TemplateCategory).HasColumnName("template_category").HasMaxLength(100);
            entity.Property(e => e.AiInsights).HasColumnName("ai_insights").HasMaxLength(5000);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by").HasMaxLength(200);
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by").HasMaxLength(200);

            // Indexes
            entity.HasIndex(e => e.TenantId).HasDatabaseName("ix_nexus_configurations_tenant_id");
            entity.HasIndex(e => e.Name).HasDatabaseName("ix_nexus_configurations_name");
            entity.HasIndex(e => e.Status).HasDatabaseName("ix_nexus_configurations_status");
            entity.HasIndex(e => e.IsTemplate).HasDatabaseName("ix_nexus_configurations_is_template");
            entity.HasIndex(e => new { e.TenantId, e.Name }).HasDatabaseName("ix_nexus_configurations_tenant_name").IsUnique();
        });
    }
}
