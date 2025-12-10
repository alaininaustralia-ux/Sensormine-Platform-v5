using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sensormine.Storage.Migrations
{
    /// <inheritdoc />
    public partial class AddAssetEnhancements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:ltree", ",,");

            migrationBuilder.AlterColumn<Guid>(
                name: "tenant_id",
                table: "user_preferences",
                type: "uuid",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<Guid>(
                name: "tenant_id",
                table: "site_configurations",
                type: "uuid",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<Guid>(
                name: "tenant_id",
                table: "schemas",
                type: "uuid",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<Guid>(
                name: "tenant_id",
                table: "schema_versions",
                type: "uuid",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<Guid>(
                name: "tenant_id",
                table: "devices",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<Guid>(
                name: "asset_id",
                table: "devices",
                type: "uuid",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "tenant_id",
                table: "alert_rules",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<Guid>(
                name: "tenant_id",
                table: "alert_instances",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<Guid>(
                name: "tenant_id",
                table: "alert_delivery_channels",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "asset_rollup_configs");

            migrationBuilder.DropTable(
                name: "asset_rollup_data");

            migrationBuilder.DropTable(
                name: "asset_states");

            migrationBuilder.DropTable(
                name: "data_point_mappings");

            migrationBuilder.DropTable(
                name: "assets");

            migrationBuilder.DropColumn(
                name: "asset_id",
                table: "devices");

            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:PostgresExtension:ltree", ",,");

            migrationBuilder.AlterColumn<string>(
                name: "tenant_id",
                table: "user_preferences",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "tenant_id",
                table: "site_configurations",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "tenant_id",
                table: "schemas",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "tenant_id",
                table: "schema_versions",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "tenant_id",
                table: "devices",
                type: "text",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<string>(
                name: "tenant_id",
                table: "alert_rules",
                type: "text",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<string>(
                name: "tenant_id",
                table: "alert_instances",
                type: "text",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<string>(
                name: "tenant_id",
                table: "alert_delivery_channels",
                type: "text",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid");
        }
    }
}
