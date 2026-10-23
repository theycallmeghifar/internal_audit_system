using Aldis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aldis.Persistence.Configurations;

public class AuditAuditeeConfiguration : IEntityTypeConfiguration<AuditAuditeeEntity>
{
    public void Configure(EntityTypeBuilder<AuditAuditeeEntity> builder)
    {
        builder.ToTable("audit_auditees");

        builder.HasKey(a => a.Id);

        builder.HasIndex(a => new { a.AuditHeaderId, a.UserId })
            .IsUnique();

        builder.HasOne(a => a.AuditHeader)
            .WithMany(h => h.AuditAuditees)
            .HasForeignKey(a => a.AuditHeaderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.User)
            .WithMany(u => u.AuditAuditees)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
