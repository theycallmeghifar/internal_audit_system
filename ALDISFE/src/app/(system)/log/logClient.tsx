"use client";

import {
  memo,
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

type ActivityLog = {
  id: number;
  user: string;
  activity: string;
  occurredAt: string;
};

type LogFilters = {
  from: string;
  to: string;
};

const EMPTY_FILTERS: LogFilters = {
  from: "",
  to: "",
};

const ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 1,
    user: "muhammad.ghifari@lmc.co.id",
    activity: "login",
    occurredAt: "2026-08-31T21:34:00",
  },
];

const LOG_DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function formatLogDate(value: string) {
  return LOG_DATE_FORMAT.format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
}

function formatLogTime(value: string) {
  return value.slice(11, 16).replace(":", ".");
}

function filterKey(filters: LogFilters) {
  return JSON.stringify([filters.from, filters.to]);
}

function isValidDateTime(value: string) {
  if (!/^(?!0000)\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}:00Z`);

  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 16) === value
  );
}

function getFilterError(filters: LogFilters) {
  if (
    (filters.from && !isValidDateTime(filters.from)) ||
    (filters.to && !isValidDateTime(filters.to))
  ) {
    return "Please enter a valid date and time.";
  }

  if (filters.from && filters.to && filters.from > filters.to) {
    return "Start Date Time must not be later than End Date Time.";
  }

  return "";
}

function filterLogs(logs: ActivityLog[], filters: LogFilters) {
  return logs.filter((log) => {
    const dateTime = log.occurredAt.slice(0, 16);

    return (
      (!filters.from || dateTime >= filters.from) &&
      (!filters.to || dateTime <= filters.to)
    );
  });
}

const ActivityLogTable = memo(function ActivityLogTable({
  logs,
}: {
  logs: ActivityLog[];
}) {
  const tableRef = useRef<HTMLTableElement>(null);
  const dataTableRef = useRef<DataTableInstance | null>(null);

  useLayoutEffect(() => {
    if (logs.length === 0) {
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

      if (!table || !jq || !jq.fn?.dataTable?.isDataTable) {
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
  }, [logs]);

  return (
    <div className="activity-log-table-container">
      <table
        ref={tableRef}
        data-datatable={logs.length > 0 ? "true" : undefined}
        style={{ width: "100%" }}
        className="table table-hover table-striped table-bordered"
      >
        <thead>
          <tr>
            <th>No</th>
            <th>User</th>
            <th>Activity</th>
            <th>Date</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center text-muted py-4">
                No activity logs match the selected period. Adjust or reset the
                filters.
              </td>
            </tr>
          ) : (
            logs.map((log, index) => (
              <tr key={log.id}>
                <td>{index + 1}</td>
                <td>{log.user}</td>
                <td>{log.activity}</td>
                <td data-order={log.occurredAt.slice(0, 10)}>
                  {formatLogDate(log.occurredAt)}
                </td>
                <td data-order={log.occurredAt.slice(11, 19)}>
                  {formatLogTime(log.occurredAt)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
});

export default function LogClient() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const [draftFilters, setDraftFilters] = useState<LogFilters>({
    ...EMPTY_FILTERS,
  });
  const [appliedFilters, setAppliedFilters] = useState<LogFilters>({
    ...EMPTY_FILTERS,
  });

  const filteredLogs = useMemo(
    () => filterLogs(ACTIVITY_LOGS, appliedFilters),
    [appliedFilters],
  );
  const appliedFilterKey = filterKey(appliedFilters);
  const hasFilterChanges = filterKey(draftFilters) !== appliedFilterKey;
  const filterError = getFilterError(draftFilters);

  function updateDraftFilter(field: keyof LogFilters, value: string) {
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
              <i className="pe-7s-news-paper icon-gradient bg-malibu-beach" />
            </div>

            <div>
              Activity Log
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
                  onClick={() => setIsFilterOpen((previous) => !previous)}
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
                    <span className="card-title m-0 p-0">Date Time Filter</span>
                  </span>

                  <i
                    className={`lnr lnr-chevron-down aldis-accordion-chevron ${
                      isFilterOpen ? "is-open" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </div>

              <div
                id="filter_accordion"
                aria-labelledby="headingOne"
                className={`collapse ${isFilterOpen ? "show" : ""}`}
              >
                <div className="card-body">
                  <form onSubmit={applyFilters} noValidate>
                    <div className="form-row align-items-end">
                      <div className="col-md-3 col-sm-6">
                        <div className="position-relative form-group mb-md-0">
                          <label htmlFor="start_datetime">Start Date Time</label>
                          <input
                            id="start_datetime"
                            name="start_datetime"
                            type="datetime-local"
                            step={60}
                            className="form-control"
                            value={draftFilters.from}
                            onChange={(event) =>
                              updateDraftFilter("from", event.currentTarget.value)
                            }
                            aria-invalid={Boolean(filterError)}
                            aria-describedby={
                              filterError ? "log-filter-error" : undefined
                            }
                          />
                        </div>
                      </div>

                      <div className="col-md-3 col-sm-6">
                        <div className="position-relative form-group mb-md-0">
                          <label htmlFor="end_datetime">End Date Time</label>
                          <input
                            id="end_datetime"
                            name="end_datetime"
                            type="datetime-local"
                            step={60}
                            className="form-control"
                            value={draftFilters.to}
                            onChange={(event) =>
                              updateDraftFilter("to", event.currentTarget.value)
                            }
                            aria-invalid={Boolean(filterError)}
                            aria-describedby={
                              filterError ? "log-filter-error" : undefined
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {filterError && (
                      <div
                        id="log-filter-error"
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
                        className={hasFilterChanges ? "text-warning" : "text-muted"}
                        role="status"
                      >
                        {hasFilterChanges
                          ? "Unapplied changes. Click Apply Filter to update the table."
                          : "Filter by the date and time shown in the table. Leave a boundary blank for no limit."}
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
        <div className="col">
          <div className="main-card card">
            <div className="card-body">
              <ActivityLogTable
                key={`${appliedFilterKey}:${resetCount}`}
                logs={filteredLogs}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
