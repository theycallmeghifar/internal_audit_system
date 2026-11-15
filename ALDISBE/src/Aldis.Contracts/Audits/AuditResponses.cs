namespace Aldis.Contracts.Audits;

public class PersonResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

/// <summary>Aksi yang boleh dilakukan user yang sedang login pada audit ini. FE cukup membaca flag ini untuk menampilkan tombol.</summary>
public class AuditPermissionsResponse
{
    public bool CanEdit { get; set; }
    public bool CanStart { get; set; }
    public bool CanFillAudit { get; set; }
    public bool CanFillImprovement { get; set; }
    public bool CanReviewImprovement { get; set; }
    public bool CanViewSummary { get; set; }
}

public class AuditListItemResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int? IsoStandardId { get; set; }

    /// <summary>Contoh: "ISO 9001:2015".</summary>
    public string? IsoStandard { get; set; }
    public int? DepartmentId { get; set; }
    public string? Department { get; set; }
    public List<PersonResponse> Auditors { get; set; } = new();
    public List<PersonResponse> Auditees { get; set; } = new();
    public DateOnly AuditDate { get; set; }
    public TimeOnly? AuditTime { get; set; }

    /// <summary>Draft | Not Yet Started | Open | Closed (menentukan tab).</summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>Label badge di tabel: Not Yet Started | Improvement Required | Improvement Review | Closed.</summary>
    public string DisplayStatus { get; set; } = string.Empty;
    public bool IsStarted { get; set; }
    public AuditPermissionsResponse Permissions { get; set; } = new();
}

public class AttachmentResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public int? Size { get; set; }

    /// <summary>URL relatif untuk preview/download, mis. /api/Audit/attachments/12.</summary>
    public string Url { get; set; } = string.Empty;
}

public class ImprovementResponse
{
    /// <summary>Sama dengan id checksheet item.</summary>
    public int Id { get; set; }
    public DateOnly? CompletionDate { get; set; }
    public string? CauseAnalysis { get; set; }
    public string? CorrectiveAction { get; set; }
    public List<AttachmentResponse> Attachments { get; set; } = new();

    /// <summary>APPROVE | RETURN | null (belum direview).</summary>
    public string? ReviewDecision { get; set; }
}

public class ChecksheetItemResponse
{
    public int Id { get; set; }
    public int CheckNumber { get; set; }
    public string StandardReference { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public string? ObjectiveEvidenceAndFinding { get; set; }
    public string? Category { get; set; }
    public int? PicId { get; set; }
    public string? PicName { get; set; }
    public DateOnly? DueDate { get; set; }
    public string? AreaDepartmentProcess { get; set; }
    public string? ReferenceDocument { get; set; }

    /// <summary>Not Answered | In Progress | Completed | Improvement Required | Improvement Review | Approved</summary>
    public string Status { get; set; } = string.Empty;
    public ImprovementResponse? Improvement { get; set; }
}

public class AuditDetailResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int? IsoStandardId { get; set; }
    public string? IsoStandard { get; set; }
    public int? DepartmentId { get; set; }
    public string? Department { get; set; }
    public DateOnly AuditDate { get; set; }
    public TimeOnly? AuditTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string DisplayStatus { get; set; } = string.Empty;
    public bool IsStarted { get; set; }
    public string? StartedBy { get; set; }
    public DateTime? StartedDate { get; set; }
    public List<PersonResponse> Auditors { get; set; } = new();
    public List<PersonResponse> Auditees { get; set; } = new();
    public List<ChecksheetItemResponse> ChecksheetItems { get; set; } = new();
    public AuditPermissionsResponse Permissions { get; set; } = new();
}

public class CategoryCountsResponse
{
    public int Ok { get; set; }
    public int Ofi { get; set; }
    public int NcMinor { get; set; }
    public int NcMajor { get; set; }
    public int Total { get; set; }
}

public class AuditSummaryResponse : AuditDetailResponse
{
    public CategoryCountsResponse CategoryCounts { get; set; } = new();
}

public class ChecksheetSaveResultResponse
{
    public int AuditId { get; set; }
    public string Status { get; set; } = string.Empty;
    public int CompletedCount { get; set; }
    public int TotalCount { get; set; }
    public DateTime SavedAt { get; set; }
    public List<ChecksheetItemStatusResponse> Items { get; set; } = new();
}

public class ChecksheetItemStatusResponse
{
    public int Id { get; set; }
    public string Status { get; set; } = string.Empty;
}

/// <summary>Hasil submit checksheet / improvement / review: status audit terbaru.</summary>
public class AuditStatusResponse
{
    public int AuditId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string DisplayStatus { get; set; } = string.Empty;
}
