import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Shield, FileText, Users, LayoutDashboard, LogOut, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { to: "/admin#overview", label: "Overview", icon: LayoutDashboard },
  { to: "/admin#content", label: "Content", icon: FileText },
  { to: "/admin#users", label: "Users", icon: Users },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActiveSection = (to: string) => {
    const [path, hash] = to.split("#");
    const matchesPath = location.pathname === path;
    if (!hash) {
      return matchesPath;
    }
    return matchesPath && location.hash === `#${hash}`;
  };

  const handleSidebarClick = (to: string) => {
    setSidebarOpen(false);

    const [, hash] = to.split("#");
    if (!hash) {
      navigate(to);
      return;
    }

    if (location.pathname === "/admin" && location.hash === `#${hash}`) {
      const target = document.getElementById(hash);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    navigate(to);

    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.15),_transparent_25%),radial-gradient(circle_at_top_right,_rgba(124,58,237,0.18),_transparent_20%)]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-slate-950 text-white transform transition-transform lg:translate-x-0 lg:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">ChakriCV</p>
            <p className="text-sm font-semibold text-white">Admin Control Center</p>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-300" />
              <span className="text-sm font-medium text-emerald-100">Privileged access</span>
            </div>
            <p className="mt-2 text-sm text-slate-200">Manage content, users, and platform growth from one secure workspace.</p>
          </div>
        </div>

        <nav className="space-y-1 px-3">
          {adminNavItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={(event) => {
                if (item.to.includes("#")) {
                  event.preventDefault();
                }
                handleSidebarClick(item.to);
              }}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
                isActiveSection(item.to) ? "bg-white text-slate-950 shadow-lg" : "text-slate-200 hover:bg-white/10"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">{user?.name}</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="premium">Admin</Badge>
            <Badge variant="secondary">Secure</Badge>
          </div>
          <Button
            variant="ghost"
            className="mt-4 w-full justify-start text-white hover:bg-white/10"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <div>
              <Button variant="ghost" size="icon" className="text-white lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden lg:block">
                <p className="text-sm text-slate-300">Platform operations</p>
                <h1 className="text-xl font-semibold text-white">Administrator workspace</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-100">
                <Sparkles className="h-4 w-4 text-amber-300" />
                Operational view
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
