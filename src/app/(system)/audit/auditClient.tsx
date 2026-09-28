"use client";

import { useEffect, useRef, useState } from "react";

type AuditTab = "not-started" | "open" | "closed";

type DataTableInstance = {
  destroy: () => void;
  columns: {
    adjust: () => DataTableInstance;
  };
  responsive?: {
    recalc: () => void;
  };
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

function CardLoader() {
  return (
    <div className="aldis-card-loader">
      <div className="aldis-card-loader-content">
        <div className="page-loader-bars">
          <span className="page-loader-bar" />
          <span className="page-loader-bar" />
          <span className="page-loader-bar" />
        </div>
      </div>
    </div>
  );
}

function AuditFilter({ tab }: { tab: AuditTab }) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterId = `audit-filter-${tab}`;

  return (
    <div id={`${filterId}-accordion`} className="accordion-wrapper">
      <div className="card">
        <div
          id={`${filterId}-heading`}
          className="card-header d-flex align-items-center"
        >
          <button
            type="button"
            className="text-left m-0 p-0 btn btn-link btn-block d-flex align-items-center justify-content-between"
            aria-expanded={isFilterOpen}
            aria-controls={`${filterId}-content`}
            onClick={() => setIsFilterOpen((prev) => !prev)}
          >
            <h6 className="card-title m-0 p-0">Filter</h6>

            <i
              className={`lnr lnr-chevron-down aldis-accordion-chevron ${
                isFilterOpen ? "is-open" : ""
              }`}
            />
          </button>
        </div>

        <div
          id={`${filterId}-content`}
          aria-labelledby={`${filterId}-heading`}
          className={`collapse ${isFilterOpen ? "show" : ""}`}
        >
          <div className="card-body">
            <div className="form-row align-items-end">
              <div className="col-md-2 col-sm-6">
                <div className="position-relative form-group mb-md-0">
                  <label htmlFor={`${filterId}-start_period`}>
                    From Audit Period
                  </label>

                  <input
                    id={`${filterId}-start_period`}
                    name="start_period"
                    type="month"
                    className="form-control"
                  />
                </div>
              </div>

              <div className="col-md-2 col-sm-6">
                <div className="position-relative form-group mb-md-0">
                  <label htmlFor={`${filterId}-end_period`}>
                    To Audit Period
                  </label>

                  <input
                    id={`${filterId}-end_period`}
                    name="end_period"
                    type="month"
                    className="form-control"
                  />
                </div>
              </div>

              <div className="col-md-2 col-sm-6">
                <div className="position-relative form-group mb-md-0">
                  <label htmlFor={`${filterId}-department`}>Department</label>
                  <select
                    id={`${filterId}-department`}
                    className="form-control aldis-select2"
                    style={{ width: "100%" }}
                    data-placeholder="Select Department"
                  >
                    <option value=""></option>
                    <option value="Sales">Sales</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Production">Production</option>
                    <option value="PPIC">PPIC</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>
              </div>

              <div className="col-md-2 col-sm-6">
                <div className="position-relative form-group mb-md-0">
                  <label htmlFor={`${filterId}-iso_standard`}>
                    ISO Standard
                  </label>
                  <select
                    id={`${filterId}-iso_standard`}
                    className="form-control aldis-select2"
                    style={{ width: "100%" }}
                    data-placeholder="Select ISO Standard"
                  >
                    <option value=""></option>
                    <option value="ISO 9001:2015">ISO 9001:2015</option>
                  </select>
                </div>
              </div>

              <div className="col-md-2 col-sm-12">
                <div className="position-relative form-group mb-md-0">
                  <label className="d-block">&nbsp;</label>
                  <button
                    type="button"
                    className="btn-hover-shine btn btn-shadow btn-secondary"
                  >
                    <span className="btn-icon-wrapper pr-2 opacity-7">
                      <i className="lnr-undo" />
                    </span>
                    Reset Filter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuditClient() {
  const dataTableRef = useRef<DataTableInstance | null>(null);
  const [activeTab, setActiveTab] = useState<AuditTab>("not-started");
  const [isTableLoading, setIsTableLoading] = useState(true);

  function destroyCurrentDataTable() {
    if (dataTableRef.current) {
      dataTableRef.current.destroy();
      dataTableRef.current = null;
    }
  }

  function openTab(tab: AuditTab) {
    if (tab === activeTab) {
      return;
    }

    destroyCurrentDataTable();
    setIsTableLoading(true);
    setActiveTab(tab);
  }

  useEffect(() => {
    let retryCount = 0;
    let retryTimer: number | null = null;
    let isMounted = true;

    function adjustDataTable(dataTable: DataTableInstance) {
      window.setTimeout(() => {
        dataTable.columns.adjust();
        dataTable.responsive?.recalc();
      }, 150);
    }

    function initDataTable() {
      if (!isMounted) {
        return;
      }

      const dataTableWindow = window as DataTableWindow;
      const jq = dataTableWindow.jQuery ?? dataTableWindow.$;

      const table = document.querySelector<HTMLTableElement>(
        `#audit-table-${activeTab}`,
      );

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
        setIsTableLoading(false);
        return;
      }

      const dataTable = jq(table).DataTable({
        pageLength: 10,
        lengthMenu: [10, 25, 50, 100],
        autoWidth: false,
        responsive: true,
        destroy: true,
      });

      dataTableRef.current = dataTable;
      adjustDataTable(dataTable);

      window.setTimeout(() => {
        setIsTableLoading(false);
      }, 200);
    }

    function retry() {
      if (retryCount >= 50) {
        console.warn(`DataTables ${activeTab} gagal di-init.`);
        setIsTableLoading(false);
        return;
      }

      retryCount += 1;
      retryTimer = window.setTimeout(initDataTable, 100);
    }

    retryTimer = window.setTimeout(initDataTable, 0);

    return () => {
      isMounted = false;

      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [activeTab]);

  useEffect(() => {
    return () => {
      destroyCurrentDataTable();
    };
  }, []);

  return (
    <>
      <div className="app-page-title">
        <div className="page-title-wrapper">
          <div className="page-title-heading">
            <div className="page-title-icon">
              <i className="pe-7s-note2 icon-gradient bg-malibu-beach" />
            </div>

            <div>
              Audit
              <div className="page-title-subheading"></div>
            </div>
          </div>
          <div className="page-title-actions">
            <a
              type="button"
              className="mb-2 mr-2 btn-hover-shine btn btn-shadow btn-primary"
              href="/audit/create"
            >
              <span className="btn-icon-wrapper pr-2 opacity-7">
                <i className="ion-android-add fa-w-20"></i>
              </span>
              Create Audit
            </a>
          </div>
        </div>
      </div>

      <ul
        className="body-tabs body-tabs-layout tabs-animated body-tabs-animated nav"
        role="tablist"
        aria-label="Audit status"
      >
        <li className="nav-item">
          <a
            id="audit-tab-not-started"
            aria-controls="audit-panel-not-started"
            aria-selected={activeTab === "not-started"}
            href="#"
            role="tab"
            className={`nav-link ${
              activeTab === "not-started" ? "show active" : ""
            }`}
            onClick={(event) => {
              event.preventDefault();
              openTab("not-started");
            }}
          >
            <span>Not Yet Started</span>
          </a>
        </li>
        <li className="nav-item">
          <a
            id="audit-tab-open"
            aria-controls="audit-panel-open"
            aria-selected={activeTab === "open"}
            href="#"
            role="tab"
            className={`nav-link ${activeTab === "open" ? "show active" : ""}`}
            onClick={(event) => {
              event.preventDefault();
              openTab("open");
            }}
          >
            <span>Open</span>
          </a>
        </li>
        <li className="nav-item">
          <a
            id="audit-tab-closed"
            aria-controls="audit-panel-closed"
            aria-selected={activeTab === "closed"}
            href="#"
            role="tab"
            className={`nav-link ${activeTab === "closed" ? "show active" : ""}`}
            onClick={(event) => {
              event.preventDefault();
              openTab("closed");
            }}
          >
            <span>Closed</span>
          </a>
        </li>
      </ul>

      <div className="tab-content">
        <div
          id="audit-panel-not-started"
          className={`tab-pane tabs-animation fade ${activeTab === "not-started" ? "show active" : ""}`}
          role="tabpanel"
          aria-labelledby="audit-tab-not-started"
          hidden={activeTab !== "not-started"}
        >
          <div className="row mb-3">
            <div className="col-12">
              <AuditFilter tab="not-started" />
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="main-card card aldis-card-loading-wrapper">
                {activeTab === "not-started" && isTableLoading && (
                  <CardLoader />
                )}

                <div className="card-body">
                  {activeTab === "not-started" && (
                    <table
                      id="audit-table-not-started"
                      data-datatable="true"
                      style={{ width: "100%" }}
                      className="table table-hover table-striped table-bordered aldis-datatable"
                    >
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Audit Title</th>
                          <th>ISO Standard</th>
                          <th>Department</th>
                          <th>Auditor</th>
                          <th>Auditee</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th className="text-center">Status</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>1</td>
                          <td>Internal Audit TSUP 2026</td>
                          <td>ISO 14001:2019</td>
                          <td>Plant Technical Support</td>
                          <td>Jim</td>
                          <td>Dwight</td>
                          <td>1 September 2026</td>
                          <td>09.00</td>
                          <td className="text-center">
                            <div className="mb-2 mr-2 badge badge-pill badge-secondary">
                              Not Yet Started
                            </div>
                          </td>
                          <td className="text-center">
                            <a
                              type="button"
                              className="btn-hover-shine btn btn-shadow btn-success"
                              href="/audit/fill"
                            >
                              Start Audit
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          id="audit-panel-open"
          className={`tab-pane tabs-animation fade ${activeTab === "open" ? "show active" : ""}`}
          role="tabpanel"
          aria-labelledby="audit-tab-open"
          hidden={activeTab !== "open"}
        >
          <div className="row mb-3">
            <div className="col-12">
              <AuditFilter tab="open" />
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="main-card card aldis-card-loading-wrapper">
                {activeTab === "open" && isTableLoading && <CardLoader />}

                <div className="card-body">
                  {activeTab === "open" && (
                    <table
                      id="audit-table-open"
                      data-datatable="true"
                      style={{ width: "100%" }}
                      className="table table-hover table-striped table-bordered aldis-datatable"
                    >
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Audit Title</th>
                          <th>ISO Standard</th>
                          <th>Department</th>
                          <th>Auditor</th>
                          <th>Auditee</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th className="text-center">Status</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>1</td>
                          <td>Internal Audit Sales 2026</td>
                          <td>ISO 14001:2019</td>
                          <td>Sales</td>
                          <td>Andy</td>
                          <td>Toby</td>
                          <td>27 September 2026</td>
                          <td>14.00</td>
                          <td className="text-center">
                            <div className="mb-2 mr-2 badge badge-pill badge-info">
                              Improvement Review
                            </div>
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn-hover-shine btn btn-shadow btn-info"
                            >
                              Review Improvement
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td>2</td>
                          <td>Internal Audit Production 2026</td>
                          <td>ISO 14001:2019</td>
                          <td>Production</td>
                          <td>Kelly</td>
                          <td>Erin</td>
                          <td>28 September 2026</td>
                          <td>14.00</td>
                          <td className="text-center">
                            <div className="mb-2 mr-2 badge badge-pill badge-warning">
                              Improvement Required
                            </div>
                          </td>
                          <td className="text-center">
                            <a
                              type="button"
                              className="btn-hover-shine btn btn-shadow btn-warning"
                              href="/audit/improvement/fill"
                            >
                              Fill Improvement
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          id="audit-panel-closed"
          className={`tab-pane tabs-animation fade ${activeTab === "closed" ? "show active" : ""}`}
          role="tabpanel"
          aria-labelledby="audit-tab-closed"
          hidden={activeTab !== "closed"}
        >
          <div className="row mb-3">
            <div className="col-12">
              <AuditFilter tab="closed" />
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="main-card card aldis-card-loading-wrapper">
                {activeTab === "closed" && isTableLoading && <CardLoader />}

                <div className="card-body">
                  {activeTab === "closed" && (
                    <table
                      id="audit-table-closed"
                      data-datatable="true"
                      style={{ width: "100%" }}
                      className="table table-hover table-striped table-bordered aldis-datatable"
                    >
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Audit Title</th>
                          <th>ISO Standard</th>
                          <th>Department</th>
                          <th>Auditor</th>
                          <th>Auditee</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th className="text-center">Status</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>1</td>
                          <td>Internal Audit Accountant 2026</td>
                          <td>ISO 14001:2019</td>
                          <td>Accountant</td>
                          <td>Kevin</td>
                          <td>Oscar</td>
                          <td>30 October 2026</td>
                          <td>08.00</td>
                          <td className="text-center">
                            <div className="mb-2 mr-2 badge badge-pill badge-danger">
                              Closed
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="d-flex justify-content-center align-items-center aldis-gap-1">
                              <button
                                type="button"
                                className="btn-hover-shine btn btn-shadow btn-danger"
                              >
                                Export Report
                              </button>
                              <button
                                type="button"
                                className="btn-hover-shine btn btn-shadow btn-success"
                              >
                                Review Summary
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
