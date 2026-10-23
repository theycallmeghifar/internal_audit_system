using Aldis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aldis.Persistence.Configurations;

public class ActivityLogConfiguration : IEntityTypeConfiguration<ActivityLogEntity>
{
    public void Configure(EntityTypeBuilder<ActivityLogEntity> builder)
    {
        builder.ToTable("activity_logs");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.Activity)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(l => l.LogDatetime)
            .IsRequired();

        builder.HasOne(l => l.User)
            .WithMany(u => u.ActivityLogs)
            .HasForeignKey(l => l.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
