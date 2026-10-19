import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X, Sun, Moon, Languages } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { usePageContent } from "@/context/PageContentContext";
import { setLanguage } from "@/i18n";
import { alternatePath } from "@/lib/i18nRouting";
import { useLang } from "@/lib/useLang";
import { useHydrated } from "@/lib/useHydrated";
import { siteName } from "@/lib/site";

export function Navbar() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { isAuthenticated: authed, logout, user } = useAuthStore();
  const { resolvedTheme, setTheme } = useThemeStore();
  const { headerFooterContent } = usePageContent();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { lang, lp, onPublicPage } = useLang();
  const hydrated = useHydrated();
  // Prerendered HTML is always the signed-out, light-theme version
  const isAuthenticated = hydrated && authed;
  const isDark = hydrated && resolvedTheme === "dark";

  const navLinks = (headerFooterContent.navLinks || [
    { label: t("nav.templates"), href: "/templates" },
    { label: t("nav.cvFormat"), href: "/cv-format-bangladesh" },
    { label: t("nav.guides"), href: "/blog" },
    { label: t("nav.pricing"), href: "/pricing" },
  ]).map((link) => ({ ...link, href: lp(link.href) }));

  const otherLang = lang === "en" ? "bn" : "en";
  const switchLanguage = () => {
    setLanguage(otherLang);
    const target = onPublicPage ? alternatePath(pathname, otherLang) : null;
    if (target) navigate(`${target}${search}`);
    setOpen(false);
  };
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");
  const initials = user?.name?.trim()?.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "U";
  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate(lp("/"));
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border glass">
      <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-4">
        <Link to={lp("/")} className="flex min-w-0 items-center gap-2" aria-label={siteName(lang)}>
          {headerFooterContent.headerLogo ? (
            <img src={headerFooterContent.headerLogo} alt={siteName(lang)} className="h-8 object-contain" width="120" height="32" />
          ) : (
            <>
              <img src="/favicon.svg" alt="" width="32" height="32" className="h-8 w-8 shrink-0" />
              <span className="truncate text-lg font-bold gradient-text sm:text-xl">{siteName(lang)}</span>
            </>
          )}
        </Link>

        <nav aria-label={t("nav.main")} className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link key={link.href} to={link.href} className="text-sm transition-colors hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={switchLanguage}
            aria-label={t("nav.switchLanguage")}
            title={t("nav.switchLanguage")}
            lang={otherLang === "bn" ? "bn" : "en"}
          >
            <Languages className="h-4 w-4" aria-hidden="true" />
            <span>{otherLang === "bn" ? "বাংলা" : "English"}</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t(isDark ? "nav.lightMode" : "nav.darkMode")}>
            {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </Button>

          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated ? (
              <>
                {user?.role === "admin" && (
                  <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>{t("nav.admin")}</Button>
                )}
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-2 rounded-full border border-border bg-background/80 py-1 pl-1 pr-3 text-left transition hover:border-primary/50"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" width="32" height="32" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground" aria-hidden="true">
                      {initials}
                    </span>
                  )}
                  <span className="text-sm font-medium">{t("nav.dashboard")}</span>
                </button>
                <Button variant="outline" size="sm" onClick={handleLogout}>{t("nav.logout")}</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")}>{t("nav.login")}</Button>
                <Button variant="gradient" onClick={() => navigate("/register")}>{t("nav.register")}</Button>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={t(open ? "nav.closeMenu" : "nav.openMenu")}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label={t("nav.main")} className="flex flex-col gap-1 border-t border-border p-4 lg:hidden">
          {navLinks.map((link) => (
            <Link key={link.href} to={link.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-secondary">
              {link.label}
            </Link>
          ))}
          <div className="mt-2 grid gap-2 border-t border-border pt-3 md:hidden">
            {isAuthenticated ? (
              <>
                <Button variant="gradient" onClick={() => { navigate("/dashboard"); setOpen(false); }}>{t("nav.dashboard")}</Button>
                <Button variant="outline" onClick={handleLogout}>{t("nav.logout")}</Button>
              </>
            ) : (
              <>
                <Button variant="gradient" onClick={() => { navigate("/register"); setOpen(false); }}>{t("nav.register")}</Button>
                <Button variant="outline" onClick={() => { navigate("/login"); setOpen(false); }}>{t("nav.login")}</Button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
