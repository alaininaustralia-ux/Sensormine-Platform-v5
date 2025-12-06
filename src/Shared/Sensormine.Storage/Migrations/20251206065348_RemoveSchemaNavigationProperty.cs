using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sensormine.Storage.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSchemaNavigationProperty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_device_types_schemas_schema_id",
                table: "device_types");

            migrationBuilder.DropIndex(
                name: "IX_device_types_schema_id",
                table: "device_types");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_device_types_schema_id",
                table: "device_types",
                column: "schema_id");

            migrationBuilder.AddForeignKey(
                name: "FK_device_types_schemas_schema_id",
                table: "device_types",
                column: "schema_id",
                principalTable: "schemas",
                principalColumn: "id");
        }
    }
}
