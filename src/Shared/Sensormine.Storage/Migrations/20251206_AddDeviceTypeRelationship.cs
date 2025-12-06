using Microsoft.EntityFrameworkCore.Migrations;
using System;

#nullable disable

namespace Sensormine.Storage.Migrations
{
    /// <inheritdoc />
    public partial class AddDeviceTypeRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop old columns
            migrationBuilder.DropColumn(
                name: "device_type",
                table: "devices");

            migrationBuilder.DropColumn(
                name: "schema_id",
                table: "devices");

            // Add new columns
            migrationBuilder.AddColumn<Guid>(
                name: "device_type_id",
                table: "devices",
                type: "uuid",
                nullable: false,
                defaultValue: Guid.Empty);

            migrationBuilder.AddColumn<string>(
                name: "serial_number",
                table: "devices",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "custom_field_values",
                table: "devices",
                type: "jsonb",
                nullable: false,
                defaultValue: "{}");

            // Create foreign key
            migrationBuilder.CreateIndex(
                name: "ix_devices_device_type_id",
                table: "devices",
                column: "device_type_id");

            migrationBuilder.AddForeignKey(
                name: "fk_devices_device_types_device_type_id",
                table: "devices",
                column: "device_type_id",
                principalTable: "device_types",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            // Create index on serial number for quick lookups
            migrationBuilder.CreateIndex(
                name: "ix_devices_serial_number",
                table: "devices",
                column: "serial_number");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_devices_device_types_device_type_id",
                table: "devices");

            migrationBuilder.DropIndex(
                name: "ix_devices_device_type_id",
                table: "devices");

            migrationBuilder.DropIndex(
                name: "ix_devices_serial_number",
                table: "devices");

            migrationBuilder.DropColumn(
                name: "device_type_id",
                table: "devices");

            migrationBuilder.DropColumn(
                name: "serial_number",
                table: "devices");

            migrationBuilder.DropColumn(
                name: "custom_field_values",
                table: "devices");

            migrationBuilder.AddColumn<string>(
                name: "device_type",
                table: "devices",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "schema_id",
                table: "devices",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
