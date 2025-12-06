using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sensormine.Storage.Migrations
{
    /// <inheritdoc />
    public partial class AddDashboardsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "dashboards",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    layout = table.Column<string>(type: "jsonb", nullable: false),
                    widgets = table.Column<string>(type: "jsonb", nullable: false),
                    is_template = table.Column<bool>(type: "boolean", nullable: false),
                    template_category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    shared_with = table.Column<string>(type: "jsonb", nullable: true),
                    tags = table.Column<string>(type: "jsonb", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_dashboards", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_dashboards_is_template",
                table: "dashboards",
                column: "is_template");

            migrationBuilder.CreateIndex(
                name: "ix_dashboards_tenant",
                table: "dashboards",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_dashboards_tenant_user",
                table: "dashboards",
                columns: new[] { "tenant_id", "user_id" });

            migrationBuilder.CreateIndex(
                name: "ix_dashboards_user",
                table: "dashboards",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "dashboards");
        }
    }
}
