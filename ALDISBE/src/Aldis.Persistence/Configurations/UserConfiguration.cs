using Aldis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aldis.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<UserEntity>
{
    public void Configure(EntityTypeBuilder<UserEntity> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.EmployeeId)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(u => u.EmployeeId)
            .IsUnique();

        builder.Property(u => u.Fullname)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(u => u.Nickname)
            .HasMaxLength(100);

        builder.Property(u => u.Email)
            .HasMaxLength(255)
            .IsRequired();

        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.Property(u => u.JobLevel)
            .HasMaxLength(100);

        builder.Property(u => u.JobTitle)
            .HasMaxLength(150);

        builder.Property(u => u.Role)
            .HasMaxLength(50);

        builder.HasOne(u => u.Department)
            .WithMany(d => d.Users)
            .HasForeignKey(u => u.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
