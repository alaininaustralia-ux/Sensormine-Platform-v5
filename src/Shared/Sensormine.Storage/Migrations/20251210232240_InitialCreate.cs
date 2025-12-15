using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Sensormine.Core.Models;

#nullable disable

namespace Sensormine.Storage.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:ltree", ",,");

            migrationBuilder.CreateTable(
                name: "alert_delivery_channels",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    configuration = table.Column<Dictionary<string, object>>(type: "jsonb", nullable: false),
                    message_template = table.Column<string>(type: "text", nullable: true),
                    use_default_template = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    tags = table.Column<List<string>>(type: "text[]", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_alert_delivery_channels", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "alert_rules",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    severity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    target_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    device_type_ids = table.Column<List<Guid>>(type: "jsonb", nullable: false),
                    device_ids = table.Column<List<Guid>>(type: "jsonb", nullable: false),
                    conditions = table.Column<string>(type: "jsonb", nullable: false),
                    condition_logic = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    time_window_seconds = table.Column<int>(type: "integer", nullable: false),
                    evaluation_frequency_seconds = table.Column<int>(type: "integer", nullable: false),
                    delivery_channels = table.Column<List<string>>(type: "text[]", nullable: false),
                    recipients = table.Column<List<string>>(type: "text[]", nullable: false),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    escalation_rule = table.Column<string>(type: "jsonb", nullable: true),
                    cooldown_minutes = table.Column<int>(type: "integer", nullable: false),
                    tags = table.Column<List<string>>(type: "text[]", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_alert_rules", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "asset_rollup_data",
                columns: table => new
                {
                    asset_id = table.Column<Guid>(type: "uuid", nullable: false),
                    metric_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    time = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    value = table.Column<double>(type: "double precision", nullable: true),
                    sample_count = table.Column<int>(type: "integer", nullable: false),
                    metadata = table.Column<Dictionary<string, object>>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_asset_rollup_data", x => new { x.asset_id, x.metric_name, x.time });
                });

            migrationBuilder.CreateTable(
                name: "assets",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    parent_id = table.Column<Guid>(type: "uuid", nullable: true),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    asset_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Equipment"),
                    path = table.Column<string>(type: "ltree", nullable: false),
                    level = table.Column<int>(type: "integer", nullable: false),
                    primary_image_url = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    image_urls = table.Column<List<string>>(type: "jsonb", nullable: false),
                    icon = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    cad_drawing_url = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Active"),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    updated_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    geographic_data = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_assets", x => x.id);
                    table.ForeignKey(
                        name: "FK_assets_assets_parent_id",
                        column: x => x.parent_id,
                        principalTable: "assets",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "dashboards",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    layout = table.Column<string>(type: "jsonb", nullable: false),
                    widgets = table.Column<string>(type: "jsonb", nullable: false),
                    is_template = table.Column<bool>(type: "boolean", nullable: false),
                    template_category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    shared_with = table.Column<string>(type: "jsonb", nullable: true),
                    tags = table.Column<string>(type: "jsonb", nullable: true),
                    parent_dashboard_id = table.Column<Guid>(type: "uuid", nullable: true),
                    display_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    dashboard_type = table.Column<int>(type: "integer", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_dashboards", x => x.id);
                    table.ForeignKey(
                        name: "FK_dashboards_dashboards_parent_dashboard_id",
                        column: x => x.parent_dashboard_id,
                        principalTable: "dashboards",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "device_types",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    protocol = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    protocol_config = table.Column<string>(type: "jsonb", nullable: false),
                    schema_id = table.Column<Guid>(type: "uuid", nullable: true),
                    custom_fields = table.Column<string>(type: "jsonb", nullable: false),
                    alert_templates = table.Column<string>(type: "jsonb", nullable: false),
                    tags = table.Column<List<string>>(type: "text[]", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_device_types", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "schemas",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    updated_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_schemas", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "site_configurations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    config_key = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    site_settings = table.Column<string>(type: "jsonb", nullable: false),
                    features = table.Column<string>(type: "jsonb", nullable: false),
                    limits = table.Column<string>(type: "jsonb", nullable: false),
                    defaults = table.Column<string>(type: "jsonb", nullable: false),
                    integrations = table.Column<string>(type: "jsonb", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_site_configurations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "user_preferences",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    display_preferences = table.Column<string>(type: "jsonb", nullable: false),
                    notification_preferences = table.Column<string>(type: "jsonb", nullable: false),
                    dashboard_preferences = table.Column<string>(type: "jsonb", nullable: false),
                    data_preferences = table.Column<string>(type: "jsonb", nullable: false),
                    favorites = table.Column<string>(type: "jsonb", nullable: false),
                    recently_viewed = table.Column<string>(type: "jsonb", nullable: false),
                    Bookmarks = table.Column<string>(type: "text", nullable: false),
                    PageHistory = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_preferences", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "asset_rollup_configs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    asset_id = table.Column<Guid>(type: "uuid", nullable: false),
                    metric_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    aggregation_method = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    rollup_interval = table.Column<TimeSpan>(type: "interval", nullable: false),
                    include_children = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    weight_factor = table.Column<decimal>(type: "numeric(10,4)", nullable: false, defaultValue: 1.0m),
                    filter_expression = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_asset_rollup_configs", x => x.id);
                    table.ForeignKey(
                        name: "FK_asset_rollup_configs_assets_asset_id",
                        column: x => x.asset_id,
                        principalTable: "assets",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "asset_states",
                columns: table => new
                {
                    asset_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    state = table.Column<Dictionary<string, object>>(type: "jsonb", nullable: false),
                    calculated_metrics = table.Column<Dictionary<string, object>>(type: "jsonb", nullable: false),
                    alarm_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    alarm_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    last_update_time = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    last_update_device_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_asset_states", x => x.asset_id);
                    table.ForeignKey(
                        name: "FK_asset_states_assets_asset_id",
                        column: x => x.asset_id,
                        principalTable: "assets",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "data_point_mappings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    schema_id = table.Column<Guid>(type: "uuid", nullable: false),
                    schema_version = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    json_path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    asset_id = table.Column<Guid>(type: "uuid", nullable: false),
                    label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    unit = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    aggregation_method = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    rollup_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    transform_expression = table.Column<string>(type: "text", nullable: true),
                    metadata = table.Column<Dictionary<string, object>>(type: "jsonb", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_data_point_mappings", x => x.id);
                    table.ForeignKey(
                        name: "FK_data_point_mappings_assets_asset_id",
                        column: x => x.asset_id,
                        principalTable: "assets",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "device_type_audit_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    device_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    action = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    old_value = table.Column<string>(type: "jsonb", nullable: true),
                    new_value = table.Column<string>(type: "jsonb", nullable: true),
                    change_summary = table.Column<string>(type: "text", nullable: true),
                    timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    user_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_device_type_audit_logs", x => x.id);
                    table.ForeignKey(
                        name: "FK_device_type_audit_logs_device_types_device_type_id",
                        column: x => x.device_type_id,
                        principalTable: "device_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "device_type_versions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    device_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    version = table.Column<int>(type: "integer", nullable: false),
                    version_data = table.Column<string>(type: "jsonb", nullable: false),
                    change_summary = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_device_type_versions", x => x.id);
                    table.ForeignKey(
                        name: "FK_device_type_versions_device_types_device_type_id",
                        column: x => x.device_type_id,
                        principalTable: "device_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "devices",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    device_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    device_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    asset_id = table.Column<Guid>(type: "uuid", nullable: true),
                    serial_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    custom_field_values = table.Column<Dictionary<string, object>>(type: "jsonb", nullable: false),
                    location = table.Column<Location>(type: "jsonb", nullable: true),
                    metadata = table.Column<Dictionary<string, string>>(type: "jsonb", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    last_seen_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_devices", x => x.id);
                    table.ForeignKey(
                        name: "FK_devices_device_types_device_type_id",
                        column: x => x.device_type_id,
                        principalTable: "device_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "field_mappings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    device_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    field_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    field_source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    friendly_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    unit = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    data_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    min_value = table.Column<double>(type: "double precision", nullable: true),
                    max_value = table.Column<double>(type: "double precision", nullable: true),
                    is_queryable = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    is_visible = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    display_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    tags = table.Column<List<string>>(type: "text[]", nullable: false),
                    default_aggregation = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    supports_aggregations = table.Column<List<string>>(type: "text[]", nullable: false),
                    format_string = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_field_mappings", x => x.id);
                    table.ForeignKey(
                        name: "FK_field_mappings_device_types_device_type_id",
                        column: x => x.device_type_id,
                        principalTable: "device_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "schema_versions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    schema_id = table.Column<Guid>(type: "uuid", nullable: false),
                    version = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    json_schema = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    is_default = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    device_types = table.Column<List<string>>(type: "jsonb", nullable: false),
                    metadata = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_schema_versions", x => x.id);
                    table.ForeignKey(
                        name: "FK_schema_versions_schemas_schema_id",
                        column: x => x.schema_id,
                        principalTable: "schemas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "alert_instances",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    alert_rule_id = table.Column<Guid>(type: "uuid", nullable: false),
                    device_id = table.Column<Guid>(type: "uuid", nullable: false),
                    severity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    message = table.Column<string>(type: "text", nullable: false),
                    details = table.Column<string>(type: "text", nullable: false),
                    field_values = table.Column<Dictionary<string, object>>(type: "jsonb", nullable: false),
                    triggered_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    acknowledged_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    acknowledged_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    acknowledgment_notes = table.Column<string>(type: "text", nullable: true),
                    resolved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    resolution_notes = table.Column<string>(type: "text", nullable: true),
                    is_escalated = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    escalated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    notification_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    last_notification_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_alert_instances", x => x.id);
                    table.ForeignKey(
                        name: "FK_alert_instances_alert_rules_alert_rule_id",
                        column: x => x.alert_rule_id,
                        principalTable: "alert_rules",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_alert_instances_devices_device_id",
                        column: x => x.device_id,
                        principalTable: "devices",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_alert_delivery_channels_enabled",
                table: "alert_delivery_channels",
                column: "is_enabled");

            migrationBuilder.CreateIndex(
                name: "ix_alert_delivery_channels_tenant",
                table: "alert_delivery_channels",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_alert_delivery_channels_tenant_name",
                table: "alert_delivery_channels",
                columns: new[] { "tenant_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_alert_delivery_channels_type",
                table: "alert_delivery_channels",
                column: "type");

            migrationBuilder.CreateIndex(
                name: "ix_alert_instances_device",
                table: "alert_instances",
                column: "device_id");

            migrationBuilder.CreateIndex(
                name: "ix_alert_instances_rule",
                table: "alert_instances",
                column: "alert_rule_id");

            migrationBuilder.CreateIndex(
                name: "ix_alert_instances_severity",
                table: "alert_instances",
                column: "severity");

            migrationBuilder.CreateIndex(
                name: "ix_alert_instances_status",
                table: "alert_instances",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_alert_instances_tenant",
                table: "alert_instances",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_alert_instances_triggered_at",
                table: "alert_instances",
                column: "triggered_at",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "ix_alert_rules_enabled",
                table: "alert_rules",
                column: "is_enabled");

            migrationBuilder.CreateIndex(
                name: "ix_alert_rules_tags",
                table: "alert_rules",
                column: "tags")
                .Annotation("Npgsql:IndexMethod", "gin");

            migrationBuilder.CreateIndex(
                name: "ix_alert_rules_target_type",
                table: "alert_rules",
                column: "target_type");

            migrationBuilder.CreateIndex(
                name: "ix_alert_rules_tenant",
                table: "alert_rules",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_alert_rules_tenant_name",
                table: "alert_rules",
                columns: new[] { "tenant_id", "name" });

            migrationBuilder.CreateIndex(
                name: "idx_rollup_configs_asset",
                table: "asset_rollup_configs",
                column: "asset_id");

            migrationBuilder.CreateIndex(
                name: "idx_rollup_configs_tenant",
                table: "asset_rollup_configs",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "unique_rollup",
                table: "asset_rollup_configs",
                columns: new[] { "tenant_id", "asset_id", "metric_name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "asset_rollup_data_time_idx",
                table: "asset_rollup_data",
                column: "time");

            migrationBuilder.CreateIndex(
                name: "idx_rollup_data_asset",
                table: "asset_rollup_data",
                columns: new[] { "asset_id", "time" });

            migrationBuilder.CreateIndex(
                name: "idx_rollup_data_metric",
                table: "asset_rollup_data",
                columns: new[] { "metric_name", "time" });

            migrationBuilder.CreateIndex(
                name: "idx_rollup_data_tenant",
                table: "asset_rollup_data",
                columns: new[] { "tenant_id", "time" });

            migrationBuilder.CreateIndex(
                name: "idx_asset_states_alarm",
                table: "asset_states",
                column: "alarm_status");

            migrationBuilder.CreateIndex(
                name: "idx_asset_states_last_update",
                table: "asset_states",
                column: "last_update_time");

            migrationBuilder.CreateIndex(
                name: "idx_asset_states_tenant",
                table: "asset_states",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "idx_assets_level",
                table: "assets",
                column: "level");

            migrationBuilder.CreateIndex(
                name: "idx_assets_parent",
                table: "assets",
                column: "parent_id");

            migrationBuilder.CreateIndex(
                name: "idx_assets_path",
                table: "assets",
                column: "path");

            migrationBuilder.CreateIndex(
                name: "idx_assets_status",
                table: "assets",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "idx_assets_tenant",
                table: "assets",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "idx_assets_type",
                table: "assets",
                column: "asset_type");

            migrationBuilder.CreateIndex(
                name: "unique_asset_name_per_parent",
                table: "assets",
                columns: new[] { "tenant_id", "parent_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_dashboards_is_template",
                table: "dashboards",
                column: "is_template");

            migrationBuilder.CreateIndex(
                name: "ix_dashboards_parent",
                table: "dashboards",
                column: "parent_dashboard_id");

            migrationBuilder.CreateIndex(
                name: "ix_dashboards_tenant",
                table: "dashboards",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_dashboards_tenant_parent",
                table: "dashboards",
                columns: new[] { "tenant_id", "parent_dashboard_id" });

            migrationBuilder.CreateIndex(
                name: "ix_dashboards_tenant_user",
                table: "dashboards",
                columns: new[] { "tenant_id", "user_id" });

            migrationBuilder.CreateIndex(
                name: "ix_dashboards_user",
                table: "dashboards",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_mappings_asset",
                table: "data_point_mappings",
                column: "asset_id");

            migrationBuilder.CreateIndex(
                name: "idx_mappings_json_path",
                table: "data_point_mappings",
                column: "json_path");

            migrationBuilder.CreateIndex(
                name: "idx_mappings_schema",
                table: "data_point_mappings",
                column: "schema_id");

            migrationBuilder.CreateIndex(
                name: "idx_mappings_tenant",
                table: "data_point_mappings",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "unique_mapping",
                table: "data_point_mappings",
                columns: new[] { "tenant_id", "schema_id", "json_path", "asset_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_device_type_audit_logs_action",
                table: "device_type_audit_logs",
                column: "action");

            migrationBuilder.CreateIndex(
                name: "ix_device_type_audit_logs_device_type",
                table: "device_type_audit_logs",
                column: "device_type_id");

            migrationBuilder.CreateIndex(
                name: "ix_device_type_audit_logs_tenant",
                table: "device_type_audit_logs",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_device_type_audit_logs_timestamp",
                table: "device_type_audit_logs",
                column: "timestamp",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "ix_device_type_versions_device_type",
                table: "device_type_versions",
                column: "device_type_id");

            migrationBuilder.CreateIndex(
                name: "ix_device_type_versions_device_type_version",
                table: "device_type_versions",
                columns: new[] { "device_type_id", "version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_device_types_active",
                table: "device_types",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "ix_device_types_protocol",
                table: "device_types",
                column: "protocol");

            migrationBuilder.CreateIndex(
                name: "ix_device_types_tags",
                table: "device_types",
                column: "tags")
                .Annotation("Npgsql:IndexMethod", "gin");

            migrationBuilder.CreateIndex(
                name: "ix_device_types_tenant",
                table: "device_types",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_device_types_tenant_name",
                table: "device_types",
                columns: new[] { "tenant_id", "name" },
                unique: true,
                filter: "is_active = true");

            migrationBuilder.CreateIndex(
                name: "ix_devices_device_id",
                table: "devices",
                column: "device_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_devices_device_type_id",
                table: "devices",
                column: "device_type_id");

            migrationBuilder.CreateIndex(
                name: "ix_devices_last_seen_at",
                table: "devices",
                column: "last_seen_at");

            migrationBuilder.CreateIndex(
                name: "ix_devices_serial_number",
                table: "devices",
                column: "serial_number");

            migrationBuilder.CreateIndex(
                name: "ix_devices_status",
                table: "devices",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_devices_tenant_id",
                table: "devices",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_mappings_device_type",
                table: "field_mappings",
                column: "device_type_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_mappings_device_type_field_name",
                table: "field_mappings",
                columns: new[] { "device_type_id", "field_name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_field_mappings_queryable",
                table: "field_mappings",
                column: "is_queryable");

            migrationBuilder.CreateIndex(
                name: "ix_field_mappings_tenant",
                table: "field_mappings",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_schema_versions_schema_default",
                table: "schema_versions",
                columns: new[] { "schema_id", "is_default" },
                filter: "is_default = true");

            migrationBuilder.CreateIndex(
                name: "ix_schema_versions_schema_version",
                table: "schema_versions",
                columns: new[] { "schema_id", "version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_schema_versions_status",
                table: "schema_versions",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_schema_versions_tenant",
                table: "schema_versions",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_schemas_deleted",
                table: "schemas",
                column: "is_deleted");

            migrationBuilder.CreateIndex(
                name: "ix_schemas_tenant",
                table: "schemas",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_schemas_tenant_name",
                table: "schemas",
                columns: new[] { "tenant_id", "name" },
                unique: true,
                filter: "is_deleted = false");

            migrationBuilder.CreateIndex(
                name: "ix_site_configurations_tenant_key",
                table: "site_configurations",
                columns: new[] { "tenant_id", "config_key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_user_preferences_tenant_user",
                table: "user_preferences",
                columns: new[] { "tenant_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_user_preferences_user",
                table: "user_preferences",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "alert_delivery_channels");

            migrationBuilder.DropTable(
                name: "alert_instances");

            migrationBuilder.DropTable(
                name: "asset_rollup_configs");

            migrationBuilder.DropTable(
                name: "asset_rollup_data");

            migrationBuilder.DropTable(
                name: "asset_states");

            migrationBuilder.DropTable(
                name: "dashboards");

            migrationBuilder.DropTable(
                name: "data_point_mappings");

            migrationBuilder.DropTable(
                name: "device_type_audit_logs");

            migrationBuilder.DropTable(
                name: "device_type_versions");

            migrationBuilder.DropTable(
                name: "field_mappings");

            migrationBuilder.DropTable(
                name: "schema_versions");

            migrationBuilder.DropTable(
                name: "site_configurations");

            migrationBuilder.DropTable(
                name: "user_preferences");

            migrationBuilder.DropTable(
                name: "alert_rules");

            migrationBuilder.DropTable(
                name: "devices");

            migrationBuilder.DropTable(
                name: "assets");

            migrationBuilder.DropTable(
                name: "schemas");

            migrationBuilder.DropTable(
                name: "device_types");
        }
    }
}
