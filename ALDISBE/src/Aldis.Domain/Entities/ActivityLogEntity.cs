using Aldis.Domain.Common;

namespace Aldis.Domain.Entities;

public class ActivityLogEntity : BaseAldisTableEntity
{
    public int? UserId { get; set; }
    public string Activity { get; set; } = string.Empty;
    public DateTime LogDatetime { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual UserEntity? User { get; set; }
}
