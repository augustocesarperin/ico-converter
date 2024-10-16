/* Lightweight analytics loader. Supports Cloudflare Web Analytics and GA4 via env. */

export function initAnalytics(): void {
  try {
    const cfToken = (import.meta as any).env?.VITE_CF_BEACON_TOKEN as string | undefined;
    if (cfToken) {
      const s = document.createElement('script');
      s.defer = true;
      s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
      s.setAttribute('data-cf-beacon', JSON.stringify({ token: cfToken }));
      document.head.appendChild(s);
    }

    const gaId = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID as string | undefined;
    if (gaId) {
      const gtag = document.createElement('script');
      gtag.async = true;
      gtag.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(gtag);

      const inline = document.createElement('script');
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



