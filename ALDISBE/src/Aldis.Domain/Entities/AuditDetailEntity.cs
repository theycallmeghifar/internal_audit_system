using Aldis.Domain.Common;

namespace Aldis.Domain.Entities;

public class AuditDetailEntity : BaseAldisTableEntity
{
    public int AuditHeaderId { get; set; }
    public string StandardReference { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public string? ObjectiveEvidenceFinding { get; set; }
    public string? FindingCategory { get; set; }
    public string? AreaDepartmentProcess { get; set; }
    public string? ReferenceDocument { get; set; }
    public int? PicId { get; set; }
    public DateOnly? DueDate { get; set; }
    public DateOnly? ImprovementCompletionDate { get; set; }
    public string? ImprovementCauseAnalysis { get; set; }
    public string? ImprovementCorrectiveAction { get; set; }
    public string? Status { get; set; }

    // Navigation properties
    public virtual AuditHeaderEntity AuditHeader { get; set; } = null!;
    public virtual UserEntity? Pic { get; set; }
    public virtual ICollection<AuditDetailAttachmentEntity> Attachments { get; set; } = new List<AuditDetailAttachmentEntity>();
}
