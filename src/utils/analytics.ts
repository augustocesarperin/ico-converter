export type AnalyticsEventName =
  | "start_conversion"
  | "finish_conversion"
  | "error_conversion"
  | "download_zip"
  | "download_ico"
  | "open_windows_tab"
  | "download_windows_assets_only"
  | "open_settings_after_result"
  | "retry_conversion";

export interface AnalyticsEventPayload {
  [key: string]: string | number | boolean | undefined;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function trackEvent(
  name: AnalyticsEventName,
  payload: AnalyticsEventPayload = {},
): void {
  if (!isBrowser()) return;

  try {
    // Plausible (no cookies)
    const plausible = (
      window as unknown as {
        plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void;
      }
    ).plausible;
    if (typeof plausible === "function") {
      plausible(name, { props: payload });
      return;
    }
  } catch {
    /* noop */
  }

  try {
    // Cloudflare Zaraz (privacy-first)
    const zaraz = (
      window as unknown as {
        zaraz?: { track?: (eventName: string, data?: Record<string, unknown>) => void };
      }
    ).zaraz;
    if (zaraz && typeof zaraz.track === "function") {
      zaraz.track(name, payload as Record<string, unknown>);
      return;
    }
  } catch {
    /* noop */
  }

  try {
    // gtag (if user later enables GA4)
    const gtag = (
      window as unknown as {
        gtag?: (command: "event", eventName: string, params?: Record<string, unknown>) => void;
      }
    ).gtag;
    if (typeof gtag === "function") {
      gtag("event", name, payload as Record<string, unknown>);
      return;
    }
  } catch {
    /* noop */
  }
}



