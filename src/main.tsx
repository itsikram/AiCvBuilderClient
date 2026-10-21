import { StrictMode, startTransition } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "@fontsource-variable/inter/wght.css";
import "@fontsource/hind-siliguri/bengali-400.css";
import "@fontsource/hind-siliguri/bengali-600.css";
import "./index.css";
import { i18nReady } from "./i18n";
import App, { type InitialQueryData } from "./App.tsx";
import { preloadRoute } from "@/lib/lazyPage";
import { applyThemeClass, useThemeStore } from "./store/themeStore";

const theme = useThemeStore.getState().theme;
const resolved = theme === "system"
  ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  : theme;
applyThemeClass(resolved);

// Prerendered pages ship head tags for crawlers; React renders its own copies,
// so drop the static ones to avoid duplicate canonical/description tags.
document.querySelectorAll("[data-prerender]").forEach((node) => node.remove());

// API data a prerendered page (blog list or post) was built with; see scripts/prerender.mjs
let initialData: InitialQueryData | undefined;
try {
  initialData = JSON.parse(document.getElementById("prerender-data")?.textContent || "null") ?? undefined;
} catch {
  initialData = undefined;
}

const container = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App initialData={initialData} />
  </StrictMode>
);

// Public pages are prerendered at build time; hydrate them so the HTML stays on
// screen while route chunks load. App pages ship an empty root and render normally.
if (container.hasChildNodes()) {
  // Fetch this page's chunk and language first so hydration matches the prerendered HTML
  Promise.all([preloadRoute(window.location.pathname), i18nReady])
    .catch(() => undefined)
    // As a transition, hydration yields to the browser between components instead
    // of one long blocking task (keeps the page responsive on low-end phones)
    .then(() => startTransition(() => void hydrateRoot(container, app)));
} else {
  void i18nReady.finally(() => createRoot(container).render(app));
}
