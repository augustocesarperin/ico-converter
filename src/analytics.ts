/* Lightweight analytics loader. Supports Cloudflare Web Analytics and GA4 via env. */

export function initAnalytics(): void {
  try {
    const env =
      (import.meta as unknown as { env?: Record<string, string | undefined> })
        .env || {};
    // Cloudflare beacon já é injetado via meta + loader em index.html

    const gaId = env.VITE_GA_MEASUREMENT_ID;
    if (typeof gaId === "string" && gaId.length > 0) {
      const gtag = document.createElement("script");
      gtag.async = true;
      gtag.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(gtag);

      const inline = document.createElement("script");
      inline.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);} 
        gtag('js', new Date());
        gtag('config', '${gaId}', { anonymize_ip: true });
      `;
      document.head.appendChild(inline);
    }
  } catch {
    // silently ignore
  }
}
