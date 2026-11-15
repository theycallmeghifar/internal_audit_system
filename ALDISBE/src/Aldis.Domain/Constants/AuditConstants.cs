namespace Aldis.Domain.Constants;

/// <summary>Status pada tabel <c>audit_headers</c>.</summary>
public static class AuditStatus
{
    public const string Draft = "Draft";
    public const string NotYetStarted = "Not Yet Started";
    public const string Open = "Open";
    public const string Closed = "Closed";
}

/// <summary>Nilai kolom <c>audit_details.finding_category</c> (sama dengan value dropdown di FE).</summary>
public static class FindingCategory
{
    public const string Ok = "OK";
    public const string Ofi = "OFI";
    public const string NcMinor = "NC_MINOR";
    public const string NcMajor = "NC_MAJOR";

    /// <summary>Normalisasi input: "NC Minor", "nc-minor", "NC_MINOR" semuanya menjadi "NC_MINOR".</summary>
    public static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var key = string.Join("_", value.Trim().ToUpperInvariant()
            .Split(new[] { ' ', '-', '_' }, StringSplitOptions.RemoveEmptyEntries));

        return key switch
        {
            Ok => Ok,
            Ofi => Ofi,
            NcMinor => NcMinor,
            NcMajor => NcMajor,
            _ => null
        };
    }

    /// <summary>Kategori selain OK = temuan yang butuh improvement.</summary>
    public static bool RequiresImprovement(string? category) =>
        category == Ofi || category == NcMinor || category == NcMajor;
}

/// <summary>Status pada tabel <c>audit_details</c>.</summary>
public static class AuditDetailStatus
{
    // Fase pengisian checksheet oleh auditor
    public const string NotAnswered = "Not Answered";
    public const string InProgress = "In Progress";
    public const string Completed = "Completed";

    // Fase improvement (hanya untuk temuan non-OK)
    public const string ImprovementRequired = "Improvement Required";
    public const string ImprovementReview = "Improvement Review";
    public const string Approved = "Approved";
}

public static class ReviewDecision
{
    public const string Approve = "APPROVE";
    public const string Return = "RETURN";
}

public static class UserRoles
{
    public const string Administrator = "Administrator";
}
