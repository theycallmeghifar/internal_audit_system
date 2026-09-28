"use client";

import { useEffect } from "react";

const templateScripts = [
  // Core
  "/assets/js/vendors/jquery-3.3.1.min.js",
  "/assets/js/vendors/bootstrap.bundle.min.js",
  "/assets/js/vendors/metismenu.js",
  "/assets/js/scripts-init/app.js",
  "/assets/js/scripts-init/demo.js",

  // Charts
  "/assets/js/vendors/charts/apex-charts.js",
  "/assets/js/scripts-init/charts/apex-charts.js",
  "/assets/js/scripts-init/charts/apex-series.js",
  "/assets/js/vendors/charts/charts-sparklines.js",
  "/assets/js/scripts-init/charts/charts-sparklines.js",
  "/assets/js/vendors/charts/Chart.min.js",
  "/assets/js/scripts-init/charts/chartsjs-utils.js",
  "/assets/js/scripts-init/charts/chartjs.js",

  // Forms
  "/assets/js/vendors/form-components/clipboard.js",
  "/assets/js/scripts-init/form-components/clipboard.js",
  "/assets/js/vendors/form-components/datepicker.js",
  "/assets/js/vendors/form-components/daterangepicker.js",
  "/assets/js/vendors/form-components/moment.js",
  "/assets/js/scripts-init/form-components/datepicker.js",
  "/assets/js/vendors/form-components/bootstrap-multiselect.js",
  "/assets/js/vendors/form-components/select2.min.js",
  "/assets/js/scripts-init/form-components/input-select.js",
  "/assets/js/vendors/form-components/form-validation.js",
  "/assets/js/scripts-init/form-components/form-validation.js",
  "/assets/js/vendors/form-components/form-wizard.js",
  "/assets/js/scripts-init/form-components/form-wizard.js",
  "/assets/js/vendors/form-components/input-mask.js",
  "/assets/js/scripts-init/form-components/input-mask.js",
  "/assets/js/vendors/form-components/wnumb.js",
  "/assets/js/vendors/form-components/range-slider.js",
  "/assets/js/scripts-init/form-components/range-slider.js",
  "/assets/js/vendors/form-components/textarea-autosize.js",
  "/assets/js/scripts-init/form-components/textarea-autosize.js",
  "/assets/js/vendors/form-components/toggle-switch.js",

  // Components
  "/assets/js/vendors/blockui.js",
  "/assets/js/scripts-init/blockui.js",
  "/assets/js/vendors/calendar.js",
  "/assets/js/scripts-init/calendar.js",
  "/assets/js/vendors/carousel-slider.js",
  "/assets/js/scripts-init/carousel-slider.js",
  "/assets/js/vendors/circle-progress.js",
  "/assets/js/scripts-init/circle-progress.js",
  "/assets/js/vendors/count-up.js",
  "/assets/js/scripts-init/count-up.js",
  "/assets/js/vendors/cropper.js",
  "/assets/js/vendors/jquery-cropper.js",
  "/assets/js/scripts-init/image-crop.js",
  "/assets/js/vendors/gmaps.js",
  "/assets/js/vendors/jvectormap.js",
  "/assets/js/scripts-init/maps-word-map.js",
  "/assets/js/scripts-init/maps.js",
  "/assets/js/vendors/guided-tours.js",
  "/assets/js/scripts-init/guided-tours.js",
  "/assets/js/vendors/ladda-loading.js",
  "/assets/js/vendors/spin.js",
  "/assets/js/scripts-init/ladda-loading.js",
  "/assets/js/vendors/rating.js",
  "/assets/js/scripts-init/rating.js",
  "/assets/js/vendors/scrollbar.js",
  "/assets/js/scripts-init/scrollbar.js",
  "/assets/js/vendors/toastr.min.js",
  "/assets/js/scripts-init/toastr.js",
  "/assets/js/vendors/sweetalert2@8.js",
  "/assets/js/scripts-init/sweet-alerts.js",
  "/assets/js/vendors/treeview.js",
  "/assets/js/scripts-init/treeview.js",

  // Tables
  "/assets/js/vendors/jquery.dataTables.min.js",
  "/assets/js/vendors/dataTables.bootstrap4.min.js",
  "/assets/js/vendors/dataTables.responsive.min.js",
  "/assets/js/vendors/responsive.bootstrap.min.js",
  "/assets/js/vendors/tables.js",
];

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);

    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = false;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    document.body.appendChild(script);
  });
}

export default function TemplateScripts() {
  useEffect(() => {
    let isMounted = true;

    async function loadTemplateScripts() {
      for (const src of templateScripts) {
        if (!isMounted) return;
        await loadScript(src);
      }
    }

    loadTemplateScripts().catch((error) => {
      console.error("Template script loading error:", error);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}
