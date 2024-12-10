import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";

import { initAnalytics } from "./analytics";
import Index from "./pages/Index";
import "./index.css";
import "./i18n";

export {};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={<div></div>}>
      <Index />
    </Suspense>
  </React.StrictMode>,
);

// Defer non-critical work
if (
  "requestIdleCallback" in window &&
  typeof window.requestIdleCallback === "function"
) {
  window.requestIdleCallback(() => initAnalytics());
} else {
  setTimeout(() => initAnalytics(), 1200);
}
