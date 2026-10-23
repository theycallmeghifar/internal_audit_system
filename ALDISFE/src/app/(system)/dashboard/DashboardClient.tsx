"use client";

import { useEffect, useId, useMemo, useState, type FormEvent } from "react";

export type AuditStatus = "NOT_YET_STARTED" | "OPEN" | "CLOSED";

export type DashboardAudit = {
  id: string;
  title: string;
  department: string;
  isoCategory?: string;
  isoStandard?: string;
  auditDate: string;
  status: AuditStatus;
  auditors: string[];
  auditees: { id: string; name: string }[];
};

type Period = { from: string; to: string };
type DashboardFilters = Period & {
  department: string;
  isoCategory: string;
  isoStandard: string;
};
type IsoReference = { category: string; standard: string };
type FilterOptions = {
  departments: string[];
  isoCategories: string[];
  isoReferences: IsoReference[];
};
type StatusCounts = Record<AuditStatus, number>;
type ChartRow = {
  key: string;
  label: string;
  total: number;
  counts: StatusCounts;
};
type DashboardClientProps = { audits?: DashboardAudit[] };

const STATUSES: AuditStatus[] = ["NOT_YET_STARTED", "OPEN", "CLOSED"];
const STATUS_CONFIG: Record<
  AuditStatus,
  { label: string; color: string; tint: string; text: string }
> = {
  NOT_YET_STARTED: {
    label: "Not Yet Started",
    color: "#e3a63b",
    tint: "#fff5df",
    text: "#805600",
  },
  OPEN: { label: "Open", color: "#3f6ad8", tint: "#edf2ff", text: "#3155b5" },
  CLOSED: {
    label: "Closed",
    color: "#208366",
    tint: "#e9f6f0",
    text: "#187357",
  },
};
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const NUMBER_FORMAT = new Intl.NumberFormat("en-GB");
const PAGE_SIZE = 8;
const DEMO_AUDITORS = ["Jim", "Stanley", "Pam", "Dwight", "Angela", "Michael"];
const DEMO_ISO_REFERENCES: IsoReference[] = [
  { category: "Quality Management", standard: "ISO 9001:2015" },
  { category: "Environmental Management", standard: "ISO 14001:2015" },
  { category: "Occupational Health & Safety", standard: "ISO 45001:2018" },
];
const DEMO_DEPARTMENTS = [
  {
    name: "PPIC",
    auditees: ["Oscar", "Kevin"],
    topics: ["Production Planning", "Inventory Control"],
  },
  {
    name: "Production",
    auditees: ["Andy", "Erin"],
    topics: ["Production Process", "Work Instruction Compliance"],
  },
  {
    name: "Quality Assurance",
    auditees: ["Phyllis", "Kelly"],
    topics: ["Quality Management", "Inspection Records"],
  },
  {
    name: "Warehouse",
    auditees: ["Darryl", "Roy"],
    topics: ["Material Storage", "Stock Traceability"],
  },
  {
    name: "Purchasing",
    auditees: ["Meredith", "Creed"],
    topics: ["Supplier Evaluation", "Purchasing Controls"],
  },
  {
    name: "Engineering",
    auditees: ["Gabe", "Ryan"],
    topics: ["Preventive Maintenance", "Equipment Calibration"],
  },
  {
    name: "HR & General Affairs",
    auditees: ["Toby", "Holly"],
    topics: ["Competency and Training", "Document Control"],
  },
];

function getJakartaDate() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

function defaultPeriod(today: string): Period {
  return { from: `${today.slice(0, 4)}-01`, to: today.slice(0, 7) };
}

function defaultFilters(today: string): DashboardFilters {
  return {
    ...defaultPeriod(today),
    department: "",
    isoCategory: "",
    isoStandard: "",
  };
}

function filterKey(filters: DashboardFilters) {
  return JSON.stringify([
    filters.from,
    filters.to,
    filters.department,
    filters.isoCategory,
    filters.isoStandard,
  ]);
}

function monthIndex(value: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null;
  return Number(value.slice(0, 4)) * 12 + Number(value.slice(5, 7)) - 1;
}

function periodError(period: Period, bounds?: Period) {
  const from = monthIndex(period.from);
  const to = monthIndex(period.to);
  if (from === null || to === null)
    return "Select a valid start and end month.";
  if (from > to)
    return "The end month must be the same as or after the start month.";
  if (bounds && (period.from < bounds.from || period.to > bounds.to))
    return `Select a period between ${formatMonth(bounds.from)} and ${formatMonth(bounds.to)}.`;
  return "";
}

function formatMonth(value: string, long = false) {
  const month = MONTHS[Number(value.slice(5, 7)) - 1];
  return `${long ? month : month.slice(0, 3)} ${value.slice(0, 4)}`;
}

function formatDate(value: string) {
  return `${value.slice(8, 10)} ${formatMonth(value.slice(0, 7))}`;
}

function formatPeriod(period: Period) {
  return period.from === period.to
    ? formatMonth(period.from)
    : `${formatMonth(period.from)} – ${formatMonth(period.to)}`;
}

function emptyCounts(): StatusCounts {
  return { NOT_YET_STARTED: 0, OPEN: 0, CLOSED: 0 };
}

function createDemoAudits(today: string): DashboardAudit[] {
  const currentYear = Number(today.slice(0, 4));
  const currentMonthIndex = monthIndex(today.slice(0, 7))!;
  const audits: DashboardAudit[] = [];

  for (let year = currentYear - 1; year <= currentYear; year += 1) {
    let sequence = 0;
    for (let month = 1; month <= 12; month += 1) {
      const count = 4 + ((year + month * 7) % 5);
      for (let index = 0; index < count; index += 1) {
        sequence += 1;
        const department =
          DEMO_DEPARTMENTS[(month + index + year) % DEMO_DEPARTMENTS.length];
        const iso =
          DEMO_ISO_REFERENCES[
            (month + index * 2 + year) % DEMO_ISO_REFERENCES.length
          ];
        const auditDate = `${year}-${String(month).padStart(2, "0")}-${String(4 + index * 3).padStart(2, "0")}`;
        const age = currentMonthIndex - (year * 12 + month - 1);
        const seed = (year + month * 7 + index * 3) % 13;
        let status: AuditStatus;

        if (auditDate > today) status = "NOT_YET_STARTED";
        else if (age >= 4)
          status =
            seed < 2 ? "OPEN" : seed === 2 ? "NOT_YET_STARTED" : "CLOSED";
        else if (age >= 1)
          status = seed < 7 ? "CLOSED" : seed < 12 ? "OPEN" : "NOT_YET_STARTED";
        else
          status = seed < 3 ? "CLOSED" : seed < 11 ? "OPEN" : "NOT_YET_STARTED";

        const auditorIndex = (month + index * 2) % DEMO_AUDITORS.length;
        const auditors = [DEMO_AUDITORS[auditorIndex]];
        if (index % 3 !== 0) {
          auditors.push(
            DEMO_AUDITORS[
              (auditorIndex + 1 + (month % 3)) % DEMO_AUDITORS.length
            ],
          );
        }

        audits.push({
          id: `AUD-${year}-${String(sequence).padStart(3, "0")}`,
          title: `Internal Audit — ${department.topics[(month + index) % department.topics.length]}`,
          department: department.name,
          isoCategory: iso.category,
          isoStandard: iso.standard,
          auditDate,
          status,
          auditors,
          auditees: department.auditees.map((name) => ({
            id: name.toLowerCase(),
            name,
          })),
        });
      }
    }
  }

  return audits;
}

function getFilterOptions(audits: DashboardAudit[]): FilterOptions {
  const departments = new Set<string>();
  const categories = new Set<string>();
  const references = new Map<string, IsoReference>();

  for (const audit of audits) {
    const department = audit.department.trim();
    const category = audit.isoCategory?.trim() ?? "";
    const standard = audit.isoStandard?.trim() ?? "";
    if (department) departments.add(department);
    if (category) categories.add(category);
    if (category || standard) {
      references.set(JSON.stringify([category, standard]), {
        category,
        standard,
      });
    }
  }

  const sort = (values: Set<string>) =>
    [...values].sort((a, b) => a.localeCompare(b));
  return {
    departments: sort(departments),
    isoCategories: sort(categories),
    isoReferences: [...references.values()],
  };
}

function getIsoStandards(references: IsoReference[], category: string) {
  return [
    ...new Set(
      references
        .filter((reference) => !category || reference.category === category)
        .map((reference) => reference.standard)
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

function filterAudits(audits: DashboardAudit[], filters: DashboardFilters) {
  if (periodError(filters)) return [];
  return audits.filter((audit) => {
    const month = audit.auditDate.slice(0, 7);
    return (
      month >= filters.from &&
      month <= filters.to &&
      (!filters.department || audit.department.trim() === filters.department) &&
      (!filters.isoCategory ||
        audit.isoCategory?.trim() === filters.isoCategory) &&
      (!filters.isoStandard ||
        audit.isoStandard?.trim() === filters.isoStandard)
    );
  });
}

function groupAudits(
  audits: DashboardAudit[],
  getLabels: (audit: DashboardAudit) => string[],
) {
  const groups = new Map<string, ChartRow>();
  for (const audit of audits) {
    for (const label of new Set(getLabels(audit))) {
      const group = groups.get(label) ?? {
        key: label,
        label,
        total: 0,
        counts: emptyCounts(),
      };
      group.total += 1;
      group.counts[audit.status] += 1;
      groups.set(label, group);
    }
  }
  return [...groups.values()].sort(
    (a, b) => b.total - a.total || a.label.localeCompare(b.label),
  );
}

function summarizeAudits(audits: DashboardAudit[], filters: DashboardFilters) {
  const filtered = filterAudits(audits, filters);
  const counts = emptyCounts();
  const months = new Map<string, ChartRow>();
  const from = monthIndex(filters.from);
  const to = monthIndex(filters.to);

  if (from !== null && to !== null && from <= to) {
    for (let index = from; index <= to; index += 1) {
      const key = `${String(Math.floor(index / 12)).padStart(4, "0")}-${String((index % 12) + 1).padStart(2, "0")}`;
      months.set(key, {
        key,
        label: formatMonth(key),
        total: 0,
        counts: emptyCounts(),
      });
    }
  }

  for (const audit of filtered) {
    counts[audit.status] += 1;
    const month = months.get(audit.auditDate.slice(0, 7));
    if (month) {
      month.total += 1;
      month.counts[audit.status] += 1;
    }
  }

  const unfinished = filtered
    .filter((audit) => audit.status !== "CLOSED")
    .sort(
      (a, b) =>
        a.auditDate.localeCompare(b.auditDate) || a.id.localeCompare(b.id),
    );

  return {
    total: filtered.length,
    counts,
    closedRate: filtered.length
      ? (counts.CLOSED / filtered.length) * 100
      : null,
    months: [...months.values()],
    departments: groupAudits(filtered, (audit) => [audit.department]),
    auditors: groupAudits(filtered, (audit) => audit.auditors),
    unfinished,
  };
}

function describeRow(row: ChartRow) {
  return `${row.label}: ${row.total} total. ${STATUSES.map((status) => `${STATUS_CONFIG[status].label}: ${row.counts[status]}`).join(". ")}.`;
}

function StatusBadge({ status }: { status: AuditStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className="ad-status"
      style={{ background: config.tint, color: config.text }}
    >
      <span className="ad-dot" style={{ background: config.color }} />
      {config.label}
    </span>
  );
}

function StatusLegend() {
  return (
    <div className="ad-legend" aria-label="Audit status legend">
      {STATUSES.map((status) => (
        <span key={status}>
          <span
            className="ad-dot"
            style={{ background: STATUS_CONFIG[status].color }}
          />
          {STATUS_CONFIG[status].label}
        </span>
      ))}
    </div>
  );
}

function MonthYearField({
  label,
  value,
  bounds,
  onChange,
  invalid,
  errorId,
}: {
  label: string;
  value: string;
  bounds: Period;
  onChange: (value: string) => void;
  invalid: boolean;
  errorId: string;
}) {
  const id = useId();
  return (
    <div className="position-relative form-group mb-0">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="month"
        className="form-control"
        style={{ minWidth: 0, height: 38 }}
        value={value}
        min={bounds.from}
        max={bounds.to}
        required
        placeholder="YYYY-MM"
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  allLabel,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  allLabel: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="position-relative form-group mb-0">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        className="form-control"
        style={{ height: 38 }}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function DashboardFilter({
  filters,
  today,
  bounds,
  options,
  onApply,
}: {
  filters: DashboardFilters;
  today: string;
  bounds: Period;
  options: FilterOptions;
  onApply: (filters: DashboardFilters) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(filters);
  const id = useId();
  const error = periodError(draft, bounds);
  const changed = filterKey(draft) !== filterKey(filters);
  const standards = getIsoStandards(options.isoReferences, draft.isoCategory);

  function applyPreset(next: Period) {
    const updated = { ...draft, ...next };
    setDraft(updated);
    onApply(updated);
  }

  function resetFilters() {
    const updated = defaultFilters(today);
    setDraft(updated);
    onApply(updated);
  }

  function changeCategory(isoCategory: string) {
    setDraft((current) => ({
      ...current,
      isoCategory,
      isoStandard: getIsoStandards(options.isoReferences, isoCategory).includes(
        current.isoStandard,
      )
        ? current.isoStandard
        : "",
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!error) onApply({ ...draft });
  }

  return (
    <>
      <div className="app-page-title">
        <div className="page-title-wrapper">
          <div className="page-title-heading">
            <div className="page-title-icon">
              <i
                className="pe-7s-home icon-gradient bg-malibu-beach"
                aria-hidden="true"
              />
            </div>
            <div>
              Dashboard
              <div className="page-title-subheading"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card ad-filter-card mb-3">
        <h2 className="ad-filter-heading">
          <button
            type="button"
            className="ad-filter-toggle"
            aria-expanded={expanded}
            aria-controls={`${id}-body`}
            onClick={() => setExpanded((value) => !value)}
          >
            <span className="ad-filter-title">
              <i className="pe-7s-filter" aria-hidden="true" /> DASHBOARD
              FILTERS
            </span>
            <span className="ad-filter-right">
              <span>{formatPeriod(filters)}</span>
              <i
                className={expanded ? "pe-7s-angle-up" : "pe-7s-angle-down"}
                aria-hidden="true"
              />
            </span>
          </button>
        </h2>
        <div
          id={`${id}-body`}
          hidden={!expanded}
          className="card-body ad-filter-body"
        >
          <form onSubmit={handleSubmit}>
            <div className="form-row align-items-end">
              <div className="col-12 col-sm-6 col-xl-2 mb-3">
                <MonthYearField
                  label="From Month–Year"
                  value={draft.from}
                  bounds={bounds}
                  invalid={Boolean(error)}
                  errorId={`${id}-error`}
                  onChange={(from) => setDraft((value) => ({ ...value, from }))}
                />
              </div>
              <div className="col-12 col-sm-6 col-xl-2 mb-3">
                <MonthYearField
                  label="To Month–Year"
                  value={draft.to}
                  bounds={bounds}
                  invalid={Boolean(error)}
                  errorId={`${id}-error`}
                  onChange={(to) => setDraft((value) => ({ ...value, to }))}
                />
              </div>
              <div className="col-12 col-md-4 col-xl-2 mb-3">
                <FilterSelect
                  label="Department"
                  value={draft.department}
                  options={options.departments}
                  allLabel="All Departments"
                  onChange={(department) =>
                    setDraft((value) => ({ ...value, department }))
                  }
                />
              </div>
              <div className="col-12 col-md-4 col-xl-3 mb-3">
                <FilterSelect
                  label="ISO Category"
                  value={draft.isoCategory}
                  options={options.isoCategories}
                  allLabel="All ISO Categories"
                  onChange={changeCategory}
                />
              </div>
              <div className="col-12 col-md-4 col-xl-3 mb-3">
                <FilterSelect
                  label="ISO Standard"
                  value={draft.isoStandard}
                  options={standards}
                  allLabel="All ISO Standards"
                  onChange={(isoStandard) =>
                    setDraft((value) => ({ ...value, isoStandard }))
                  }
                />
              </div>
            </div>
            <div className="ad-filter-actions justify-content-end">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={Boolean(error) || !changed}
              >
                Apply Filter
              </button>
              <button
                type="button"
                className="btn btn-light"
                onClick={resetFilters}
              >
                Reset
              </button>
            </div>
            {error && (
              <div
                id={`${id}-error`}
                className="text-danger small mt-2"
                role="alert"
              >
                {error}
              </div>
            )}
            <div className="ad-filter-bottom">
              <div className="ad-presets" aria-label="Quick periods">
                <span>Quick select:</span>
                <button
                  type="button"
                  onClick={() =>
                    applyPreset({
                      from: today.slice(0, 7),
                      to: today.slice(0, 7),
                    })
                  }
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(defaultPeriod(today))}
                >
                  Year to Date
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyPreset({
                      from: `${Number(today.slice(0, 4)) - 1}-01`,
                      to: `${Number(today.slice(0, 4)) - 1}-12`,
                    })
                  }
                >
                  Previous Year
                </button>
              </div>
              <span
                className={changed ? "ad-pending-filter" : "ad-muted"}
                role="status"
              >
                {changed
                  ? "Unapplied changes"
                  : "Applies to all cards, charts, and the table"}
              </span>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function SummaryCards({
  summary,
}: {
  summary: ReturnType<typeof summarizeAudits>;
}) {
  const cards = [
    {
      label: "Total Audit",
      value: NUMBER_FORMAT.format(summary.total),
      detail: "Audits matching the selected filters",
      color: "#6257bc",
      tint: "#f0edfb",
      icon: "pe-7s-note2",
    },
    {
      label: "Not Yet Started",
      value: NUMBER_FORMAT.format(summary.counts.NOT_YET_STARTED),
      detail: "Scheduled or awaiting execution",
      color: STATUS_CONFIG.NOT_YET_STARTED.text,
      tint: STATUS_CONFIG.NOT_YET_STARTED.tint,
      icon: "pe-7s-clock",
    },
    {
      label: "Open",
      value: NUMBER_FORMAT.format(summary.counts.OPEN),
      detail: "Audits still in progress",
      color: STATUS_CONFIG.OPEN.text,
      tint: STATUS_CONFIG.OPEN.tint,
      icon: "pe-7s-refresh-2",
    },
    {
      label: "Closed",
      value: NUMBER_FORMAT.format(summary.counts.CLOSED),
      detail: "Audits completed and closed",
      color: STATUS_CONFIG.CLOSED.text,
      tint: STATUS_CONFIG.CLOSED.tint,
      icon: "pe-7s-check",
    },
    {
      label: "Closed Rate",
      value:
        summary.closedRate === null ? "—" : `${summary.closedRate.toFixed(1)}%`,
      detail: `${NUMBER_FORMAT.format(summary.counts.CLOSED)} closed / ${NUMBER_FORMAT.format(summary.total)} total audits`,
      color: "#187357",
      tint: "#e9f6f0",
      icon: "pe-7s-graph2",
    },
  ];

  return (
    <div className="ad-kpi-grid mb-3" aria-label="Audit summary">
      {cards.map((card) => (
        <div className="card ad-kpi" key={card.label}>
          <div className="ad-kpi-top">
            <h2>{card.label}</h2>
            <span
              className="ad-kpi-icon"
              style={{ color: card.color, background: card.tint }}
            >
              <i className={card.icon} aria-hidden="true" />
            </span>
          </div>
          <div className="ad-kpi-value" style={{ color: card.color }}>
            {card.value}
          </div>
          <p>{card.detail}</p>
        </div>
      ))}
    </div>
  );
}

function MonthlyChart({ rows, period }: { rows: ChartRow[]; period: Period }) {
  const [selected, setSelected] = useState(rows[rows.length - 1]?.key ?? "");
  const active =
    rows.find((row) => row.key === selected) ?? rows[rows.length - 1];
  const highest = Math.max(1, ...rows.map((row) => row.total));
  const step = Math.max(1, Math.ceil(highest / 4));
  const ceiling = step * 4;
  const ticks = [ceiling, step * 3, step * 2, step, 0];
  const plotHeight = 210;
  const minimumLabelHeight = 18;
  const fitsInside = (value: number) =>
    (value / ceiling) * plotHeight >= minimumLabelHeight;
  const hasSmallSegments = rows.some((row) =>
    STATUSES.some(
      (status) => row.counts[status] > 0 && !fitsInside(row.counts[status]),
    ),
  );

  return (
    <section
      className="card ad-chart-card mb-3"
      aria-label="Monthly audit activity"
    >
      <div className="ad-card-heading">
        <div>
          <h2>Monthly Audit Activity</h2>
          <p>Audit counts by audit month and latest status</p>
        </div>
        <span className="ad-period-label">{formatPeriod(period)}</span>
      </div>
      <div className="card-body pt-0">
        <StatusLegend />
        <div className="ad-axis-caption">Number of audits</div>
        <div className="ad-month-chart">
          <div
            className="ad-y-axis"
            style={{ height: plotHeight }}
            aria-hidden="true"
          >
            {ticks.map((tick, index) => (
              <span key={tick} style={{ top: `${index * 25}%` }}>
                {tick}
              </span>
            ))}
          </div>
          <div
            className="ad-month-scroll"
            tabIndex={0}
            aria-label="Scrollable monthly audit chart"
          >
            <div
              className="ad-month-canvas"
              style={{ minWidth: Math.max(380, rows.length * 62) }}
            >
              <div
                className="ad-chart-grid"
                style={{ height: plotHeight }}
                aria-hidden="true"
              >
                {ticks.map((tick, index) => (
                  <span key={tick} style={{ top: `${index * 25}%` }} />
                ))}
              </div>
              <div
                className="ad-month-columns"
                style={{
                  gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))`,
                }}
              >
                {rows.map((row) => (
                  <button
                    type="button"
                    key={row.key}
                    className={`ad-month-column${active?.key === row.key ? " is-active" : ""}`}
                    aria-label={describeRow(row)}
                    aria-pressed={active?.key === row.key}
                    onClick={() => setSelected(row.key)}
                  >
                    <span
                      className="ad-column-plot"
                      style={{ height: plotHeight }}
                    >
                      <span
                        className="ad-column-total"
                        style={{ bottom: `${(row.total / ceiling) * 100}%` }}
                      >
                        {row.total}
                      </span>
                      <span
                        className="ad-column-stack"
                        style={{ height: `${(row.total / ceiling) * 100}%` }}
                        aria-hidden="true"
                      >
                        {STATUSES.map(
                          (status) =>
                            row.counts[status] > 0 && (
                              <span
                                key={status}
                                className="ad-column-segment"
                                style={{
                                  height: `${(row.counts[status] / row.total) * 100}%`,
                                  background: STATUS_CONFIG[status].color,
                                  color:
                                    status === "NOT_YET_STARTED"
                                      ? "#553900"
                                      : "#ffffff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  lineHeight: 1,
                                  fontVariantNumeric: "tabular-nums",
                                }}
                              >
                                {fitsInside(row.counts[status]) && (
                                  <span className="ad-column-segment-value">
                                    {row.counts[status]}
                                  </span>
                                )}
                              </span>
                            ),
                        )}
                      </span>
                    </span>
                    <span className="ad-column-label">
                      {MONTHS[Number(row.key.slice(5, 7)) - 1].slice(0, 3)}
                      <small>{row.key.slice(0, 4)}</small>
                    </span>
                    {hasSmallSegments && (
                      <span
                        className="ad-column-small-values"
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "center",
                          flexWrap: "wrap",
                          gap: 3,
                          minHeight: 22,
                          paddingTop: 3,
                        }}
                        aria-hidden="true"
                      >
                        {STATUSES.map(
                          (status) =>
                            row.counts[status] > 0 &&
                            !fitsInside(row.counts[status]) && (
                              <span
                                key={status}
                                title={`${STATUS_CONFIG[status].label}: ${row.counts[status]}`}
                                style={{
                                  background: STATUS_CONFIG[status].color,
                                  color:
                                    status === "NOT_YET_STARTED"
                                      ? "#553900"
                                      : "#ffffff",
                                  borderRadius: 3,
                                  padding: "2px 4px",
                                  fontSize: 10,
                                  fontWeight: 600,
                                  lineHeight: 1.2,
                                  fontVariantNumeric: "tabular-nums",
                                }}
                              >
                                {row.counts[status]}
                              </span>
                            ),
                        )}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {active && (
          <div
            className="ad-chart-details"
            aria-live="polite"
            aria-atomic="true"
          >
            <strong>{active.label}</strong>
            <span>{active.total} audits</span>
            {STATUSES.map((status) => (
              <span key={status}>
                <span
                  className="ad-dot"
                  style={{ background: STATUS_CONFIG[status].color }}
                />
                {STATUS_CONFIG[status].label}: <b>{active.counts[status]}</b>
              </span>
            ))}
          </div>
        )}
        <p className="ad-chart-note">
          Numbers inside each segment show the status count. Numbers above the
          bars show monthly totals. Small segments have matching colour labels
          below the month. Select a month to view all counts, including zero.
        </p>
      </div>
    </section>
  );
}

function HorizontalChart({
  title,
  subtitle,
  rows,
  period,
  unit,
  note,
}: {
  title: string;
  subtitle: string;
  rows: ChartRow[];
  period: Period;
  unit: string;
  note: string;
}) {
  const highest = Math.max(1, ...rows.map((row) => row.total));
  const ceiling = Math.max(1, Math.ceil(highest / 4)) * 4;
  return (
    <section
      className="card ad-chart-card ad-horizontal-card mb-3"
      aria-label={title}
    >
      <div className="ad-card-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <span className="ad-period-label">{formatPeriod(period)}</span>
      </div>
      <div className="card-body pt-0">
        <StatusLegend />
        {rows.length ? (
          <div className="ad-horizontal-rows">
            {rows.map((row) => (
              <div className="ad-horizontal-row" key={row.key}>
                <div className="ad-horizontal-label">
                  <span>{row.label}</span>
                  <strong>
                    {row.total}
                    <small> {unit}</small>
                  </strong>
                </div>
                <div
                  className="ad-horizontal-track"
                  role="img"
                  aria-label={describeRow(row)}
                  title={describeRow(row)}
                >
                  {STATUSES.map(
                    (status) =>
                      row.counts[status] > 0 && (
                        <span
                          key={status}
                          className="ad-horizontal-segment"
                          style={{
                            width: `${(row.counts[status] / ceiling) * 100}%`,
                            background: STATUS_CONFIG[status].color,
                            color:
                              status === "NOT_YET_STARTED"
                                ? "#553900"
                                : "#ffffff",
                          }}
                          aria-hidden="true"
                        >
                          {row.counts[status]}
                        </span>
                      ),
                  )}
                </div>
                <div className="sr-only">{describeRow(row)}</div>
              </div>
            ))}
            <div className="ad-horizontal-axis" aria-hidden="true">
              <span>0</span>
              <span>{ceiling / 2}</span>
              <span>
                {ceiling} {unit}
              </span>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No audit data"
            detail="Adjust the selected filters to see the distribution."
          />
        )}
        <p className="ad-chart-note">{note}</p>
      </div>
    </section>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="ad-empty">
      <span className="ad-empty-icon">
        <i className="pe-7s-note2" aria-hidden="true" />
      </span>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}

function UnfinishedAuditsTable({
  audits,
  period,
  total,
}: {
  audits: DashboardAudit[];
  period: Period;
  total: number;
}) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(audits.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = audits.slice(start, start + PAGE_SIZE);

  return (
    <section className="card mb-3" aria-label="Unfinished audits">
      <div className="ad-card-heading">
        <div>
          <h2>
            Unfinished Audits{" "}
            <span className="ad-count-badge">{audits.length}</span>
          </h2>
          <p>Not Yet Started and Open audits, ordered by oldest audit date</p>
        </div>
        <span className="ad-period-label">{formatPeriod(period)}</span>
      </div>
      {audits.length ? (
        <>
          <div className="table-responsive">
            <table className="table table-hover mb-0 ad-audit-table">
              <caption className="sr-only">
                Unfinished audits for {formatPeriod(period)}, oldest audit date
                first.
              </caption>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Audit</th>
                  <th scope="col">Department</th>
                  <th scope="col" aria-sort="ascending">
                    Audit Date ↑
                  </th>
                  <th scope="col">Auditor</th>
                  <th scope="col">Auditee</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((audit, index) => (
                  <tr key={audit.id}>
                    <td className="ad-muted">{start + index + 1}</td>
                    <td>
                      <span className="ad-audit-id">{audit.id}</span>
                      <span className="ad-audit-title">{audit.title}</span>
                    </td>
                    <td>{audit.department}</td>
                    <td className="text-nowrap">
                      {formatDate(audit.auditDate)}
                    </td>
                    <td>
                      {audit.auditors.length
                        ? [...new Set(audit.auditors)].map((name) => (
                            <span className="ad-person" key={name}>
                              {name}
                            </span>
                          ))
                        : "—"}
                    </td>
                    <td>
                      {audit.auditees.length
                        ? audit.auditees.map((person) => (
                            <span className="ad-person" key={person.id}>
                              {person.name}
                            </span>
                          ))
                        : "—"}
                    </td>
                    <td>
                      <StatusBadge status={audit.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ad-table-footer">
            <span>
              Showing {start + 1}–{Math.min(start + PAGE_SIZE, audits.length)}{" "}
              of {audits.length} audits
            </span>
            <nav
              className="ad-pagination"
              aria-label="Unfinished audits pagination"
            >
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </button>
              <span aria-live="polite">
                {currentPage} / {pages}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={currentPage === pages}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </button>
            </nav>
          </div>
        </>
      ) : (
        <EmptyState
          title={
            total
              ? "All matching audits are closed"
              : "No audits match the selected filters"
          }
          detail={
            total
              ? "There are no unfinished audits to display."
              : "Adjust the period, department, ISO category, or ISO standard."
          }
        />
      )}
    </section>
  );
}

function DashboardContent({
  today,
  audits,
}: DashboardClientProps & { today: string }) {
  const records = useMemo(
    () => audits ?? createDemoAudits(today),
    [audits, today],
  );
  const [filters, setFilters] = useState<DashboardFilters>(() =>
    defaultFilters(today),
  );
  const summary = useMemo(
    () => summarizeAudits(records, filters),
    [records, filters],
  );
  const options = useMemo(() => getFilterOptions(records), [records]);
  const bounds = useMemo<Period>(() => {
    const currentYear = Number(today.slice(0, 4));
    const values = records
      .map((audit) => Number(audit.auditDate.slice(0, 4)))
      .filter(Number.isInteger);
    const first = Math.min(currentYear - 2, ...values);
    const last = Math.max(currentYear + 1, ...values);
    return { from: `${first}-01`, to: `${last}-12` };
  }, [records, today]);
  const appliedFilterKey = filterKey(filters);

  return (
    <div className="aldis-dashboard">
      <DashboardFilter
        filters={filters}
        today={today}
        bounds={bounds}
        options={options}
        onApply={setFilters}
      />
      <div className="ad-overview-heading">
        <div>
          <h2>Audit Overview</h2>
          <p>Based on audit date · Latest audit status</p>
        </div>
        <div className="ad-overview-meta">
          <span className="ad-period-label" role="status">
            {formatPeriod(filters)}
          </span>
        </div>
      </div>
      {(filters.department || filters.isoCategory || filters.isoStandard) && (
        <div
          className="d-flex flex-wrap mb-2"
          aria-label="Applied dashboard filters"
        >
          {[
            { label: "Department", value: filters.department },
            { label: "ISO Category", value: filters.isoCategory },
            { label: "ISO Standard", value: filters.isoStandard },
          ]
            .filter((filter) => filter.value)
            .map((filter) => (
              <span
                key={filter.label}
                className="ad-period-label mr-2 mb-2"
                style={{ whiteSpace: "normal" }}
              >
                {filter.label}: {filter.value}
              </span>
            ))}
        </div>
      )}
      {summary.total === 0 && (
        <div className="alert alert-light ad-no-data" role="status">
          No audits match the selected filters. All cards and charts below
          reflect the same empty result.
        </div>
      )}
      <SummaryCards summary={summary} />
      <div className="row">
        <div className="col-12">
          <MonthlyChart
            rows={summary.months}
            period={filters}
            key={appliedFilterKey}
          />
        </div>
      </div>
      <div className="row">
        <div className="col-xl-6 d-flex">
          <HorizontalChart
            title="Audits by Department"
            subtitle="Audit volume and status across departments"
            rows={summary.departments}
            period={filters}
            unit="audits"
            note="Each audit is counted once in its assigned department."
          />
        </div>
        <div className="col-xl-6 d-flex">
          <HorizontalChart
            title="Auditor Assignments"
            subtitle="Assigned audits by auditor and latest audit status"
            rows={summary.auditors}
            period={filters}
            unit="assignments"
            note="An audit with two auditors counts once for each auditor, so assignments may exceed the total audit count."
          />
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <UnfinishedAuditsTable
            audits={summary.unfinished}
            total={summary.total}
            period={filters}
            key={appliedFilterKey}
          />
        </div>
      </div>
      <p className="ad-dashboard-note">
        The selected period includes both the start and end months. Closed rate
        = Closed audits ÷ Total audits × 100%.
      </p>
      {audits === undefined && (
        <p className="ad-dashboard-note">
          Sample audits cover January {Number(today.slice(0, 4)) - 1}–December{" "}
          {today.slice(0, 4)}. Future scheduled audits are Not Yet Started.
        </p>
      )}
    </div>
  );
}

export default function DashboardClient({ audits }: DashboardClientProps = {}) {
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(getJakartaDate());
  }, []);

  if (!today) {
    return (
      <div className="card mb-3">
        <div className="card-body text-muted" role="status">
          Loading audit dashboard…
        </div>
      </div>
    );
  }

  return <DashboardContent today={today} audits={audits} />;
}
