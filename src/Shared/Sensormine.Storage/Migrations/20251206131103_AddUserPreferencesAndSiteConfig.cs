using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sensormine.Storage.Migrations
{
    /// <inheritdoc />
    public partial class AddUserPreferencesAndSiteConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "site_configurations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    config_key = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    site_settings = table.Column<string>(type: "jsonb", nullable: false),
                    features = table.Column<string>(type: "jsonb", nullable: false),
                    limits = table.Column<string>(type: "jsonb", nullable: false),
                    defaults = table.Column<string>(type: "jsonb", nullable: false),
                    integrations = table.Column<string>(type: "jsonb", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_site_configurations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "user_preferences",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    tenant_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    display_preferences = table.Column<string>(type: "jsonb", nullable: false),
                    notification_preferences = table.Column<string>(type: "jsonb", nullable: false),
                    dashboard_preferences = table.Column<string>(type: "jsonb", nullable: false),
                    data_preferences = table.Column<string>(type: "jsonb", nullable: false),
                    favorites = table.Column<string>(type: "jsonb", nullable: false),
                    recently_viewed = table.Column<string>(type: "jsonb", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_preferences", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_site_configurations_tenant_key",
                table: "site_configurations",
                columns: new[] { "tenant_id", "config_key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_user_preferences_tenant_user",
                table: "user_preferences",
                columns: new[] { "tenant_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_user_preferences_user",
                table: "user_preferences",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "site_configurations");

            migrationBuilder.DropTable(
                name: "user_preferences");
        }
    }
}
