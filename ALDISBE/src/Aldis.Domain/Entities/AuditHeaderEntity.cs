using Aldis.Domain.Common;

namespace Aldis.Domain.Entities;

public class AuditHeaderEntity : BaseAldisTableEntity
{
    public string Title { get; set; } = string.Empty;
    public int? IsoStandardId { get; set; }
    public int? DepartmentId { get; set; }
    public DateOnly AuditDate { get; set; }
    public string? Status { get; set; }

    // Navigation properties
    public virtual IsoStandardEntity? IsoStandard { get; set; }
    public virtual DepartmentEntity? Department { get; set; }
    public virtual ICollection<AuditAuditorEntity> AuditAuditors { get; set; } = new List<AuditAuditorEntity>();
    public virtual ICollection<AuditAuditeeEntity> AuditAuditees { get; set; } = new List<AuditAuditeeEntity>();
    public virtual ICollection<AuditDetailEntity> AuditDetails { get; set; } = new List<AuditDetailEntity>();
}
