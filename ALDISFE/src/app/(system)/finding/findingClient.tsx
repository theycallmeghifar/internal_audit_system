"use client";

import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

type DataTableInstance = {
  destroy: () => void;
};

type JQueryDataTableElement = {
  DataTable: (options?: Record<string, unknown>) => DataTableInstance;
  trigger: (events: string) => JQueryDataTableElement;
};

type JQueryStatic = {
  (element: HTMLElement): JQueryDataTableElement;
  fn?: {
    dataTable?: {
      isDataTable?: (element: HTMLElement) => boolean;
    };
  };
};

type DataTableWindow = Window & {
  jQuery?: JQueryStatic;
  $?: JQueryStatic;
};

type FindingKpiTone = "total" | "required" | "review" | "approved";

function FindingKpiIcon({ tone }: { tone: FindingKpiTone }) {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {tone === "total" && (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1.6" />
          <rect x="14" y="3" width="7" height="7" rx="1.6" />
          <rect x="3" y="14" width="7" height="7" rx="1.6" />
          <rect x="14" y="14" width="7" height="7" rx="1.6" />
        </>
      )}
      {tone === "required" && (
        <>
          <path d="M10.3 4.2 2.5 17.7A2 2 0 0 0 4.2 20.7h15.6a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4.5M12 17h.01" />
        </>
      )}
      {tone === "review" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.5 2" />
        </>
      )}
      {tone === "approved" && (
        <>
          <path d="M12 3 4 6v5c0 5 3.5 8.1 8 10 4.5-1.9 8-5 8-10V6l-8-3Z" />
          <path d="m8.5 12 2.3 2.3 4.7-4.7" />
        </>
      )}
    </svg>
  );
}

function FindingKpiCards({
  total,
  required,
  review,
  approved,
}: {
  total: number;
  required: number;
  review: number;
  approved: number;
}) {
  const share = (value: number) => (total > 0 ? (value / total) * 100 : 0);
  const cards: {
    tone: FindingKpiTone;
    title: string;
    tag: string;
    value: number;
    description: string;
    percentage: number;
    percentageLabel: string;
  }[] = [
    {
      tone: "total",
      title: "Total Findings",
      tag: "Overview",
      value: total,
      description: "Findings matching applied filters",
      percentage: share(approved),
      percentageLabel: "Approval rate",
    },
    {
      tone: "required",
      title: "Improvement Required",
      tag: "Action Needed",
      value: required,
      description: "Awaiting auditee improvement",
      percentage: share(required),
      percentageLabel: "Share of total findings",
    },
    {
      tone: "review",
      title: "Improvement Review",
      tag: "In Review",
      value: review,
      description: "Awaiting auditor review",
      percentage: share(review),
      percentageLabel: "Share of total findings",
    },
    {
      tone: "approved",
      title: "Approved",
      tag: "Completed",
      value: approved,
      description: "Improvements approved by auditor",
      percentage: share(approved),
      percentageLabel: "Share of total findings",
    },
  ];

  return (
    <section className="aldis-finding-kpis mb-3" aria-label="Finding summary">
      <div className="afk-grid">
        {cards.map((card) => (
          <article
            className={`card afk-card afk-card--${card.tone}`}
            key={card.tone}
          >
            <div className="afk-top">
              <span className="afk-icon">
                <FindingKpiIcon tone={card.tone} />
              </span>
              <span className="afk-tag">
                <span className="afk-dot" />
                {card.tag}
              </span>
            </div>
            <h2 className="afk-title">{card.title}</h2>
            <div className="afk-value">
              <strong>{card.value.toLocaleString("en-GB")}</strong>
              <span>{card.value === 1 ? "finding" : "findings"}</span>
            </div>
            <p className="afk-description">{card.description}</p>
            <div className="afk-footer">
              <div className="afk-share">
                <span>{card.percentageLabel}</span>
                <strong>
                  {total > 0 ? `${card.percentage.toFixed(1)}%` : "—"}
                </strong>
              </div>
              <div className="afk-track" aria-hidden="true">
                <span style={{ width: `${card.percentage}%` }} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

type FindingStatus = "Improvement Required" | "Improvement Review" | "Approved";
type FindingCategory = "OFI" | "NC Minor" | "NC Major";

type Finding = {
  id: number;
  auditTitle: string;
  auditDate: string;
  department: string;
  standard: string;
  category: FindingCategory;
  auditee: string;
  auditor: string;
  finding: string;
  status: FindingStatus;
};

type FindingFilters = {
  from: string;
  to: string;
  department: string;
  standard: string;
  category: string;
  status: string;
};

const EMPTY_FILTERS: FindingFilters = {
  from: "",
  to: "",
  department: "",
  standard: "",
  category: "",
  status: "",
};

const FINDINGS: Finding[] = [
  {
    id: 1,
    auditTitle: "Internal Audit Sales 2026",
    auditDate: "2026-09-27",
    department: "Sales",
    standard: "ISO 9001:2015",
    category: "NC Minor",
    auditee: "Toby",
    auditor: "Michael",
    finding:
      "Document distribution record was not updated according to the latest SOP revision.",
    status: "Improvement Required",
  },
  {
    id: 2,
    auditTitle: "Internal Audit Warehouse 2026",
    auditDate: "2026-09-27",
    department: "Warehouse",
    standard: "ISO 14001:2019",
    category: "OFI",
    auditee: "Kevin",
    auditor: "Toby",
    finding:
      "Waste segregation monitoring can be improved to ensure better traceability.",
    status: "Improvement Review",
  },
  {
    id: 3,
    auditTitle: "Internal Audit Production 2026",
    auditDate: "2026-09-27",
    department: "Production",
    standard: "ISO 9001:2015",
    category: "NC Major",
    auditee: "Oscar",
    auditor: "Pam",
    finding:
      "Critical process parameter monitoring was not performed according to approved procedure.",
    status: "Approved",
  },
];

const DEPARTMENTS = Array.from(
  new Set([
    ...FINDINGS.map((finding) => finding.department),
    "PPIC",
    "Engineering",
  ]),
);
const ISO_STANDARDS = Array.from(
  new Set(FINDINGS.map((finding) => finding.standard)),
);
const FINDING_CATEGORIES: FindingCategory[] = ["OFI", "NC Minor", "NC Major"];
const FINDING_STATUSES: FindingStatus[] = [
  "Improvement Required",
  "Improvement Review",
  "Approved",
];

const AUDIT_DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function formatAuditDate(value: string) {
  return AUDIT_DATE_FORMAT.format(new Date(`${value}T00:00:00Z`));
}

function filterKey(filters: FindingFilters) {
  return JSON.stringify([
    filters.from,
    filters.to,
    filters.department,
    filters.standard,
    filters.category,
    filters.status,
  ]);
}

function getFilterError(filters: FindingFilters) {
  const validMonth = /^(?!0000)\d{4}-(0[1-9]|1[0-2])$/;

  if (
    (filters.from && !validMonth.test(filters.from)) ||
    (filters.to && !validMonth.test(filters.to))
  ) {
    return "Please enter a valid month and year.";
  }

  if (filters.from && filters.to && filters.from > filters.to) {
    return "From Audit Period must not be later than To Audit Period.";
  }

  return "";
}

function filterFindings(findings: Finding[], filters: FindingFilters) {
  return findings.filter((finding) => {
    const auditMonth = finding.auditDate.slice(0, 7);

    return (
      (!filters.from || auditMonth >= filters.from) &&
      (!filters.to || auditMonth <= filters.to) &&
      (!filters.department || finding.department === filters.department) &&
      (!filters.standard || finding.standard === filters.standard) &&
      (!filters.category || finding.category === filters.category) &&
      (!filters.status || finding.status === filters.status)
    );
  });
}

const FindingTable = memo(function FindingTable({
  findings,
}: {
  findings: Finding[];
}) {
  const tableRef = useRef<HTMLTableElement>(null);
  const dataTableRef = useRef<DataTableInstance | null>(null);

  useLayoutEffect(() => {
    if (findings.length === 0) {
      return;
    }

    let retryCount = 0;
    let retryTimer: number | null = null;
    let isMounted = true;

    function initDataTable() {
      if (!isMounted) {
        return;
      }

      const table = tableRef.current;
      const dataTableWindow = window as DataTableWindow;
      const jq = dataTableWindow.jQuery ?? dataTableWindow.$;

      if (!table) {
        retry();
        return;
      }

      if (!jq || !jq.fn?.dataTable?.isDataTable) {
        retry();
        return;
      }

      if (typeof jq(table).DataTable !== "function") {
        retry();
        return;
      }

      if (jq.fn.dataTable.isDataTable(table)) {
        dataTableRef.current = jq(table).DataTable();
        return;
      }

      dataTableRef.current = jq(table).DataTable({
        pageLength: 10,
        lengthMenu: [10, 25, 50, 100],
        autoWidth: false,
        responsive: true,
        destroy: true,
      });
    }

    function retry() {
      if (retryCount >= 50) {
        console.warn("DataTables gagal di-init: plugin belum tersedia.");
        return;
      }

      retryCount += 1;
      retryTimer = window.setTimeout(initDataTable, 100);
    }

    retryTimer = window.setTimeout(initDataTable, 0);

    return () => {
      isMounted = false;

      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
      }

      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
    };
  }, [findings]);

  return (
    <div className="finding-table-container">
      <table
        ref={tableRef}
        data-datatable={findings.length > 0 ? "true" : undefined}
        style={{ width: "100%" }}
        className="table table-hover table-striped table-bordered"
      >
        <thead>
          <tr>
            <th>No</th>
            <th>Audit Title</th>
            <th>Audit Date</th>
            <th>Department</th>
            <th>ISO Standard</th>
            <th>Finding Category</th>
            <th>Finding</th>
            <th>Auditee</th>
            <th>Auditor</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {findings.length === 0 ? (
            <tr>
              <td colSpan={10} className="text-center text-muted py-4">
                No findings match the selected filters. Adjust or reset the
                filters.
              </td>
            </tr>
          ) : (
            findings.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.auditTitle}</td>
                <td data-order={item.auditDate}>
                  {formatAuditDate(item.auditDate)}
                </td>
                <td>{item.department}</td>
                <td>{item.standard}</td>
                <td>{item.category}</td>
                <td>{item.finding}</td>
                <td>{item.auditee}</td>
                <td>{item.auditor}</td>
                <td className="text-center">
                  <span
                    className={`badge badge-pill ${
                      item.status === "Improvement Required"
                        ? "badge-warning"
                        : item.status === "Improvement Review"
                          ? "badge-info"
                          : "badge-success"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
});

export default function FindingClient() {
  const filterFormRef = useRef<HTMLFormElement>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const [draftFilters, setDraftFilters] = useState<FindingFilters>({
    ...EMPTY_FILTERS,
  });
  const [appliedFilters, setAppliedFilters] = useState<FindingFilters>({
    ...EMPTY_FILTERS,
  });

  const filteredFindings = useMemo(
    () => filterFindings(FINDINGS, appliedFilters),
    [appliedFilters],
  );
  const appliedFilterKey = filterKey(appliedFilters);
  const hasFilterChanges = filterKey(draftFilters) !== appliedFilterKey;
  const filterError = getFilterError(draftFilters);
  const totalFinding = filteredFindings.length;
  const improvementRequired = filteredFindings.filter(
    (finding) => finding.status === "Improvement Required",
  ).length;
  const improvementReview = filteredFindings.filter(
    (finding) => finding.status === "Improvement Review",
  ).length;
  const approved = filteredFindings.filter(
    (finding) => finding.status === "Approved",
  ).length;

  useEffect(() => {
    const pluginWindow = window as DataTableWindow;
    const jq = pluginWindow.jQuery ?? pluginWindow.$;

    if (!jq) return;

    filterFormRef.current
      ?.querySelectorAll<HTMLSelectElement>("select.aldis-select2")
      .forEach((select) => {
        jq(select).trigger("change.select2");
      });
  }, [draftFilters]);

  function updateDraftFilter(field: keyof FindingFilters, value: string) {
    setDraftFilters((current) => ({ ...current, [field]: value }));
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!getFilterError(draftFilters) && hasFilterChanges) {
      setAppliedFilters({ ...draftFilters });
    }
  }

  function resetFilters() {
    setDraftFilters({ ...EMPTY_FILTERS });
    setAppliedFilters({ ...EMPTY_FILTERS });
    setResetCount((current) => current + 1);
  }

  return (
    <>
      <div className="app-page-title">
        <div className="page-title-wrapper">
          <div className="page-title-heading">
            <div className="page-title-icon">
              <i className="pe-7s-attention icon-gradient bg-malibu-beach" />
            </div>

            <div>
              Findings
              <div className="page-title-subheading"></div>
            </div>
          </div>
          <div className="page-title-actions"></div>
        </div>
      </div>

      <div className="row">
        <div className="col">
          <div id="accordion" className="accordion-wrapper mb-3">
            <div className="card">
              <div
                id="headingOne"
                className="card-header d-flex align-items-center"
              >
                <button
                  type="button"
                  className="text-left m-0 p-0 btn btn-link btn-block d-flex align-items-center justify-content-between"
                  aria-expanded={isFilterOpen}
                  aria-controls="filter_accordion"
                  onClick={() => setIsFilterOpen((prev) => !prev)}
                >
                  <span
                    className="d-flex align-items-center"
                    style={{ gap: 9 }}
                  >
                    <i
                      className="pe-7s-filter"
                      style={{ fontSize: 23, color: "#3f6ad8", lineHeight: 1 }}
                      aria-hidden="true"
                    />
                    <span className="card-title m-0 p-0">FILTERS</span>
                  </span>

                  <i
                    className={`lnr lnr-chevron-down aldis-accordion-chevron ${
                      isFilterOpen ? "is-open" : ""
                    }`}
                  />
                </button>
              </div>

              <div
                id="filter_accordion"
                aria-labelledby="headingOne"
                className={`collapse ${isFilterOpen ? "show" : ""}`}
              >
                <div className="card-body">
                  <form ref={filterFormRef} onSubmit={applyFilters} noValidate>
                    <div className="form-row align-items-end">
                      <div className="col-md-2 col-sm-6">
                        <div className="position-relative form-group mb-md-0">
                          <label htmlFor="start_period">
                            From Audit Period
                          </label>
                          <input
                            id="start_period"
                            name="from"
                            type="month"
                            className="form-control"
                            value={draftFilters.from}
                            onChange={(event) =>
                              updateDraftFilter(
                                "from",
                                event.currentTarget.value,
                              )
                            }
                            aria-invalid={Boolean(filterError)}
                            aria-describedby={
                              filterError ? "finding-filter-error" : undefined
                            }
                          />
                        </div>
                      </div>

                      <div className="col-md-2 col-sm-6">
                        <div className="position-relative form-group mb-md-0">
                          <label htmlFor="end_period">To Audit Period</label>
                          <input
                            id="end_period"
                            name="to"
                            type="month"
                            className="form-control"
                            value={draftFilters.to}
                            onChange={(event) =>
                              updateDraftFilter("to", event.currentTarget.value)
                            }
                            aria-invalid={Boolean(filterError)}
                            aria-describedby={
                              filterError ? "finding-filter-error" : undefined
                            }
                          />
                        </div>
                      </div>

                      <div className="col-md-2 col-sm-6">
                        <div className="position-relative form-group mb-md-0">
                          <label htmlFor="department">Department</label>
                          <select
                            id="department"
                            name="department"
                            className="form-control aldis-select2"
                            data-placeholder="All Departments"
                            data-allow-clear="true"
                            value={draftFilters.department}
                            onChange={(event) =>
                              updateDraftFilter(
                                "department",
                                event.currentTarget.value,
                              )
                            }
                          >
                            <option value="">All Departments</option>
                            {DEPARTMENTS.map((department) => (
                              <option key={department} value={department}>
                                {department}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="col-md-2 col-sm-6">
                        <div className="position-relative form-group mb-md-0">
                          <label htmlFor="iso_standard">ISO Standard</label>
                          <select
                            id="iso_standard"
                            name="standard"
                            className="form-control aldis-select2"
                            data-placeholder="All ISO Standards"
                            data-allow-clear="true"
                            value={draftFilters.standard}
                            onChange={(event) =>
                              updateDraftFilter(
                                "standard",
                                event.currentTarget.value,
                              )
                            }
                          >
                            <option value="">All ISO Standards</option>
                            {ISO_STANDARDS.map((standard) => (
                              <option key={standard} value={standard}>
                                {standard}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="col-md-2 col-sm-6">
                        <div className="position-relative form-group mb-md-0">
                          <label htmlFor="finding_category">
                            Finding Category
                          </label>
                          <select
                            id="finding_category"
                            name="category"
                            className="form-control aldis-select2"
                            data-placeholder="All Finding Categories"
                            data-allow-clear="true"
                            value={draftFilters.category}
                            onChange={(event) =>
                              updateDraftFilter(
                                "category",
                                event.currentTarget.value,
                              )
                            }
                          >
                            <option value="">All Finding Categories</option>
                            {FINDING_CATEGORIES.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="col-md-2 col-sm-6">
                        <div className="position-relative form-group mb-md-0">
                          <label htmlFor="finding_status">Status</label>
                          <select
                            id="finding_status"
                            name="status"
                            className="form-control aldis-select2"
                            data-placeholder="All Statuses"
                            data-allow-clear="true"
                            value={draftFilters.status}
                            onChange={(event) =>
                              updateDraftFilter(
                                "status",
                                event.currentTarget.value,
                              )
                            }
                          >
                            <option value="">All Statuses</option>
                            {FINDING_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {filterError && (
                      <div
                        id="finding-filter-error"
                        className="text-danger small mt-2"
                        role="alert"
                      >
                        {filterError}
                      </div>
                    )}

                    <div
                      className="d-flex flex-wrap align-items-center justify-content-between mt-3"
                      style={{ gap: 12 }}
                    >
                      <small
                        className={
                          hasFilterChanges ? "text-warning" : "text-muted"
                        }
                        role="status"
                      >
                        {hasFilterChanges
                          ? "Unapplied changes. Click Apply Filter to update the KPI cards and table."
                          : "Filters apply to all KPI cards and the table."}
                      </small>
                      <div className="d-flex flex-wrap" style={{ gap: 8 }}>
                        <button
                          type="submit"
                          className="btn-hover-shine btn btn-shadow btn-primary"
                          disabled={Boolean(filterError) || !hasFilterChanges}
                        >
                          Apply Filter
                        </button>
                        <button
                          type="button"
                          className="btn-hover-shine btn btn-shadow btn-secondary"
                          onClick={resetFilters}
                        >
                          <span className="btn-icon-wrapper pr-2 opacity-7">
                            <i className="lnr-undo" aria-hidden="true" />
                          </span>
                          Reset Filter
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <FindingKpiCards
            total={totalFinding}
            required={improvementRequired}
            review={improvementReview}
            approved={approved}
          />
        </div>
      </div>

      <div className="row">
        <div className="col">
          <div className="main-card card">
            <div className="card-body">
              <FindingTable
                key={`${appliedFilterKey}:${resetCount}`}
                findings={filteredFindings}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
