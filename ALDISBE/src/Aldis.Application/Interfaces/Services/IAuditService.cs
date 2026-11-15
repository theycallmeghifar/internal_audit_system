using Aldis.Contracts.Audits;
using Aldis.Contracts.Common;

namespace Aldis.Application.Interfaces.Services;

public interface IAuditService
{
    Task<ApiResponse<IEnumerable<AuditListItemResponse>>> GetAuditsAsync(AuditListQuery query, CancellationToken cancellationToken = default);
    Task<ApiResponse<AuditDetailResponse>> GetAuditAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<int>> CreateAuditAsync(CreateAuditRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<int>> UpdateAuditAsync(int id, UpdateAuditRequest request, CancellationToken cancellationToken = default);

    Task<ApiResponse<AuditStatusResponse>> StartAuditAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<ChecksheetSaveResultResponse>> SaveChecksheetAsync(int id, SaveChecksheetRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<AuditStatusResponse>> SubmitChecksheetAsync(int id, SaveChecksheetRequest? request, CancellationToken cancellationToken = default);

    Task<ApiResponse<AuditStatusResponse>> SubmitImprovementAsync(int id, IReadOnlyList<ImprovementSubmissionItem> items, CancellationToken cancellationToken = default);
    Task<ApiResponse<AuditStatusResponse>> ReviewImprovementAsync(int id, ReviewImprovementRequest request, CancellationToken cancellationToken = default);

    Task<ApiResponse<AuditSummaryResponse>> GetSummaryAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<AttachmentFileResult>> GetAttachmentAsync(int attachmentId, CancellationToken cancellationToken = default);
}
