using Aldis.Domain.Common;
using Aldis.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Aldis.Persistence.Context;

public class AldisDbContext : DbContext
{
    static AldisDbContext()
    {
        AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
    }

    public AldisDbContext(DbContextOptions<AldisDbContext> options)
        : base(options)
    {
    }

    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<DepartmentEntity> Departments => Set<DepartmentEntity>();
    public DbSet<IsoCategoryEntity> IsoCategories => Set<IsoCategoryEntity>();
    public DbSet<IsoStandardEntity> IsoStandards => Set<IsoStandardEntity>();
    public DbSet<AuditHeaderEntity> AuditHeaders => Set<AuditHeaderEntity>();
    public DbSet<AuditAuditorEntity> AuditAuditors => Set<AuditAuditorEntity>();
    public DbSet<AuditAuditeeEntity> AuditAuditees => Set<AuditAuditeeEntity>();
    public DbSet<AuditDetailEntity> AuditDetails => Set<AuditDetailEntity>();
    public DbSet<AuditDetailAttachmentEntity> AuditDetailAttachments => Set<AuditDetailAttachmentEntity>();
    public DbSet<ActivityLogEntity> ActivityLogs => Set<ActivityLogEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AldisDbContext).Assembly);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseAldisTableEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType, b =>
                {
                    b.Property(nameof(BaseAldisTableEntity.CreatedBy))
                        .HasMaxLength(100)
                        .IsRequired();

                    b.Property(nameof(BaseAldisTableEntity.CreatedDate))
                        .IsRequired()
                        .HasDefaultValueSql("CURRENT_TIMESTAMP");

                    b.Property(nameof(BaseAldisTableEntity.UpdateBy))
                        .HasMaxLength(100);

                    b.Property(nameof(BaseAldisTableEntity.UpdateDate));

                    b.Property(nameof(BaseAldisTableEntity.IsActive))
                        .IsRequired()
                        .HasDefaultValue(true);
                });
            }
        }
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseAldisTableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    if (entry.Entity.CreatedDate == default)
                    {
                        entry.Entity.CreatedDate = DateTime.Now;
                    }
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdateDate = DateTime.Now;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
