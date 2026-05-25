import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  Mail,
  Target,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/seo/SEO";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/dashboard/resumes", icon: FileText, label: "My Resumes" },
  { to: "/dashboard/templates", icon: Sparkles, label: "Templates" },
  { to: "/dashboard/ats", icon: Target, label: "ATS Checker" },
  { to: "/dashboard/cover-letters", icon: Mail, label: "Cover Letters" },
  { to: "/dashboard/billing", icon: CreditCard, label: "Billing" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function DashboardLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isPremium = user?.subscription?.plan === "premium";

  return (
    <>
      <SEO title="ChakriCV dashboard" description="Manage your resumes, templates, ATS checks, and billing from your private ChakriCV dashboard." noIndex />
      <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_20%),radial-gradient(circle_at_top_right,_rgba(147,51,234,0.14),_transparent_20%)]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 border-r border-border/80 bg-card/95 backdrop-blur transform transition-transform lg:translate-x-0 lg:static",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link to="/" className="font-bold gradient-text text-lg">
            ChakriCV
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Workspace</p>
            <p className="mt-2 text-sm font-semibold">{user?.name}</p>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant={isPremium ? "premium" : "secondary"}>{isPremium ? "Premium" : "Free"}</Badge>
              <span className="text-xs text-muted-foreground">Ready to build</span>
            </div>
          </div>
        </div>

        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
                location.pathname === item.to || location.pathname.startsWith(item.to + "/")
                  ? "bg-gradient-to-r from-primary to-violet-600 text-primary-foreground shadow-lg"
                  : "hover:bg-secondary"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-secondary"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-border bg-secondary/40 p-4">
          <p className="text-sm font-semibold">Need a stronger plan?</p>
          <p className="mt-1 text-sm text-muted-foreground">Unlock AI tools, premium templates, and faster exports.</p>
          <Button
            variant="outline"
            className="mt-3 w-full justify-between"
            onClick={() => navigate("/dashboard/billing")}
          >
            Manage billing
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b border-border/80 bg-background/80 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-4 lg:px-8">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <p className="text-sm text-muted-foreground">Welcome back</p>
                  <h1 className="text-lg font-semibold sm:text-xl">{t("dashboard.welcome")}, {user?.name?.split(" ")[0]}</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!isPremium && (
                  <Button variant="gradient" size="sm" onClick={() => navigate("/dashboard/billing")}>
                    Upgrade to Premium
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 lg:p-8 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
