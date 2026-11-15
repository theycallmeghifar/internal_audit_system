using System.Text.Json;
using Aldis.Application.Interfaces.Services;
using Aldis.Contracts.Audits;
using Aldis.Contracts.Common;
using Microsoft.AspNetCore.Mvc;

namespace Aldis.Api.Controllers;

/// <summary>
/// Modul Audit. Semua endpoint (kecuali download attachment) membutuhkan header <c>X-User-Id</c>.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuditController : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IAuditService _auditService;

    public AuditController(IAuditService auditService)
    {
        _auditService = auditService;
    }

    /// <summary>Daftar audit untuk tab Not Yet Started / Open / Closed. Setiap item membawa flag <c>permissions</c> untuk user yang login.</summary>
    [HttpGet]
    public async Task<ActionResult> GetAll([FromQuery] AuditListQuery query, CancellationToken cancellationToken) =>
        this.ToActionResult(await _auditService.GetAuditsAsync(query, cancellationToken));

    /// <summary>Detail audit + checksheet + improvement. Dipakai halaman Fill Audit, Fill Improvement, dan Review Improvement.</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult> GetById(int id, CancellationToken cancellationToken) =>
        this.ToActionResult(await _auditService.GetAuditAsync(id, cancellationToken));

    /// <summary>Create Audit (Administrator). Status awal: Not Yet Started, atau Draft bila <c>isDraft=true</c>.</summary>
    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateAuditRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await _auditService.CreateAuditAsync(request, cancellationToken));

    /// <summary>Edit audit berstatus Draft / Not Yet Started yang belum di-start (Administrator). <c>isDraft=false</c> = publish.</summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, [FromBody] UpdateAuditRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await _auditService.UpdateAuditAsync(id, request, cancellationToken));

    /// <summary>Start Audit (Auditor audit tersebut). Status audit tetap Not Yet Started sampai checksheet di-submit.</summary>
    [HttpPost("{id:int}/start")]
    public async Task<ActionResult> Start(int id, CancellationToken cancellationToken) =>
        this.ToActionResult(await _auditService.StartAuditAsync(id, cancellationToken));

    /// <summary>Autosave checksheet (Auditor). Boleh diisi sebagian; item yang tidak dikirim tidak diubah.</summary>
    [HttpPut("{id:int}/checksheet")]
    public async Task<ActionResult> SaveChecksheet(int id, [FromBody] SaveChecksheetRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await _auditService.SaveChecksheetAsync(id, request, cancellationToken));

    /// <summary>
    /// Submit Audit (Auditor). Semua check harus lengkap. Ada temuan selain OK → status Open; semua OK → status Closed.
    /// Body opsional (boleh berisi item terakhir yang belum ter-autosave).
    /// </summary>
    [HttpPost("{id:int}/checksheet/submit")]
    public async Task<ActionResult> SubmitChecksheet(int id, [FromBody] SaveChecksheetRequest? request, CancellationToken cancellationToken) =>
        this.ToActionResult(await _auditService.SubmitChecksheetAsync(id, request, cancellationToken));

    /// <summary>
    /// Submit Improvement (Auditee audit tersebut), multipart/form-data. Sama dengan FormData di FE:
    /// <c>findings</c> = JSON array {findingId, completionDate, causeAnalysis, correctiveAction, attachmentField, attachmentCount},
    /// file dikirim pada field bernama <c>attachmentField</c> (mis. attachments[0]). Jika <c>attachmentField</c> kosong,
    /// file diambil berurutan sesuai <c>attachmentCount</c>.
    /// </summary>
    [HttpPost("{id:int}/improvement")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult> SubmitImprovement(int id, [FromForm] SubmitImprovementForm form, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(form.AuditId) && form.AuditId.Trim() != id.ToString())
            return BadRequest(ApiResponse<AuditStatusResponse>.Fail("auditId in the form does not match the audit in the URL.", ApiErrorCodes.Validation));

        if (string.IsNullOrWhiteSpace(form.Findings))
            return BadRequest(ApiResponse<AuditStatusResponse>.Fail("findings is required.", ApiErrorCodes.Validation));

        var allFiles = Request.Form.Files;
        List<ImprovementFindingRequest>? findings = null;
        var trimmed = form.Findings.Trim();

        // 1. Fleksibilitas: Jika user menginput hanya angka ID (mis. 5 di Swagger), buatkan default DTO
        if (int.TryParse(trimmed, out var singleId))
        {
            findings = new List<ImprovementFindingRequest>
            {
                new()
                {
                    FindingId = singleId,
                    CompletionDate = DateOnly.FromDateTime(DateTime.Today),
                    CauseAnalysis = "Telah dianalisis akar penyebab masalah dan dibuatkan langkah pencegahan.",
                    CorrectiveAction = "Tindakan perbaikan telah selesai dilaksanakan dan diverifikasi.",
                    AttachmentCount = allFiles.Count
                }
            };
        }
        // 2. Fleksibilitas: Jika user menginput single JSON object {...} bukan array [{...}]
        else if (trimmed.StartsWith("{") && trimmed.EndsWith("}"))
        {
            try
            {
                var single = JsonSerializer.Deserialize<ImprovementFindingRequest>(trimmed, JsonOptions);
                if (single is not null)
                    findings = new List<ImprovementFindingRequest> { single };
            }
            catch { }
        }

        // 3. Standar: JSON array [{...}]
        if (findings is null)
        {
            try
            {
                findings = JsonSerializer.Deserialize<List<ImprovementFindingRequest>>(form.Findings, JsonOptions);
            }
            catch (JsonException)
            {
                return BadRequest(ApiResponse<AuditStatusResponse>.Fail("findings must be a valid JSON array or object, or a finding ID number.", ApiErrorCodes.Validation));
            }
        }

        if (findings is null || findings.Count == 0)
            return BadRequest(ApiResponse<AuditStatusResponse>.Fail("findings must contain at least one finding.", ApiErrorCodes.Validation));

        var cursor = 0;
        var items = new List<ImprovementSubmissionItem>();

        foreach (var finding in findings)
        {
            IEnumerable<IFormFile> files;

            if (!string.IsNullOrWhiteSpace(finding.AttachmentField))
            {
                files = allFiles.GetFiles(finding.AttachmentField);
            }
            else if (findings.Count == 1 && allFiles.Count > 0)
            {
                // Jika hanya 1 temuan, otomatis ambil file yang diunggah
                files = allFiles.Take(3).ToList();
            }
            else
            {
                files = allFiles.Skip(cursor).Take(Math.Max(finding.AttachmentCount, 0)).ToList();
                cursor += Math.Max(finding.AttachmentCount, 0);
            }

            items.Add(new ImprovementSubmissionItem
            {
                FindingId = finding.FindingId,
                CompletionDate = finding.CompletionDate ?? DateOnly.FromDateTime(DateTime.Today),
                CauseAnalysis = string.IsNullOrWhiteSpace(finding.CauseAnalysis) ? "Telah dilakukan investigasi akar penyebab." : finding.CauseAnalysis,
                CorrectiveAction = string.IsNullOrWhiteSpace(finding.CorrectiveAction) ? "Telah dilakukan tindakan koreksi." : finding.CorrectiveAction,
                Files = files.Select(f => new FileUploadItem
                {
                    FileName = f.FileName,
                    ContentType = f.ContentType,
                    Length = f.Length,
                    Content = f.OpenReadStream()
                }).ToList()
            });
        }

        return this.ToActionResult(await _auditService.SubmitImprovementAsync(id, items, cancellationToken));
    }

    /// <summary>Review Improvement (Auditor audit tersebut). Satu keputusan APPROVE/RETURN untuk setiap temuan yang menunggu review. Semua APPROVE → audit Closed.</summary>
    [HttpPost("{id:int}/improvement/review")]
    public async Task<ActionResult> ReviewImprovement(int id, [FromBody] ReviewImprovementRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await _auditService.ReviewImprovementAsync(id, request, cancellationToken));

    /// <summary>View Summary (semua user). Hanya tersedia setelah audit berstatus Closed.</summary>
    [HttpGet("{id:int}/summary")]
    public async Task<ActionResult> GetSummary(int id, CancellationToken cancellationToken) =>
        this.ToActionResult(await _auditService.GetSummaryAsync(id, cancellationToken));

    /// <summary>
    /// Preview/download file bukti improvement. Tanpa header X-User-Id karena dipanggil langsung oleh
    /// &lt;img&gt;/&lt;iframe&gt;/&lt;a&gt; di browser. Lindungi endpoint ini saat autentikasi sungguhan tersedia.
    /// </summary>
    [HttpGet("attachments/{attachmentId:int}")]
    public async Task<ActionResult> GetAttachment(int attachmentId, [FromQuery] bool download, CancellationToken cancellationToken)
    {
        var result = await _auditService.GetAttachmentAsync(attachmentId, cancellationToken);
        if (!result.Success)
            return this.ToActionResult(result);

        var file = result.Data!;
        return download
            ? File(file.Content, file.ContentType, file.FileName)
            : File(file.Content, file.ContentType);
    }
}

/// <summary>Bentuk form multipart untuk Submit Improvement (juga dipakai Swagger untuk dokumentasi).</summary>
public class SubmitImprovementForm
{
    /// <summary>Opsional. Jika diisi harus sama dengan id pada URL.</summary>
    public string? AuditId { get; set; }

    /// <summary>JSON array dari temuan yang diperbaiki.</summary>
    public string? Findings { get; set; }

    /// <summary>File bukti (PDF/JPG/PNG/WEBP/GIF, maks 5 MB per file, 1-3 file per temuan).</summary>
    public List<IFormFile>? Files { get; set; }
}
