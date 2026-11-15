namespace Aldis.Contracts.Audits;

public class AuditQuestionRequest
{
    public string StandardReference { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
}

/// <summary>Body untuk membuat audit. <c>isDraft=true</c> = tombol "Save Draft", <c>false</c> = tombol "Save".</summary>
public class CreateAuditRequest
{
    public string Title { get; set; } = string.Empty;
    public int? IsoStandardId { get; set; }
    public int? DepartmentId { get; set; }
    public DateOnly? AuditDate { get; set; }
    public TimeOnly? AuditTime { get; set; }
    public List<int> AuditorIds { get; set; } = new();
    public List<int> AuditeeIds { get; set; } = new();
    public List<AuditQuestionRequest> Questions { get; set; } = new();
    public bool IsDraft { get; set; }
}

/// <summary>Body untuk mengubah audit yang masih Draft / Not Yet Started (belum di-start auditor).</summary>
public class UpdateAuditRequest : CreateAuditRequest
{
}

public class AuditListQuery
{
    /// <summary>"Not Yet Started" | "Open" | "Closed" | "Draft" (slug tab FE seperti "not-started" juga diterima).</summary>
    public string? Status { get; set; }

    /// <summary>Format yyyy-MM (input type=month di FE).</summary>
    public string? StartPeriod { get; set; }

    /// <summary>Format yyyy-MM (input type=month di FE).</summary>
    public string? EndPeriod { get; set; }

    public int? DepartmentId { get; set; }
    public int? IsoStandardId { get; set; }
}

/// <summary>Satu item checksheet yang dikirim auditor (autosave maupun submit).</summary>
public class ChecksheetItemRequest
{
    public int Id { get; set; }
    public string? ObjectiveEvidenceAndFinding { get; set; }

    /// <summary>OK | OFI | NC_MINOR | NC_MAJOR</summary>
    public string? Category { get; set; }
    public string? AreaDepartmentProcess { get; set; }
    public string? ReferenceDocument { get; set; }

    /// <summary>Wajib bila category bukan OK. Harus salah satu auditee pada audit ini.</summary>
    public int? PicId { get; set; }

    /// <summary>Wajib bila category bukan OK.</summary>
    public DateOnly? DueDate { get; set; }
}

public class SaveChecksheetRequest
{
    public List<ChecksheetItemRequest> Items { get; set; } = new();
}

public class ImprovementFindingRequest
{
    /// <summary>Id checksheet item (audit_details.id) yang berstatus Improvement Required.</summary>
    public int FindingId { get; set; }
    public DateOnly? CompletionDate { get; set; }
    public string? CauseAnalysis { get; set; }
    public string? CorrectiveAction { get; set; }

    /// <summary>Nama field multipart tempat file temuan ini dikirim, mis. "attachments[0]". Opsional: jika kosong, file diambil berurutan berdasarkan <see cref="AttachmentCount"/>.</summary>
    public string? AttachmentField { get; set; }
    public int AttachmentCount { get; set; }
}

public class ReviewFindingRequest
{
    public int FindingId { get; set; }

    /// <summary>Sama dengan FindingId (satu temuan = satu improvement aktif).</summary>
    public int ImprovementId { get; set; }

    /// <summary>APPROVE | RETURN</summary>
    public string Decision { get; set; } = string.Empty;
}

public class ReviewImprovementRequest
{
    public List<ReviewFindingRequest> Findings { get; set; } = new();
}

/// <summary>Satu temuan beserta file buktinya, sudah dipetakan dari multipart form oleh controller.</summary>
public class ImprovementSubmissionItem
{
    public int FindingId { get; set; }
    public DateOnly? CompletionDate { get; set; }
    public string? CauseAnalysis { get; set; }
    public string? CorrectiveAction { get; set; }
    public List<Aldis.Contracts.Common.FileUploadItem> Files { get; set; } = new();
}

/// <summary>File attachment yang siap di-stream ke client.</summary>
public class AttachmentFileResult
{
    public Stream Content { get; set; } = Stream.Null;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
}
