import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SEO } from "@/components/seo/SEO";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/toast";

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "", referralCode: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      setAuth(data.data.user, data.data.accessToken);
      toast.add("Account created! Check email to verify.", "success");
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.add(msg || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Register" />
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("auth.register")}</CardTitle>
            <CardDescription>Start free — 2 resumes included</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t("auth.name")}</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("auth.email")}</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("auth.password")}</label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Referral Code (optional)</label>
                <Input
                  value={form.referralCode}
                  onChange={(e) => setForm({ ...form, referralCode: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" variant="gradient" disabled={loading}>
                {loading ? t("common.loading") : t("nav.register")}
              </Button>
            </form>
            <p className="text-center text-sm mt-4">
              {t("auth.hasAccount")}{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                {t("nav.login")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
