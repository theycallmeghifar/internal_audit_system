"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

type FindingCategory = "OFI" | "NC_MINOR" | "NC_MAJOR";
export type ReviewDecision = "APPROVE" | "RETURN";

export type ReviewAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  url: string;
};

export type SubmittedImprovement = {
  id: string;
  completionDate: string;
  causeAnalysis: string;
  correctiveAction: string;
  attachments: ReviewAttachment[];
  reviewDecision?: ReviewDecision;
};

export type AuditForReview = {
  id: string;
  title: string;
  department: string;
  auditDate: string;
  auditors: string[];
  auditees: { id: string; name: string }[];
  checksheetItems: {
    id: string | number;
    standardReference: string;
    question: string;
    objectiveEvidenceAndFinding: string;
    category: string;
    picId: string;
    dueDate: string;
    areaDepartmentProcess: string;
    referenceDocument: string;
    improvement?: SubmittedImprovement | null;
  }[];
};

export type ReviewSubmission = {
  auditId: string;
  findings: {
    findingId: string;
    improvementId: string;
    decision: ReviewDecision;
  }[];
};

type ReviewImprovementProps = {
  audit?: AuditForReview;
  onSubmit?: (payload: ReviewSubmission) => Promise<void>;
  backHref?: string;
};

type Finding = AuditForReview["checksheetItems"][number] & {
  findingId: string;
  checkNumber: number;
  picName: string;
  category: FindingCategory;
};

type Decisions = Record<string, ReviewDecision>;
type AttachmentPreviewType = "pdf" | "image";

const CATEGORY_CONFIG: Record<
  FindingCategory,
  { label: string; badge: string }
> = {
  OFI: { label: "OFI", badge: "badge-info" },
  NC_MINOR: { label: "NC Minor", badge: "badge-warning" },
  NC_MAJOR: { label: "NC Major", badge: "badge-danger" },
};

const DEMO_AUDIT: AuditForReview = {
  id: "audit-ppic-2026-review-demo",
  title: "Internal Audit PPIC 2026",
  department: "PPIC",
  auditDate: "2026-09-09",
  auditors: ["Jim", "Stanley"],
  auditees: [
    { id: "oscar", name: "Oscar" },
    { id: "kevin", name: "Kevin" },
  ],
  checksheetItems: [
    {
      id: 1,
      standardReference: "4.4.1 & 4.4.2 — Sistem manajemen mutu dan prosesnya",
      question:
        "Apakah input dan output setiap proses sudah ditetapkan pada IPSMM?",
      objectiveEvidenceAndFinding:
        "Identifikasi input dan output sudah tersedia. Penyajian alur antarproses dapat diperjelas untuk memudahkan penelusuran.",
      category: "OFI",
      picId: "oscar",
      dueDate: "2026-10-09",
      areaDepartmentProcess: "PPIC / Perencanaan Produksi",
      referenceDocument: "Form IPSMM",
      improvement: {
        id: "improvement-1-v1",
        completionDate: "2026-09-23",
        causeAnalysis:
          "Hubungan input dan output antarproses belum ditampilkan dalam satu alur yang mudah ditelusuri.",
        correctiveAction:
          "Memperbarui IPSMM dengan diagram hubungan antarproses, kemudian menyosialisasikan perubahan kepada personel PPIC.",
        attachments: [],
      },
    },
    {
      id: 2,
      standardReference: "5.2.2 — Komunikasi Kebijakan Mutu",
      question:
        "Apakah kebijakan mutu tersedia dan disosialisasikan kepada karyawan?",
      objectiveEvidenceAndFinding:
        "Bukti sosialisasi kebijakan mutu kepada dua karyawan baru belum tersedia saat audit.",
      category: "NC_MINOR",
      picId: "kevin",
      dueDate: "2026-10-16",
      areaDepartmentProcess: "PPIC / Administrasi",
      referenceDocument: "Daftar Hadir Sosialisasi Kebijakan Mutu",
      improvement: {
        id: "improvement-2-v1",
        completionDate: "2026-09-24",
        causeAnalysis:
          "Checklist orientasi karyawan baru belum mencakup penyimpanan bukti sosialisasi kebijakan mutu.",
        correctiveAction:
          "Melaksanakan sosialisasi kepada dua karyawan baru dan menambahkan pemeriksaan bukti sosialisasi pada checklist orientasi.",
        attachments: [],
      },
    },
    {
      id: 3,
      standardReference: "5.3 — Peran, Tanggung Jawab dan Wewenang Organisasi",
      question:
        "Apakah uraian jabatan dan tanggung jawab telah ditetapkan dan dikomunikasikan?",
      objectiveEvidenceAndFinding:
        "Uraian tanggung jawab untuk fungsi yang baru dibentuk belum ditetapkan dan belum dikomunikasikan kepada personel terkait.",
      category: "NC_MAJOR",
      picId: "oscar",
      dueDate: "2026-10-23",
      areaDepartmentProcess: "PPIC / Pengendalian Produksi",
      referenceDocument: "Struktur Organisasi dan Uraian Jabatan",
      improvement: {
        id: "improvement-3-v1",
        completionDate: "2026-09-25",
        causeAnalysis:
          "Perubahan struktur organisasi belum diikuti pembaruan uraian jabatan pada fungsi yang baru dibentuk.",
        correctiveAction:
          "Menyusun dan mengesahkan uraian jabatan terbaru serta mengomunikasikan tanggung jawab kepada personel terkait.",
        attachments: [],
      },
    },
  ],
};

function isFindingCategory(category: string): category is FindingCategory {
  return (
    category === "OFI" || category === "NC_MINOR" || category === "NC_MAJOR"
  );
}

function createFindings(audit: AuditForReview): Finding[] {
  return audit.checksheetItems.flatMap((item, index) => {
    if (!isFindingCategory(item.category)) return [];

    return [
      {
        ...item,
        category: item.category,
        findingId: String(item.id),
        checkNumber: index + 1,
        picName:
          audit.auditees.find((person) => person.id === item.picId)?.name ?? "",
      },
    ];
  });
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function formatDate(value: string) {
  if (!isValidDate(value)) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatFileSize(size?: number) {
  if (size === undefined || !Number.isFinite(size) || size < 0) return "";
  if (size < 1024) return `${size} B`;
  return size < 1024 * 1024
    ? `${Math.round(size / 1024)} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function canReview(
  finding: Finding,
): finding is Finding & { improvement: SubmittedImprovement } {
  const improvement = finding.improvement;
  return Boolean(
    improvement?.id.trim() &&
    isValidDate(improvement.completionDate) &&
    improvement.causeAnalysis.trim() &&
    improvement.correctiveAction.trim(),
  );
}

function createDecisions(findings: Finding[]): Decisions {
  return Object.fromEntries(
    findings
      .filter(canReview)
      .map((finding) => [
        finding.findingId,
        finding.improvement.reviewDecision === "APPROVE" ? "APPROVE" : "RETURN",
      ]),
  );
}

function createReviewSubmission(
  auditId: string,
  findings: Finding[],
  decisions: Decisions,
): ReviewSubmission {
  return {
    auditId,
    findings: findings.filter(canReview).map((finding) => ({
      findingId: finding.findingId,
      improvementId: finding.improvement.id,
      decision:
        decisions[finding.findingId] === "APPROVE" ? "APPROVE" : "RETURN",
    })),
  };
}

function getAttachmentType(
  file: ReviewAttachment,
): AttachmentPreviewType | null {
  const mimeType = file.mimeType.toLowerCase().split(";")[0].trim();
  if (mimeType === "application/pdf") return "pdf";
  if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType))
    return "image";
  if (mimeType && mimeType !== "application/octet-stream") return null;

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "pdf";
  return extension && ["jpg", "jpeg", "png", "webp", "gif"].includes(extension)
    ? "image"
    : null;
}

function getAttachmentUrl(value: string) {
  const url = value.trim();
  if (!url || /[\u0000-\u0020\\]/.test(url)) return "";
  if (url.startsWith("/") && !url.startsWith("//")) return url;

  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol) &&
      !parsed.username &&
      !parsed.password
      ? parsed.href
      : "";
  } catch {
    return "";
  }
}

function InfoField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="aldis-check-context">
      <div className="aldis-check-context-label text-muted small mb-1">
        {label}
      </div>
      <div
        className="aldis-check-context-value"
        style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
      >
        {children}
      </div>
    </div>
  );
}

function AttachmentList({
  files,
  onPreview,
}: {
  files: ReviewAttachment[];
  onPreview: (file: ReviewAttachment) => void;
}) {
  return (
    <div className="border rounded bg-light p-3">
      <div
        className="d-flex flex-wrap align-items-center justify-content-between mb-2"
        style={{ gap: "0.5rem" }}
      >
        <strong>Supporting Evidence</strong>
        <span className="badge badge-pill badge-secondary">
          {files.length} / 3 files
        </span>
      </div>
      {files.length === 0 ? (
        <div className="text-muted small">No attachments were submitted.</div>
      ) : (
        <ul className="list-unstyled mb-0">
          {files.map((file) => {
            const previewType = getAttachmentType(file);
            const url = getAttachmentUrl(file.url);

            return (
              <li
                key={file.id}
                className="d-flex flex-wrap align-items-center bg-white border rounded p-2 mt-2"
                style={{ gap: "0.5rem" }}
              >
                <span className="badge badge-light">
                  {previewType === "pdf"
                    ? "PDF"
                    : previewType === "image"
                      ? "Image"
                      : "File"}
                </span>
                <div
                  className="flex-grow-1"
                  style={{ minWidth: 0, flexBasis: "160px" }}
                >
                  <div style={{ overflowWrap: "anywhere" }}>{file.name}</div>
                  <small className="text-muted">
                    {formatFileSize(file.size)}
                  </small>
                </div>
                {url && previewType ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => onPreview(file)}
                    aria-label={`Preview ${file.name}`}
                  >
                    <i className="lnr-eye mr-1" aria-hidden="true" />
                    Preview
                  </button>
                ) : (
                  <small className="text-warning">Preview unavailable</small>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AttachmentPreview({
  file,
  onClose,
}: {
  file: ReviewAttachment;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [hasError, setHasError] = useState(false);
  const url = getAttachmentUrl(file.url);
  const previewType = getAttachmentType(file);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="aldis-review-preview border-0 rounded p-0"
      aria-labelledby="review-preview-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      style={{
        width: "min(1100px, calc(100vw - 2rem))",
        maxWidth: "calc(100vw - 2rem)",
        maxHeight: "calc(100vh - 2rem)",
      }}
    >
      <div className="modal-content border-0">
        <div className="modal-header align-items-start">
          <div style={{ minWidth: 0 }}>
            <h5
              id="review-preview-title"
              className="modal-title"
              style={{ overflowWrap: "anywhere" }}
            >
              {file.name}
            </h5>
            <small className="text-muted">
              {previewType === "pdf" ? "PDF document" : "Image attachment"}{" "}
              {formatFileSize(file.size)}
            </small>
          </div>
          <button
            type="button"
            className="close ml-3"
            aria-label="Close attachment preview"
            onClick={onClose}
            autoFocus
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="modal-body bg-light p-2">
          {hasError || !url || !previewType ? (
            <div className="alert alert-warning m-3" role="alert">
              This attachment could not be displayed. Try opening it in a new
              tab.
            </div>
          ) : previewType === "pdf" ? (
            <iframe
              title={`PDF preview: ${file.name}`}
              src={url}
              className="border-0 d-block w-100"
              style={{ height: "65vh" }}
              onError={() => setHasError(true)}
            />
          ) : (
            <div
              style={{ position: "relative", height: "65vh", width: "100%" }}
            >
              <Image
                src={url}
                alt={`Supporting evidence: ${file.name}`}
                fill
                unoptimized
                sizes="100vw"
                style={{ objectFit: "contain" }}
                onError={() => setHasError(true)}
              />
            </div>
          )}
        </div>
        <div
          className="modal-footer d-flex flex-wrap justify-content-between"
          style={{ gap: "0.5rem" }}
        >
          <small className="text-muted">
            If the preview is unavailable, open the file in a new tab.
          </small>
          <div className="d-flex" style={{ gap: "0.5rem" }}>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-primary btn-sm"
              >
                Open in New Tab
              </a>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

export default function ReviewImprovementClient({
  audit,
  onSubmit,
  backHref = "/audit",
}: ReviewImprovementProps = {}) {
  const currentAudit = audit ?? DEMO_AUDIT;
  return (
    <ReviewForm
      key={JSON.stringify(currentAudit)}
      audit={currentAudit}
      onSubmit={onSubmit}
      backHref={backHref}
      isDemo={!audit}
    />
  );
}

function ReviewForm({
  audit,
  onSubmit,
  backHref,
  isDemo,
}: {
  audit: AuditForReview;
  onSubmit?: ReviewImprovementProps["onSubmit"];
  backHref: string;
  isDemo: boolean;
}) {
  const router = useRouter();
  const findings = useMemo(() => createFindings(audit), [audit]);
  const reviewableFindings = useMemo(
    () => findings.filter(canReview),
    [findings],
  );
  const initialDecisions = useMemo(() => createDecisions(findings), [findings]);
  const [decisions, setDecisions] = useState<Decisions>(initialDecisions);
  const [isAuditInfoOpen, setIsAuditInfoOpen] = useState(true);
  const [openFindingId, setOpenFindingId] = useState<string | null>(
    findings[0]?.findingId ?? null,
  );
  const [previewFile, setPreviewFile] = useState<ReviewAttachment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const submittingRef = useRef(false);
  const allowNavigationRef = useRef(false);

  const approveCount = reviewableFindings.filter(
    (finding) => decisions[finding.findingId] === "APPROVE",
  ).length;
  const returnCount = reviewableFindings.length - approveCount;
  const hasChanges =
    JSON.stringify(decisions) !== JSON.stringify(initialDecisions);

  useEffect(() => {
    if (!hasChanges || isSubmitted) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (allowNavigationRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges, isSubmitted]);

  function updateDecision(findingId: string, approved: boolean) {
    if (
      submittingRef.current ||
      isSubmitted ||
      !reviewableFindings.some((finding) => finding.findingId === findingId)
    )
      return;
    setDecisions((previous) => ({
      ...previous,
      [findingId]: approved ? "APPROVE" : "RETURN",
    }));
  }

  async function handleBack() {
    if (submittingRef.current) return;

    if (hasChanges && !isSubmitted) {
      const result = await Swal.fire({
        title: "Leave without submitting?",
        text: "Your review decisions have not been submitted.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Leave Page",
        cancelButtonText: "Continue Review",
        focusCancel: true,
      });
      if (!result.isConfirmed) return;
    }

    allowNavigationRef.current = true;
    router.push(backHref);
  }

  async function handleSubmitReview() {
    if (submittingRef.current || isSubmitted || !reviewableFindings.length)
      return;
    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const payload = createReviewSubmission(audit.id, findings, decisions);
      const summary = `${approveCount} improvement(s) will be approved and ${returnCount} will be returned.`;
      const result = await Swal.fire({
        title: "Submit Improvement Review?",
        text: `${summary} Check your selections before continuing.`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Submit Review",
        cancelButtonText: "Check Again",
        focusCancel: true,
        didOpen: () => {
          const confirmButton = Swal.getConfirmButton();
          const cancelButton = Swal.getCancelButton();

          if (confirmButton) {
            confirmButton.style.setProperty(
              "background-color",
              "#3f6ad8",
              "important",
            );

            confirmButton.style.setProperty(
              "border-color",
              "#3f6ad8",
              "important",
            );

            confirmButton.style.setProperty("color", "#ffffff", "important");
          }

          if (cancelButton) {
            cancelButton.style.setProperty(
              "background-color",
              "#6c757d",
              "important",
            );

            cancelButton.style.setProperty(
              "border-color",
              "#6c757d",
              "important",
            );

            cancelButton.style.setProperty("color", "#ffffff", "important");
          }
        },
      });
      if (!result.isConfirmed) return;

      if (isDemo || !onSubmit) {
        await Swal.fire({
          title: "Review Preview",
          text: `${summary} This is a UI preview. No review decisions have been submitted.`,
          icon: "info",
          confirmButtonText: "Back to Review",
        });
        return;
      }

      await onSubmit(payload);
      allowNavigationRef.current = true;
      setIsSubmitted(true);
      await Swal.fire({
        title: "Review Submitted",
        text: "Your improvement review has been submitted successfully.",
        icon: "success",
        confirmButtonText: "Back to Audit",
      });
      router.push(backHref);
    } catch (error) {
      await Swal.fire({
        title: "Unable to Submit Review",
        text:
          error instanceof Error
            ? error.message
            : "Please try again. Your selections have been kept.",
        icon: "error",
      });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <style>{`
        .aldis-review-preview::backdrop { background: rgba(0, 0, 0, 0.55); }
        .aldis-review-switch .custom-control-input:checked ~ .custom-control-label::before { background-color: #218838; border-color: #218838; }
        .aldis-review-switch .custom-control-label { cursor: pointer; }
        .aldis-review-switch .custom-control-input:disabled ~ .custom-control-label { cursor: default; }
      `}</style>

      <div className="app-page-title">
        <div className="page-title-wrapper">
          <div className="page-title-heading">
            <div className="page-title-icon">
              <i className="pe-7s-check icon-gradient bg-malibu-beach" />
            </div>
            <div>
              Review Improvement
              <div className="page-title-subheading"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-12">
          <div className="accordion-wrapper">
            <div className="card">
              <div className="card-header d-flex align-items-center">
                <button
                  type="button"
                  className="text-left m-0 p-0 btn btn-link btn-block d-flex align-items-center justify-content-between"
                  aria-expanded={isAuditInfoOpen}
                  aria-controls="review-audit-info"
                  onClick={() => setIsAuditInfoOpen((previous) => !previous)}
                >
                  <span className="card-title m-0">Audit Information</span>
                  <i
                    className={`lnr lnr-chevron-down aldis-accordion-chevron ${isAuditInfoOpen ? "is-open" : ""}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
              <div
                id="review-audit-info"
                className={`collapse ${isAuditInfoOpen ? "show" : ""}`}
              >
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <InfoField label="Audit Title">{audit.title}</InfoField>
                    </div>
                    <div className="col-md-3 mb-3">
                      <InfoField label="Department">
                        {audit.department}
                      </InfoField>
                    </div>
                    <div className="col-md-3 mb-3">
                      <InfoField label="Audit Date">
                        {formatDate(audit.auditDate)}
                      </InfoField>
                    </div>
                    <div className="col-md-6">
                      <InfoField label="Auditor">
                        {audit.auditors.join(" & ") || "—"}
                      </InfoField>
                    </div>
                    <div className="col-md-6">
                      <InfoField label="Auditee">
                        {audit.auditees
                          .map((person) => person.name)
                          .join(" & ") || "—"}
                      </InfoField>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="main-card card mb-3">
            <div
              className="card-header d-flex flex-wrap align-items-center justify-content-between"
              style={{ height: "auto", minHeight: "3.5rem", gap: "0.5rem" }}
            >
              <span className="card-title m-0">Findings</span>
              <span className="badge badge-pill badge-primary">
                {reviewableFindings.length} / {findings.length} Ready for Review
              </span>
            </div>
            <div className="card-body">
              {findings.length === 0 ? (
                <div className="alert alert-success mb-0">
                  No OFI, NC Minor, or NC Major findings require review for this
                  audit.
                </div>
              ) : (
                <div className="aldis-checksheet-accordion">
                  {findings.map((finding, index) => {
                    const improvement = finding.improvement;
                    const isReviewable = canReview(finding);
                    const decision = decisions[finding.findingId] ?? "RETURN";
                    const isApproved = decision === "APPROVE";
                    const isOpen = openFindingId === finding.findingId;
                    const category = CATEGORY_CONFIG[finding.category];
                    const isOfi = finding.category === "OFI";
                    const domId = `review-${encodeURIComponent(finding.findingId)}`;
                    const findingNumber = String(index + 1).padStart(2, "0");

                    return (
                      <div
                        key={finding.findingId}
                        className="card aldis-check-item"
                      >
                        <div
                          className="card-header aldis-check-header"
                          style={{ height: "auto", minHeight: "3.5rem" }}
                        >
                          <button
                            id={`${domId}-heading`}
                            type="button"
                            className="text-left m-0 p-0 btn btn-link btn-block aldis-check-toggle"
                            aria-expanded={isOpen}
                            aria-controls={`${domId}-content`}
                            onClick={() =>
                              setOpenFindingId((previous) =>
                                previous === finding.findingId
                                  ? null
                                  : finding.findingId,
                              )
                            }
                          >
                            <span
                              className="d-flex flex-wrap align-items-center justify-content-between w-100"
                              style={{ gap: "0.5rem" }}
                            >
                              <span
                                className="d-flex flex-wrap align-items-center"
                                style={{ gap: "0.75rem" }}
                              >
                                <span className="aldis-check-number">
                                  Finding {findingNumber}
                                </span>
                                <span className={`badge ${category.badge}`}>
                                  {category.label}
                                </span>
                                <small className="text-muted">
                                  Check{" "}
                                  {String(finding.checkNumber).padStart(2, "0")}
                                </small>
                              </span>
                              <span className="d-flex align-items-center">
                                <span
                                  className={`badge mr-3 ${!isReviewable ? "badge-secondary" : isApproved ? "badge-success" : "badge-warning"}`}
                                >
                                  {!isReviewable
                                    ? "Not Ready for Review"
                                    : isApproved
                                      ? "Approve"
                                      : "Return"}
                                </span>
                                <i
                                  className={`lnr lnr-chevron-down aldis-accordion-chevron ${isOpen ? "is-open" : ""}`}
                                  aria-hidden="true"
                                />
                              </span>
                            </span>
                          </button>
                        </div>
                        <div
                          id={`${domId}-content`}
                          role="region"
                          aria-labelledby={`${domId}-heading`}
                          className={`collapse ${isOpen ? "show" : ""}`}
                        >
                          <div className="card-body">
                            <div className="row">
                              <div className="col-md-4 mb-3">
                                <InfoField label="Finding Category">
                                  <span className={`badge ${category.badge}`}>
                                    {category.label}
                                  </span>
                                </InfoField>
                              </div>
                              <div className="col-md-4 mb-3">
                                <InfoField label="PIC">
                                  <strong>
                                    {finding.picName || "Not assigned"}
                                  </strong>
                                </InfoField>
                              </div>
                              <div className="col-md-4 mb-3">
                                <InfoField label="Due Date">
                                  <strong>{formatDate(finding.dueDate)}</strong>
                                </InfoField>
                              </div>
                              <div className="col-md-6 mb-3">
                                <InfoField label="Standard Reference">
                                  {finding.standardReference || "—"}
                                </InfoField>
                              </div>
                              <div className="col-md-6 mb-3">
                                <InfoField label="Area / Department / Process">
                                  {finding.areaDepartmentProcess || "—"}
                                </InfoField>
                              </div>
                              <div className="col-12 mb-3">
                                <InfoField label="Audit Question">
                                  {finding.question || "—"}
                                </InfoField>
                              </div>
                              <div className="col-12 mb-3">
                                <InfoField
                                  label={
                                    isOfi
                                      ? "Opportunity for Improvement"
                                      : "Details of Non-Conformity"
                                  }
                                >
                                  {finding.objectiveEvidenceAndFinding || "—"}
                                </InfoField>
                              </div>
                              <div className="col-12 mb-4">
                                <InfoField label="Audit Reference Document">
                                  {finding.referenceDocument || "—"}
                                </InfoField>
                              </div>
                            </div>

                            <h6 className="border-top pt-3 mb-3">
                              Improvement Details
                            </h6>
                            {improvement ? (
                              <>
                                <div className="row">
                                  <div className="col-12 mb-3">
                                    <InfoField label="Completion Date">
                                      {formatDate(improvement.completionDate)}
                                    </InfoField>
                                  </div>
                                  <div className="col-md-6 mb-3">
                                    <InfoField
                                      label={
                                        isOfi
                                          ? "Improvement Rationale"
                                          : "Cause Analysis"
                                      }
                                    >
                                      {improvement.causeAnalysis || "—"}
                                    </InfoField>
                                  </div>
                                  <div className="col-md-6 mb-3">
                                    <InfoField
                                      label={
                                        isOfi
                                          ? "Improvement Action"
                                          : "Corrective Action"
                                      }
                                    >
                                      {improvement.correctiveAction || "—"}
                                    </InfoField>
                                  </div>
                                </div>
                                <AttachmentList
                                  files={improvement.attachments}
                                  onPreview={setPreviewFile}
                                />
                              </>
                            ) : (
                              <div className="alert alert-secondary">
                                No submitted improvement is available for this
                                finding.
                              </div>
                            )}

                            <div className="border rounded bg-light p-3 mt-4">
                              <div
                                className="d-flex flex-wrap align-items-center justify-content-between"
                                style={{ gap: "1rem" }}
                              >
                                <div>
                                  <strong>Auditor Decision</strong>
                                  <div
                                    id={`${domId}-decision-help`}
                                    className="small text-muted mt-1"
                                  >
                                    {isReviewable
                                      ? "Switch off: Return. Switch on: Approve. Submit Review to confirm your decision."
                                      : "The submitted improvement must be complete before it can be reviewed."}
                                  </div>
                                </div>
                                <div className="custom-control custom-switch aldis-review-switch">
                                  <input
                                    id={`${domId}-decision`}
                                    name={`reviews[${finding.findingId}]`}
                                    type="checkbox"
                                    role="switch"
                                    className="custom-control-input"
                                    checked={isReviewable && isApproved}
                                    disabled={
                                      !isReviewable ||
                                      isSubmitting ||
                                      isSubmitted
                                    }
                                    aria-label={`Approve improvement for Finding ${findingNumber}`}
                                    aria-describedby={`${domId}-decision-help`}
                                    onChange={(event) =>
                                      updateDecision(
                                        finding.findingId,
                                        event.currentTarget.checked,
                                      )
                                    }
                                  />
                                  <label
                                    className={`custom-control-label font-weight-bold ${!isReviewable ? "text-muted" : isApproved ? "text-success" : "text-warning"}`}
                                    htmlFor={`${domId}-decision`}
                                  >
                                    {!isReviewable
                                      ? "Unavailable"
                                      : isApproved
                                        ? "Approve"
                                        : "Return"}
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div
              className="card-footer d-flex flex-wrap align-items-center justify-content-between"
              style={{ gap: "1rem" }}
            >
              <div aria-live="polite">
                <div className="mb-1">
                  <span className="text-success mr-3">
                    <i
                      className="lnr-checkmark-circle mr-1"
                      aria-hidden="true"
                    />
                    {approveCount} Approve
                  </span>
                  <span className="text-warning">
                    <i className="lnr-undo mr-1" aria-hidden="true" />
                    {returnCount} Return
                  </span>
                </div>
                <small className={isSubmitted ? "text-success" : "text-muted"}>
                  {isSubmitted
                    ? "Review submitted successfully."
                    : !reviewableFindings.length
                      ? "No submitted improvements are ready for review."
                      : "Decisions are applied after you submit the review."}
                </small>
              </div>
              <div
                className="d-flex align-items-center"
                style={{ gap: "0.5rem" }}
              >
                <button
                  type="button"
                  className="btn-hover-shine btn btn-secondary"
                  disabled={isSubmitting}
                  onClick={handleBack}
                >
                  Back
                </button>
                {reviewableFindings.length > 0 && (
                  <button
                    type="button"
                    className="btn-hover-shine btn btn-primary"
                    disabled={isSubmitting || isSubmitted}
                    onClick={handleSubmitReview}
                  >
                    {isSubmitting
                      ? "Please wait..."
                      : isSubmitted
                        ? "Review Submitted"
                        : "Submit Review"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {previewFile && (
        <AttachmentPreview
          key={`${previewFile.id}:${previewFile.url}`}
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </>
  );
}
