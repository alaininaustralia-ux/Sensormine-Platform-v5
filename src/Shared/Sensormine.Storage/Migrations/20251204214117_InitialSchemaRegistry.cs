using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sensormine.Storage.Migrations
{
    /// <inheritdoc />
    public partial class InitialSchemaRegistry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "schemas",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    tenant_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_schemas", x => x.id);
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
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    device_types = table.Column<List<string>>(type: "jsonb", nullable: false),
                    Metadata = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    tenant_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "schema_versions");

            migrationBuilder.DropTable(
                name: "schemas");
        }
    }
}
