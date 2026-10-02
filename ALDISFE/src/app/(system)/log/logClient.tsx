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
                  onClick={() => setIsFilterOpen((prev) => !prev)}
                >
                  <h6 className="card-title m-0 p-0">Date Time Filter</h6>

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
                    <div className="col-md-3 col-sm-6">
                      <div className="position-relative form-group mb-md-0">
                        <label htmlFor="start_datetime">Start Date Time</label>
                        <input
                          id="start_datetime"
                          name="start_datetime"
                          type="datetime-local"
                          className="form-control"
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
                          className="form-control"
                        />
                      </div>
                    </div>

                    <div className="col-md-3 col-sm-12">
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
                    <th>User</th>
                    <th>Activity</th>
                    <th>Date</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>muhammad.ghifari@lmc.co.id</td>
                    <td>login</td>
                    <td>31 August 2026</td>
                    <td>21.34</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
