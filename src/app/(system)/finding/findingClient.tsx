"use client";

import { useEffect, useRef, useState } from "react";

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

export default function FindingClient() {
  const tableRef = useRef<HTMLTableElement>(null);
  const dataTableRef = useRef<DataTableInstance | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const findingData = [
    {
      id: 1,
      auditTitle: "Internal Audit Sales 2026",
      auditDate: "27 September 2026",
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
      auditDate: "27 September 2026",
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
      auditDate: "27 September 2026",
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

  const totalFinding = findingData.length;

  const improvementRequired = findingData.filter(
    (item) => item.status === "Improvement Required",
  ).length;

  const improvementReview = findingData.filter(
    (item) => item.status === "Improvement Review",
  ).length;

  const approved = findingData.filter(
    (item) => item.status === "Approved",
  ).length;

  useEffect(() => {
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

      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }

      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <div className="app-page-title">
        <div className="page-title-wrapper">
          <div className="page-title-heading">
            <div className="page-title-icon">
              <i className="pe-7s-attention icon-gradient bg-malibu-beach" />
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
                id="filter_accordion"
                aria-labelledby="headingOne"
                className={`collapse ${isFilterOpen ? "show" : ""}`}
              >
                <div className="card-body">
                  <div className="form-row align-items-end">
                    <div className="col-md-2 col-sm-6">
                      <div className="position-relative form-group mb-md-0">
                        <label htmlFor="start_period">From Audit Period</label>

                        <input
                          id="start_period"
                          name="start_period"
                          type="month"
                          className="form-control"
                        />
                      </div>
                    </div>

                    <div className="col-md-2 col-sm-6">
                      <div className="position-relative form-group mb-md-0">
                        <label htmlFor="end_period">To Audit Period</label>

                        <input
                          id="end_period"
                          name="end_period"
                          type="month"
                          className="form-control"
                        />
                      </div>
                    </div>

                    <div className="col-md-2 col-sm-6">
                      <div className="position-relative form-group mb-md-0">
                        <label htmlFor="department">Department</label>
                        <select
                          id="department"
                          className="form-control aldis-select2"
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
                        <label htmlFor="iso_standard">ISO Standard</label>
                        <select
                          id="iso_standard"
                          className="form-control aldis-select2"
                          data-placeholder="Select ISO Standard"
                        >
                          <option value=""></option>
                          <option value="ISO 9001:2015">ISO 9001:2015</option>
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
                          className="form-control aldis-select2"
                          data-placeholder="Select ISO category"
                        >
                          <option value=""></option>
                          <option value="OFI">OFI</option>
                          <option value="NC Minor">NC Minor</option>
                          <option value="NC Major">NC Major</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-2 col-sm-6">
                      <div className="position-relative form-group mb-md-0">
                        <label htmlFor="finding_status">Status</label>
                        <select
                          id="finding_status"
                          className="form-control aldis-select2"
                          data-placeholder="Select ISO Standard"
                        >
                          <option value=""></option>
                          <option value="Improvement Required">
                            Improvement Required
                          </option>
                          <option value="Improvement Review">
                            Improvement Review
                          </option>
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
        </div>
      </div>

      <div className="row">
        <div className="col-md-3">
          <div className="card mb-3 widget-content">
            <div className="widget-content-wrapper">
              <div className="widget-content-left">
                <div className="widget-heading">Total Findings</div>
              </div>
              <div className="widget-content-right">
                <div className="widget-numbers text-primary">
                  <span>{totalFinding}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card mb-3 widget-content">
            <div className="widget-content-wrapper">
              <div className="widget-content-left">
                <div className="widget-heading">Total Improvement Required</div>
              </div>
              <div className="widget-content-right">
                <div className="widget-numbers text-warning">
                  <span>{improvementRequired}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card mb-3 widget-content">
            <div className="widget-content-wrapper">
              <div className="widget-content-left">
                <div className="widget-heading">Total Improvement Review</div>
              </div>
              <div className="widget-content-right">
                <div className="widget-numbers text-info">
                  <span>{improvementReview}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card mb-3 widget-content">
            <div className="widget-content-wrapper">
              <div className="widget-content-left">
                <div className="widget-heading">Total Approved</div>
              </div>
              <div className="widget-content-right">
                <div className="widget-numbers text-success">
                  <span>{approved}</span>
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
              <table
                ref={tableRef}
                data-datatable="true"
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
                  {findingData.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.auditTitle}</td>
                      <td>{item.auditDate}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
