using Aldis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aldis.Persistence.Configurations;

public class IsoStandardConfiguration : IEntityTypeConfiguration<IsoStandardEntity>
{
    public void Configure(EntityTypeBuilder<IsoStandardEntity> builder)
    {
        builder.ToTable("iso_standards");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Code)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(s => s.Version)
            .HasMaxLength(50);

        builder.Property(s => s.Title)
            .HasMaxLength(255)
            .IsRequired();

        builder.HasOne(s => s.Category)
            .WithMany(c => c.IsoStandards)
            .HasForeignKey(s => s.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
