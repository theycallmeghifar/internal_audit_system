using Aldis.Domain.Common;

namespace Aldis.Domain.Entities;

public class AuditDetailAttachmentEntity : BaseAldisTableEntity
{
    public int AuditDetailId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public int? FileSize { get; set; }
    public string? FileType { get; set; }

    // Navigation properties
    public virtual AuditDetailEntity AuditDetail { get; set; } = null!;
}
