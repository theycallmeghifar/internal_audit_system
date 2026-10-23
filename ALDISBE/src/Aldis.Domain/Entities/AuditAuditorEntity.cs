using Aldis.Domain.Common;

namespace Aldis.Domain.Entities;

public class AuditAuditorEntity : BaseAldisTableEntity
{
    public int AuditHeaderId { get; set; }
    public int UserId { get; set; }

    // Navigation properties
    public virtual AuditHeaderEntity AuditHeader { get; set; } = null!;
    public virtual UserEntity User { get; set; } = null!;
}
