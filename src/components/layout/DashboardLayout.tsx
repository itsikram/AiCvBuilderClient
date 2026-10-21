import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, CreditCard, FileText, Languages, LayoutDashboard, LogOut, Mail, Menu, Settings, Shield, Sparkles, Target, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/seo/SEO";
import { setLanguage } from "@/i18n";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, key: "dashboard" },
  { to: "/dashboard/resumes", icon: FileText, key: "resumes" },
  { to: "/dashboard/templates", icon: Sparkles, key: "templates" },
  { to: "/dashboard/ats", icon: Target, key: "ats" },
  { to: "/dashboard/cover-letters", icon: Mail, key: "coverLetters" },
  { to: "/dashboard/billing", icon: CreditCard, key: "billing" },
  { to: "/dashboard/settings", icon: Settings, key: "settings" },
] as const;

export function DashboardLayout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isPremium = user?.subscription?.plan === "premium";
  const otherLang = i18n.language === "bn" ? "en" : "bn";
  const isActive = (to: string) => (to === "/dashboard" ? location.pathname === to : location.pathname === to || location.pathname.startsWith(`${to}/`));

  return (
    <>
      <SEO title={t("dashboardNav.seoTitle")} description={t("dashboardNav.seoDescription")} noIndex />
      <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_20%),radial-gradient(circle_at_top_right,_rgba(147,51,234,0.14),_transparent_20%)]">
        <aside
          id="dashboard-sidebar"
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col border-r border-border/80 bg-card/95 backdrop-blur transition-transform lg:static lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <Link to="/" className="gradient-text text-2xl font-bold">
              AI CV Builder BD
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)} aria-label={t("nav.closeMenu")}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs uppercase tracking-wider text-muted">{t("dashboardNav.workspace")}</p>
              <p className="mt-1 truncate text-sm font-semibold">{user?.name}</p>
              <Badge className="mt-2" variant={isPremium ? "premium" : "secondary"}>
                {isPremium ? t("dashboardNav.premium") : t("dashboardNav.free")}
              </Badge>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label={t("nav.main")}>
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                aria-current={isActive(item.to) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                  isActive(item.to) ? "bg-gradient-to-r from-primary to-violet-600 text-primary-foreground shadow-lg" : "hover:bg-secondary"
                )}
              >
                <item.icon className="h-4 w-4" aria-hidden />
                {t(`dashboardNav.${item.key}`)}
              </Link>
            ))}
            {user?.role === "admin" && (
              <Link to="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-secondary">
                <Shield className="h-4 w-4" aria-hidden />
                {t("dashboardNav.admin")}
              </Link>
            )}
          </nav>

          {!isPremium && (
            <div className="m-4 rounded-2xl border border-border bg-secondary/40 p-4">
              <p className="text-sm font-semibold">{t("dashboardNav.upgradeTitle")}</p>
              <p className="mt-1 text-sm text-muted">{t("dashboardNav.upgradeText")}</p>
              <Button variant="outline" className="mt-3 w-full justify-between" onClick={() => navigate("/dashboard/billing")}>
                {t("dashboardNav.manageBilling")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </aside>

        {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-border/80 bg-background/80 backdrop-blur">
            <div className="flex h-14 items-center justify-between gap-2 px-3 lg:h-16 lg:px-8">
              <div className="flex min-w-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                  aria-label={t("nav.openMenu")}
                  aria-expanded={sidebarOpen}
                  aria-controls="dashboard-sidebar"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <p className="truncate font-semibold">
                  {t("dashboard.welcome")}, {user?.name?.split(" ")[0]}
                </p>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Button variant="ghost" size="sm" onClick={() => setLanguage(otherLang)} aria-label={t("nav.switchLanguage")} title={t("nav.switchLanguage")}>
                  <Languages className="h-4 w-4" aria-hidden />
                  <span>{otherLang === "bn" ? "বাংলা" : "EN"}</span>
                </Button>
                {!isPremium && (
                  <Button variant="gradient" size="sm" className="hidden sm:inline-flex" onClick={() => navigate("/dashboard/billing")}>
                    {t("dashboardNav.upgrade")}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  aria-label={t("dashboardNav.logout")}
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">{t("dashboardNav.logout")}</span>
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
