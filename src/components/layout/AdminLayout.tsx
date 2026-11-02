import { useEffect, useRef, useState, type ComponentType } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CreditCard,
  DollarSign,
  Edit3,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
  Menu,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Shows the number of bKash payments waiting for review */
  pendingPayments?: boolean;
}

const navGroups: Array<{ title: string; items: NavItem[] }> = [
  { title: "General", items: [{ to: "/admin", label: "Overview", icon: LayoutDashboard }] },
  {
    title: "Customers",
    items: [
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/bkash-payments", label: "bKash payments", icon: CreditCard, pendingPayments: true },
      { to: "/admin/plans", label: "Subscription plans", icon: DollarSign },
    ],
  },
  {
    title: "Content",
    items: [
      { to: "/admin/templates", label: "Templates", icon: Palette },
      { to: "/admin/content-manager", label: "Page content", icon: Edit3 },
      { to: "/admin/menu-manager", label: "Menu manager", icon: LinkIcon },
      { to: "/admin/blog", label: "Blog", icon: FileText },
    ],
  },
  { title: "System", items: [{ to: "/admin/settings", label: "Settings", icon: Settings }] },
];

const allItems = navGroups.flatMap((group) => group.items);

const isActive = (pathname: string, to: string) =>
  to === "/admin" ? pathname === "/admin" || pathname === "/admin/" : pathname === to || pathname.startsWith(`${to}/`);

const COLLAPSED_KEY = "admin-sidebar-collapsed";

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
};

const initials = (name?: string) =>
  (name || "Admin")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const closeButton = useRef<HTMLButtonElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  // Same query (and cache) as the bKash payments page with the "pending" filter
  const pending = useQuery({
    queryKey: ["admin-bkash-payments", "pending"],
    queryFn: async () => (await api.get("/admin/bkash/payments?status=pending")).data.data as { payments: unknown[] },
    refetchInterval: 60_000,
  });
  const pendingCount = pending.data?.payments.length ?? 0;

  const current = allItems.find((item) => isActive(location.pathname, item.to));

  // Close the drawer when the route changes (render-time state adjustment)
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setMobileOpen(false);
  }

  // While the drawer is open: Escape closes it, the page behind does not scroll, focus moves in and back
  useEffect(() => {
    if (!mobileOpen) return;
    const opener = menuButton.current;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [mobileOpen]);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, value ? "0" : "1");
      } catch {
        /* storage unavailable: keep the choice for this visit only */
      }
      return !value;
    });
  };

  // The icon-only rail applies to the desktop sidebar; the mobile drawer always shows labels
  const rail = collapsed;

  return (
    <>
      <SEO title="AI CV Builder BD admin" description="Administrative dashboard for platform content, user management, and site operations." noIndex />
      <div className="flex min-h-screen bg-background">
        <aside
          id="admin-sidebar"
          aria-label="Admin navigation"
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-slate-950 text-slate-200 shadow-2xl transition-[transform,width] duration-200 ease-out",
            "lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:max-w-none lg:translate-x-0 lg:shadow-none",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
            rail ? "lg:w-[76px]" : "lg:w-64"
          )}
        >
          {/* Brand */}
          <div className={cn("flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4", rail && "lg:justify-center lg:px-0")}>
            <Link to="/admin" className="flex min-w-0 items-center gap-3" title="Admin overview">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg shadow-violet-900/40">
                <Shield className="h-5 w-5" aria-hidden />
              </span>
              <span className={cn("min-w-0", rail && "lg:sr-only")}>
                <span className="block truncate text-sm font-semibold text-white">AI CV Builder BD</span>
                <span className="block text-xs text-slate-400">Admin console</span>
              </span>
            </Link>
            <Button
              ref={closeButton}
              variant="ghost"
              size="icon"
              className="ml-auto text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4" aria-label="Admin sections">
            {navGroups.map((group) => (
              <div key={group.title} className="mb-5 last:mb-0">
                <p className={cn("mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500", rail && "lg:sr-only")}>
                  {group.title}
                </p>
                {rail && <div className="mx-auto mb-2 hidden h-px w-8 bg-white/10 lg:block" aria-hidden />}
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const active = isActive(location.pathname, item.to);
                    const badge = item.pendingPayments && pendingCount > 0 ? pendingCount : 0;
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          aria-current={active ? "page" : undefined}
                          title={rail ? item.label : undefined}
                          className={cn(
                            "group relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                            active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white",
                            rail && "lg:justify-center lg:px-0"
                          )}
                        >
                          {active && <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-gradient-to-b from-blue-400 to-violet-500" aria-hidden />}
                          <item.icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-blue-300" : "text-slate-400 group-hover:text-slate-200")} />
                          <span className={cn("truncate", rail && "lg:sr-only")}>{item.label}</span>
                          {badge > 0 && (
                            <span
                              className={cn(
                                "ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold leading-none text-slate-950",
                                rail && "lg:absolute lg:right-2 lg:top-1 lg:ml-0 lg:px-1.5"
                              )}
                              aria-label={`${badge} pending`}
                            >
                              {badge > 99 ? "99+" : badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Account */}
          <div className="shrink-0 space-y-1 border-t border-white/10 p-3">
            <Link
              to="/dashboard"
              title={rail ? "Back to my dashboard" : undefined}
              className={cn("flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white", rail && "lg:justify-center lg:px-0")}
            >
              <ArrowLeft className="h-[18px] w-[18px] shrink-0 text-slate-400" />
              <span className={cn(rail && "lg:sr-only")}>My dashboard</span>
            </Link>
            <div className={cn("flex items-center gap-3 rounded-lg px-3 py-2", rail && "lg:justify-center lg:px-0")}>
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white" aria-hidden>
                  {initials(user?.name)}
                </span>
              )}
              <div className={cn("min-w-0 flex-1", rail && "lg:sr-only")}>
                <p className="truncate text-sm font-medium text-white">{user?.name}</p>
                <p className="truncate text-xs text-slate-400">{user?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={cn("shrink-0 text-slate-400 hover:bg-white/10 hover:text-white", rail && "lg:hidden")}
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                aria-label="Log out"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white lg:flex"
              aria-label={rail ? "Expand sidebar" : "Collapse sidebar"}
              aria-pressed={rail}
              title={rail ? "Expand sidebar" : "Collapse sidebar"}
              style={rail ? { justifyContent: "center", paddingLeft: 0, paddingRight: 0 } : undefined}
            >
              {rail ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
              <span className={cn(rail && "sr-only")}>Collapse</span>
            </button>
          </div>
        </aside>

        {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden />}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 lg:px-8">
              <Button
                ref={menuButton}
                variant="ghost"
                size="icon"
                className="-ml-2 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                aria-controls="admin-sidebar"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">Admin</p>
                <p className="truncate font-semibold leading-tight">{current?.label ?? "Admin"}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/" target="_blank" rel="noreferrer" aria-label="View site (opens in a new tab)">
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden sm:inline">View site</span>
                </Link>
              </Button>
            </div>
          </header>

          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
