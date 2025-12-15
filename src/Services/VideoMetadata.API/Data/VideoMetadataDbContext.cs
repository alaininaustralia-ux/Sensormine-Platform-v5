using Microsoft.EntityFrameworkCore;
using VideoMetadata.API.Models;

namespace VideoMetadata.API.Data;

public class VideoMetadataDbContext : DbContext
{
    public VideoMetadataDbContext(DbContextOptions<VideoMetadataDbContext> options)
        : base(options)
    {
    }

    public DbSet<VideoAnalyticsConfiguration> VideoAnalyticsConfigurations { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<VideoAnalyticsConfiguration>(entity =>
        {
            entity.HasIndex(e => e.TenantId);
            entity.HasIndex(e => e.Enabled);
            entity.HasIndex(e => new { e.TenantId, e.Name });
        });
    }
}
