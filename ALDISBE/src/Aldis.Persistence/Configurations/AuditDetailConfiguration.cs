using Aldis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aldis.Persistence.Configurations;

public class AuditDetailConfiguration : IEntityTypeConfiguration<AuditDetailEntity>
{
    public void Configure(EntityTypeBuilder<AuditDetailEntity> builder)
    {
        builder.ToTable("audit_details");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.StandardReference)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(d => d.Question)
            .HasColumnType("text")
            .IsRequired();

        builder.Property(d => d.ObjectiveEvidenceFinding)
            .HasColumnType("text");

        builder.Property(d => d.FindingCategory)
            .HasMaxLength(50);

        builder.Property(d => d.AreaDepartmentProcess)
            .HasMaxLength(255);

        builder.Property(d => d.ReferenceDocument)
            .HasMaxLength(255);

        builder.Property(d => d.ImprovementCauseAnalysis)
            .HasColumnType("text");

        builder.Property(d => d.ImprovementCorrectiveAction)
            .HasColumnType("text");

        builder.Property(d => d.Status)
            .HasMaxLength(50);

        builder.Property(d => d.ReviewDecision)
            .HasMaxLength(20);

        builder.Property(d => d.ReviewedBy)
            .HasMaxLength(100);

        builder.HasOne(d => d.AuditHeader)
            .WithMany(h => h.AuditDetails)
            .HasForeignKey(d => d.AuditHeaderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.Pic)
            .WithMany(u => u.AssignedAuditDetails)
            .HasForeignKey(d => d.PicId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
