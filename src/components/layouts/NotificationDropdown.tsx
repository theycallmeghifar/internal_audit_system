"use client";

import { useEffect, useRef, useState } from "react";

type NotificationItem = {
  id: number;
  userName: string;
  title: string;
  description: string;
  time: string;
};

const dummyNotifications: NotificationItem[] = [
  {
    id: 1,
    userName: "Alina Mcloughlin",
    title: "Audit schedule updated",
    description: "Jadwal audit internal telah diperbarui oleh Administrator.",
    time: "5 menit lalu",
  },
  {
    id: 2,
    userName: "Bryan Adams",
    title: "New finding created",
    description: "Terdapat finding baru yang membutuhkan tindak lanjut.",
    time: "20 menit lalu",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(dummyNotifications);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleMarkAsRead(id: number) {
    // Simulasi: karena list hanya menampilkan unread,
    // setelah ditandai dibaca, item langsung dihapus dari list.
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notification) => notification.id !== id),
    );
  }

  function handleView(id: number) {
    console.log("View notification:", id);
    setIsOpen(false);
  }

  return (
    <div ref={dropdownRef} className={`dropdown ${isOpen ? "show" : ""}`}>
      <button
        type="button"
        className="notification-toggle p-0 mr-2 btn"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="icon-wrapper icon-wrapper-alt rounded-circle">
          <span className="icon-wrapper-bg bg-light" />
          <i className="lnr lnr-alarm text-primary" />
        </span>
      </button>

      <div
        tabIndex={-1}
        role="menu"
        aria-hidden={!isOpen}
        className={`dropdown-menu dropdown-menu-right dropdown-menu-lg rm-pointers notification-menu ${
          isOpen ? "show" : ""
        }`}
      >
        <div className="dropdown-menu-header">
          <div className="dropdown-menu-header-inner bg-primary">
            <div className="menu-header-content text-white">
              <h5 className="menu-header-title">Notifications</h5>
              <h6 className="menu-header-subtitle">
                {notifications.length} unread notification
              </h6>
            </div>
          </div>
        </div>

        <div
          className="scroll-area-xs notification-scroll-area"
          style={{
            maxHeight: notifications.length > 0 ? 360 : "auto",
          }}
        >
          <div
            className="scrollbar-container p-2"
            style={{
              maxHeight: notifications.length > 0 ? 360 : "none",
              overflowY: notifications.length > 2 ? "auto" : "visible",
            }}
          >
            {notifications.map((item) => (
              <div
                key={item.id}
                className="card mb-2 shadow-sm border-0 notification-card"
              >
                <div className="card-body p-3">
                  <div className="d-flex align-items-start">
                    <div className="mr-3">
                      <div className="avatar-icon-wrapper avatar-icon-md">
                        <div className="avatar-icon rounded-circle bg-primary text-white d-flex align-items-center justify-content-center">
                          {getInitials(item.userName)}
                        </div>
                      </div>
                    </div>

                    <div className="flex-grow-1 notification-card-content">
                      <div className="d-flex align-items-start justify-content-between">
                        <div>
                          <div className="font-weight-bold text-dark">
                            {item.title}
                          </div>

                          <div className="text-muted" style={{ fontSize: 12 }}>
                            {item.userName}
                          </div>
                        </div>
                      </div>

                      <div className="text-muted small mt-2 mb-2">
                        {item.description}
                      </div>

                      <div className="d-flex align-items-center justify-content-between">
                        <div className="text-muted" style={{ fontSize: 11 }}>
                          {item.time}
                        </div>

                        <div className="notification-card-actions">
                          <button
                            type="button"
                            className="btn btn-light btn-sm mr-2"
                            onClick={() => handleMarkAsRead(item.id)}
                          >
                            Tandai dibaca
                          </button>

                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleView(item.id)}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="text-center text-muted p-3">
                Tidak ada notifikasi.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
