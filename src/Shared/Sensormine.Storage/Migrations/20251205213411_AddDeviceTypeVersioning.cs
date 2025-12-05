using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sensormine.Storage.Migrations
{
    /// <inheritdoc />
    public partial class AddDeviceTypeVersioning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "device_type_audit_logs");

            migrationBuilder.DropTable(
                name: "device_type_versions");
        }
    }
}
