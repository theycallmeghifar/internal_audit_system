using Aldis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aldis.Persistence.Configurations;

public class AuditDetailAttachmentConfiguration : IEntityTypeConfiguration<AuditDetailAttachmentEntity>
{
    public void Configure(EntityTypeBuilder<AuditDetailAttachmentEntity> builder)
    {
        builder.ToTable("audit_detail_attachments");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.FileName)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(a => a.FilePath)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(a => a.FileType)
            .HasMaxLength(100);

        builder.HasOne(a => a.AuditDetail)
            .WithMany(d => d.Attachments)
            .HasForeignKey(a => a.AuditDetailId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
