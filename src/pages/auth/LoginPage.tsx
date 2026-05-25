import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SEO } from "@/components/seo/SEO";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setAuth(data.data.user, data.data.accessToken);
      toast.add("Welcome back!", "success");
      navigate(from);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.add(msg || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential: string) => {
    try {
      const { data } = await api.post("/auth/google", { credential });
      setAuth(data.data.user, data.data.accessToken);
      navigate(from);
    } catch {
      toast.add("Google login failed", "error");
    }
  };

  return (
    <>
      <SEO title="Log in to ChakriCV" description="Access your ChakriCV account to build resumes, check ATS scores, and generate cover letters." noIndex />
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("auth.login")}</CardTitle>
            <CardDescription>ChakriCV — AI Resume Builder</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t("auth.email")}</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium">{t("auth.password")}</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <Button type="submit" className="w-full" variant="gradient" disabled={loading}>
                {loading ? t("common.loading") : t("nav.login")}
              </Button>
            </form>

            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <>
                <p className="text-center text-sm text-muted">{t("auth.orContinueWith")}</p>
                <GoogleLogin
                  onSuccess={(res) => res.credential && handleGoogle(res.credential)}
                  onError={() => toast.add("Google login failed", "error")}
                  width="100%"
                />
              </>
            )}

            <p className="text-center text-sm">
              {t("auth.noAccount")}{" "}
              <Link to="/register" className="text-primary font-medium hover:underline">
                {t("nav.register")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
