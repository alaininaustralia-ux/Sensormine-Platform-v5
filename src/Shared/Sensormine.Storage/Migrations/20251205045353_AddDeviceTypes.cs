using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Sensormine.Core.Models;

#nullable disable

namespace Sensormine.Storage.Migrations
{
    /// <inheritdoc />
    public partial class AddDeviceTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "device_types",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    protocol = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    protocol_config = table.Column<ProtocolConfig>(type: "jsonb", nullable: false),
                    schema_id = table.Column<Guid>(type: "uuid", nullable: true),
                    custom_fields = table.Column<List<CustomFieldDefinition>>(type: "jsonb", nullable: false),
                    alert_templates = table.Column<List<AlertRuleTemplate>>(type: "jsonb", nullable: false),
                    tags = table.Column<List<string>>(type: "text[]", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_device_types", x => x.id);
                    table.ForeignKey(
                        name: "FK_device_types_schemas_schema_id",
                        column: x => x.schema_id,
                        principalTable: "schemas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "ix_device_types_active",
                table: "device_types",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "ix_device_types_protocol",
                table: "device_types",
                column: "protocol");

            migrationBuilder.CreateIndex(
                name: "IX_device_types_schema_id",
                table: "device_types",
                column: "schema_id");

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "device_types");
        }
    }
}
