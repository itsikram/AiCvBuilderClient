import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/lib/useHydrated";

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "";
const STORAGE_KEY = "analytics-consent";
type Consent = "granted" | "denied" | null;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const readConsent = (): Consent => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
};

let gaLoaded = false;
function loadGa() {
  if (gaLoaded || !GA_ID) return;
  gaLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js expects the arguments object itself
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  // Page views are sent manually on route changes (SPA)
  window.gtag("config", GA_ID, { send_page_view: false, anonymize_ip: true });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);
}

/**
 * GA4 loads only after the visitor accepts analytics cookies. Without
 * VITE_GA_MEASUREMENT_ID nothing is shown or loaded.
 */
export function ConsentBanner() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const hydrated = useHydrated();
  const [consent, setConsent] = useState<Consent>(() => (typeof window === "undefined" ? null : readConsent()));

  useEffect(() => {
    if (consent === "granted") loadGa();
  }, [consent]);

  useEffect(() => {
    if (consent === "granted" && window.gtag) {
      window.gtag("event", "page_view", { page_path: pathname, page_location: window.location.href });
    }
  }, [consent, pathname]);

  if (!GA_ID || !hydrated || consent !== null) return null;

  const choose = (value: Exclude<Consent, null>) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* storage unavailable */
    }
    setConsent(value);
  };

  return (
    <div
      role="region"
      aria-label={t("consent.label")}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-border bg-background p-4 shadow-xl sm:flex-row sm:items-center"
    >
      <p className="flex-1 text-sm">{t("consent.text")}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => choose("denied")}>{t("consent.decline")}</Button>
        <Button size="sm" onClick={() => choose("granted")}>{t("consent.accept")}</Button>
      </div>
    </div>
  );
}
