using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Sensormine.Core.Models;

#nullable disable

namespace Sensormine.Storage.Migrations
{
    /// <inheritdoc />
    public partial class AddDeviceRegistration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SchemaId1",
                table: "device_types",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "devices",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    device_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    device_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    serial_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    custom_field_values = table.Column<Dictionary<string, object>>(type: "jsonb", nullable: false),
                    location = table.Column<Location>(type: "jsonb", nullable: true),
                    metadata = table.Column<Dictionary<string, string>>(type: "jsonb", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    last_seen_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<string>(type: "text", nullable: false)
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

            migrationBuilder.CreateIndex(
                name: "IX_device_types_SchemaId1",
                table: "device_types",
                column: "SchemaId1");

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

            migrationBuilder.AddForeignKey(
                name: "FK_device_types_schemas_SchemaId1",
                table: "device_types",
                column: "SchemaId1",
                principalTable: "schemas",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_device_types_schemas_SchemaId1",
                table: "device_types");

            migrationBuilder.DropTable(
                name: "devices");

            migrationBuilder.DropIndex(
                name: "IX_device_types_SchemaId1",
                table: "device_types");

            migrationBuilder.DropColumn(
                name: "SchemaId1",
                table: "device_types");
        }
    }
}
