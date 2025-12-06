using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sensormine.Storage.Migrations
{
    /// <summary>
    /// Remove foreign key constraint from device_types.schema_id to schemas.id
    /// This allows microservices architecture where schemas are managed by SchemaRegistry.API
    /// and device types are managed by Device.API with separate databases.
    /// </summary>
    public partial class RemoveSchemaForeignKey : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop the foreign key constraint
            migrationBuilder.DropForeignKey(
                name: "FK_device_types_schemas_schema_id",
                table: "device_types");

            // Keep the index for query performance
            // (already exists from previous migration)
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Recreate the foreign key constraint if rolling back
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
