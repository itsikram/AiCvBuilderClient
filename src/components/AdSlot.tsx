import { useEffect, useRef, useState } from "react";
import { useHydrated } from "@/lib/useHydrated";
import { cn } from "@/lib/utils";

// Optional Google AdSense unit for content pages (guides, job circulars), never the CV builder.
// Shows nothing unless VITE_ADSENSE_CLIENT (ca-pub-...) and VITE_ADSENSE_SLOT are set at build time,
// and loads only after the visitor accepts cookies in the consent banner. The build adds AdSense's
// hosts to the Content-Security-Policy and writes ads.txt when VITE_ADSENSE_CLIENT is set.

const CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || "";
const SLOT = import.meta.env.VITE_ADSENSE_SLOT || "";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const consented = () => {
  try {
    return localStorage.getItem("analytics-consent") === "granted";
  } catch {
    return false;
  }
};

let scriptAdded = false;
const loadScript = () => {
  if (scriptAdded) return;
  scriptAdded = true;
  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(CLIENT)}`;
  document.head.appendChild(script);
};

export function AdSlot({ className }: { className?: string }) {
  const hydrated = useHydrated();
  const [allowed] = useState(() => typeof window !== "undefined" && Boolean(CLIENT && SLOT) && consented());
  const pushed = useRef(false);

  useEffect(() => {
    if (!hydrated || !allowed || pushed.current) return;
    pushed.current = true;
    loadScript();
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* an ad failing to load must never break the page */
    }
  }, [hydrated, allowed]);

  // Nothing during prerendering/hydration, so the static HTML and the first render match
  if (!hydrated || !allowed) return null;
  return (
    <ins
      className={cn("adsbygoogle block", className)}
      style={{ display: "block" }}
      data-ad-client={CLIENT}
      data-ad-slot={SLOT}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
