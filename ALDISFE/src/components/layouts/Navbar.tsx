"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import NotificationDropdown from "@/components/layouts/NotificationDropdown";

type NavbarProps = {
  onToggleSidebar: () => void;
};

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    function handleClickOutside(event: globalThis.MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleLogout(event: ReactMouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    event.stopPropagation();

    console.log("logout clicked");

    localStorage.clear();
    sessionStorage.clear();

    window.location.href = "/login";
  }

  function openChangePasswordModal() {
    setIsProfileOpen(false);
    setPasswordError("");
    setIsChangePasswordOpen(true);
  }

  function closeChangePasswordModal() {
    setIsChangePasswordOpen(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  }

  function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("Password baru minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi password tidak sama.");
      return;
    }

    console.log({
      oldPassword,
      newPassword,
    });

    closeChangePasswordModal();
  }

  return (
    <>
      <div className="app-header header-shadow">
        <div className="app-header__logo">
          <div className="logo-src" />

          <div className="header__pane ml-auto">
            <button
              type="button"
              className="hamburger close-sidebar-btn hamburger--elastic"
              onClick={onToggleSidebar}
            >
              <span className="hamburger-box">
                <span className="hamburger-inner" />
              </span>
            </button>
          </div>
        </div>

        <div className="app-header__mobile-menu">
          <button
            type="button"
            className="hamburger hamburger--elastic mobile-toggle-nav"
            onClick={onToggleSidebar}
          >
            <span className="hamburger-box">
              <span className="hamburger-inner" />
            </span>
          </button>
        </div>

        <div className="app-header__menu">
          <span>
            <button
              type="button"
              className="btn-icon btn-icon-only btn btn-primary btn-sm mobile-toggle-header-nav"
            >
              <span className="btn-icon-wrapper">
                <i className="fa fa-ellipsis-v fa-w-6" />
              </span>
            </button>
          </span>
        </div>

        <div className="app-header__content">
          <div className="app-header-left">
            <div className="search-wrapper">
              <div className="input-holder">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Type to search"
                />
                <button type="button" className="search-icon">
                  <span />
                </button>
              </div>
              <button type="button" className="close" />
            </div>
          </div>

          <div className="app-header-right">
            <NotificationDropdown />
            <div className="pr-0">
              <div className="widget-content p-0">
                <div className="widget-content-wrapper">
                  <div className="widget-content-left mr-3 header-user-info text-center">
                    <div className="widget-heading">Alina Mcloughlin</div>
                    <div className="widget-subheading">Administrator</div>
                  </div>

                  <div className="widget-content-left">
                    <div
                      ref={profileDropdownRef}
                      className={`btn-group ${isProfileOpen ? "show" : ""}`}
                    >
                      <button
                        type="button"
                        aria-haspopup="true"
                        aria-expanded={isProfileOpen}
                        className="p-0 btn"
                        onClick={() => setIsProfileOpen((prev) => !prev)}
                      >
                        <div className="avatar-icon-wrapper avatar-icon-md">
                          <div className="avatar-icon rounded-circle bg-primary text-white d-flex align-items-center justify-content-center">
                            AM
                          </div>
                        </div>
                      </button>
                      <div
                        tabIndex={-1}
                        role="menu"
                        aria-hidden={!isProfileOpen}
                        className={`dropdown-menu-lg dropdown-menu dropdown-menu-right profile-dropdown-menu ${
                          isProfileOpen ? "show" : ""
                        }`}
                      >
                        <div className="dropdown-menu-header">
                          <div className="dropdown-menu-header-inner bg-primary">
                            <div className="menu-header-content text-left">
                              <div className="widget-content p-0">
                                <div className="widget-content-wrapper">
                                  <div className="widget-content-left mr-3">
                                    <div className="avatar-icon rounded-circle bg-white text-primary d-flex align-items-center justify-content-center">
                                      AM
                                    </div>
                                  </div>
                                  <div className="widget-content-left">
                                    <div className="widget-heading">
                                      Alina Mcloughlin
                                    </div>
                                    <div className="widget-subheading opacity-8">
                                      Administrator
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          className="scroll-area-xs"
                          style={{ height: "80px" }}
                        >
                          <div className="scrollbar-container ps">
                            <ul className="nav flex-column">
                              <li className="nav-item">
                                <button
                                  type="button"
                                  className="nav-link border-0 bg-transparent w-100 text-left d-flex align-items-center"
                                  onClick={openChangePasswordModal}
                                >
                                  <i className="lnr lnr-lock mr-2" />
                                  Change Password
                                </button>
                              </li>

                              <li className="nav-item">
                                <a
                                  href="/login"
                                  className="nav-link text-danger d-flex align-items-center"
                                  onClick={handleLogout}
                                >
                                  <i className="lnr lnr-exit mr-2" />
                                  Logout
                                </a>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isChangePasswordOpen && (
        <>
          <div
            className="modal fade show"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            style={{ display: "block" }}
          >
            <div className="modal-dialog" role="document">
              <form className="modal-content" onSubmit={handleChangePassword}>
                <div className="modal-header">
                  <h5 className="modal-title">Change Password</h5>

                  <button
                    type="button"
                    className="close"
                    aria-label="Close"
                    onClick={closeChangePasswordModal}
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>

                <div className="modal-body">
                  {passwordError && (
                    <div className="alert alert-danger">{passwordError}</div>
                  )}

                  <div className="position-relative form-group">
                    <label htmlFor="oldPassword">Current Password</label>
                    <input
                      id="oldPassword"
                      name="oldPassword"
                      type="password"
                      className="form-control"
                      placeholder="Current password here..."
                      value={oldPassword}
                      onChange={(event) => setOldPassword(event.target.value)}
                      required
                    />
                  </div>

                  <div className="position-relative form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      className="form-control"
                      placeholder="New password here..."
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      required
                    />
                  </div>

                  <div className="position-relative form-group mb-0">
                    <label htmlFor="confirmPassword">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      className="form-control"
                      placeholder="Repeat new password here..."
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeChangePasswordModal}
                  >
                    Close
                  </button>

                  <button type="submit" className="btn btn-primary">
                    Save changes
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div
            className="modal-backdrop fade show"
            onClick={closeChangePasswordModal}
          />
        </>
      )}
    </>
  );
}
