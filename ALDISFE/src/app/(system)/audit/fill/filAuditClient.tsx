"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

type ChecksheetItem = {
  id: number;
  standardReference: string;
  question: string;
  objectiveEvidenceAndFinding: string;
  category: string;
  picId: string;
  dueDate: string;
  areaDepartmentProcess: string;
  referenceDocument: string;
};

type AuditSyncStatus = "idle" | "saving" | "saved" | "offline";

type AuditRecoverySnapshot = {
  checksheetItems: ChecksheetItem[];
  savedAt: string;
};

const AUDIT_RECOVERY_STORAGE_KEY = "aldis-fill-audit-recovery";

const AUTOSAVE_DELAY = 1200;

const AUDITORS = [
  { id: "Michael", name: "Oscar" },
  { id: "Andy", name: "Kevin" },
];

const AUDITEES = [
  { id: "oscar", name: "Oscar" },
  { id: "kevin", name: "Kevin" },
];

function requiresFollowUp(category: string) {
  return (
    category === "OFI" || category === "NC_MINOR" || category === "NC_MAJOR"
  );
}

function normalizeChecksheetItem(item: ChecksheetItem): ChecksheetItem {
  const needsFollowUp = requiresFollowUp(item.category);

  return {
    ...item,
    picId: needsFollowUp && typeof item.picId === "string" ? item.picId : "",
    dueDate:
      needsFollowUp && typeof item.dueDate === "string" ? item.dueDate : "",
  };
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

export default function FillAuditClient() {
  const router = useRouter();

  const [isAuditInfoOpen, setIsAuditInfoOpen] = useState(true);
  const [openCheckId, setOpenCheckId] = useState<number | null>(1);

  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  const [hasRecoveredSession, setHasRecoveredSession] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<AuditSyncStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const autosaveTimerRef = useRef<number | null>(null);

  const allowBrowserNavigationRef = useRef(false);

  const [checksheetItems, setChecksheetItems] = useState<ChecksheetItem[]>([
    {
      id: 1,
      standardReference:
        "4. Konteks Organisasi 4.4 Sistem manajemen mutu dan prosesnya 4.4.1 & 4.4.2",
      question:
        "Apakah sudah menetapkan input yang dibutuhkan dan output yang diharapkan dari setiap proses? Lihat form identifikasi proses sistem manajemen mutu (IPSMM)",
      objectiveEvidenceAndFinding: "",
      category: "",
      picId: "",
      dueDate: "",
      areaDepartmentProcess: "",
      referenceDocument: "",
    },
    {
      id: 2,
      standardReference: "5.2.2 Komunikasi Kebijakan Mutu",
      question:
        "Apakah kebijakan mutu tersedia dan dipelihara sebagai informasi terdokumentasi di area yang dibutuhkan? Apakah kebijakan telah disosialisasikan, dimengerti, dan diterapkan?",
      objectiveEvidenceAndFinding: "",
      category: "",
      picId: "",
      dueDate: "",
      areaDepartmentProcess: "",
      referenceDocument: "",
    },
    {
      id: 3,
      standardReference: "5.3 Peran Tanggung Jawab dan Wewenang Organisasi",
      question:
        "Apakah tersedia Job Description untuk seluruh karyawan? Apakah sudah mencakup peran, tanggung jawab, dan wewenang serta sesuai dengan kondisi aktual?",
      objectiveEvidenceAndFinding: "",
      category: "",
      picId: "",
      dueDate: "",
      areaDepartmentProcess: "",
      referenceDocument: "",
    },
  ]);

  const checksheetItemsRef = useRef(checksheetItems);

  useEffect(() => {
    checksheetItemsRef.current = checksheetItems;
  }, [checksheetItems]);

  function toggleCheck(checkId: number) {
    setOpenCheckId((prev) => (prev === checkId ? null : checkId));
  }

  function updateCheckField<K extends keyof ChecksheetItem>(
    checkId: number,
    field: K,
    value: ChecksheetItem[K],
  ) {
    setChecksheetItems((prev) =>
      prev.map((item) =>
        item.id === checkId
          ? normalizeChecksheetItem({
              ...item,
              [field]: value,
            })
          : item,
      ),
    );

    if (isRecoveryReady) {
      setSyncStatus(navigator.onLine ? "saving" : "offline");
    }
  }

  function getCheckStatus(item: ChecksheetItem) {
    const values = [
      item.objectiveEvidenceAndFinding,
      item.category,
      item.areaDepartmentProcess,
      item.referenceDocument,
    ];

    if (requiresFollowUp(item.category)) {
      values.push(item.picId, item.dueDate);
    }

    const filledCount = values.filter((value) => value.trim() !== "").length;

    if (filledCount === 0) {
      return "Not Answered";
    }

    if (filledCount === values.length) {
      return "Completed";
    }

    return "In Progress";
  }

  function getCheckStatusClass(item: ChecksheetItem) {
    const status = getCheckStatus(item);

    if (status === "Completed") {
      return "badge-success";
    }

    if (status === "In Progress") {
      return "badge-warning";
    }

    return "badge-secondary";
  }

  function hasAuditProgress(items: ChecksheetItem[]) {
    return items.some(
      (item) =>
        item.objectiveEvidenceAndFinding.trim() !== "" ||
        item.category.trim() !== "" ||
        item.areaDepartmentProcess.trim() !== "" ||
        item.referenceDocument.trim() !== "",
    );
  }

  useEffect(() => {
    const recoveryTimer = window.setTimeout(() => {
      const savedRecovery = localStorage.getItem(AUDIT_RECOVERY_STORAGE_KEY);

      if (savedRecovery) {
        try {
          const recovery: AuditRecoverySnapshot = JSON.parse(savedRecovery);

          if (
            Array.isArray(recovery.checksheetItems) &&
            recovery.checksheetItems.length > 0
          ) {
            setChecksheetItems(
              recovery.checksheetItems.map(normalizeChecksheetItem),
            );
            setHasRecoveredSession(true);
            setLastSavedAt(new Date(recovery.savedAt));
            setSyncStatus(navigator.onLine ? "saved" : "offline");
          }
        } catch {
          localStorage.removeItem(AUDIT_RECOVERY_STORAGE_KEY);
        }
      }

      setIsOnline(navigator.onLine);
      setIsRecoveryReady(true);
    }, 0);

    return () => {
      window.clearTimeout(recoveryTimer);
    };
  }, []);

  useEffect(() => {
    let reconnectTimer: number | null = null;

    function handleOnline() {
      setIsOnline(true);

      if (hasAuditProgress(checksheetItemsRef.current)) {
        setSyncStatus("saving");

        reconnectTimer = window.setTimeout(() => {
          setSyncStatus("saved");
          setLastSavedAt(new Date());
        }, 800);
      }
    }

    function handleOffline() {
      setIsOnline(false);
      setSyncStatus("offline");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
    };
  }, []);

  useEffect(() => {
    if (!isRecoveryReady) {
      return;
    }

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      if (!hasAuditProgress(checksheetItems)) {
        localStorage.removeItem(AUDIT_RECOVERY_STORAGE_KEY);

        setSyncStatus("idle");
        setLastSavedAt(null);

        return;
      }

      const savedAt = new Date();

      const recovery: AuditRecoverySnapshot = {
        checksheetItems,
        savedAt: savedAt.toISOString(),
      };

      localStorage.setItem(
        AUDIT_RECOVERY_STORAGE_KEY,
        JSON.stringify(recovery),
      );

      setLastSavedAt(savedAt);

      if (!navigator.onLine) {
        setSyncStatus("offline");
        return;
      }

      setSyncStatus("saved");
    }, AUTOSAVE_DELAY);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [checksheetItems, isRecoveryReady]);

  const completedCheckCount = checksheetItems.filter(
    (item) => getCheckStatus(item) === "Completed",
  ).length;

  const incompleteCheckCount = checksheetItems.length - completedCheckCount;

  const isAllChecksCompleted =
    checksheetItems.length > 0 &&
    completedCheckCount === checksheetItems.length;

  async function confirmLeaveAudit() {
    if (!hasAuditProgress(checksheetItemsRef.current)) {
      return true;
    }

    const result = await Swal.fire({
      title: "Audit in Progress",
      text: "Your progress is saved automatically. This audit has not been submitted yet.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Leave Page",
      cancelButtonText: "Continue Audit",
      reverseButtons: true,
      didOpen: () => {
        const confirmButton = Swal.getConfirmButton();
        const cancelButton = Swal.getCancelButton();

        if (confirmButton) {
          confirmButton.style.setProperty(
            "background-color",
            "#d92550",
            "important",
          );

          confirmButton.style.setProperty(
            "border-color",
            "#d92550",
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

    return result.isConfirmed;
  }

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasAuditProgress(checksheetItemsRef.current)) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const currentUrl = window.location.href;

    window.history.pushState(
      {
        aldisAuditGuard: true,
      },
      "",
      currentUrl,
    );

    async function handlePopState() {
      if (allowBrowserNavigationRef.current) {
        return;
      }

      if (!hasAuditProgress(checksheetItemsRef.current)) {
        allowBrowserNavigationRef.current = true;
        window.history.back();
        return;
      }

      window.history.pushState(
        {
          aldisAuditGuard: true,
        },
        "",
        currentUrl,
      );

      const canLeave = await confirmLeaveAudit();

      if (!canLeave) {
        return;
      }

      allowBrowserNavigationRef.current = true;
      window.history.back();
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  async function handleBack() {
    const canLeave = await confirmLeaveAudit();

    if (!canLeave) {
      return;
    }

    router.push("/audit");
  }

  async function handleSubmitAudit() {
    if (!isAllChecksCompleted || !isOnline || syncStatus === "saving") {
      return;
    }

    const result = await Swal.fire({
      title: "Submit Audit?",
      text: "Please make sure all audit findings and supporting information are correct before submitting.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Submit Audit",
      cancelButtonText: "Cancel",
      reverseButtons: true,
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

    if (!result.isConfirmed) {
      return;
    }

    localStorage.removeItem(AUDIT_RECOVERY_STORAGE_KEY);

    await Swal.fire({
      title: "Audit Submitted",
      text: "The audit has been submitted successfully.",
      icon: "success",
      showConfirmButton: false,
      timer: 1800,
      timerProgressBar: true,
    });

    router.push("/audit");
  }

  function renderSyncStatus() {
    if (syncStatus === "offline") {
      return (
        <span className="text-warning">
          <i className="lnr-warning mr-1" />
          Offline — changes are stored locally
        </span>
      );
    }

    if (syncStatus === "saving") {
      return (
        <span className="text-info">
          <i className="lnr-sync mr-1" />
          Saving...
        </span>
      );
    }

    if (syncStatus === "saved") {
      return (
        <>
          <span className="text-success">
            <i className="lnr-checkmark-circle mr-1" />
            All changes saved automatically
          </span>

          {lastSavedAt && (
            <small className="text-muted ml-2">
              {lastSavedAt.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </small>
          )}
        </>
      );
    }

    return <span className="text-muted">Changes are saved automatically</span>;
  }

  return (
    <>
      <div className="app-page-title">
        <div className="page-title-wrapper">
          <div className="page-title-heading">
            <div className="page-title-icon">
              <i className="pe-7s-copy-file icon-gradient bg-malibu-beach" />
            </div>

            <div>
              Fill Audit
              <div className="page-title-subheading"></div>
            </div>
          </div>

          <div className="page-title-actions"></div>
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
                      <InfoField label="Audit Title">
                        Internal Audit Accountant 2026
                      </InfoField>
                    </div>
                    <div className="col-md-3 mb-3">
                      <InfoField label="Department">PPIC</InfoField>
                    </div>
                    <div className="col-md-3 mb-3">
                      <InfoField label="Audit Date">9 September 2026</InfoField>
                    </div>
                    <div className="col-md-6">
                      <InfoField label="Auditor">
                        {AUDITORS.map((auditor) => auditor.name).join(" & ")}
                      </InfoField>
                    </div>
                    <div className="col-md-6">
                      <InfoField label="Auditee">
                        {AUDITEES.map((auditee) => auditee.name).join(" & ")}
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
          <div>
            <strong>Audit session recovered.</strong> Your previous progress has
            been restored.
          </div>

          <button
            type="button"
            className="close"
            aria-label="Close"
            onClick={() => setHasRecoveredSession(false)}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      )}

      <div className="row">
        <div className="col-md-12">
          <div className="main-card card mb-3">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h6 className="card-title m-0 p-0">Checksheet</h6>
              <span className="badge badge-pill badge-primary">
                {completedCheckCount} / {checksheetItems.length} Completed
              </span>
            </div>
            <div className="card-body">
              <div
                id="checksheet-accordion"
                className="aldis-checksheet-accordion"
              >
                {checksheetItems.map((item, index) => {
                  const isOpen = openCheckId === item.id;
                  const status = getCheckStatus(item);
                  const needsFollowUp = requiresFollowUp(item.category);

                  return (
                    <div key={item.id} className="card aldis-check-item">
                      <div
                        id={`check-heading-${item.id}`}
                        className="card-header aldis-check-header"
                      >
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={`check-collapse-${item.id}`}
                          className="text-left m-0 p-0 btn btn-link btn-block aldis-check-toggle"
                          onClick={() => toggleCheck(item.id)}
                        >
                          <div className="d-flex align-items-center justify-content-between w-100">
                            <div className="d-flex align-items-center aldis-check-header-main">
                              <span className="aldis-check-number">
                                Check {String(index + 1).padStart(2, "0")}
                              </span>

                              <span className="aldis-check-reference ml-3">
                                {item.standardReference}
                              </span>
                            </div>

                            <div className="d-flex align-items-center ml-3">
                              <span
                                className={`badge mr-3 ${getCheckStatusClass(item)}`}
                              >
                                {status}
                              </span>

                              <i
                                className={`lnr lnr-chevron-down aldis-accordion-chevron ${
                                  isOpen ? "is-open" : ""
                                }`}
                              />
                            </div>
                          </div>
                        </button>
                      </div>

                      <div
                        id={`check-collapse-${item.id}`}
                        aria-labelledby={`check-heading-${item.id}`}
                        className={`collapse ${isOpen ? "show" : ""}`}
                      >
                        <div className="card-body">
                          <div className="row mb-4">
                            <div className="col-md-5">
                              <div className="aldis-check-context">
                                <div className="aldis-check-context-label">
                                  Standard Reference
                                </div>

                                <div className="aldis-check-context-value">
                                  {item.standardReference}
                                </div>
                              </div>
                            </div>

                            <div className="col-md-7">
                              <div className="aldis-check-context">
                                <div className="aldis-check-context-label">
                                  Question
                                </div>

                                <div className="aldis-check-context-value">
                                  {item.question}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="row">
                            <div className="col-12">
                              <div className="position-relative form-group">
                                <label
                                  htmlFor={`objective-evidence-${item.id}`}
                                  className="aldis-required-label"
                                >
                                  Objective Evidence & Finding
                                </label>

                                <textarea
                                  id={`objective-evidence-${item.id}`}
                                  name={`checksheet[${item.id}][objective_evidence_and_finding]`}
                                  className="form-control aldis-textarea-standard-ref-question"
                                  placeholder="Enter objective evidence and findings..."
                                  value={item.objectiveEvidenceAndFinding}
                                  onChange={(event) =>
                                    updateCheckField(
                                      item.id,
                                      "objectiveEvidenceAndFinding",
                                      event.target.value,
                                    )
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
                                  htmlFor={`category-${item.id}`}
                                  className="aldis-required-label"
                                >
                                  Category
                                </label>

                                <select
                                  id={`category-${item.id}`}
                                  name={`checksheet[${item.id}][category]`}
                                  className="form-control aldis-select2"
                                  data-hide-search="true"
                                  value={item.category}
                                  onChange={(event) =>
                                    updateCheckField(
                                      item.id,
                                      "category",
                                      event.target.value,
                                    )
                                  }
                                  required
                                >
                                  <option value="">Select category</option>
                                  <option value="OK">OK</option>
                                  <option value="OFI">
                                    OFI (Opportunity for Improvement)
                                  </option>
                                  <option value="NC_MINOR">
                                    NC Minor (Minor Non-Conformity)
                                  </option>
                                  <option value="NC_MAJOR">
                                    NC Major (Major Non-Conformity)
                                  </option>
                                </select>
                              </div>
                            </div>

                            <div className="col-md-6">
                              <div className="position-relative form-group">
                                <label
                                  htmlFor={`area-department-process-${item.id}`}
                                  className="aldis-required-label"
                                >
                                  Area / Department / Process
                                </label>

                                <input
                                  id={`area-department-process-${item.id}`}
                                  name={`checksheet[${item.id}][area_department_process]`}
                                  type="text"
                                  className="form-control"
                                  placeholder="Enter area, department, or process..."
                                  value={item.areaDepartmentProcess}
                                  onChange={(event) =>
                                    updateCheckField(
                                      item.id,
                                      "areaDepartmentProcess",
                                      event.target.value,
                                    )
                                  }
                                  required
                                />
                              </div>
                            </div>
                          </div>

                          <div className="row">
                            <div className="col-12">
                              <div className="position-relative form-group">
                                <label
                                  htmlFor={`reference-document-${item.id}`}
                                  className="aldis-required-label"
                                >
                                  Reference Document
                                </label>

                                <input
                                  id={`reference-document-${item.id}`}
                                  name={`checksheet[${item.id}][reference_document]`}
                                  type="text"
                                  className="form-control"
                                  placeholder="Enter reference document..."
                                  value={item.referenceDocument}
                                  onChange={(event) =>
                                    updateCheckField(
                                      item.id,
                                      "referenceDocument",
                                      event.target.value,
                                    )
                                  }
                                  required
                                />
                              </div>
                            </div>
                          </div>

                          {needsFollowUp && (
                            <div className="row">
                              <div className="col-md-6">
                                <div className="position-relative form-group">
                                  <label
                                    htmlFor={`pic-${item.id}`}
                                    className="aldis-required-label"
                                  >
                                    PIC
                                  </label>

                                  <select
                                    id={`pic-${item.id}`}
                                    name={`checksheet[${item.id}][pic_id]`}
                                    className="form-control aldis-select2"
                                    data-hide-search="true"
                                    value={item.picId}
                                    onChange={(event) =>
                                      updateCheckField(
                                        item.id,
                                        "picId",
                                        event.target.value,
                                      )
                                    }
                                    required
                                  >
                                    <option value="">Select PIC</option>
                                    {AUDITEES.map((auditee) => (
                                      <option
                                        key={auditee.id}
                                        value={auditee.id}
                                      >
                                        {auditee.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="col-md-6">
                                <div className="position-relative form-group">
                                  <label
                                    htmlFor={`due-date-${item.id}`}
                                    className="aldis-required-label"
                                  >
                                    Due Date
                                  </label>

                                  <input
                                    id={`due-date-${item.id}`}
                                    name={`checksheet[${item.id}][due_date]`}
                                    type="date"
                                    className="form-control"
                                    value={item.dueDate}
                                    onChange={(event) =>
                                      updateCheckField(
                                        item.id,
                                        "dueDate",
                                        event.target.value,
                                      )
                                    }
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card-footer d-flex align-items-center justify-content-between">
              <div>
                <div className="mb-1">{renderSyncStatus()}</div>

                {!isAllChecksCompleted && (
                  <small className="text-muted">
                    {incompleteCheckCount}{" "}
                    {incompleteCheckCount === 1 ? "check" : "checks"} remaining
                    before submission.
                  </small>
                )}

                {isAllChecksCompleted && (
                  <small className="text-success">
                    All checks are complete and ready for submission.
                  </small>
                )}
              </div>

              <div className="d-flex align-items-center aldis-gap-2">
                <button
                  type="button"
                  className="btn-hover-shine btn btn-secondary"
                  onClick={handleBack}
                >
                  Back
                </button>

                <div
                  className="aldis-tooltip-wrapper"
                  data-tooltip={
                    !isOnline
                      ? "Reconnect to the network before submitting the audit."
                      : !isAllChecksCompleted
                        ? "Complete all required checks before submitting the audit."
                        : syncStatus === "saving"
                          ? "Please wait until the latest changes are saved."
                          : "Submit the completed audit."
                  }
                >
                  <button
                    type="button"
                    className="btn-hover-shine btn btn-primary"
                    onClick={handleSubmitAudit}
                    disabled={
                      !isOnline ||
                      !isAllChecksCompleted ||
                      syncStatus === "saving"
                    }
                  >
                    <span className="btn-icon-wrapper opacity-7"></span>
                    Submit Audit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
