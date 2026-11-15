using Aldis.Application.Interfaces.Repositories;
using Aldis.Domain.Constants;
using Aldis.Domain.Entities;
using Aldis.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Aldis.Persistence.Repositories;

public class AuditRepository : IAuditRepository
{
    private readonly AldisDbContext _context;

    public AuditRepository(AldisDbContext context)
    {
        _context = context;
    }

    public async Task<AuditHeaderEntity?> GetAuditAsync(int id, bool track, CancellationToken cancellationToken = default)
    {
        var query = _context.AuditHeaders
            .Include(a => a.IsoStandard)
            .Include(a => a.Department)
            .Include(a => a.AuditAuditors).ThenInclude(x => x.User)
            .Include(a => a.AuditAuditees).ThenInclude(x => x.User)
            .Include(a => a.AuditDetails).ThenInclude(d => d.Pic)
            .Include(a => a.AuditDetails).ThenInclude(d => d.Attachments)
            .AsSplitQuery();

        if (!track)
            query = query.AsNoTracking();

        return await query.FirstOrDefaultAsync(a => a.Id == id && a.IsActive, cancellationToken);
    }

    public async Task<List<AuditHeaderEntity>> ListAuditsAsync(AuditListFilter filter, CancellationToken cancellationToken = default)
    {
        var query = _context.AuditHeaders
            .AsNoTracking()
            .Include(a => a.IsoStandard)
            .Include(a => a.Department)
            .Include(a => a.AuditAuditors).ThenInclude(x => x.User)
            .Include(a => a.AuditAuditees).ThenInclude(x => x.User)
            .Include(a => a.AuditDetails)
            .AsSplitQuery()
            .Where(a => a.IsActive);

        if (!filter.IncludeDrafts)
            query = query.Where(a => a.Status != AuditStatus.Draft);

        if (!string.IsNullOrWhiteSpace(filter.Status))
            query = query.Where(a => a.Status == filter.Status);

        if (filter.From.HasValue)
            query = query.Where(a => a.AuditDate >= filter.From.Value);

        if (filter.To.HasValue)
            query = query.Where(a => a.AuditDate <= filter.To.Value);

        if (filter.DepartmentId.HasValue)
            query = query.Where(a => a.DepartmentId == filter.DepartmentId.Value);

        if (filter.IsoStandardId.HasValue)
            query = query.Where(a => a.IsoStandardId == filter.IsoStandardId.Value);

        return await query
            .OrderByDescending(a => a.AuditDate)
            .ThenByDescending(a => a.Id)
            .ToListAsync(cancellationToken);
    }

    public Task<UserEntity?> GetActiveUserAsync(int id, CancellationToken cancellationToken = default) =>
        _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id && u.IsActive, cancellationToken);

    public Task<List<UserEntity>> GetActiveUsersAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken = default) =>
        _context.Users.AsNoTracking().Where(u => ids.Contains(u.Id) && u.IsActive).ToListAsync(cancellationToken);

    public Task<bool> IsoStandardExistsAsync(int id, CancellationToken cancellationToken = default) =>
        _context.IsoStandards.AnyAsync(s => s.Id == id && s.IsActive, cancellationToken);

    public Task<bool> DepartmentExistsAsync(int id, CancellationToken cancellationToken = default) =>
        _context.Departments.AnyAsync(d => d.Id == id && d.IsActive, cancellationToken);

    public Task<AuditDetailAttachmentEntity?> GetAttachmentAsync(int id, CancellationToken cancellationToken = default) =>
        _context.AuditDetailAttachments.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id && a.IsActive, cancellationToken);

    public void AddAudit(AuditHeaderEntity audit) => _context.AuditHeaders.Add(audit);

    public void RemoveAuditors(IEnumerable<AuditAuditorEntity> items) => _context.AuditAuditors.RemoveRange(items);

    public void RemoveAuditees(IEnumerable<AuditAuditeeEntity> items) => _context.AuditAuditees.RemoveRange(items);

    public void RemoveDetails(IEnumerable<AuditDetailEntity> items) => _context.AuditDetails.RemoveRange(items);

    public void RemoveAttachments(IEnumerable<AuditDetailAttachmentEntity> items) =>
        _context.AuditDetailAttachments.RemoveRange(items);

    public void AddActivityLog(ActivityLogEntity log) => _context.ActivityLogs.Add(log);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _context.SaveChangesAsync(cancellationToken);
}
