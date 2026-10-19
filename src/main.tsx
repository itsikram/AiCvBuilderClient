import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter/wght.css";
import "@fontsource/hind-siliguri/bengali-400.css";
import "@fontsource/hind-siliguri/bengali-600.css";
import "./index.css";
import "./i18n";
import App from "./App.tsx";
import { useThemeStore } from "./store/themeStore";

const theme = useThemeStore.getState().theme;
const resolved = theme === "system"
  ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  : theme;
document.documentElement.classList.toggle("dark", resolved === "dark");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
