"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

type FindingCategory = "OFI" | "NC_MINOR" | "NC_MAJOR";
type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

export type AuditForImprovement = {
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
  }[];
};

type Finding = AuditForImprovement["checksheetItems"][number] & {
  findingId: string;
  checkNumber: number;
  picName: string;
  category: FindingCategory;
};

type ImprovementDraft = {
  completionDate: string;
  causeAnalysis: string;
  correctiveAction: string;
  attachments: File[];
};

type Drafts = Record<string, ImprovementDraft>;
type RecoverySnapshot = {
  version: 1;
  auditId: string;
  savedAt: string;
  drafts: Drafts;
};

type FillImprovementProps = {
  audit?: AuditForImprovement;
  onSubmit?: (formData: FormData) => Promise<void>;
};

const MAX_FILES_PER_FINDING = 3;
const AUTOSAVE_DELAY = 1200;
const DRAFT_DATABASE = "aldis-improvement-drafts";
const DRAFT_STORE = "drafts";
const ALLOWED_FILES: Record<string, string[]> = {
  pdf: ["application/pdf"],
  jpg: ["image/jpeg", "image/pjpeg"],
  jpeg: ["image/jpeg", "image/pjpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
  gif: ["image/gif"],
};
const FILE_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,.webp,.gif,application/pdf,image/jpeg,image/png,image/webp,image/gif";
const FILE_FORMATS = "PDF, JPG/JPEG, PNG, WEBP, GIF";

const CATEGORY_CONFIG: Record<
  FindingCategory,
  { label: string; badge: string }
> = {
  OFI: { label: "OFI", badge: "badge-info" },
  NC_MINOR: { label: "NC Minor", badge: "badge-warning" },
  NC_MAJOR: { label: "NC Major", badge: "badge-danger" },
};

const DEMO_AUDIT: AuditForImprovement = {
  id: "audit-ppic-2026-ui-demo",
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
    },
  ],
};

function isFindingCategory(category: string): category is FindingCategory {
  return (
    category === "OFI" || category === "NC_MINOR" || category === "NC_MAJOR"
  );
}

function createFindings(audit: AuditForImprovement): Finding[] {
  return audit.checksheetItems.flatMap((item, index) => {
    if (!isFindingCategory(item.category)) return [];

    return [
      {
        ...item,
        category: item.category,
        findingId: String(item.id),
        checkNumber: index + 1,
        picName:
          audit.auditees.find((auditee) => auditee.id === item.picId)?.name ??
          "",
      },
    ];
  });
}

function emptyDraft(): ImprovementDraft {
  return {
    completionDate: "",
    causeAnalysis: "",
    correctiveAction: "",
    attachments: [],
  };
}

function createDrafts(findings: Finding[]): Drafts {
  return Object.fromEntries(
    findings.map((finding) => [finding.findingId, emptyDraft()]),
  );
}

function isAllowedFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeTypes = ALLOWED_FILES[extension];
  return (
    file.size > 0 &&
    Boolean(mimeTypes) &&
    (file.type === "" || mimeTypes.includes(file.type.toLowerCase()))
  );
}

function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function formatDate(value: string) {
  if (!isValidDate(value)) return "Not assigned";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatFileSize(size: number) {
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getImprovementStatus(draft: ImprovementDraft) {
  if (
    isValidDate(draft.completionDate) &&
    draft.causeAnalysis.trim() &&
    draft.correctiveAction.trim()
  )
    return "Ready to Submit";
  if (
    draft.completionDate ||
    draft.causeAnalysis.trim() ||
    draft.correctiveAction.trim() ||
    draft.attachments.length
  )
    return "In Progress";
  return "Not Started";
}

function normalizeDraft(value: unknown): ImprovementDraft {
  if (!value || typeof value !== "object") return emptyDraft();
  const draft = value as Partial<ImprovementDraft>;

  return {
    completionDate:
      typeof draft.completionDate === "string" ? draft.completionDate : "",
    causeAnalysis:
      typeof draft.causeAnalysis === "string" ? draft.causeAnalysis : "",
    correctiveAction:
      typeof draft.correctiveAction === "string" ? draft.correctiveAction : "",
    attachments: Array.isArray(draft.attachments)
      ? draft.attachments
          .filter(
            (file): file is File => file instanceof File && isAllowedFile(file),
          )
          .slice(0, MAX_FILES_PER_FINDING)
      : [],
  };
}

function draftTransaction<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(DRAFT_DATABASE, 1);
    let blocked = false;

    openRequest.onupgradeneeded = () => {
      if (!openRequest.result.objectStoreNames.contains(DRAFT_STORE))
        openRequest.result.createObjectStore(DRAFT_STORE);
    };
    openRequest.onerror = () =>
      reject(openRequest.error ?? new Error("Unable to open draft storage."));
    openRequest.onblocked = () => {
      blocked = true;
      reject(new Error("Draft storage is blocked by another tab."));
    };
    openRequest.onsuccess = () => {
      const database = openRequest.result;
      if (blocked) {
        database.close();
        return;
      }
      database.onversionchange = () => database.close();

      try {
        const transaction = database.transaction(DRAFT_STORE, mode);
        const request = action(transaction.objectStore(DRAFT_STORE));
        transaction.oncomplete = () => {
          database.close();
          resolve(request.result);
        };
        transaction.onabort = () => {
          database.close();
          reject(
            transaction.error ??
              request.error ??
              new Error("Unable to save the draft."),
          );
        };
        transaction.onerror = () => {
          database.close();
          reject(
            transaction.error ??
              request.error ??
              new Error("Draft storage failed."),
          );
        };
      } catch (error) {
        database.close();
        reject(error);
      }
    };
  });
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

function AttachmentRow({
  file,
  disabled,
  onRemove,
}: {
  file: File;
  disabled: boolean;
  onRemove: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <li className="d-flex flex-wrap align-items-center bg-white border rounded p-2 mb-2">
      <span className="badge badge-light mr-2">
        {file.name.split(".").pop()?.toUpperCase()}
      </span>
      <div
        className="flex-grow-1 mr-2"
        style={{ minWidth: 0, flexBasis: "120px" }}
      >
        <div style={{ overflowWrap: "anywhere" }}>{file.name}</div>
        <small className="text-muted">{formatFileSize(file.size)}</small>
      </div>
      <div className="d-flex align-items-center mt-1 mb-1">
        {previewUrl && (
          <a
            className="btn btn-sm btn-outline-primary mr-2"
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Preview ${file.name}`}
          >
            Preview
          </a>
        )}
        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          disabled={disabled}
          onClick={onRemove}
          aria-label={`Remove ${file.name}`}
        >
          Remove
        </button>
      </div>
    </li>
  );
}

export default function FillImprovementClient({
  audit = DEMO_AUDIT,
  onSubmit,
}: FillImprovementProps = {}) {
  return (
    <ImprovementForm
      key={JSON.stringify(audit)}
      audit={audit}
      onSubmit={onSubmit}
    />
  );
}

function ImprovementForm({
  audit,
  onSubmit,
}: {
  audit: AuditForImprovement;
  onSubmit?: FillImprovementProps["onSubmit"];
}) {
  const router = useRouter();
  const findings = useMemo(() => createFindings(audit), [audit]);
  const draftKey = `improvement:${audit.id}`;
  const [drafts, setDrafts] = useState<Drafts>(() => createDrafts(findings));
  const [isAuditInfoOpen, setIsAuditInfoOpen] = useState(true);
  const [openFindingId, setOpenFindingId] = useState<string | null>(
    findings[0]?.findingId ?? null,
  );
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  const [hasRecoveredSession, setHasRecoveredSession] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [storageError, setStorageError] = useState("");
  const [attachmentErrors, setAttachmentErrors] = useState<
    Record<string, string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const draftsRef = useRef(drafts);
  const revisionRef = useRef(0);
  const savedRevisionRef = useRef(0);
  const saveQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef(false);
  const submittingRef = useRef(false);
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      if (revisionRef.current !== savedRevisionRef.current) {
        const snapshot: RecoverySnapshot = {
          version: 1,
          auditId: audit.id,
          savedAt: new Date().toISOString(),
          drafts: draftsRef.current,
        };
        saveQueueRef.current = saveQueueRef.current
          .catch(() => undefined)
          .then(() =>
            draftTransaction("readwrite", (store) =>
              store.put(snapshot, draftKey),
            ),
          )
          .catch(() => undefined);
      }
    };
  }, [audit.id, draftKey]);

  useEffect(() => {
    let cancelled = false;

    async function restoreDraft() {
      try {
        const snapshot = await draftTransaction<RecoverySnapshot | undefined>(
          "readonly",
          (store) => store.get(draftKey),
        );
        if (cancelled) return;
        if (
          snapshot?.version === 1 &&
          snapshot.auditId === audit.id &&
          snapshot.drafts &&
          typeof snapshot.drafts === "object"
        ) {
          const restored = Object.fromEntries(
            findings.map((finding) => [
              finding.findingId,
              normalizeDraft(snapshot.drafts[finding.findingId]),
            ]),
          );
          draftsRef.current = restored;
          setDrafts(restored);
          setHasRecoveredSession(
            Object.values(restored).some(
              (draft) => getImprovementStatus(draft) !== "Not Started",
            ),
          );
          setLastSavedAt(snapshot.savedAt);
          setSaveStatus("saved");
        }
      } catch {
        if (!cancelled) {
          setStorageError(
            "Draft storage is unavailable. Keep this page open to avoid losing your changes.",
          );
          setSaveStatus("error");
        }
      } finally {
        if (!cancelled) setIsRecoveryReady(true);
      }
    }

    void restoreDraft();
    return () => {
      cancelled = true;
    };
  }, [audit.id, draftKey, findings]);

  const persistDraft = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    const revision = revisionRef.current;
    const snapshot: RecoverySnapshot = {
      version: 1,
      auditId: audit.id,
      savedAt: new Date().toISOString(),
      drafts: draftsRef.current,
    };
    setSaveStatus("saving");

    const save = saveQueueRef.current
      .catch(() => undefined)
      .then(() =>
        draftTransaction("readwrite", (store) => store.put(snapshot, draftKey)),
      );
    saveQueueRef.current = save;

    return save
      .then(() => {
        savedRevisionRef.current = Math.max(savedRevisionRef.current, revision);
        if (mountedRef.current && revision === revisionRef.current) {
          setLastSavedAt(snapshot.savedAt);
          setStorageError("");
          setSaveStatus("saved");
        }
      })
      .catch((error: unknown) => {
        if (mountedRef.current && revision === revisionRef.current) {
          setStorageError(
            "Your latest draft could not be saved. Keep this page open and try again.",
          );
          setSaveStatus("error");
        }
        throw error;
      });
  }, [audit.id, draftKey]);

  useEffect(() => {
    if (
      !isRecoveryReady ||
      revisionRef.current === savedRevisionRef.current ||
      submittingRef.current
    )
      return;
    timerRef.current = window.setTimeout(() => {
      void persistDraft().catch(() => undefined);
    }, AUTOSAVE_DELAY);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [drafts, isRecoveryReady, persistDraft]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (revisionRef.current === savedRevisionRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  function updateDraft(findingId: string, patch: Partial<ImprovementDraft>) {
    if (!isRecoveryReady || submittingRef.current) return;
    const current = draftsRef.current[findingId];
    if (!current) return;
    const next = {
      ...draftsRef.current,
      [findingId]: { ...current, ...patch },
    };
    draftsRef.current = next;
    revisionRef.current += 1;
    setDrafts(next);
    setSaveStatus("pending");
  }

  function addAttachments(findingId: string, selectedFiles: File[]) {
    const current = draftsRef.current[findingId];
    if (!current || !selectedFiles.length || submittingRef.current) return;
    const fail = (message: string) =>
      setAttachmentErrors((previous) => ({
        ...previous,
        [findingId]: message,
      }));
    const invalid = selectedFiles.find((file) => !isAllowedFile(file));

    if (invalid) {
      fail(
        `"${invalid.name}" cannot be added. Choose a non-empty file in one of these formats: ${FILE_FORMATS}.`,
      );
      return;
    }

    const existing = new Set(current.attachments.map(fileKey));
    const uniqueFiles = selectedFiles.filter((file) => {
      const key = fileKey(file);
      if (existing.has(key)) return false;
      existing.add(key);
      return true;
    });
    const remaining = MAX_FILES_PER_FINDING - current.attachments.length;

    if (uniqueFiles.length > remaining) {
      fail(
        `Maximum ${MAX_FILES_PER_FINDING} files per finding. You can add ${remaining} more ${remaining === 1 ? "file" : "files"}. No additional files were added.`,
      );
      return;
    }
    if (!uniqueFiles.length) {
      fail("The selected files have already been added to this finding.");
      return;
    }

    updateDraft(findingId, {
      attachments: [...current.attachments, ...uniqueFiles],
    });
    setAttachmentErrors((previous) => ({
      ...previous,
      [findingId]:
        uniqueFiles.length < selectedFiles.length
          ? "Duplicate files were skipped."
          : "",
    }));
  }

  function removeAttachment(findingId: string, key: string) {
    updateDraft(findingId, {
      attachments: draftsRef.current[findingId].attachments.filter(
        (file) => fileKey(file) !== key,
      ),
    });
    setAttachmentErrors((previous) => ({ ...previous, [findingId]: "" }));
  }

  const readyCount = findings.filter(
    (finding) =>
      getImprovementStatus(drafts[finding.findingId]) === "Ready to Submit",
  ).length;
  const allReady = findings.length > 0 && readyCount === findings.length;
  const missingAssignment = findings.some(
    (finding) => !finding.picName || !isValidDate(finding.dueDate),
  );

  async function handleBack() {
    if (submittingRef.current) return;
    if (revisionRef.current !== savedRevisionRef.current) {
      try {
        await persistDraft();
      } catch {
        const result = await Swal.fire({
          title: "Leave without saving?",
          text: "Your latest changes and selected files could not be saved on this device.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Leave Page",
          cancelButtonText: "Continue Editing",
          confirmButtonColor: "#d92550",
        });
        if (!result.isConfirmed) return;
      }
    }
    router.push("/audit");
  }

  async function handleSubmitImprovement() {
    if (!isRecoveryReady || submittingRef.current || !findings.length) return;
    const firstIncomplete = findings.find(
      (finding) =>
        getImprovementStatus(draftsRef.current[finding.findingId]) !==
        "Ready to Submit",
    );
    if (firstIncomplete) {
      setOpenFindingId(firstIncomplete.findingId);
      await Swal.fire({
        title: "Complete the improvement",
        text: "Fill in the completion date, analysis or rationale, and action for every finding.",
        icon: "warning",
      });
      return;
    }
    if (missingAssignment) {
      await Swal.fire({
        title: "Assignment incomplete",
        text: "Every finding must have an assigned PIC and due date from the audit.",
        icon: "warning",
      });
      return;
    }
    if (
      findings.some((finding) => {
        const files = draftsRef.current[finding.findingId].attachments;
        return (
          files.length > MAX_FILES_PER_FINDING ||
          files.some((file) => !isAllowedFile(file))
        );
      })
    ) {
      await Swal.fire({
        title: "Check the attachments",
        text: `Each finding accepts up to ${MAX_FILES_PER_FINDING} files: ${FILE_FORMATS}.`,
        icon: "warning",
      });
      return;
    }

    const confirmation = await Swal.fire({
      title: "Submit Improvements?",
      text: "Please review the improvement details and supporting evidence before continuing.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Continue",
      cancelButtonText: "Review Again",
      confirmButtonColor: "#3f6ad8",
    });
    if (!confirmation.isConfirmed || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      try {
        await persistDraft();
      } catch {
        if (!onSubmit)
          throw new Error(
            "The draft could not be saved on this device. Please try again.",
          );
      }

      if (!onSubmit) {
        await Swal.fire({
          title: "Improvements Ready",
          text: "All required details are complete. The draft and attachments are saved on this device; they have not been sent for review.",
          icon: "info",
        });
        return;
      }

      const formData = new FormData();
      formData.append("auditId", audit.id);
      formData.append(
        "findings",
        JSON.stringify(
          findings.map((finding, index) => {
            const draft = draftsRef.current[finding.findingId];
            draft.attachments.forEach((file) =>
              formData.append(`attachments[${index}]`, file, file.name),
            );
            return {
              findingId: finding.findingId,
              completionDate: draft.completionDate,
              causeAnalysis: draft.causeAnalysis.trim(),
              correctiveAction: draft.correctiveAction.trim(),
              attachmentField: `attachments[${index}]`,
              attachmentCount: draft.attachments.length,
            };
          }),
        ),
      );

      await onSubmit(formData);
      await saveQueueRef.current.catch(() => undefined);
      try {
        await draftTransaction("readwrite", (store) => store.delete(draftKey));
      } catch {
        setStorageError(
          "Improvements were submitted, but the local draft could not be cleared.",
        );
      }
      savedRevisionRef.current = revisionRef.current;
      await Swal.fire({
        title: "Improvements Submitted",
        text: "The improvements have been sent for review.",
        icon: "success",
        confirmButtonColor: "#3f6ad8",
      });
      router.push("/audit");
    } catch (error) {
      await Swal.fire({
        title: "Unable to continue",
        text:
          error instanceof Error
            ? error.message
            : "Please try again. Your current input has been kept.",
        icon: "error",
      });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  const saveMessage = !isRecoveryReady
    ? "Loading draft..."
    : saveStatus === "saving"
      ? "Saving draft..."
      : saveStatus === "pending"
        ? "Changes pending save"
        : saveStatus === "saved"
          ? "Draft and attachments saved on this device"
          : saveStatus === "error"
            ? "Draft could not be saved"
            : "Draft changes are saved automatically on this device";

  return (
    <>
      <div className="app-page-title">
        <div className="page-title-wrapper">
          <div className="page-title-heading">
            <div className="page-title-icon">
              <i className="pe-7s-tools icon-gradient bg-malibu-beach" />
            </div>
            <div>
              Fill Improvement
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
                  aria-controls="improvement-audit-info"
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
                id="improvement-audit-info"
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

      {hasRecoveredSession && (
        <div className="alert alert-info d-flex align-items-center justify-content-between">
          <span>
            <strong>Improvement draft recovered.</strong> Your saved entries and
            attachments have been restored.
          </span>
          <button
            type="button"
            className="close ml-3"
            aria-label="Dismiss recovered draft message"
            onClick={() => setHasRecoveredSession(false)}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      )}

      {storageError && (
        <div className="alert alert-warning" role="alert">
          {storageError}
        </div>
      )}
      {missingAssignment && (
        <div className="alert alert-warning" role="alert">
          Some findings are missing an assigned PIC or due date. Complete the
          audit assignment before submitting improvements.
        </div>
      )}

      <div className="row">
        <div className="col-12">
          <div className="main-card card mb-3">
            <div
              className="card-header d-flex flex-wrap align-items-center justify-content-between"
              style={{ height: "auto", minHeight: "3.5rem", gap: "0.5rem" }}
            >
              <span className="card-title m-0">Findings</span>
              <span
                className="badge badge-pill badge-primary"
                aria-live="polite"
              >
                {readyCount} / {findings.length} Completed
              </span>
            </div>
            <div className="card-body">
              {findings.length === 0 ? (
                <div className="alert alert-success mb-0">
                  No OFI, NC Minor, or NC Major findings require improvement for
                  this audit.
                </div>
              ) : (
                <div className="aldis-checksheet-accordion">
                  {findings.map((finding, index) => {
                    const draft = drafts[finding.findingId];
                    const status = getImprovementStatus(draft);
                    const isOpen = openFindingId === finding.findingId;
                    const category = CATEGORY_CONFIG[finding.category];
                    const isOfi = finding.category === "OFI";
                    const domId = `improvement-${encodeURIComponent(finding.findingId)}`;
                    const remainingFiles =
                      MAX_FILES_PER_FINDING - draft.attachments.length;
                    const statusClass =
                      status === "Ready to Submit"
                        ? "badge-success"
                        : status === "In Progress"
                          ? "badge-warning"
                          : "badge-secondary";

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
                                  Finding {String(index + 1).padStart(2, "0")}
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
                                <span className={`badge mr-3 ${statusClass}`}>
                                  {status}
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
                                  {finding.objectiveEvidenceAndFinding ||
                                    "No finding details supplied."}
                                </InfoField>
                              </div>
                              <div className="col-12 mb-4">
                                <InfoField label="Audit Reference Document">
                                  {finding.referenceDocument || "—"}
                                </InfoField>
                              </div>
                            </div>

                            <fieldset
                              disabled={!isRecoveryReady || isSubmitting}
                              className="m-0 p-0 border-0"
                              style={{ minWidth: 0 }}
                            >
                              <legend className="h6 border-top pt-3 mb-3">
                                Improvement Details
                              </legend>
                              <div className="row">
                                <div className="col-md-12">
                                  <div className="position-relative form-group">
                                    <label
                                      htmlFor={`${domId}-completion-date`}
                                      className="aldis-required-label"
                                    >
                                      Completion Date
                                    </label>
                                    <input
                                      id={`${domId}-completion-date`}
                                      name={`improvements[${finding.findingId}][completion_date]`}
                                      type="date"
                                      className="form-control"
                                      value={draft.completionDate}
                                      onChange={(event) =>
                                        updateDraft(finding.findingId, {
                                          completionDate: event.target.value,
                                        })
                                      }
                                      required
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="row">
                                <div className="col-md-6">
                                  <div className="position-relative form-group">
                                    <label
                                      htmlFor={`${domId}-cause-analysis`}
                                      className="aldis-required-label"
                                    >
                                      {isOfi
                                        ? "Improvement Rationale"
                                        : "Cause Analysis"}
                                    </label>
                                    <textarea
                                      id={`${domId}-cause-analysis`}
                                      name={`improvements[${finding.findingId}][cause_analysis]`}
                                      className="form-control aldis-textarea-standard-ref-question"
                                      rows={4}
                                      placeholder={
                                        isOfi
                                          ? "Explain the reason for this improvement..."
                                          : "Describe the cause of the non-conformity..."
                                      }
                                      value={draft.causeAnalysis}
                                      onChange={(event) =>
                                        updateDraft(finding.findingId, {
                                          causeAnalysis: event.target.value,
                                        })
                                      }
                                      required
                                    />
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="position-relative form-group">
                                    <label
                                      htmlFor={`${domId}-corrective-action`}
                                      className="aldis-required-label"
                                    >
                                      {isOfi
                                        ? "Improvement Action"
                                        : "Corrective Action"}
                                    </label>
                                    <textarea
                                      id={`${domId}-corrective-action`}
                                      name={`improvements[${finding.findingId}][corrective_action]`}
                                      className="form-control aldis-textarea-standard-ref-question"
                                      rows={4}
                                      placeholder="Describe the action taken and its result..."
                                      value={draft.correctiveAction}
                                      onChange={(event) =>
                                        updateDraft(finding.findingId, {
                                          correctiveAction: event.target.value,
                                        })
                                      }
                                      required
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="border rounded bg-light p-3">
                                <div
                                  className="d-flex flex-wrap justify-content-between align-items-center mb-2"
                                  style={{ gap: "0.5rem" }}
                                >
                                  <label
                                    id={`${domId}-attachments-label`}
                                    htmlFor={`${domId}-attachments`}
                                    className="font-weight-bold mb-0"
                                  >
                                    Supporting Evidence{" "}
                                    <span className="font-weight-normal text-muted">
                                      (optional)
                                    </span>
                                  </label>
                                  <span
                                    className={`badge badge-pill ${remainingFiles === 0 ? "badge-success" : "badge-secondary"}`}
                                    aria-live="polite"
                                  >
                                    {draft.attachments.length} /{" "}
                                    {MAX_FILES_PER_FINDING} files
                                  </span>
                                </div>
                                <p
                                  id={`${domId}-attachments-help`}
                                  className="small text-muted mb-3"
                                >
                                  <strong>
                                    Up to {MAX_FILES_PER_FINDING} files per
                                    finding.
                                  </strong>{" "}
                                  {FILE_FORMATS} only. Add files together or one
                                  at a time.
                                </p>
                                <input
                                  ref={(element) => {
                                    fileInputsRef.current[finding.findingId] =
                                      element;
                                  }}
                                  id={`${domId}-attachments`}
                                  name={`improvements[${finding.findingId}][attachments][]`}
                                  type="file"
                                  accept={FILE_ACCEPT}
                                  multiple
                                  hidden
                                  aria-describedby={`${domId}-attachments-help`}
                                  disabled={remainingFiles === 0}
                                  onChange={(event) => {
                                    const files = Array.from(
                                      event.currentTarget.files ?? [],
                                    );
                                    event.currentTarget.value = "";
                                    addAttachments(finding.findingId, files);
                                  }}
                                />
                                <div
                                  className="d-flex flex-wrap align-items-center"
                                  style={{ gap: "0.75rem" }}
                                >
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm"
                                    disabled={remainingFiles === 0}
                                    aria-describedby={`${domId}-attachments-help`}
                                    onClick={() =>
                                      fileInputsRef.current[
                                        finding.findingId
                                      ]?.click()
                                    }
                                  >
                                    {remainingFiles === 0
                                      ? `${MAX_FILES_PER_FINDING} Files Added`
                                      : "Add Files"}
                                  </button>
                                  <small className="text-muted">
                                    {remainingFiles === 0
                                      ? "Limit reached. Remove a file to add another."
                                      : `${remainingFiles} ${remainingFiles === 1 ? "slot" : "slots"} available`}
                                  </small>
                                </div>
                                {attachmentErrors[finding.findingId] && (
                                  <div
                                    className="alert alert-warning mt-3 mb-0 py-2"
                                    role="alert"
                                  >
                                    {attachmentErrors[finding.findingId]}
                                  </div>
                                )}
                                {draft.attachments.length > 0 ? (
                                  <ul className="list-unstyled mt-3 mb-0">
                                    {draft.attachments.map((file) => (
                                      <AttachmentRow
                                        key={fileKey(file)}
                                        file={file}
                                        disabled={isSubmitting}
                                        onRemove={() =>
                                          removeAttachment(
                                            finding.findingId,
                                            fileKey(file),
                                          )
                                        }
                                      />
                                    ))}
                                  </ul>
                                ) : (
                                  <div className="small text-muted mt-3">
                                    No files added yet.
                                  </div>
                                )}
                              </div>
                            </fieldset>
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
                <div
                  className={
                    saveStatus === "error"
                      ? "text-danger"
                      : saveStatus === "saved"
                        ? "text-success"
                        : "text-muted"
                  }
                >
                  {saveMessage}
                </div>
                {lastSavedAt && (
                  <small className="text-muted mr-2">
                    {new Date(lastSavedAt).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                )}
                {findings.length > 0 && (
                  <small className="text-muted">
                    {allReady
                      ? "All findings are ready for submission."
                      : `${findings.length - readyCount} findings still need improvement details.`}
                  </small>
                )}
                {saveStatus === "error" && (
                  <button
                    type="button"
                    className="btn btn-link btn-sm"
                    disabled={isSubmitting}
                    onClick={() => {
                      void persistDraft().catch(() => undefined);
                    }}
                  >
                    Retry Save
                  </button>
                )}
              </div>
              <div
                className="d-flex align-items-center"
                style={{ gap: "0.5rem" }}
              >
                <button
                  type="button"
                  className="btn-hover-shine btn btn-secondary"
                  disabled={!isRecoveryReady || isSubmitting}
                  onClick={handleBack}
                >
                  Back
                </button>
                {findings.length > 0 && (
                  <button
                    type="button"
                    className="btn-hover-shine btn btn-primary"
                    disabled={
                      !isRecoveryReady ||
                      isSubmitting ||
                      !allReady ||
                      missingAssignment
                    }
                    onClick={handleSubmitImprovement}
                  >
                    {isSubmitting ? "Please wait..." : "Submit Improvements"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
