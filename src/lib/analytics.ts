/**
 * The Google tag (gtag.js) is loaded on every page from index.html with the Google Ads ID below and
 * consent mode (see ConsentBanner). GA4 is added only after the visitor accepts analytics cookies and
 * only with VITE_GA_MEASUREMENT_ID set.
 *
 * GA4 events: sign_up, trial_start, begin_checkout, purchase_request, code_redeem, file_download,
 * tool_use (photo resizer, biodata maker). Mark sign_up, trial_start and purchase_request as key
 * events in GA4 (Admin -> Events) to see conversions.
 *
 * Google Ads conversions: "Purchase" (trackPurchase) and "Quote request (website, all forms)"
 * (trackLead). Keep the ID here and in index.html the same.
 */
export const GOOGLE_ADS_ID = "AW-18454059893";
const ADS_CONVERSIONS = {
  purchase: `${GOOGLE_ADS_ID}/UkFKCJGGp_kcEPW2yt9E`,
  lead: `${GOOGLE_ADS_ID}/7oUSCO-44ZsdEPW2yt9E`,
};

const gtag = (...args: unknown[]) => {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") window.gtag(...args);
  } catch {
    /* analytics must never break the page */
  }
};

export const trackEvent = (name: string, params: Record<string, unknown> = {}) => gtag("event", name, params);

/**
 * Google Ads "Purchase" conversion. The transaction ID stops Google counting the same payment twice
 * (a reloaded success page, a second tab).
 */
export const trackPurchase = ({ value, transactionId, currency = "BDT" }: { value: number; transactionId: string; currency?: string }) =>
  gtag("event", "conversion", { send_to: ADS_CONVERSIONS.purchase, value, currency, transaction_id: transactionId });

/** Google Ads "Quote request (website, all forms)" conversion: sign-ups and the contact form. */
export const trackLead = () => gtag("event", "conversion", { send_to: ADS_CONVERSIONS.lead });

// Card and Nagad payments leave the site for the gateway and come back to
// /dashboard/billing?payment=success; the checkout is remembered meanwhile so the
// conversion can carry its amount and transaction ID (see usePaymentReturnConversion).
const PENDING_KEY = "pending-checkout";
const PENDING_MAX_AGE = 6 * 60 * 60 * 1000;

export const rememberCheckout = (transactionId: string, value: number) => {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ transactionId, value, at: Date.now() }));
  } catch {
    /* storage unavailable: the success page then can't report this payment */
  }
};

/** Sends the Purchase conversion for the checkout the visitor just paid for, once. */
export const reportReturnedCheckout = () => {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return;
    localStorage.removeItem(PENDING_KEY);
    const pending = JSON.parse(raw) as { transactionId?: string; value?: number; at?: number };
    if (!pending.transactionId || typeof pending.value !== "number" || Date.now() - (pending.at ?? 0) > PENDING_MAX_AGE) return;
    trackPurchase({ value: pending.value, transactionId: pending.transactionId });
    trackEvent("purchase", { currency: "BDT", value: pending.value, transaction_id: pending.transactionId });
  } catch {
    /* analytics must never break the page */
  }
};

/** Forgets a checkout the gateway reported as failed or cancelled. */
export const forgetCheckout = () => {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* storage unavailable */
  }
};
