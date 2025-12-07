using Microsoft.EntityFrameworkCore;
using Sensormine.Core.Models;

namespace Identity.API.Data;

/// <summary>
/// Database context for identity and user management
/// </summary>
public class IdentityDbContext : DbContext
{
    public IdentityDbContext(DbContextOptions<IdentityDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<UserInvitation> UserInvitations => Set<UserInvitation>();
    public DbSet<Tenant> Tenants => Set<Tenant>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure User entity
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.TenantId);
            entity.HasIndex(e => new { e.TenantId, e.Email }).IsUnique();
            entity.HasIndex(e => new { e.SsoProvider, e.SsoUserId });

            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Role).HasConversion<string>().IsRequired();
            entity.Property(e => e.SsoProvider).HasMaxLength(100);
            entity.Property(e => e.SsoUserId).HasMaxLength(255);
            entity.Property(e => e.PhoneNumber).HasMaxLength(50);
            entity.Property(e => e.PreferredLanguage).HasMaxLength(10);
            entity.Property(e => e.Timezone).HasMaxLength(100);
            entity.Property(e => e.AvatarUrl).HasMaxLength(500);

            // Configure JSONB column for metadata
            entity.Property(e => e.Metadata)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");
        });

        // Configure UserInvitation entity
        modelBuilder.Entity<UserInvitation>(entity =>
        {
            entity.ToTable("user_invitations");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasIndex(e => e.TenantId);
            entity.HasIndex(e => new { e.TenantId, e.Email });
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.ExpiresAt);

            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Role).HasConversion<string>().IsRequired();
            entity.Property(e => e.Token).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Status).HasConversion<string>().IsRequired();
            entity.Property(e => e.InvitedByName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Message).HasMaxLength(1000);

            // Configure JSONB column for metadata
            entity.Property(e => e.Metadata)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");
        });

        // Configure Tenant entity
        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.ToTable("tenants");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Name);
            entity.HasIndex(e => e.Subdomain).IsUnique();
            entity.HasIndex(e => e.Status);

            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.ContactEmail).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Status).HasConversion<string>().IsRequired();
            entity.Property(e => e.Subdomain).HasMaxLength(100);
            entity.Property(e => e.StripeCustomerId).HasMaxLength(255);

            // Configure JSONB columns
            entity.Property(e => e.Settings)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            entity.Property(e => e.Metadata)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            // Configure complex types as JSONB
            entity.OwnsOne(e => e.Branding, branding =>
            {
                branding.ToJson();
            });

            entity.OwnsOne(e => e.BillingAddress, address =>
            {
                address.ToJson();
            });
        });

        // TODO: Seed default super admin tenant and user via SQL script or startup code
        // HasData cannot be used with entities that have owned types mapped to JSONB
        // See: https://github.com/npgsql/efcore.pg/issues/2485
        /*
        // Seed default super admin tenant
        var defaultTenantId = "00000000-0000-0000-0000-000000000001";
        modelBuilder.Entity<Tenant>().HasData(new Tenant
        {
            Id = Guid.Parse(defaultTenantId),
            TenantId = defaultTenantId,
            Name = "System",
            ContactEmail = "admin@sensormine.com",
            Status = TenantStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow
        });

        // Seed default super admin user
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            TenantId = defaultTenantId,
            Email = "admin@sensormine.com",
            FullName = "System Administrator",
            Role = UserRole.Administrator,
            IsSuperAdmin = true,
            IsActive = true,
            // Password: Admin123! (will need to be changed on first login)
            // This is a pre-hashed password using Argon2
            PasswordHash = "$argon2id$v=19$m=65536,t=3,p=1$placeholder",
            MustChangePassword = true,
            CreatedAt = DateTimeOffset.UtcNow,
            Metadata = new Dictionary<string, string>()
        });
        */
    }
}
