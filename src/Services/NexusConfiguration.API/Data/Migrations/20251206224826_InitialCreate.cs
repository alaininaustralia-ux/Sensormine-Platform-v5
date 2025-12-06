using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using NexusConfiguration.API.Models;

#nullable disable

namespace NexusConfiguration.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "nexus_configurations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    device_type_id = table.Column<Guid>(type: "uuid", nullable: true),
                    schema_id = table.Column<Guid>(type: "uuid", nullable: true),
                    source_document = table.Column<DocumentInfo>(type: "jsonb", nullable: true),
                    probe_configurations = table.Column<List<ProbeConfig>>(type: "jsonb", nullable: false),
                    schema_field_mappings = table.Column<Dictionary<string, string>>(type: "jsonb", nullable: false),
                    communication_settings = table.Column<CommunicationSettings>(type: "jsonb", nullable: false),
                    custom_logic = table.Column<string>(type: "character varying(50000)", maxLength: 50000, nullable: true),
                    custom_logic_language = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    alert_rule_templates = table.Column<List<AlertRuleTemplate>>(type: "jsonb", nullable: false),
                    tags = table.Column<List<string>>(type: "jsonb", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    is_template = table.Column<bool>(type: "boolean", nullable: false),
                    template_category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ai_insights = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    updated_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_nexus_configurations", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_nexus_configurations_is_template",
                table: "nexus_configurations",
                column: "is_template");

            migrationBuilder.CreateIndex(
                name: "ix_nexus_configurations_name",
                table: "nexus_configurations",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_nexus_configurations_status",
                table: "nexus_configurations",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_nexus_configurations_tenant_id",
                table: "nexus_configurations",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_nexus_configurations_tenant_name",
                table: "nexus_configurations",
                columns: new[] { "tenant_id", "name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "nexus_configurations");
        }
    }
}
