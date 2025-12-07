using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sensormine.Storage.Migrations
{
    /// <inheritdoc />
    public partial class AddDashboardHierarchy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "dashboard_type",
                table: "dashboards",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "display_order",
                table: "dashboards",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "parent_dashboard_id",
                table: "dashboards",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_dashboards_parent",
                table: "dashboards",
                column: "parent_dashboard_id");

            migrationBuilder.CreateIndex(
                name: "ix_dashboards_tenant_parent",
                table: "dashboards",
                columns: new[] { "tenant_id", "parent_dashboard_id" });

            migrationBuilder.AddForeignKey(
                name: "FK_dashboards_dashboards_parent_dashboard_id",
                table: "dashboards",
                column: "parent_dashboard_id",
                principalTable: "dashboards",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_dashboards_dashboards_parent_dashboard_id",
                table: "dashboards");

            migrationBuilder.DropIndex(
                name: "ix_dashboards_parent",
                table: "dashboards");

            migrationBuilder.DropIndex(
                name: "ix_dashboards_tenant_parent",
                table: "dashboards");

            migrationBuilder.DropColumn(
                name: "dashboard_type",
                table: "dashboards");

            migrationBuilder.DropColumn(
                name: "display_order",
                table: "dashboards");

            migrationBuilder.DropColumn(
                name: "parent_dashboard_id",
                table: "dashboards");
        }
    }
}
