import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/editor/fields";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SEO } from "@/components/seo/SEO";
import api, { getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/toast";
import { trackEvent, trackLead } from "@/lib/analytics";
import { GoogleSignIn, type GoogleSignInResult } from "@/components/auth/GoogleSignIn";

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
      toast.add(t("auth.welcome"), "success");
      navigate(from);
    } catch (err: unknown) {
      toast.add(getErrorMessage(err, t("auth.loginFailed")), "error");
    } finally {
      setLoading(false);
    }
  };

  // Google signs people up too: a new Google account gets an account here straight away
  const handleGoogle = ({ user, accessToken, isNewUser }: GoogleSignInResult) => {
    setAuth(user, accessToken);
    if (isNewUser) {
      trackEvent("sign_up", { method: "google" });
      trackLead();
    }
    toast.add(isNewUser ? t("auth.googleCreated") : t("auth.welcome"), "success");
    navigate(from);
  };

  return (
    <>
      <SEO title="Log in to AI CV Builder BD" description="Access your AI CV Builder BD account to build resumes, check ATS scores, and generate cover letters." />
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("auth.login")}</CardTitle>
            <CardDescription>{t("auth.loginSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <GoogleSignIn mode="signin" onSignedIn={handleGoogle} />
            <form onSubmit={handleSubmit} className="space-y-4">
              <TextField label={t("auth.email")} type="email" value={email} onChange={setEmail} required autoComplete="email" inputMode="email" />
              <TextField label={t("auth.password")} type="password" value={password} onChange={setPassword} required autoComplete="current-password" />
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <Button type="submit" className="w-full" variant="gradient" disabled={loading}>
                {loading ? t("common.loading") : t("nav.login")}
              </Button>
            </form>

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
