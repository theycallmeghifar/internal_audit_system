using Aldis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aldis.Persistence.Configurations;

public class AuditHeaderConfiguration : IEntityTypeConfiguration<AuditHeaderEntity>
{
    public void Configure(EntityTypeBuilder<AuditHeaderEntity> builder)
    {
        builder.ToTable("audit_headers");

        builder.HasKey(h => h.Id);

        builder.Property(h => h.Title)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(h => h.AuditDate)
            .IsRequired();

        builder.Property(h => h.Status)
            .HasMaxLength(50);

        builder.Property(h => h.StartedBy)
            .HasMaxLength(100);

        builder.HasOne(h => h.IsoStandard)
            .WithMany(s => s.AuditHeaders)
            .HasForeignKey(h => h.IsoStandardId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(h => h.Department)
            .WithMany(d => d.AuditHeaders)
            .HasForeignKey(h => h.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
