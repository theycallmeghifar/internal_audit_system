using Aldis.Domain.Entities;

namespace Aldis.Application.Interfaces.Repositories;

public class AuditListFilter
{
    public string? Status { get; set; }
    public DateOnly? From { get; set; }
    public DateOnly? To { get; set; }
    public int? DepartmentId { get; set; }
    public int? IsoStandardId { get; set; }
    public bool IncludeDrafts { get; set; }
}

/// <summary>
/// Akses data modul Audit. Alur multi-tabel (header, auditor, auditee, checksheet, attachment)
/// memakai EF Core agar satu SaveChanges = satu transaksi atomik.
/// </summary>
public interface IAuditRepository
{
    Task<AuditHeaderEntity?> GetAuditAsync(int id, bool track, CancellationToken cancellationToken = default);
    Task<List<AuditHeaderEntity>> ListAuditsAsync(AuditListFilter filter, CancellationToken cancellationToken = default);

    Task<UserEntity?> GetActiveUserAsync(int id, CancellationToken cancellationToken = default);
    Task<List<UserEntity>> GetActiveUsersAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken = default);
    Task<bool> IsoStandardExistsAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> DepartmentExistsAsync(int id, CancellationToken cancellationToken = default);

    Task<AuditDetailAttachmentEntity?> GetAttachmentAsync(int id, CancellationToken cancellationToken = default);

    void AddAudit(AuditHeaderEntity audit);
    void RemoveAuditors(IEnumerable<AuditAuditorEntity> items);
    void RemoveAuditees(IEnumerable<AuditAuditeeEntity> items);
    void RemoveDetails(IEnumerable<AuditDetailEntity> items);
    void RemoveAttachments(IEnumerable<AuditDetailAttachmentEntity> items);
    void AddActivityLog(ActivityLogEntity log);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
