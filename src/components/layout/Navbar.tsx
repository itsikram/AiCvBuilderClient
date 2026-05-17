import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X, Sun, Moon, Globe } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";

export function Navbar() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const { isAuthenticated, logout } = useAuthStore();
  const { resolvedTheme, setTheme } = useThemeStore();
  const navigate = useNavigate();

  const toggleLang = () => i18n.changeLanguage(i18n.language === "en" ? "bn" : "en");
  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white font-bold text-sm">
            CV
          </div>
          <span className="text-xl font-bold gradient-text">ChakriCV</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/pricing" className="text-sm hover:text-primary transition-colors">
            {t("nav.pricing")}
          </Link>
          <Link to="/blog" className="text-sm hover:text-primary transition-colors">
            {t("nav.blog")}
          </Link>
          <Link to="/contact" className="text-sm hover:text-primary transition-colors">
            {t("nav.contact")}
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleLang}>
            <Globe className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {isAuthenticated ? (
            <>
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                {t("nav.dashboard")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/login")}>
                {t("nav.login")}
              </Button>
              <Button variant="gradient" onClick={() => navigate("/register")}>
                {t("nav.register")}
              </Button>
            </>
          )}
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border p-4 flex flex-col gap-3">
          <Link to="/pricing" onClick={() => setOpen(false)}>
            {t("nav.pricing")}
          </Link>
          <Link to="/blog" onClick={() => setOpen(false)}>
            {t("nav.blog")}
          </Link>
          {isAuthenticated ? (
            <Button
              onClick={() => {
                navigate("/dashboard");
                setOpen(false);
              }}
            >
              {t("nav.dashboard")}
            </Button>
          ) : (
            <Button
              variant="gradient"
              onClick={() => {
                navigate("/register");
                setOpen(false);
              }}
            >
              {t("nav.register")}
            </Button>
          )}
        </div>
      )}
    </header>
  );
}
