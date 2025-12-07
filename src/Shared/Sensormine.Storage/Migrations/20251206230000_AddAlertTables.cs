using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sensormine.Storage.Migrations
{
    /// <inheritdoc />
    public partial class AddAlertTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create alert_rules table
            migrationBuilder.CreateTable(
                name: "alert_rules",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    severity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    target_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    device_type_ids = table.Column<string>(type: "jsonb", nullable: false),
                    device_ids = table.Column<string>(type: "jsonb", nullable: false),
                    conditions = table.Column<string>(type: "jsonb", nullable: false),
                    condition_logic = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    time_window_seconds = table.Column<int>(type: "integer", nullable: false),
                    evaluation_frequency_seconds = table.Column<int>(type: "integer", nullable: false),
                    delivery_channels = table.Column<string[]>(type: "text[]", nullable: false),
                    recipients = table.Column<string[]>(type: "text[]", nullable: false),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    escalation_rule = table.Column<string>(type: "jsonb", nullable: true),
                    cooldown_minutes = table.Column<int>(type: "integer", nullable: false),
                    tags = table.Column<string[]>(type: "text[]", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_alert_rules", x => x.id);
                });

            // Create alert_instances table
            migrationBuilder.CreateTable(
                name: "alert_instances",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<string>(type: "text", nullable: false),
                    alert_rule_id = table.Column<Guid>(type: "uuid", nullable: false),
                    device_id = table.Column<Guid>(type: "uuid", nullable: false),
                    severity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    message = table.Column<string>(type: "text", nullable: false),
                    details = table.Column<string>(type: "text", nullable: false),
                    field_values = table.Column<string>(type: "jsonb", nullable: false),
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
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
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

            // Create alert_delivery_channels table
            migrationBuilder.CreateTable(
                name: "alert_delivery_channels",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    configuration = table.Column<string>(type: "jsonb", nullable: false),
                    message_template = table.Column<string>(type: "text", nullable: true),
                    use_default_template = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    tags = table.Column<string[]>(type: "text[]", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_alert_delivery_channels", x => x.id);
                });

            // Create indexes for alert_rules
            migrationBuilder.CreateIndex(
                name: "ix_alert_rules_tenant",
                table: "alert_rules",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_alert_rules_tenant_name",
                table: "alert_rules",
                columns: new[] { "tenant_id", "name" });

            migrationBuilder.CreateIndex(
                name: "ix_alert_rules_enabled",
                table: "alert_rules",
                column: "is_enabled");

            migrationBuilder.CreateIndex(
                name: "ix_alert_rules_target_type",
                table: "alert_rules",
                column: "target_type");

            migrationBuilder.CreateIndex(
                name: "ix_alert_rules_tags",
                table: "alert_rules",
                column: "tags")
                .Annotation("Npgsql:IndexMethod", "gin");

            // Create indexes for alert_instances
            migrationBuilder.CreateIndex(
                name: "ix_alert_instances_tenant",
                table: "alert_instances",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_alert_instances_rule",
                table: "alert_instances",
                column: "alert_rule_id");

            migrationBuilder.CreateIndex(
                name: "ix_alert_instances_device",
                table: "alert_instances",
                column: "device_id");

            migrationBuilder.CreateIndex(
                name: "ix_alert_instances_status",
                table: "alert_instances",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_alert_instances_severity",
                table: "alert_instances",
                column: "severity");

            migrationBuilder.CreateIndex(
                name: "ix_alert_instances_triggered_at",
                table: "alert_instances",
                column: "triggered_at",
                descending: new[] { true });

            // Create indexes for alert_delivery_channels
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
                name: "ix_alert_delivery_channels_enabled",
                table: "alert_delivery_channels",
                column: "is_enabled");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "alert_instances");
            migrationBuilder.DropTable(name: "alert_delivery_channels");
            migrationBuilder.DropTable(name: "alert_rules");
        }
    }
}
