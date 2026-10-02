"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import ModalPortal from "@/components/common/ModalPortal";

type ModalMode = "add" | "edit" | null;

type CategoryForm = {
  name: string;
};

const emptyForm: CategoryForm = {
  name: "",
};

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

export default function CategoryClient() {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const tableRef = useRef<HTMLTableElement>(null);
  const dataTableRef = useRef<DataTableInstance | null>(null);

  const isModalOpen = modalMode !== null;

  function openAddModal() {
    setForm(emptyForm);
    setModalMode("add");
  }

  function openEditModal() {
    setForm({
      name: "Quality Management",
    });

    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setForm(emptyForm);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (modalMode === "add") {
      console.log("submit add category", form);
    }

    if (modalMode === "edit") {
      console.log("submit edit category", form);
    }

    closeModal();
  }

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
              <i className="pe-7s-copy-file icon-gradient bg-malibu-beach" />
            </div>

            <div>
              ISO Category
              <div className="page-title-subheading"></div>
            </div>
          </div>
          <div className="page-title-actions">
            <button
              type="button"
              className="mb-2 mr-2 btn-hover-shine btn btn-shadow btn-primary"
              onClick={openAddModal}
            >
              <span className="btn-icon-wrapper pr-2 opacity-7">
                <i className="ion-android-add fa-w-20"></i>
              </span>
              Add Data
            </button>
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
                    <th>Category</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>Quality Management</td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center align-items-center">
                        <button
                          type="button"
                          className="btn-icon btn-icon-only btn-hover-shine btn-shadow btn btn-warning btn-sm mr-2"
                          onClick={openEditModal}
                        >
                          <i className="lnr-pencil" />
                        </button>
                        <button className="btn-icon btn-icon-only btn-hover-shine btn-shadow btn btn-danger btn-sm">
                          <i className="lnr-trash"> </i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <ModalPortal>
          <div
            className="modal fade show aldis-modal"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="modal-dialog aldis-modal-dialog aldis-modal-lg"
              role="document"
            >
              <form className="modal-content" onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {modalMode === "add" ? "Add Category" : "Edit Category"}
                  </h5>

                  <button
                    type="button"
                    className="close"
                    aria-label="Close"
                    onClick={closeModal}
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>

                <div className="modal-body">
                  <div className="form-row">
                    <div className="col-md-12">
                      <div className="position-relative form-group">
                        <label htmlFor="name">Categoory</label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          className="form-control"
                          placeholder="Category here..."
                          value={form.name}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              name: event.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-hover-shine btn btn-secondary"
                    onClick={closeModal}
                  >
                    Close
                  </button>

                  <button
                    type="submit"
                    className="btn-hover-shine btn btn-primary"
                  >
                    {modalMode === "add" ? "Save changes" : "Update changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div
            className="modal-backdrop fade show aldis-modal-backdrop"
            onClick={closeModal}
          />
        </ModalPortal>
      )}
    </>
  );
}
