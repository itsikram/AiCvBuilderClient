import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "@fontsource-variable/inter/wght.css";
import "@fontsource/hind-siliguri/bengali-400.css";
import "@fontsource/hind-siliguri/bengali-600.css";
import "./index.css";
import i18n, { resolveInitialLanguage } from "./i18n";
import App from "./App.tsx";
import { preloadRoute } from "@/lib/lazyPage";
import { useThemeStore } from "./store/themeStore";

const theme = useThemeStore.getState().theme;
const resolved = theme === "system"
  ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  : theme;
document.documentElement.classList.toggle("dark", resolved === "dark");

i18n.changeLanguage(resolveInitialLanguage(window.location.pathname));

// Prerendered pages ship head tags for crawlers; React renders its own copies,
// so drop the static ones to avoid duplicate canonical/description tags.
document.querySelectorAll("[data-prerender]").forEach((node) => node.remove());

const container = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Public pages are prerendered at build time; hydrate them so the HTML stays on
// screen while route chunks load. App pages ship an empty root and render normally.
if (container.hasChildNodes()) {
  // Fetch this page's chunk first so hydration matches the prerendered HTML
  preloadRoute(window.location.pathname)
    .catch(() => undefined)
    .then(() => hydrateRoot(container, app));
} else {
  createRoot(container).render(app);
}
