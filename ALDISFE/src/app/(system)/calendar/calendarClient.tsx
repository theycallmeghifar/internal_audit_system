"use client";

import { useEffect, useRef } from "react";

type JQueryCalendarElement = {
  fullCalendar?: (
    optionsOrMethod?: Record<string, unknown> | string,
    ...args: unknown[]
  ) => JQueryCalendarElement;
};

type JQueryStatic = {
  (element: HTMLElement | string): JQueryCalendarElement;
};

type CalendarWindow = Window & {
  jQuery?: JQueryStatic;
  $?: JQueryStatic;
};

export default function CalendarClient() {
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let retryCount = 0;
    let retryTimer: number | null = null;
    let isMounted = true;

    function initCalendar() {
      if (!isMounted) {
        return;
      }

      const calendarElement = calendarRef.current;
      const calendarWindow = window as CalendarWindow;
      const jq = calendarWindow.jQuery ?? calendarWindow.$;

      if (!calendarElement || !jq) {
        retry();
        return;
      }

      const calendar = jq(calendarElement);

      if (typeof calendar.fullCalendar !== "function") {
        retry();
        return;
      }

      calendar.fullCalendar("destroy");

      calendar.fullCalendar({
        themeSystem: "bootstrap4",
        height: "auto",
        contentHeight: "auto",
        editable: false,
        eventStartEditable: false,
        eventDurationEditable: false,
        droppable: false,
        eventLimit: true,

        header: {
          left: "prev,next",
          center: "title",
          right: "",
        },

        defaultDate: "2026-09-01",

        events: [
          {
            title: "Internal Audit TSUP",
            start: "2026-09-01",
          },
          {
            title: "Internal Audit Sales",
            start: "2026-09-27T14:00:00",
          },
          {
            title: "Internal Audit Accountant",
            start: "2026-10-30T08:00:00",
          },
        ],
      });
    }

    function retry() {
      if (retryCount >= 50) {
        console.warn("FullCalendar gagal di-init: plugin belum tersedia.");
        return;
      }

      retryCount += 1;
      retryTimer = window.setTimeout(initCalendar, 100);
    }

    retryTimer = window.setTimeout(initCalendar, 0);

    return () => {
      isMounted = false;

      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }

      const calendarElement = calendarRef.current;
      const calendarWindow = window as CalendarWindow;
      const jq = calendarWindow.jQuery ?? calendarWindow.$;

      if (calendarElement && jq) {
        const calendar = jq(calendarElement);

        if (typeof calendar.fullCalendar === "function") {
          calendar.fullCalendar("destroy");
        }
      }
    };
  }, []);

  return (
    <>
      <div className="app-page-title">
        <div className="page-title-wrapper">
          <div className="page-title-heading">
            <div className="page-title-icon">
              <i className="pe-7s-date icon-gradient bg-malibu-beach" />
            </div>

            <div>
              Calendar
              <div className="page-title-subheading"></div>
            </div>
          </div>
          <div className="page-title-actions"></div>
        </div>
      </div>

      <div className="row">
        <div className="col">
          <div className="main-card card">
            <div className="card-body">
              <div ref={calendarRef} id="calendar" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
