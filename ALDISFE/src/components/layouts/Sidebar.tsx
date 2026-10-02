"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function activeClass(href: string) {
    return isActive(href) ? "mm-active" : "";
  }

  return (
    <div className="app-sidebar sidebar-shadow">
      <div className="app-header__logo">
        <div className="logo-src" />
      </div>

      <div className="scrollbar-sidebar">
        <div className="app-sidebar__inner">
          <ul className="vertical-nav-menu">
            <li className="app-sidebar__heading">Menu</li>

            <li>
              <Link href="/dashboard" className={activeClass("/dashboard")}>
                <i className="metismenu-icon pe-7s-home" />
                Dashboard
              </Link>
            </li>

            <li>
              <Link href="/calendar" className={activeClass("/calendar")}>
                <i className="metismenu-icon pe-7s-date" />
                Calendar
              </Link>
            </li>

            <li className="app-sidebar__heading">User Setting</li>

            <li>
              <Link href="/user" className={activeClass("/user")}>
                <i className="metismenu-icon pe-7s-users" />
                Users
              </Link>
            </li>

            <li className="app-sidebar__heading">Master Data</li>

            <li>
              <Link href="/department" className={activeClass("/department")}>
                <i className="metismenu-icon pe-7s-network" />
                Departments
              </Link>
            </li>

            <li>
              <Link href="/category" className={activeClass("/category")}>
                <i className="metismenu-icon pe-7s-copy-file" />
                ISO Categories
              </Link>
            </li>

            <li>
              <Link href="/standard" className={activeClass("/standard")}>
                <i className="metismenu-icon pe-7s-file" />
                ISO Standard
              </Link>
            </li>

            <li className="app-sidebar__heading">Audit</li>

            <li>
              <Link href="/audit" className={activeClass("/audit")}>
                <i className="metismenu-icon pe-7s-note2" />
                Audit
              </Link>
            </li>

            <li>
              <Link href="/finding" className={activeClass("/finding")}>
                <i className="metismenu-icon pe-7s-attention" />
                Findings
              </Link>
            </li>

            <li className="app-sidebar__heading">Logs</li>

            <li>
              <Link href="/log" className={activeClass("/log")}>
                <i className="metismenu-icon pe-7s-news-paper" />
                Activity Log
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
