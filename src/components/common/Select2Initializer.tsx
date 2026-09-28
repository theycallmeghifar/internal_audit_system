"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type JQueryElement = {
  select2?: (options?: Record<string, unknown> | string) => JQueryElement;
  on: (events: string, handler: () => void) => JQueryElement;
  data: (key: string, value?: unknown) => unknown;
};

type JQueryFn = (element: Element) => JQueryElement;

type Select2Window = Window & {
  jQuery?: JQueryFn;
  $?: JQueryFn;
};

export default function Select2Initializer() {
  const pathname = usePathname();

  useEffect(() => {
    let retryCount = 0;
    let retryTimer: number | null = null;

    function initSelect2() {
      const select2Window = window as Select2Window;
      const jq = select2Window.jQuery ?? select2Window.$;

      if (!jq) {
        retry();
        return;
      }

      const selectElements = document.querySelectorAll<HTMLSelectElement>(
        "select.aldis-select2:not([data-aldis-select2-initialized='true'])",
      );

      selectElements.forEach((selectElement) => {
        const select = jq(selectElement);

        if (typeof select.select2 !== "function") {
          retry();
          return;
        }

        const parentModal = selectElement.closest(".modal");

        const placeholder =
          selectElement.getAttribute("data-placeholder") ?? "Select option";

        const allowClear =
          selectElement.getAttribute("data-allow-clear") === "true";

        const hideSearch =
          selectElement.getAttribute("data-hide-search") === "true";

        select.select2({
          width: "100%",
          placeholder,
          allowClear,
          closeOnSelect: !selectElement.multiple,
          minimumResultsForSearch: hideSearch ? Infinity : 0,
          dropdownParent: parentModal ? jq(parentModal) : jq(document.body),
        });

        select.on("select2:select select2:unselect select2:clear", () => {
          selectElement.dispatchEvent(
            new Event("change", {
              bubbles: true,
            }),
          );
        });

        selectElement.setAttribute("data-aldis-select2-initialized", "true");
      });
    }

    function retry() {
      if (retryCount >= 20) {
        return;
      }

      retryCount += 1;

      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }

      retryTimer = window.setTimeout(initSelect2, 100);
    }

    initSelect2();

    const observer = new MutationObserver(() => {
      initSelect2();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();

      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [pathname]);

  return null;
}
