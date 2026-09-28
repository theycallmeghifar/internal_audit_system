"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layouts/Navbar";
import Sidebar from "@/components/layouts/Sidebar";
import Footer from "@/components/layouts/Footer";
import PageBlockLoading from "@/components/common/PageBlockLoading";
import Select2Initializer from "@/components/common/Select2Initializer";

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [sidebarClosed, setSidebarClosed] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);

  const loadingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (loadingTimerRef.current) {
      window.clearTimeout(loadingTimerRef.current);
    }

    loadingTimerRef.current = window.setTimeout(() => {
      setIsPageLoading(true);

      loadingTimerRef.current = window.setTimeout(() => {
        setIsPageLoading(false);
      }, 400);
    }, 0);

    return () => {
      if (loadingTimerRef.current) {
        window.clearTimeout(loadingTimerRef.current);
      }
    };
  }, [pathname]);

  return (
    <>
      <Select2Initializer />

      <PageBlockLoading show={isPageLoading} />

      <div
        className={`app-container app-theme-white body-tabs-shadow fixed-header fixed-sidebar ${
          sidebarClosed ? "closed-sidebar" : ""
        }`}
      >
        <Navbar onToggleSidebar={() => setSidebarClosed((prev) => !prev)} />

        <div className="app-main">
          <Sidebar />

          <div className="app-main__outer">
            <div className="app-main__inner">{children}</div>
            <Footer />
          </div>
        </div>
      </div>
    </>
  );
}
