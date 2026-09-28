"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import ModalPortal from "@/components/common/ModalPortal";

type ModalMode = "add" | "edit" | null;

type UserForm = {
  employeeId: string;
  fullname: string;
  nickname: string;
  email: string;
  department: string;
  jobLevel: string;
  jobTitle: string;
  role: string;
};

const emptyForm: UserForm = {
  employeeId: "",
  fullname: "",
  nickname: "",
  email: "",
  department: "",
  jobLevel: "",
  jobTitle: "",
  role: "",
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

export default function UserClient() {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const tableRef = useRef<HTMLTableElement>(null);
  const dataTableRef = useRef<DataTableInstance | null>(null);

  const isModalOpen = modalMode !== null;

  function openAddModal() {
    setForm(emptyForm);
    setModalMode("add");
  }

  function openEditModal() {
    setForm({
      employeeId: "251001740",
      fullname: "Muhammad Al Ghifari",
      nickname: "Ghifar",
      email: "muhammad.ghifari.lmc.co.id",
      department: "MSTD",
      jobLevel: "Staff",
      jobTitle: "Manufacturing Technology Development Staff",
      role: "administrator",
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
      console.log("submit add user", form);
    }

    if (modalMode === "edit") {
      console.log("submit edit user", form);
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
              <i className="pe-7s-users icon-gradient bg-malibu-beach" />
            </div>

            <div>
              User
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
                    <th>Employee ID</th>
                    <th>Fullname</th>
                    <th>Nickname</th>
                    <th>Email</th>
                    <th>Departement</th>
                    <th>Job Level</th>
                    <th>Job Title</th>
                    <th>Role</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>251001740</td>
                    <td>Muhammad Al Ghifari</td>
                    <td>Ghifar</td>
                    <td>muhammad.ghifari.lmc.co.id</td>
                    <td>MSTD</td>
                    <td>Staff</td>
                    <td>Manufacturing Technology Development Staff</td>
                    <td>Administrator</td>
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
                          <i className="lnr-trash" />
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
                    {modalMode === "add" ? "Add User" : "Edit User"}
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
                    <div className="col-md-6">
                      <div className="position-relative form-group">
                        <label htmlFor="employeeId">Employee ID</label>
                        <input
                          id="employeeId"
                          name="employeeId"
                          type="text"
                          className="form-control"
                          placeholder="Employee ID here..."
                          value={form.employeeId}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              employeeId: event.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="position-relative form-group">
                        <label htmlFor="fullname">Fullname</label>
                        <input
                          id="fullname"
                          name="fullname"
                          type="text"
                          className="form-control"
                          placeholder="Fullname here..."
                          value={form.fullname}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              fullname: event.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="position-relative form-group">
                        <label htmlFor="nickname">Nickname</label>
                        <input
                          id="nickname"
                          name="nickname"
                          type="text"
                          className="form-control"
                          placeholder="Nickname here..."
                          value={form.nickname}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              nickname: event.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="position-relative form-group">
                        <label htmlFor="email">Email</label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          className="form-control"
                          placeholder="Email here..."
                          value={form.email}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              email: event.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="position-relative form-group">
                        <label htmlFor="department">Department</label>
                        <select
                          id="department"
                          name="department"
                          className="form-control aldis-select2"
                          value={form.department}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              department: event.target.value,
                            }))
                          }
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
                        <label htmlFor="jobLevel">Job Level</label>
                        <input
                          id="jobLevel"
                          name="jobLevel"
                          type="text"
                          className="form-control"
                          placeholder="Job level here..."
                          value={form.jobLevel}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              jobLevel: event.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="position-relative form-group">
                        <label htmlFor="jobTitle">Job Title</label>
                        <input
                          id="jobTitle"
                          name="jobTitle"
                          type="text"
                          className="form-control"
                          placeholder="Job title here..."
                          value={form.jobTitle}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              jobTitle: event.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="position-relative form-group">
                        <label htmlFor="role">Role</label>
                        <select
                          id="role"
                          name="role"
                          className="form-control aldis-select2"
                          data-placeholder="Select role"
                          value={form.role}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              role: event.target.value,
                            }))
                          }
                          required
                        >
                          <option value="">Select role</option>
                          <option value="administrator">Administrator</option>
                          <option value="user">User</option>
                        </select>
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
