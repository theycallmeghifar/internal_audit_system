using Aldis.Domain.Common;

namespace Aldis.Domain.Entities;

public class IsoStandardEntity : BaseAldisTableEntity
{
    public string Code { get; set; } = string.Empty;
    public string? Version { get; set; }
    public string Title { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public DateOnly? EffectiveDate { get; set; }

    // Navigation properties
    public virtual IsoCategoryEntity? Category { get; set; }
    public virtual ICollection<AuditHeaderEntity> AuditHeaders { get; set; } = new List<AuditHeaderEntity>();
}
