/**
 * Sends a GA4 event when analytics is loaded (only after the visitor accepts analytics cookies,
 * see ConsentBanner, and only with VITE_GA_MEASUREMENT_ID set); otherwise does nothing.
 *
 * Events used: sign_up, trial_start, begin_checkout, purchase_request, code_redeem, file_download,
 * tool_use (photo resizer, biodata maker). Mark sign_up, trial_start and purchase_request as key
 * events in GA4 (Admin -> Events) to see conversions.
 */
export const trackEvent = (name: string, params: Record<string, unknown> = {}) => {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") window.gtag("event", name, params);
  } catch {
    /* analytics must never break the page */
  }
};
