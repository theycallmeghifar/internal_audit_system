using Aldis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aldis.Persistence.Configurations;

public class DepartmentConfiguration : IEntityTypeConfiguration<DepartmentEntity>
{
    public void Configure(EntityTypeBuilder<DepartmentEntity> builder)
    {
        builder.ToTable("departments");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Code)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(d => d.Code)
            .IsUnique();

        builder.Property(d => d.Name)
            .HasMaxLength(150)
            .IsRequired();

        builder.HasOne(d => d.HeadUser)
            .WithMany(u => u.HeadOfDepartments)
            .HasForeignKey(d => d.HeadUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
