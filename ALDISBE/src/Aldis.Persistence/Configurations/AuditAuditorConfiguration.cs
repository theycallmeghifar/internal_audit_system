using Aldis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aldis.Persistence.Configurations;

public class AuditAuditorConfiguration : IEntityTypeConfiguration<AuditAuditorEntity>
{
    public void Configure(EntityTypeBuilder<AuditAuditorEntity> builder)
    {
        builder.ToTable("audit_auditors");

        builder.HasKey(a => a.Id);

        builder.HasIndex(a => new { a.AuditHeaderId, a.UserId })
            .IsUnique();

        builder.HasOne(a => a.AuditHeader)
            .WithMany(h => h.AuditAuditors)
            .HasForeignKey(a => a.AuditHeaderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.User)
            .WithMany(u => u.AuditAuditors)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
