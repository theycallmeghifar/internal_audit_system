using Aldis.Application.Interfaces.Repositories;
using Aldis.Application.Interfaces.Services;
using Aldis.Contracts.Audits;
using Aldis.Contracts.Common;
using Aldis.Domain.Constants;
using Aldis.Domain.Entities;

namespace Aldis.Application.Services;

public class AuditService : IAuditService
{
    private const int MaxFilesPerFinding = 3;
    private const long MaxFileSizeBytes = 5 * 1024 * 1024;

    private static readonly Dictionary<string, string[]> AllowedFiles = new(StringComparer.OrdinalIgnoreCase)
    {
        ["pdf"] = new[] { "application/pdf" },
        ["jpg"] = new[] { "image/jpeg", "image/pjpeg" },
        ["jpeg"] = new[] { "image/jpeg", "image/pjpeg" },
        ["png"] = new[] { "image/png" },
        ["webp"] = new[] { "image/webp" },
        ["gif"] = new[] { "image/gif" }
    };

    private readonly IAuditRepository _repository;
    private readonly IFileStorage _fileStorage;
    private readonly ICurrentUserService _currentUser;

    public AuditService(IAuditRepository repository, IFileStorage fileStorage, ICurrentUserService currentUser)
    {
        _repository = repository;
        _fileStorage = fileStorage;
        _currentUser = currentUser;
    }

    // ------------------------------------------------------------------
    // Query
    // ------------------------------------------------------------------

    public async Task<ApiResponse<IEnumerable<AuditListItemResponse>>> GetAuditsAsync(AuditListQuery query, CancellationToken cancellationToken = default)
    {
        var user = await GetCurrentUserAsync(cancellationToken);
        if (user is null)
            return Unauthorized<IEnumerable<AuditListItemResponse>>();

        var filter = new AuditListFilter
        {
            DepartmentId = NormalizeId(query.DepartmentId),
            IsoStandardId = NormalizeId(query.IsoStandardId)
        };

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            var status = ParseStatus(query.Status);
            if (status is null)
                return Fail<IEnumerable<AuditListItemResponse>>(ApiErrorCodes.Validation,
                    "Status must be one of: Not Yet Started, Open, Closed, Draft.");

            if (status == AuditStatus.Draft)
            {
                /* TODO: UNCOMMENT FOR PRODUCTION DEPLOYMENT
                if (!IsAdmin(user))
                    return Fail<IEnumerable<AuditListItemResponse>>(ApiErrorCodes.Forbidden, "Only an administrator can view draft audits.");
                */

                filter.IncludeDrafts = true;
            }

            filter.Status = status;
        }

        if (!string.IsNullOrWhiteSpace(query.StartPeriod))
        {
            if (!TryParsePeriod(query.StartPeriod, out var from))
                return Fail<IEnumerable<AuditListItemResponse>>(ApiErrorCodes.Validation, "startPeriod must use the yyyy-MM format.");

            filter.From = from;
        }

        if (!string.IsNullOrWhiteSpace(query.EndPeriod))
        {
            if (!TryParsePeriod(query.EndPeriod, out var endMonth))
                return Fail<IEnumerable<AuditListItemResponse>>(ApiErrorCodes.Validation, "endPeriod must use the yyyy-MM format.");

            filter.To = endMonth.AddMonths(1).AddDays(-1);
        }

        var audits = await _repository.ListAuditsAsync(filter, cancellationToken);
        var items = audits.Select(a => MapListItem(a, user)).ToList();

        return ApiResponse<IEnumerable<AuditListItemResponse>>.Ok(items);
    }

    public async Task<ApiResponse<AuditDetailResponse>> GetAuditAsync(int id, CancellationToken cancellationToken = default)
    {
        var user = await GetCurrentUserAsync(cancellationToken);
        if (user is null)
            return Unauthorized<AuditDetailResponse>();

        var audit = await _repository.GetAuditAsync(id, false, cancellationToken);
        /* TODO: UNCOMMENT FOR PRODUCTION DEPLOYMENT
        if (audit is null || (audit.Status == AuditStatus.Draft && !IsAdmin(user)))
            return NotFound<AuditDetailResponse>();
        */
        if (audit is null)
            return NotFound<AuditDetailResponse>();

        return ApiResponse<AuditDetailResponse>.Ok(MapDetail<AuditDetailResponse>(audit, user));
    }

    public async Task<ApiResponse<AuditSummaryResponse>> GetSummaryAsync(int id, CancellationToken cancellationToken = default)
    {
        var user = await GetCurrentUserAsync(cancellationToken);
        if (user is null)
            return Unauthorized<AuditSummaryResponse>();

        var audit = await _repository.GetAuditAsync(id, false, cancellationToken);
        if (audit is null)
            return NotFound<AuditSummaryResponse>();

        if (audit.Status != AuditStatus.Closed)
            return Fail<AuditSummaryResponse>(ApiErrorCodes.Conflict, "The audit summary is available after the audit status is Closed.");

        var summary = MapDetail<AuditSummaryResponse>(audit, user);
        var counts = new CategoryCountsResponse { Total = summary.ChecksheetItems.Count };

        foreach (var item in summary.ChecksheetItems)
        {
            switch (item.Category)
            {
                case FindingCategory.Ok: counts.Ok++; break;
                case FindingCategory.Ofi: counts.Ofi++; break;
                case FindingCategory.NcMinor: counts.NcMinor++; break;
                case FindingCategory.NcMajor: counts.NcMajor++; break;
            }
        }

        summary.CategoryCounts = counts;
        return ApiResponse<AuditSummaryResponse>.Ok(summary);
    }

    public async Task<ApiResponse<AttachmentFileResult>> GetAttachmentAsync(int attachmentId, CancellationToken cancellationToken = default)
    {
        var attachment = await _repository.GetAttachmentAsync(attachmentId, cancellationToken);
        if (attachment is null)
            return NotFound<AttachmentFileResult>("Attachment not found.");

        var stream = await _fileStorage.OpenReadAsync(attachment.FilePath, cancellationToken);
        if (stream is null)
            return NotFound<AttachmentFileResult>("Attachment file is missing from storage.");

        return ApiResponse<AttachmentFileResult>.Ok(new AttachmentFileResult
        {
            Content = stream,
            FileName = attachment.FileName,
            ContentType = string.IsNullOrWhiteSpace(attachment.FileType) ? "application/octet-stream" : attachment.FileType
        });
    }

    // ------------------------------------------------------------------
    // Create / update audit (Administrator)
    // ------------------------------------------------------------------

    public async Task<ApiResponse<int>> CreateAuditAsync(CreateAuditRequest request, CancellationToken cancellationToken = default)
    {
        var user = await GetCurrentUserAsync(cancellationToken);
        if (user is null)
            return Unauthorized<int>();

        /* TODO: UNCOMMENT FOR PRODUCTION DEPLOYMENT
        if (!IsAdmin(user))
            return Fail<int>(ApiErrorCodes.Forbidden, "Only an administrator can create an audit.");
        */

        var validation = await ValidateAuditRequestAsync(request, cancellationToken);
        if (validation.Errors.Count > 0)
            return Fail<int>(ApiErrorCodes.Validation, "Audit data is not valid.", validation.Errors);

        var audit = new AuditHeaderEntity
        {
            CreatedBy = user.Fullname,
            Status = request.IsDraft ? AuditStatus.Draft : AuditStatus.NotYetStarted
        };

        ApplyAuditFields(audit, request);

        foreach (var auditor in validation.Auditors)
            audit.AuditAuditors.Add(new AuditAuditorEntity { UserId = auditor.Id, CreatedBy = user.Fullname });

        foreach (var auditee in validation.Auditees)
            audit.AuditAuditees.Add(new AuditAuditeeEntity { UserId = auditee.Id, CreatedBy = user.Fullname });

        foreach (var question in request.Questions)
            audit.AuditDetails.Add(NewDetail(question, user));

        _repository.AddAudit(audit);
        AddLog(user, $"{(request.IsDraft ? "Save Audit Draft" : "Create Audit Plan")}: {audit.Title}");
        await _repository.SaveChangesAsync(cancellationToken);

        return ApiResponse<int>.Ok(audit.Id, request.IsDraft ? "Audit draft saved successfully." : "Audit created successfully.");
    }

    public async Task<ApiResponse<int>> UpdateAuditAsync(int id, UpdateAuditRequest request, CancellationToken cancellationToken = default)
    {
        var user = await GetCurrentUserAsync(cancellationToken);
        if (user is null)
            return Unauthorized<int>();

        /* TODO: UNCOMMENT FOR PRODUCTION DEPLOYMENT
        if (!IsAdmin(user))
            return Fail<int>(ApiErrorCodes.Forbidden, "Only an administrator can edit an audit.");
        */

        var audit = await _repository.GetAuditAsync(id, true, cancellationToken);
        if (audit is null)
            return NotFound<int>();

        var editable = audit.Status == AuditStatus.Draft ||
                       (audit.Status == AuditStatus.NotYetStarted && audit.StartedDate is null);
        if (!editable)
            return Fail<int>(ApiErrorCodes.Conflict, "Only a draft or a not-yet-started audit can be edited.");

        if (audit.Status == AuditStatus.NotYetStarted && request.IsDraft)
            return Fail<int>(ApiErrorCodes.Validation, "A published audit cannot be reverted to draft.");

        var validation = await ValidateAuditRequestAsync(request, cancellationToken);
        if (validation.Errors.Count > 0)
            return Fail<int>(ApiErrorCodes.Validation, "Audit data is not valid.", validation.Errors);

        ApplyAuditFields(audit, request);
        audit.Status = request.IsDraft ? AuditStatus.Draft : AuditStatus.NotYetStarted;
        audit.UpdateBy = user.Fullname;

        var auditorIds = validation.Auditors.Select(u => u.Id).ToHashSet();
        _repository.RemoveAuditors(audit.AuditAuditors.Where(a => !auditorIds.Contains(a.UserId)).ToList());
        foreach (var auditor in validation.Auditors.Where(u => audit.AuditAuditors.All(a => a.UserId != u.Id)))
            audit.AuditAuditors.Add(new AuditAuditorEntity { UserId = auditor.Id, CreatedBy = user.Fullname });

        var auditeeIds = validation.Auditees.Select(u => u.Id).ToHashSet();
        _repository.RemoveAuditees(audit.AuditAuditees.Where(a => !auditeeIds.Contains(a.UserId)).ToList());
        foreach (var auditee in validation.Auditees.Where(u => audit.AuditAuditees.All(a => a.UserId != u.Id)))
            audit.AuditAuditees.Add(new AuditAuditeeEntity { UserId = auditee.Id, CreatedBy = user.Fullname });

        // Belum ada jawaban checksheet (audit belum di-start), jadi daftar pertanyaan aman diganti total.
        _repository.RemoveDetails(audit.AuditDetails.ToList());
        foreach (var question in request.Questions)
            audit.AuditDetails.Add(NewDetail(question, user));

        AddLog(user, $"Update Audit Plan: {audit.Title}");
        await _repository.SaveChangesAsync(cancellationToken);

        return ApiResponse<int>.Ok(audit.Id, "Audit updated successfully.");
    }

    // ------------------------------------------------------------------
    // Auditor: start, fill, submit
    // ------------------------------------------------------------------

    public async Task<ApiResponse<AuditStatusResponse>> StartAuditAsync(int id, CancellationToken cancellationToken = default)
    {
        var access = await LoadForAuditorAsync(id, cancellationToken);
        if (access.Error is not null)
            return access.Error;

        var (user, audit) = (access.User!, access.Audit!);

        if (audit.Status != AuditStatus.NotYetStarted)
            return Fail<AuditStatusResponse>(ApiErrorCodes.Conflict, "Only an audit with status Not Yet Started can be started.");

        if (audit.StartedDate is null)
        {
            MarkStarted(audit, user);
            AddLog(user, $"Start Audit: {audit.Title}");
            await _repository.SaveChangesAsync(cancellationToken);
        }

        return ApiResponse<AuditStatusResponse>.Ok(MapStatus(audit), "Audit started.");
    }

    public async Task<ApiResponse<ChecksheetSaveResultResponse>> SaveChecksheetAsync(int id, SaveChecksheetRequest request, CancellationToken cancellationToken = default)
    {
        var access = await LoadForAuditorAsync(id, cancellationToken);
        if (access.Error is not null)
            return Fail<ChecksheetSaveResultResponse>(access.Error.ErrorCode!, access.Error.Message);

        var (user, audit) = (access.User!, access.Audit!);

        if (audit.Status != AuditStatus.NotYetStarted)
            return Fail<ChecksheetSaveResultResponse>(ApiErrorCodes.Conflict, "The checksheet can only be filled while the audit status is Not Yet Started.");

        var errors = ApplyChecksheetItems(audit, request.Items, user);
        if (errors.Count > 0)
            return Fail<ChecksheetSaveResultResponse>(ApiErrorCodes.Validation, "Checksheet data is not valid.", errors);

        if (audit.StartedDate is null)
            MarkStarted(audit, user);

        audit.UpdateBy = user.Fullname;
        await _repository.SaveChangesAsync(cancellationToken);

        var ordered = audit.AuditDetails.OrderBy(d => d.Id).ToList();
        return ApiResponse<ChecksheetSaveResultResponse>.Ok(new ChecksheetSaveResultResponse
        {
            AuditId = audit.Id,
            Status = audit.Status!,
            TotalCount = ordered.Count,
            CompletedCount = ordered.Count(d => d.Status == AuditDetailStatus.Completed),
            SavedAt = DateTime.Now,
            Items = ordered.Select(d => new ChecksheetItemStatusResponse { Id = d.Id, Status = d.Status ?? string.Empty }).ToList()
        }, "Checksheet saved.");
    }

    public async Task<ApiResponse<AuditStatusResponse>> SubmitChecksheetAsync(int id, SaveChecksheetRequest? request, CancellationToken cancellationToken = default)
    {
        var access = await LoadForAuditorAsync(id, cancellationToken);
        if (access.Error is not null)
            return access.Error;

        var (user, audit) = (access.User!, access.Audit!);

        if (audit.Status != AuditStatus.NotYetStarted)
            return Fail<AuditStatusResponse>(ApiErrorCodes.Conflict, "The audit has already been submitted.");

        var errors = new List<string>();
        if (request is { Items.Count: > 0 })
            errors.AddRange(ApplyChecksheetItems(audit, request.Items, user));

        var ordered = audit.AuditDetails.OrderBy(d => d.Id).ToList();
        if (ordered.Count == 0)
            errors.Add("The audit has no checksheet items.");

        for (var i = 0; i < ordered.Count; i++)
        {
            var missing = GetMissingFields(ordered[i]);
            if (missing.Count > 0)
                errors.Add($"Check {i + 1:00}: {string.Join(", ", missing)} must be filled.");
        }

        if (errors.Count > 0)
            return Fail<AuditStatusResponse>(ApiErrorCodes.Validation, "Complete all checks before submitting the audit.", errors);

        foreach (var detail in ordered)
        {
            detail.Status = FindingCategory.RequiresImprovement(detail.FindingCategory)
                ? AuditDetailStatus.ImprovementRequired
                : AuditDetailStatus.Completed;
            detail.UpdateBy = user.Fullname;
        }

        // Ada temuan (selain OK) = Open, semua OK = Closed.
        audit.Status = ordered.Any(d => FindingCategory.RequiresImprovement(d.FindingCategory))
            ? AuditStatus.Open
            : AuditStatus.Closed;
        audit.UpdateBy = user.Fullname;

        if (audit.StartedDate is null)
            MarkStarted(audit, user);

        AddLog(user, $"Submit Audit: {audit.Title} ({audit.Status})");
        await _repository.SaveChangesAsync(cancellationToken);

        return ApiResponse<AuditStatusResponse>.Ok(MapStatus(audit),
            audit.Status == AuditStatus.Closed
                ? "Audit submitted. All checks are OK, so the audit is Closed."
                : "Audit submitted. Findings were recorded, so the audit is Open.");
    }

    // ------------------------------------------------------------------
    // Auditee: fill improvement
    // ------------------------------------------------------------------

    public async Task<ApiResponse<AuditStatusResponse>> SubmitImprovementAsync(int id, IReadOnlyList<ImprovementSubmissionItem> items, CancellationToken cancellationToken = default)
    {
        var user = await GetCurrentUserAsync(cancellationToken);
        if (user is null)
            return Unauthorized<AuditStatusResponse>();

        var audit = await _repository.GetAuditAsync(id, true, cancellationToken);
        if (audit is null)
            return NotFound<AuditStatusResponse>();

        /* TODO: UNCOMMENT FOR PRODUCTION DEPLOYMENT
        if (audit.AuditAuditees.All(a => a.UserId != user.Id))
            return Fail<AuditStatusResponse>(ApiErrorCodes.Forbidden, "Only an auditee of this audit can fill the improvement.");
        */

        if (audit.Status != AuditStatus.Open)
            return Fail<AuditStatusResponse>(ApiErrorCodes.Conflict, "Improvements can only be submitted while the audit status is Open.");

        var ordered = audit.AuditDetails.OrderBy(d => d.Id).ToList();
        var required = ordered.Where(d => d.Status == AuditDetailStatus.ImprovementRequired).ToList();
        if (required.Count == 0)
            return Fail<AuditStatusResponse>(ApiErrorCodes.Conflict, "No finding is waiting for an improvement.");

        var errors = new List<string>();
        var submittedIds = items.Select(i => i.FindingId).ToList();

        if (submittedIds.Count != submittedIds.Distinct().Count())
            errors.Add("A finding was submitted more than once.");

        foreach (var detail in required.Where(d => !submittedIds.Contains(d.Id)))
            errors.Add($"Check {ordered.IndexOf(detail) + 1:00} (finding {detail.Id}) is missing an improvement.");

        foreach (var extra in submittedIds.Where(fid => required.All(d => d.Id != fid)).Distinct())
            errors.Add($"Finding {extra} is not waiting for an improvement.");

        foreach (var item in items.Where(i => required.Any(d => d.Id == i.FindingId)))
        {
            var number = ordered.FindIndex(d => d.Id == item.FindingId) + 1;
            var label = $"Check {number:00}";

            if (item.CompletionDate is null)
                errors.Add($"{label}: completionDate is required.");
            if (string.IsNullOrWhiteSpace(item.CauseAnalysis))
                errors.Add($"{label}: causeAnalysis is required.");
            if (string.IsNullOrWhiteSpace(item.CorrectiveAction))
                errors.Add($"{label}: correctiveAction is required.");

            if (item.Files.Count < 1 || item.Files.Count > MaxFilesPerFinding)
                errors.Add($"{label}: 1 to {MaxFilesPerFinding} attachment files are required.");

            foreach (var file in item.Files)
            {
                var fileError = ValidateFile(file);
                if (fileError is not null)
                    errors.Add($"{label}: {fileError}");
            }
        }

        if (errors.Count > 0)
            return Fail<AuditStatusResponse>(ApiErrorCodes.Validation, "Improvement data is not valid.", errors);

        var savedPaths = new List<string>();
        var obsoletePaths = new List<string>();

        try
        {
            foreach (var item in items)
            {
                var detail = required.First(d => d.Id == item.FindingId);

                var oldAttachments = detail.Attachments.ToList();
                obsoletePaths.AddRange(oldAttachments.Select(a => a.FilePath));
                _repository.RemoveAttachments(oldAttachments);

                foreach (var file in item.Files)
                {
                    var extension = GetExtension(file.FileName);
                    var path = await _fileStorage.SaveAsync($"audits/{audit.Id}/{detail.Id}", file, extension, cancellationToken);
                    savedPaths.Add(path);

                    detail.Attachments.Add(new AuditDetailAttachmentEntity
                    {
                        FileName = Truncate(Path.GetFileName(file.FileName), 255),
                        FilePath = path,
                        FileSize = (int)file.Length,
                        FileType = ResolveMimeType(file, extension),
                        CreatedBy = user.Fullname
                    });
                }

                detail.ImprovementCompletionDate = item.CompletionDate;
                detail.ImprovementCauseAnalysis = item.CauseAnalysis!.Trim();
                detail.ImprovementCorrectiveAction = item.CorrectiveAction!.Trim();
                detail.Status = AuditDetailStatus.ImprovementReview;
                detail.ReviewDecision = null;
                detail.ReviewedBy = null;
                detail.ReviewedDate = null;
                detail.UpdateBy = user.Fullname;
            }

            audit.UpdateBy = user.Fullname;
            AddLog(user, $"Submit Improvement: {audit.Title}");
            await _repository.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            await DeleteFilesQuietlyAsync(savedPaths);
            throw;
        }

        await DeleteFilesQuietlyAsync(obsoletePaths);

        return ApiResponse<AuditStatusResponse>.Ok(MapStatus(audit), "Improvements submitted and sent for review.");
    }

    // ------------------------------------------------------------------
    // Auditor: review improvement
    // ------------------------------------------------------------------

    public async Task<ApiResponse<AuditStatusResponse>> ReviewImprovementAsync(int id, ReviewImprovementRequest request, CancellationToken cancellationToken = default)
    {
        var access = await LoadForAuditorAsync(id, cancellationToken);
        if (access.Error is not null)
            return access.Error;

        var (user, audit) = (access.User!, access.Audit!);

        if (audit.Status != AuditStatus.Open)
            return Fail<AuditStatusResponse>(ApiErrorCodes.Conflict, "Improvements can only be reviewed while the audit status is Open.");

        var ordered = audit.AuditDetails.OrderBy(d => d.Id).ToList();
        var reviewable = ordered.Where(d => d.Status == AuditDetailStatus.ImprovementReview).ToList();
        if (reviewable.Count == 0)
            return Fail<AuditStatusResponse>(ApiErrorCodes.Conflict, "No improvement is waiting for review.");

        var errors = new List<string>();
        var submittedIds = request.Findings.Select(f => f.FindingId).ToList();

        if (submittedIds.Count != submittedIds.Distinct().Count())
            errors.Add("A finding was submitted more than once.");

        foreach (var detail in reviewable.Where(d => !submittedIds.Contains(d.Id)))
            errors.Add($"Check {ordered.IndexOf(detail) + 1:00} (finding {detail.Id}) needs a review decision.");

        foreach (var extra in submittedIds.Where(fid => reviewable.All(d => d.Id != fid)).Distinct())
            errors.Add($"Finding {extra} is not waiting for review.");

        foreach (var finding in request.Findings.Where(f => reviewable.Any(d => d.Id == f.FindingId)))
        {
            if (finding.ImprovementId != finding.FindingId)
                errors.Add($"Finding {finding.FindingId}: improvementId must be {finding.FindingId}.");

            var decision = finding.Decision?.Trim().ToUpperInvariant();
            if (decision != ReviewDecision.Approve && decision != ReviewDecision.Return)
                errors.Add($"Finding {finding.FindingId}: decision must be APPROVE or RETURN.");
        }

        if (errors.Count > 0)
            return Fail<AuditStatusResponse>(ApiErrorCodes.Validation, "Review data is not valid.", errors);

        foreach (var finding in request.Findings)
        {
            var detail = reviewable.First(d => d.Id == finding.FindingId);
            var approved = finding.Decision.Trim().ToUpperInvariant() == ReviewDecision.Approve;

            detail.ReviewDecision = approved ? ReviewDecision.Approve : ReviewDecision.Return;
            detail.Status = approved ? AuditDetailStatus.Approved : AuditDetailStatus.ImprovementRequired;
            detail.ReviewedBy = user.Fullname;
            detail.ReviewedDate = DateTime.Now;
            detail.UpdateBy = user.Fullname;
        }

        // Semua temuan disetujui = audit Closed. Jika ada yang RETURN, audit tetap Open dan auditee wajib memperbaiki lagi.
        var allApproved = ordered
            .Where(d => FindingCategory.RequiresImprovement(d.FindingCategory))
            .All(d => d.Status == AuditDetailStatus.Approved);

        if (allApproved)
            audit.Status = AuditStatus.Closed;

        audit.UpdateBy = user.Fullname;
        AddLog(user, $"Review Improvement: {audit.Title} ({audit.Status})");
        await _repository.SaveChangesAsync(cancellationToken);

        return ApiResponse<AuditStatusResponse>.Ok(MapStatus(audit),
            allApproved
                ? "All improvements approved. The audit is Closed."
                : "Review submitted. Returned findings must be improved again.");
    }

    // ------------------------------------------------------------------
    // Helpers: identity & access
    // ------------------------------------------------------------------

    private async Task<UserEntity?> GetCurrentUserAsync(CancellationToken cancellationToken)
    {
        /* TODO: UNCOMMENT FOR PRODUCTION DEPLOYMENT
        if (_currentUser.UserId is not int userId)
            return null;

        return await _repository.GetActiveUserAsync(userId, cancellationToken);
        */

        // MODE DEVELOPMENT / TESTING TANPA LOGIN:
        // Jika ada X-User-Id diisi, gunakan user tersebut; jika tidak ada, gunakan user default (Admin ID 2)
        if (_currentUser.UserId is int userId)
        {
            var activeUser = await _repository.GetActiveUserAsync(userId, cancellationToken);
            if (activeUser is not null) return activeUser;
        }

        return await _repository.GetActiveUserAsync(2, cancellationToken)
            ?? new UserEntity { Id = 2, Fullname = "Muhammad Al Ghifari", Role = UserRoles.Administrator };
    }

    private async Task<AuditAccess> LoadForAuditorAsync(int auditId, CancellationToken cancellationToken)
    {
        var user = await GetCurrentUserAsync(cancellationToken);
        if (user is null)
            return new AuditAccess(null, null, Unauthorized<AuditStatusResponse>());

        var audit = await _repository.GetAuditAsync(auditId, true, cancellationToken);
        if (audit is null)
            return new AuditAccess(null, null, NotFound<AuditStatusResponse>());

        /* TODO: UNCOMMENT FOR PRODUCTION DEPLOYMENT
        if (audit.AuditAuditors.All(a => a.UserId != user.Id))
            return new AuditAccess(null, null, Fail<AuditStatusResponse>(ApiErrorCodes.Forbidden, "Only an auditor of this audit can perform this action."));
        */

        return new AuditAccess(user, audit, null);
    }

    private sealed record AuditAccess(UserEntity? User, AuditHeaderEntity? Audit, ApiResponse<AuditStatusResponse>? Error);

    private static bool IsAdmin(UserEntity user) =>
        string.Equals(user.Role?.Trim(), UserRoles.Administrator, StringComparison.OrdinalIgnoreCase);

    private static ApiResponse<T> Fail<T>(string code, string message, List<string>? errors = null) =>
        ApiResponse<T>.Fail(message, code, errors);

    private static ApiResponse<T> Unauthorized<T>() =>
        Fail<T>(ApiErrorCodes.Unauthorized, "Missing or invalid X-User-Id header, or the user is not active.");

    private static ApiResponse<T> NotFound<T>(string message = "Audit not found.") =>
        Fail<T>(ApiErrorCodes.NotFound, message);

    private static int? NormalizeId(int? id) => id is > 0 ? id : null;

    private void AddLog(UserEntity user, string activity)
    {
        _repository.AddActivityLog(new ActivityLogEntity
        {
            UserId = user.Id,
            Activity = Truncate(activity, 255),
            LogDatetime = DateTime.Now,
            CreatedBy = user.Fullname
        });
    }

    private static void MarkStarted(AuditHeaderEntity audit, UserEntity user)
    {
        audit.StartedBy = user.Fullname;
        audit.StartedDate = DateTime.Now;
    }

    // ------------------------------------------------------------------
    // Helpers: create / update validation
    // ------------------------------------------------------------------

    private sealed record AuditValidation(List<string> Errors, List<UserEntity> Auditors, List<UserEntity> Auditees);

    private async Task<AuditValidation> ValidateAuditRequestAsync(CreateAuditRequest request, CancellationToken cancellationToken)
    {
        var errors = new List<string>();
        var isDraft = request.IsDraft;

        if (string.IsNullOrWhiteSpace(request.Title))
            errors.Add("title is required.");
        else if (request.Title.Trim().Length > 255)
            errors.Add("title must not exceed 255 characters.");

        var isoId = NormalizeId(request.IsoStandardId);
        if (isoId is null)
        {
            if (!isDraft) errors.Add("isoStandardId is required.");
        }
        else if (!await _repository.IsoStandardExistsAsync(isoId.Value, cancellationToken))
        {
            errors.Add($"ISO standard {isoId} was not found.");
        }

        var departmentId = NormalizeId(request.DepartmentId);
        if (departmentId is null)
        {
            if (!isDraft) errors.Add("departmentId is required.");
        }
        else if (!await _repository.DepartmentExistsAsync(departmentId.Value, cancellationToken))
        {
            errors.Add($"Department {departmentId} was not found.");
        }

        if (request.AuditDate is null && !isDraft)
            errors.Add("auditDate is required.");

        var auditorIds = request.AuditorIds.Where(i => i > 0).Distinct().ToList();
        var auditeeIds = request.AuditeeIds.Where(i => i > 0).Distinct().ToList();

        if (!isDraft && auditorIds.Count == 0)
            errors.Add("At least one auditor is required.");
        if (!isDraft && auditeeIds.Count == 0)
            errors.Add("At least one auditee is required.");

        var overlap = auditorIds.Intersect(auditeeIds).ToList();
        if (overlap.Count > 0)
            errors.Add($"A user cannot be both auditor and auditee (user id: {string.Join(", ", overlap)}).");

        var auditors = auditorIds.Count > 0
            ? await _repository.GetActiveUsersAsync(auditorIds, cancellationToken)
            : new List<UserEntity>();
        foreach (var missing in auditorIds.Except(auditors.Select(u => u.Id)))
            errors.Add($"Auditor user {missing} was not found or is not active.");

        var auditees = auditeeIds.Count > 0
            ? await _repository.GetActiveUsersAsync(auditeeIds, cancellationToken)
            : new List<UserEntity>();
        foreach (var missing in auditeeIds.Except(auditees.Select(u => u.Id)))
            errors.Add($"Auditee user {missing} was not found or is not active.");

        if (request.Questions.Count == 0)
            errors.Add("At least one standard reference and question is required.");

        for (var i = 0; i < request.Questions.Count; i++)
        {
            var question = request.Questions[i];
            if (string.IsNullOrWhiteSpace(question.StandardReference) || string.IsNullOrWhiteSpace(question.Question))
                errors.Add($"questions[{i}]: standardReference and question are required.");
            else if (question.StandardReference.Trim().Length > 255)
                errors.Add($"questions[{i}]: standardReference must not exceed 255 characters.");
        }

        return new AuditValidation(errors, auditors, auditees);
    }

    private static void ApplyAuditFields(AuditHeaderEntity audit, CreateAuditRequest request)
    {
        audit.Title = request.Title.Trim();
        audit.IsoStandardId = NormalizeId(request.IsoStandardId);
        audit.DepartmentId = NormalizeId(request.DepartmentId);
        audit.AuditDate = request.AuditDate ?? DateOnly.FromDateTime(DateTime.Today);
        audit.AuditTime = request.AuditTime;
    }

    private static AuditDetailEntity NewDetail(AuditQuestionRequest question, UserEntity user) => new()
    {
        StandardReference = question.StandardReference.Trim(),
        Question = question.Question.Trim(),
        Status = AuditDetailStatus.NotAnswered,
        CreatedBy = user.Fullname
    };

    // ------------------------------------------------------------------
    // Helpers: checksheet
    // ------------------------------------------------------------------

    private static List<string> ApplyChecksheetItems(AuditHeaderEntity audit, List<ChecksheetItemRequest> items, UserEntity user)
    {
        var errors = new List<string>();
        var ordered = audit.AuditDetails.OrderBy(d => d.Id).ToList();
        var auditeeIds = audit.AuditAuditees.Select(a => a.UserId).ToHashSet();

        foreach (var item in items)
        {
            var detail = ordered.FirstOrDefault(d => d.Id == item.Id);
            if (detail is null)
            {
                errors.Add($"Checksheet item {item.Id} does not belong to this audit.");
                continue;
            }

            var label = $"Check {ordered.IndexOf(detail) + 1:00}";

            string? category = null;
            if (!string.IsNullOrWhiteSpace(item.Category))
            {
                category = FindingCategory.Normalize(item.Category);
                if (category is null)
                {
                    errors.Add($"{label}: category must be one of OK, OFI, NC_MINOR, NC_MAJOR.");
                    continue;
                }
            }

            var picId = NormalizeId(item.PicId);
            if (FindingCategory.RequiresImprovement(category) && picId is not null && !auditeeIds.Contains(picId.Value))
            {
                errors.Add($"{label}: picId must be one of the auditees of this audit.");
                continue;
            }

            detail.ObjectiveEvidenceFinding = NullIfBlank(item.ObjectiveEvidenceAndFinding);
            detail.FindingCategory = category;
            detail.AreaDepartmentProcess = NullIfBlank(item.AreaDepartmentProcess, 255);
            detail.ReferenceDocument = NullIfBlank(item.ReferenceDocument, 255);

            // PIC & due date hanya berlaku untuk temuan (selain OK), sama seperti perilaku form di FE.
            if (FindingCategory.RequiresImprovement(category))
            {
                detail.PicId = picId;
                detail.DueDate = item.DueDate;
            }
            else
            {
                detail.PicId = null;
                detail.DueDate = null;
            }

            detail.Status = GetMissingFields(detail).Count switch
            {
                0 => AuditDetailStatus.Completed,
                var missing when missing == RequiredFieldCount(detail) => AuditDetailStatus.NotAnswered,
                _ => AuditDetailStatus.InProgress
            };
            detail.UpdateBy = user.Fullname;
        }

        return errors;
    }

    private static int RequiredFieldCount(AuditDetailEntity detail) =>
        FindingCategory.RequiresImprovement(detail.FindingCategory) ? 6 : 4;

    private static List<string> GetMissingFields(AuditDetailEntity detail)
    {
        var missing = new List<string>();

        if (string.IsNullOrWhiteSpace(detail.ObjectiveEvidenceFinding)) missing.Add("objectiveEvidenceAndFinding");
        if (string.IsNullOrWhiteSpace(detail.FindingCategory)) missing.Add("category");
        if (string.IsNullOrWhiteSpace(detail.AreaDepartmentProcess)) missing.Add("areaDepartmentProcess");
        if (string.IsNullOrWhiteSpace(detail.ReferenceDocument)) missing.Add("referenceDocument");

        if (FindingCategory.RequiresImprovement(detail.FindingCategory))
        {
            if (detail.PicId is null) missing.Add("picId");
            if (detail.DueDate is null) missing.Add("dueDate");
        }

        return missing;
    }

    private static string? NullIfBlank(string? value, int? maxLength = null)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var trimmed = value.Trim();
        return maxLength is null ? trimmed : Truncate(trimmed, maxLength.Value);
    }

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength];

    // ------------------------------------------------------------------
    // Helpers: files
    // ------------------------------------------------------------------

    private static string GetExtension(string fileName) =>
        Path.GetExtension(fileName).TrimStart('.').ToLowerInvariant();

    private static string? ValidateFile(FileUploadItem file)
    {
        var name = Path.GetFileName(file.FileName);
        var extension = GetExtension(name);

        if (!AllowedFiles.TryGetValue(extension, out var mimeTypes))
            return $"file '{name}' must be PDF, JPG/JPEG, PNG, WEBP or GIF.";

        if (file.Length <= 0)
            return $"file '{name}' is empty.";

        if (file.Length > MaxFileSizeBytes)
            return $"file '{name}' exceeds the {MaxFileSizeBytes / (1024 * 1024)} MB limit.";

        if (!string.IsNullOrWhiteSpace(file.ContentType) &&
            !mimeTypes.Contains(file.ContentType.Trim().ToLowerInvariant()) &&
            !string.Equals(file.ContentType, "application/octet-stream", StringComparison.OrdinalIgnoreCase))
            return $"file '{name}' content type '{file.ContentType}' does not match its extension.";

        return null;
    }

    private static string ResolveMimeType(FileUploadItem file, string extension)
    {
        if (!string.IsNullOrWhiteSpace(file.ContentType) &&
            !string.Equals(file.ContentType, "application/octet-stream", StringComparison.OrdinalIgnoreCase))
            return file.ContentType.Trim().ToLowerInvariant();

        return AllowedFiles[extension][0];
    }

    private async Task DeleteFilesQuietlyAsync(IEnumerable<string> paths)
    {
        foreach (var path in paths)
        {
            try
            {
                await _fileStorage.DeleteAsync(path);
            }
            catch
            {
                // Pembersihan file bersifat best-effort; kegagalan tidak boleh menggagalkan request.
            }
        }
    }

    // ------------------------------------------------------------------
    // Helpers: mapping
    // ------------------------------------------------------------------

    private static string? ParseStatus(string raw)
    {
        var key = new string(raw.Where(char.IsLetter).ToArray()).ToLowerInvariant();
        return key switch
        {
            "notyetstarted" or "notstarted" => AuditStatus.NotYetStarted,
            "open" => AuditStatus.Open,
            "closed" => AuditStatus.Closed,
            "draft" => AuditStatus.Draft,
            _ => null
        };
    }

    private static bool TryParsePeriod(string value, out DateOnly firstDay) =>
        DateOnly.TryParseExact($"{value.Trim()}-01", "yyyy-MM-dd", out firstDay);

    private static string GetDisplayStatus(AuditHeaderEntity audit)
    {
        if (audit.Status != AuditStatus.Open)
            return audit.Status ?? string.Empty;

        if (audit.AuditDetails.Any(d => d.Status == AuditDetailStatus.ImprovementRequired))
            return AuditDetailStatus.ImprovementRequired;

        if (audit.AuditDetails.Any(d => d.Status == AuditDetailStatus.ImprovementReview))
            return AuditDetailStatus.ImprovementReview;

        return AuditStatus.Open;
    }

    private static AuditPermissionsResponse GetPermissions(AuditHeaderEntity audit, UserEntity user)
    {
        /* TODO: UNCOMMENT FOR PRODUCTION DEPLOYMENT
        var isAuditor = audit.AuditAuditors.Any(a => a.UserId == user.Id);
        var isAuditee = audit.AuditAuditees.Any(a => a.UserId == user.Id);
        var canEdit = IsAdmin(user) && (audit.Status == AuditStatus.Draft || (notStarted && audit.StartedDate is null));
        */

        // MODE DEVELOPMENT / TESTING TANPA LOGIN: Tombol aksi aktif otomatis sesuai siklus status audit
        var isAuditor = true;
        var isAuditee = true;
        var notStarted = audit.Status == AuditStatus.NotYetStarted;
        var isOpen = audit.Status == AuditStatus.Open;

        return new AuditPermissionsResponse
        {
            CanEdit = audit.Status == AuditStatus.Draft || (notStarted && audit.StartedDate is null),
            CanStart = notStarted && isAuditor,
            CanFillAudit = notStarted && isAuditor,
            CanFillImprovement = isOpen && isAuditee &&
                                 audit.AuditDetails.Any(d => d.Status == AuditDetailStatus.ImprovementRequired),
            CanReviewImprovement = isOpen && isAuditor &&
                                   audit.AuditDetails.Any(d => d.Status == AuditDetailStatus.ImprovementReview),
            CanViewSummary = audit.Status == AuditStatus.Closed
        };
    }

    private static string? FormatIso(IsoStandardEntity? iso) =>
        iso is null ? null : string.IsNullOrWhiteSpace(iso.Version) ? iso.Code : $"{iso.Code}:{iso.Version}";

    private static List<PersonResponse> MapAuditors(AuditHeaderEntity audit) =>
        audit.AuditAuditors.OrderBy(a => a.Id)
            .Select(a => new PersonResponse { Id = a.UserId, Name = a.User.Fullname }).ToList();

    private static List<PersonResponse> MapAuditees(AuditHeaderEntity audit) =>
        audit.AuditAuditees.OrderBy(a => a.Id)
            .Select(a => new PersonResponse { Id = a.UserId, Name = a.User.Fullname }).ToList();

    private static AuditListItemResponse MapListItem(AuditHeaderEntity audit, UserEntity user) => new()
    {
        Id = audit.Id,
        Title = audit.Title,
        IsoStandardId = audit.IsoStandardId,
        IsoStandard = FormatIso(audit.IsoStandard),
        DepartmentId = audit.DepartmentId,
        Department = audit.Department?.Name,
        Auditors = MapAuditors(audit),
        Auditees = MapAuditees(audit),
        AuditDate = audit.AuditDate,
        AuditTime = audit.AuditTime,
        Status = audit.Status ?? string.Empty,
        DisplayStatus = GetDisplayStatus(audit),
        IsStarted = audit.StartedDate is not null,
        Permissions = GetPermissions(audit, user)
    };

    private static T MapDetail<T>(AuditHeaderEntity audit, UserEntity user) where T : AuditDetailResponse, new()
    {
        var response = new T
        {
            Id = audit.Id,
            Title = audit.Title,
            IsoStandardId = audit.IsoStandardId,
            IsoStandard = FormatIso(audit.IsoStandard),
            DepartmentId = audit.DepartmentId,
            Department = audit.Department?.Name,
            AuditDate = audit.AuditDate,
            AuditTime = audit.AuditTime,
            Status = audit.Status ?? string.Empty,
            DisplayStatus = GetDisplayStatus(audit),
            IsStarted = audit.StartedDate is not null,
            StartedBy = audit.StartedBy,
            StartedDate = audit.StartedDate,
            Auditors = MapAuditors(audit),
            Auditees = MapAuditees(audit),
            Permissions = GetPermissions(audit, user)
        };

        var number = 0;
        foreach (var detail in audit.AuditDetails.OrderBy(d => d.Id))
        {
            number++;
            response.ChecksheetItems.Add(new ChecksheetItemResponse
            {
                Id = detail.Id,
                CheckNumber = number,
                StandardReference = detail.StandardReference,
                Question = detail.Question,
                ObjectiveEvidenceAndFinding = detail.ObjectiveEvidenceFinding,
                Category = detail.FindingCategory,
                PicId = detail.PicId,
                PicName = detail.Pic?.Fullname,
                DueDate = detail.DueDate,
                AreaDepartmentProcess = detail.AreaDepartmentProcess,
                ReferenceDocument = detail.ReferenceDocument,
                Status = detail.Status ?? string.Empty,
                Improvement = MapImprovement(detail)
            });
        }

        return response;
    }

    private static ImprovementResponse? MapImprovement(AuditDetailEntity detail)
    {
        if (!FindingCategory.RequiresImprovement(detail.FindingCategory))
            return null;

        var submitted = detail.ImprovementCompletionDate is not null ||
                        !string.IsNullOrWhiteSpace(detail.ImprovementCauseAnalysis) ||
                        !string.IsNullOrWhiteSpace(detail.ImprovementCorrectiveAction) ||
                        detail.Attachments.Count > 0;
        if (!submitted)
            return null;

        return new ImprovementResponse
        {
            Id = detail.Id,
            CompletionDate = detail.ImprovementCompletionDate,
            CauseAnalysis = detail.ImprovementCauseAnalysis,
            CorrectiveAction = detail.ImprovementCorrectiveAction,
            ReviewDecision = detail.ReviewDecision,
            Attachments = detail.Attachments.OrderBy(a => a.Id).Select(a => new AttachmentResponse
            {
                Id = a.Id,
                Name = a.FileName,
                MimeType = a.FileType ?? "application/octet-stream",
                Size = a.FileSize,
                Url = $"/api/Audit/attachments/{a.Id}"
            }).ToList()
        };
    }

    private static AuditStatusResponse MapStatus(AuditHeaderEntity audit) => new()
    {
        AuditId = audit.Id,
        Status = audit.Status ?? string.Empty,
        DisplayStatus = GetDisplayStatus(audit)
    };
}

