using Aldis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aldis.Persistence.Configurations;

public class IsoCategoryConfiguration : IEntityTypeConfiguration<IsoCategoryEntity>
{
    public void Configure(EntityTypeBuilder<IsoCategoryEntity> builder)
    {
        builder.ToTable("iso_categories");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .HasMaxLength(150)
            .IsRequired();
    }
}
