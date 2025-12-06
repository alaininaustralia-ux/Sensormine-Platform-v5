using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sensormine.Storage.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSchemaForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_device_types_schemas_SchemaId1",
                table: "device_types");

            migrationBuilder.DropForeignKey(
                name: "FK_device_types_schemas_schema_id",
                table: "device_types");

            migrationBuilder.DropIndex(
                name: "IX_device_types_SchemaId1",
                table: "device_types");

            migrationBuilder.DropColumn(
                name: "SchemaId1",
                table: "device_types");

            migrationBuilder.AddForeignKey(
                name: "FK_device_types_schemas_schema_id",
                table: "device_types",
                column: "schema_id",
                principalTable: "schemas",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_device_types_schemas_schema_id",
                table: "device_types");

            migrationBuilder.AddColumn<Guid>(
                name: "SchemaId1",
                table: "device_types",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_device_types_SchemaId1",
                table: "device_types",
                column: "SchemaId1");

            migrationBuilder.AddForeignKey(
                name: "FK_device_types_schemas_SchemaId1",
                table: "device_types",
                column: "SchemaId1",
                principalTable: "schemas",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_device_types_schemas_schema_id",
                table: "device_types",
                column: "schema_id",
                principalTable: "schemas",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
