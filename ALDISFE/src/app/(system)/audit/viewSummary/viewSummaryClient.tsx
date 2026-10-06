"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";

type CheckCategory = "OK" | "OFI" | "NC_MINOR" | "NC_MAJOR";
type AttachmentPreviewType = "pdf" | "image";

export type SummaryAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  url: string;
};

export type SummaryImprovement = {
  id: string;
  completionDate: string;
  causeAnalysis: string;
  correctiveAction: string;
  attachments: SummaryAttachment[];
  reviewDecision?: "APPROVE" | "RETURN" | null;
};

export type AuditSummaryData = {
  id: string;
  title: string;
  status: string;
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
    improvement?: SummaryImprovement | null;
  }[];
};

type SummaryCheck = AuditSummaryData["checksheetItems"][number] & {
  checkId: string;
  checkNumber: number;
  categoryKey: CheckCategory | null;
  picName: string;
};

const CATEGORY_CONFIG: Record<CheckCategory, { label: string; badge: string }> =
  {
    OK: { label: "OK", badge: "badge-success" },
    OFI: { label: "OFI", badge: "badge-info" },
    NC_MINOR: { label: "NC Minor", badge: "badge-warning" },
    NC_MAJOR: { label: "NC Major", badge: "badge-danger" },
  };

const DEMO_AUDIT: AuditSummaryData = {
  id: "audit-ppic-2026-summary-demo",
  title: "Internal Audit PPIC 2026",
  department: "PPIC",
  auditDate: "2026-09-09",
  auditors: ["Jim", "Stanley"],
  auditees: [
    {
      id: "oscar",
      name: "Oscar",
    },
    {
      id: "kevin",
      name: "Kevin",
    },
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
        reviewDecision: "APPROVE",
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
        reviewDecision: "APPROVE",
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
        reviewDecision: "APPROVE",
      },
    },
    {
      id: 4,
      standardReference: "7.5 — Informasi terdokumentasi",
      question:
        "Apakah dokumen kerja yang digunakan merupakan versi terbaru dan terkendali?",
      objectiveEvidenceAndFinding:
        "Dokumen kerja yang diperiksa sesuai dengan daftar induk dokumen. Versi terbaru tersedia dan dapat diakses oleh personel terkait.",
      category: "OK",
      picId: "",
      dueDate: "",
      areaDepartmentProcess: "PPIC / Pengendalian Dokumen",
      referenceDocument: "Daftar Induk Dokumen dan Instruksi Kerja PPIC",
      improvement: null,
    },
  ],
  status: "CLOSED",
};

function normalizeCategory(value: string): CheckCategory | null {
  const category = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return category === "OK" ||
    category === "OFI" ||
    category === "NC_MINOR" ||
    category === "NC_MAJOR"
    ? category
    : null;
}

function requiresImprovement(category: CheckCategory | null) {
  return (
    category === "OFI" || category === "NC_MINOR" || category === "NC_MAJOR"
  );
}

function createChecks(audit: AuditSummaryData): SummaryCheck[] {
  return audit.checksheetItems.map((item, index) => ({
    ...item,
    checkId: String(item.id),
    checkNumber: index + 1,
    categoryKey: normalizeCategory(item.category),
    picName:
      audit.auditees.find((person) => person.id === item.picId)?.name ?? "",
  }));
}

function getSummaryUnavailableReason(audit: AuditSummaryData): string | null {
  if (audit.status.trim().toUpperCase() !== "CLOSED") {
    return "The audit summary is available after the audit status is Closed.";
  }

  if (audit.checksheetItems.length === 0) {
    return "No checksheet data is available for this audit.";
  }

  const checks = createChecks(audit);

  if (checks.some((check) => check.categoryKey === null)) {
    return "Every check must have a valid category before the audit summary is available.";
  }

  const pendingCount = checks.filter(
    (check) =>
      requiresImprovement(check.categoryKey) &&
      check.improvement?.reviewDecision !== "APPROVE",
  ).length;

  if (pendingCount > 0) {
    return `${pendingCount} ${pendingCount === 1 ? "finding still requires an approved improvement" : "findings still require approved improvements"}. The summary is available once all findings have been approved.`;
  }

  return null;
}

function getCategoryCounts(
  checks: SummaryCheck[],
): Record<CheckCategory, number> {
  return checks.reduce<Record<CheckCategory, number>>(
    (counts, check) => {
      if (check.categoryKey) counts[check.categoryKey] += 1;
      return counts;
    },
    { OK: 0, OFI: 0, NC_MINOR: 0, NC_MAJOR: 0 },
  );
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

function getAttachmentType(
  file: SummaryAttachment,
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
  files: SummaryAttachment[];
  onPreview: (file: SummaryAttachment) => void;
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
  file: SummaryAttachment;
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
      className="aldis-summary-preview border-0 rounded p-0"
      aria-labelledby="summary-preview-title"
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
              id="summary-preview-title"
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

function PageTitle() {
  return (
    <div className="app-page-title">
      <div className="page-title-wrapper">
        <div className="page-title-heading">
          <div className="page-title-icon">
            <i className="pe-7s-note2 icon-gradient bg-malibu-beach" />
          </div>
          <div>
            Audit Summary
            <div className="page-title-subheading"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ViewSummaryClient({
  audit,
}: { audit?: AuditSummaryData } = {}) {
  const currentAudit = audit ?? DEMO_AUDIT;
  const unavailableReason = getSummaryUnavailableReason(currentAudit);

  if (unavailableReason) {
    return (
      <>
        <PageTitle />
        <div className="row">
          <div className="col-12">
            <div className="main-card card mb-3">
              <div className="card-body">
                <h5 className="card-title">Summary Not Available</h5>
                <div className="alert alert-warning mb-0" role="status">
                  {unavailableReason}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <SummaryView
      key={JSON.stringify(currentAudit)}
      audit={currentAudit}
      isDemo={!audit}
    />
  );
}

function SummaryView({
  audit,
  isDemo,
}: {
  audit: AuditSummaryData;
  isDemo: boolean;
}) {
  const checks = useMemo(() => createChecks(audit), [audit]);
  const counts = useMemo(() => getCategoryCounts(checks), [checks]);
  const findingCount = counts.OFI + counts.NC_MINOR + counts.NC_MAJOR;
  const [isAuditInfoOpen, setIsAuditInfoOpen] = useState(true);
  const [openCheckId, setOpenCheckId] = useState<string | null>(
    checks[0]?.checkId ?? null,
  );
  const [previewFile, setPreviewFile] = useState<SummaryAttachment | null>(
    null,
  );

  return (
    <>
      <style>{`.aldis-summary-preview::backdrop { background: rgba(0, 0, 0, 0.55); }`}</style>
      <PageTitle />

      {isDemo && (
        <div className="alert alert-light border">
          Sample data for UI preview.
        </div>
      )}

      <div className="row mb-3">
        <div className="col-12">
          <div className="accordion-wrapper">
            <div className="card">
              <div className="card-header d-flex align-items-center">
                <button
                  type="button"
                  className="text-left m-0 p-0 btn btn-link btn-block d-flex align-items-center justify-content-between"
                  aria-expanded={isAuditInfoOpen}
                  aria-controls="summary-audit-info"
                  onClick={() => setIsAuditInfoOpen((previous) => !previous)}
                >
                  <span
                    className="d-flex align-items-center"
                    style={{ gap: "0.75rem" }}
                  >
                    <span className="card-title m-0">Audit Information</span>
                    <span className="badge badge-success">Closed</span>
                  </span>
                  <i
                    className={`lnr lnr-chevron-down aldis-accordion-chevron ${isAuditInfoOpen ? "is-open" : ""}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
              <div
                id="summary-audit-info"
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
              <span className="card-title m-0">Checksheet Summary</span>
              <span className="badge badge-pill badge-primary">
                {checks.length} {checks.length === 1 ? "Check" : "Checks"}
              </span>
            </div>
            <div className="card-body">
              <div
                className="d-flex flex-wrap align-items-center border rounded bg-light p-3 mb-3"
                style={{ gap: "1rem" }}
                aria-label="Check category totals"
              >
                {(Object.keys(CATEGORY_CONFIG) as CheckCategory[]).map(
                  (categoryKey) => (
                    <span
                      key={categoryKey}
                      className="d-flex align-items-center"
                      style={{ gap: "0.4rem" }}
                    >
                      <span
                        className={`badge ${CATEGORY_CONFIG[categoryKey].badge}`}
                      >
                        {CATEGORY_CONFIG[categoryKey].label}
                      </span>
                      <strong>{counts[categoryKey]}</strong>
                    </span>
                  ),
                )}
              </div>

              <div className="aldis-checksheet-accordion">
                {checks.map((check) => {
                  const isOpen = openCheckId === check.checkId;
                  const category = check.categoryKey
                    ? CATEGORY_CONFIG[check.categoryKey]
                    : { label: "Uncategorized", badge: "badge-secondary" };
                  const needsImprovement = requiresImprovement(
                    check.categoryKey,
                  );
                  const improvement = needsImprovement
                    ? check.improvement
                    : null;
                  const isOfi = check.categoryKey === "OFI";
                  const checkNumber = String(check.checkNumber).padStart(
                    2,
                    "0",
                  );
                  const domId = `summary-check-${encodeURIComponent(check.checkId)}`;

                  return (
                    <div key={check.checkId} className="card aldis-check-item">
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
                            setOpenCheckId((previous) =>
                              previous === check.checkId ? null : check.checkId,
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
                                Check {checkNumber}
                              </span>
                              <span className={`badge ${category.badge}`}>
                                {category.label}
                              </span>
                            </span>
                            <span className="d-flex align-items-center">
                              <span
                                className={`badge mr-3 ${needsImprovement ? "badge-success" : "badge-light"}`}
                              >
                                {needsImprovement
                                  ? "Improvement Approved"
                                  : "No Improvement Required"}
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
                            <div
                              className={
                                needsImprovement
                                  ? "col-md-4 mb-3"
                                  : "col-12 mb-3"
                              }
                            >
                              <InfoField label="Check Category">
                                <span className={`badge ${category.badge}`}>
                                  {category.label}
                                </span>
                              </InfoField>
                            </div>
                            {needsImprovement && (
                              <>
                                <div className="col-md-4 mb-3">
                                  <InfoField label="PIC">
                                    <strong>
                                      {check.picName || "Not assigned"}
                                    </strong>
                                  </InfoField>
                                </div>
                                <div className="col-md-4 mb-3">
                                  <InfoField label="Due Date">
                                    <strong>{formatDate(check.dueDate)}</strong>
                                  </InfoField>
                                </div>
                              </>
                            )}
                            <div className="col-md-6 mb-3">
                              <InfoField label="Standard Reference">
                                {check.standardReference || "—"}
                              </InfoField>
                            </div>
                            <div className="col-md-6 mb-3">
                              <InfoField label="Area / Department / Process">
                                {check.areaDepartmentProcess || "—"}
                              </InfoField>
                            </div>
                            <div className="col-12 mb-3">
                              <InfoField label="Audit Question">
                                {check.question || "—"}
                              </InfoField>
                            </div>
                            <div className="col-12 mb-3">
                              <InfoField
                                label={
                                  !needsImprovement
                                    ? "Objective Evidence"
                                    : isOfi
                                      ? "Opportunity for Improvement"
                                      : "Details of Non-Conformity"
                                }
                              >
                                {check.objectiveEvidenceAndFinding || "—"}
                              </InfoField>
                            </div>
                            <div className="col-12 mb-3">
                              <InfoField label="Audit Reference Document">
                                {check.referenceDocument || "—"}
                              </InfoField>
                            </div>
                          </div>

                          {needsImprovement && improvement && (
                            <>
                              <h6 className="border-top pt-3 mb-3">
                                Improvement Details
                              </h6>
                              <div className="row">
                                <div className="col-md-6 mb-3">
                                  <InfoField label="Completion Date">
                                    {formatDate(improvement.completionDate)}
                                  </InfoField>
                                </div>
                                <div className="col-md-6 mb-3">
                                  <InfoField label="Review Result">
                                    <span className="badge badge-success">
                                      Approved
                                    </span>
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
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card-footer">
              <small className="text-success">
                <i className="lnr-checkmark-circle mr-1" aria-hidden="true" />
                {findingCount === 0
                  ? "Audit closed. All checks are OK; no improvement is required."
                  : findingCount === 1
                    ? "Audit closed. The improvement has been approved."
                    : `Audit closed. All ${findingCount} improvements have been approved.`}
              </small>
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
