using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Identity.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create tenants table
            migrationBuilder.CreateTable(
                name: "tenants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ParentTenantId = table.Column<Guid>(type: "uuid", nullable: true),
                    StripeCustomerId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    SubscriptionPlanId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Subdomain = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Branding = table.Column<string>(type: "jsonb", nullable: true),
                    Settings = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'{}'::jsonb"),
                    ContactEmail = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    BillingAddress = table.Column<string>(type: "jsonb", nullable: true),
                    IsTrial = table.Column<bool>(type: "boolean", nullable: false),
                    TrialEndsAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Metadata = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'{}'::jsonb"),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tenants", x => x.Id);
                });

            // Create users table
            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FullName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: true),
                    Role = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsSuperAdmin = table.Column<bool>(type: "boolean", nullable: false),
                    SsoProvider = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SsoUserId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    LastLoginAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LockedOutUntil = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    FailedLoginAttempts = table.Column<int>(type: "integer", nullable: false),
                    MustChangePassword = table.Column<bool>(type: "boolean", nullable: false),
                    Metadata = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'{}'::jsonb"),
                    PhoneNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    MfaEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AvatarUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PreferredLanguage = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Timezone = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                });

            // Create user_invitations table
            migrationBuilder.CreateTable(
                name: "user_invitations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    InvitedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    InvitedByName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Token = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    AcceptedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    AcceptedUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Message = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Metadata = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'{}'::jsonb"),
                    TenantId = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_invitations", x => x.Id);
                });

            // Create indexes for tenants
            migrationBuilder.CreateIndex(
                name: "IX_tenants_Name",
                table: "tenants",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_tenants_Subdomain",
                table: "tenants",
                column: "Subdomain",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tenants_Status",
                table: "tenants",
                column: "Status");

            // Create indexes for users
            migrationBuilder.CreateIndex(
                name: "IX_users_Email",
                table: "users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_TenantId",
                table: "users",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_users_TenantId_Email",
                table: "users",
                columns: new[] { "TenantId", "Email" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_SsoProvider_SsoUserId",
                table: "users",
                columns: new[] { "SsoProvider", "SsoUserId" });

            // Create indexes for user_invitations
            migrationBuilder.CreateIndex(
                name: "IX_user_invitations_Token",
                table: "user_invitations",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_invitations_TenantId",
                table: "user_invitations",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_user_invitations_TenantId_Email",
                table: "user_invitations",
                columns: new[] { "TenantId", "Email" });

            migrationBuilder.CreateIndex(
                name: "IX_user_invitations_Status",
                table: "user_invitations",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_user_invitations_ExpiresAt",
                table: "user_invitations",
                column: "ExpiresAt");

            // Insert seed data - System tenant
            migrationBuilder.InsertData(
                table: "tenants",
                columns: new[] { "Id", "Name", "ContactEmail", "Status", "TenantId", "CreatedAt", "Settings", "Metadata", "IsTrial" },
                values: new object[] 
                { 
                    Guid.Parse("00000000-0000-0000-0000-000000000001"), 
                    "System", 
                    "admin@sensormine.com", 
                    "Active", 
                    "00000000-0000-0000-0000-000000000001", 
                    DateTimeOffset.UtcNow, 
                    "{}", 
                    "{}", 
                    false 
                });

            // Insert seed data - Default super admin user
            migrationBuilder.InsertData(
                table: "users",
                columns: new[] { "Id", "TenantId", "Email", "FullName", "Role", "IsSuperAdmin", "IsActive", "PasswordHash", "MustChangePassword", "CreatedAt", "Metadata", "FailedLoginAttempts", "MfaEnabled" },
                values: new object[] 
                { 
                    Guid.Parse("00000000-0000-0000-0000-000000000001"), 
                    "00000000-0000-0000-0000-000000000001", 
                    "admin@sensormine.com", 
                    "System Administrator", 
                    "Administrator", 
                    true, 
                    true, 
                    "$argon2id$v=19$m=65536,t=3,p=1$placeholder", 
                    true, 
                    DateTimeOffset.UtcNow, 
                    "{}", 
                    0, 
                    false 
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "users");
            migrationBuilder.DropTable(name: "user_invitations");
            migrationBuilder.DropTable(name: "tenants");
        }
    }
}
