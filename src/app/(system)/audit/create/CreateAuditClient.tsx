"use client";

import ModalPortal from "@/components/common/ModalPortal";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type PersonRow = {
  id: number;
  value: string;
};

type StandardRefQuestionRow = {
  id: number;
  standard_ref: string;
  question: string;
};

const personOptions = [
  "Michael",
  "Jim",
  "Pam",
  "Dwight",
  "Andy",
  "Phyllis",
  "Stanley",
  "Oscar",
];

const MAX_EXCEL_FILE_SIZE_MB = 5;
const MAX_EXCEL_FILE_SIZE_BYTES = MAX_EXCEL_FILE_SIZE_MB * 1024 * 1024;

export default function CreateAuditClient() {
  const router = useRouter();

  const standardRefQuestionIdRef = useRef(0);

  const [auditors, setAuditors] = useState<string[]>([]);
  const [auditees, setAuditees] = useState<string[]>([]);

  const [standardRefQuestions, setStandardRefQuestions] = useState<
    StandardRefQuestionRow[]
  >([]);

  const [standardRefDraft, setStandardRefDraft] = useState("");
  const [questionDraft, setQuestionDraft] = useState("");
  const [editingStandardQuestionId, setEditingStandardQuestionId] = useState<
    number | null
  >(null);

  const standardQuestionComposerRef = useRef<HTMLDivElement>(null);
  const standardRefTextareaRef = useRef<HTMLTextAreaElement>(null);

  function getSelectedValues(select: HTMLSelectElement) {
    return Array.from(select.selectedOptions).map((option) => option.value);
  }

  function handleAuditorsChange(select: HTMLSelectElement) {
    const selectedValues = getSelectedValues(select);

    const validValues = selectedValues.filter(
      (person) => !auditees.includes(person),
    );

    setAuditors(validValues);
  }

  function handleAuditeesChange(select: HTMLSelectElement) {
    const selectedValues = getSelectedValues(select);

    const validValues = selectedValues.filter(
      (person) => !auditors.includes(person),
    );

    setAuditees(validValues);
  }

  function resetStandardQuestionDraft() {
    setStandardRefDraft("");
    setQuestionDraft("");
    setEditingStandardQuestionId(null);
  }

  function saveStandardRefQuestion() {
    const standardRef = standardRefDraft.trim();
    const question = questionDraft.trim();

    if (!standardRef || !question) {
      return;
    }

    if (editingStandardQuestionId !== null) {
      setStandardRefQuestions((prev) =>
        prev.map((item) =>
          item.id === editingStandardQuestionId
            ? {
                ...item,
                standard_ref: standardRef,
                question,
              }
            : item,
        ),
      );

      resetStandardQuestionDraft();
      return;
    }

    standardRefQuestionIdRef.current += 1;

    setStandardRefQuestions((prev) => [
      ...prev,
      {
        id: standardRefQuestionIdRef.current,
        standard_ref: standardRef,
        question,
      },
    ]);

    resetStandardQuestionDraft();
  }

  function editStandardRefQuestion(item: StandardRefQuestionRow) {
    setStandardRefDraft(item.standard_ref);
    setQuestionDraft(item.question);
    setEditingStandardQuestionId(item.id);

    window.requestAnimationFrame(() => {
      standardQuestionComposerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      window.setTimeout(() => {
        standardRefTextareaRef.current?.focus({
          preventScroll: true,
        });

        standardRefTextareaRef.current?.setSelectionRange(
          standardRefTextareaRef.current.value.length,
          standardRefTextareaRef.current.value.length,
        );
      }, 350);
    });
  }

  function deleteStandardRefQuestion(id: number) {
    setStandardRefQuestions((prev) => prev.filter((item) => item.id !== id));

    if (editingStandardQuestionId === id) {
      resetStandardQuestionDraft();
    }
  }

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/audit");
  }

  const excelInputRef = useRef<HTMLInputElement>(null);

  const [isUploadExcelOpen, setIsUploadExcelOpen] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [uploadExcelError, setUploadExcelError] = useState("");

  function openUploadExcelModal() {
    setExcelFile(null);
    setUploadExcelError("");
    setIsUploadExcelOpen(true);
  }

  function closeUploadExcelModal() {
    setIsUploadExcelOpen(false);
    setExcelFile(null);
    setUploadExcelError("");

    if (excelInputRef.current) {
      excelInputRef.current.value = "";
    }
  }

  function handleExcelFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setExcelFile(null);
    setUploadExcelError("");

    if (!file) {
      return;
    }

    const isXlsx = file.name.toLowerCase().endsWith(".xlsx");

    if (!isXlsx) {
      setUploadExcelError("Only .xlsx files are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_EXCEL_FILE_SIZE_BYTES) {
      setUploadExcelError(
        `The maximum file size is ${MAX_EXCEL_FILE_SIZE_MB} MB.`,
      );
      event.target.value = "";
      return;
    }

    setExcelFile(file);
  }

  function handleUploadExcel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!excelFile) {
      setUploadExcelError(
        "Please select an .xlsx Excel file before uploading.",
      );
      return;
    }

    const formData = new FormData();
    formData.append("file", excelFile);

    console.log("upload excel", excelFile);

    closeUploadExcelModal();
  }

  return (
    <>
      <div className="app-page-title">
        <div className="page-title-wrapper">
          <div className="page-title-heading">
            <div className="page-title-icon">
              <i className="pe-7s-note2 icon-gradient bg-malibu-beach" />
            </div>

            <div>
              Create Audit
              <div className="page-title-subheading"></div>
            </div>
          </div>
          <div className="page-title-actions"></div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-12">
          <div className="main-card card mb-3">
            <div className="card-header">
              <h6 className="card-title m-0 p-0">General information</h6>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="col-md-6">
                  <div className="position-relative form-group">
                    <label htmlFor="title" className="aldis-required-label">Title</label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      className="form-control"
                      placeholder="Title here..."
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="position-relative form-group">
                    <label htmlFor="iso_standard" className="aldis-required-label">ISO</label>
                    <select
                      id="iso_standard"
                      name="iso_standard"
                      className="form-control aldis-select2"
                      required
                    >
                      <option value="">Select ISO standard</option>
                      <option value="704:2022 - Principles and methods">
                        704:2022 - Principles and methods
                      </option>
                      <option value="860:2007 - Harmonization of concepts and terms">
                        860:2007 - Harmonization of concepts and terms
                      </option>
                      <option value="1087:2019 - Vocabulary">
                        1087:2019 - Vocabulary
                      </option>
                      <option value="1951:2026 - Fundamentals and recommendations">
                        1951:2026 - Fundamentals and recommendations
                      </option>
                      <option value="5060:2024 - Evaluation of translation output - General guidance">
                        5060:2024 - Evaluation of translation output - General
                        guidance
                      </option>
                    </select>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="position-relative form-group">
                    <label htmlFor="department" className="aldis-required-label">Department</label>
                    <select
                      id="department"
                      name="department"
                      className="form-control aldis-select2"
                      required
                    >
                      <option value="">Select department</option>
                      <option value="MSTD">MSTD</option>
                      <option value="QA">QA</option>
                      <option value="QC">QC</option>
                      <option value="Production">Production Line 1</option>
                      <option value="Production">Production Line 2</option>
                      <option value="Production">Production Line 3</option>
                      <option value="Production">Production Line 4</option>
                      <option value="Engineering">Engineering</option>
                    </select>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="position-relative form-group">
                    <label htmlFor="date" className="aldis-required-label">Date</label>
                    <input
                      id="date"
                      name="date"
                      type="date"
                      className="form-control"
                      placeholder="Date here..."
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="main-card card mb-3">
            <div className="card-header">
              <h6 className="card-title m-0 p-0">Auditor And Auditee</h6>
            </div>

            <div className="card-body">
              <div className="form-row">
                <div className="col-md-6">
                  <div className="position-relative form-group">
                    <label htmlFor="auditors" className="aldis-required-label">Auditor</label>

                    <select
                      id="auditors"
                      name="auditors[]"
                      className="form-control aldis-select2"
                      data-placeholder="Select auditor"
                      data-allow-clear="true"
                      multiple
                      value={auditors}
                      onChange={(event) => handleAuditorsChange(event.target)}
                      required
                    >
                      {personOptions.map((person) => (
                        <option
                          key={person}
                          value={person}
                          disabled={auditees.includes(person)}
                        >
                          {person}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="position-relative form-group">
                    <label htmlFor="auditees" className="aldis-required-label">Auditee</label>

                    <select
                      id="auditees"
                      name="auditees[]"
                      className="form-control aldis-select2"
                      data-placeholder="Select auditee"
                      data-allow-clear="true"
                      multiple
                      value={auditees}
                      onChange={(event) => handleAuditeesChange(event.target)}
                      required
                    >
                      {personOptions.map((person) => (
                        <option
                          key={person}
                          value={person}
                          disabled={auditors.includes(person)}
                        >
                          {person}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="main-card card">
            <div className="card-header d-flex justify-content-between">
              <h6 className="card-title m-0 p-0">
                Standard References And Questions
              </h6>

              <button
                type="button"
                className="btn-hover-shine btn btn-success"
                onClick={openUploadExcelModal}
              >
                <span className="btn-icon-wrapper pr-2 opacity-7">
                  <i className="ion-android-arrow-up fa-w-20" />
                </span>
                Upload Excel
              </button>
            </div>

            <div className="card-body">
              <div
                ref={standardQuestionComposerRef}
                className={`standard-question-composer ${
                  editingStandardQuestionId !== null ? "is-editing" : ""
                }`}
              >
                {editingStandardQuestionId !== null && (
                  <div className="aldis-editing-indicator mb-3">
                    <div className="d-flex align-items-center">
                      <div className="aldis-editing-indicator-icon mr-2">
                        <i className="lnr-pencil" />
                      </div>

                      <div>
                        <div className="font-weight-bold">
                          Editing Standard Reference & Question
                        </div>
                        <div className="aldis-editing-indicator-text">
                          Update the fields below, then click Update Question to
                          save your changes.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="form-row">
                  <div className="col-md-5">
                    <div className="position-relative form-group">
                      <label htmlFor="standard_ref">Standard Reference</label>

                      <textarea
                        ref={standardRefTextareaRef}
                        id="standard_ref"
                        name="standard_ref"
                        className="form-control aldis-textarea-standard-ref-question"
                        placeholder="Standard reference here..."
                        value={standardRefDraft}
                        onChange={(event) =>
                          setStandardRefDraft(event.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="col-md-7">
                    <div className="position-relative form-group">
                      <label htmlFor="question">Question</label>

                      <textarea
                        id="question"
                        name="question"
                        className="form-control aldis-textarea-standard-ref-question"
                        placeholder="Question here..."
                        value={questionDraft}
                        onChange={(event) =>
                          setQuestionDraft(event.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end">
                  {editingStandardQuestionId !== null && (
                    <button
                      type="button"
                      className="btn-hover-shine btn btn-secondary mr-2"
                      onClick={resetStandardQuestionDraft}
                    >
                      Cancel Edit
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-hover-shine btn btn-primary"
                    onClick={saveStandardRefQuestion}
                    disabled={!standardRefDraft.trim() || !questionDraft.trim()}
                  >
                    <span className="btn-icon-wrapper pr-2 opacity-7">
                      <i
                        className={
                          editingStandardQuestionId !== null
                            ? "lnr-checkmark-circle"
                            : "ion-android-add"
                        }
                      />
                    </span>

                    {editingStandardQuestionId !== null
                      ? "Update Question"
                      : "Add Question"}
                  </button>
                </div>
              </div>

              {standardRefQuestions.length > 0 && (
                <>
                  <div className="divider mt-4" />

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0 font-weight-bold">Added Questions</h6>

                    <span className="badge badge-pill badge-primary">
                      {standardRefQuestions.length}
                    </span>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover table-bordered mb-0">
                      <thead>
                        <tr>
                          <th className="text-center" style={{ width: "60px" }}>
                            No
                          </th>

                          <th style={{ width: "35%" }}>Standard Reference</th>

                          <th>Question</th>

                          <th
                            className="text-center"
                            style={{ width: "110px" }}
                          >
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {standardRefQuestions.map((item, index) => (
                          <tr key={item.id}>
                            <td className="text-center align-middle">
                              {index + 1}
                            </td>

                            <td className="align-middle">
                              {item.standard_ref}
                            </td>

                            <td className="align-middle">{item.question}</td>

                            <td className="text-center align-middle">
                              <div className="d-flex justify-content-center align-items-center">
                                <button
                                  type="button"
                                  className="btn-icon btn-icon-only btn-hover-shine btn btn-warning btn-sm mr-2"
                                  onClick={() => editStandardRefQuestion(item)}
                                  title="Edit"
                                  aria-label="Edit"
                                >
                                  <i className="lnr-pencil" />
                                </button>

                                <button
                                  type="button"
                                  className="btn-icon btn-icon-only btn-hover-shine btn btn-danger btn-sm"
                                  onClick={() =>
                                    deleteStandardRefQuestion(item.id)
                                  }
                                  title="Delete"
                                  aria-label="Delete"
                                >
                                  <i className="lnr-trash" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="card-footer d-flex justify-content-end aldis-gap-2">
              <button
                type="button"
                className="btn-hover-shine btn btn-secondary"
                onClick={handleBack}
              >
                Back
              </button>

              <div
                className="aldis-tooltip-wrapper"
                data-tooltip="Save as a draft. You can continue editing this data later."
              >
                <button
                  type="button"
                  className="btn-hover-shine btn btn-success"
                  disabled={standardRefQuestions.length === 0}
                >
                  Save Draft
                </button>
              </div>

              <button
                type="button"
                className="btn-hover-shine btn btn-primary"
                disabled={standardRefQuestions.length === 0}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
      {isUploadExcelOpen && (
        <ModalPortal>
          <div
            className="aldis-modal-backdrop"
            onClick={closeUploadExcelModal}
          />

          <div
            className="modal aldis-modal show"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog aldis-modal-dialog aldis-modal-md">
              <form className="modal-content" onSubmit={handleUploadExcel}>
                <div className="modal-header">
                  <h5 className="modal-title">Upload Excel</h5>

                  <button
                    type="button"
                    className="close"
                    aria-label="Close"
                    onClick={closeUploadExcelModal}
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>

                <div className="modal-body">
                  <div className="alert alert-warning mb-3">
                    <strong>Important:</strong> Only <strong>.xlsx</strong>{" "}
                    files are allowed, with a maximum file size of{" "}
                    <strong>{MAX_EXCEL_FILE_SIZE_MB} MB</strong>.
                  </div>

                  <div className="position-relative form-group">
                    <label htmlFor="excel_file">Excel File</label>

                    <div className="aldis-file-upload">
                      <input
                        ref={excelInputRef}
                        id="excel_file"
                        name="excel_file"
                        type="file"
                        className="aldis-file-upload-input"
                        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handleExcelFileChange}
                        required
                      />

                      <label
                        htmlFor="excel_file"
                        className="aldis-file-upload-control"
                      >
                        <span className="aldis-file-upload-button">
                          <i className="lnr-upload mr-2" />
                          Browse
                        </span>

                        <span
                          className={`aldis-file-upload-name ${
                            excelFile ? "has-file" : ""
                          }`}
                        >
                          {excelFile ? excelFile.name : "No file selected"}
                        </span>
                      </label>
                    </div>

                    <small className="form-text text-muted mt-2">
                      Please use the provided Excel template to ensure the data
                      format is correct.
                    </small>
                  </div>

                  {excelFile && (
                    <div className="alert alert-info mb-3">
                      Selected file: <strong>{excelFile.name}</strong>
                    </div>
                  )}

                  {uploadExcelError && (
                    <div className="alert alert-danger mb-3">
                      {uploadExcelError}
                    </div>
                  )}

                  <a
                    href="/templates/audit-standard-question-template.xlsx"
                    download
                    className="btn-hover-shine btn btn-outline-success"
                  >
                    <span className="btn-icon-wrapper pr-2 opacity-7">
                      <i className="lnr-download" />
                    </span>
                    Download Template Excel
                  </a>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-hover-shine btn btn-secondary"
                    onClick={closeUploadExcelModal}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn-hover-shine btn btn-primary"
                    disabled={!excelFile}
                  >
                    Upload
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
