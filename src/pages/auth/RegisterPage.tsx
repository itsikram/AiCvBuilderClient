import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextField } from "@/components/editor/fields";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SEO } from "@/components/seo/SEO";
import api, { getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/toast";

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "", referralCode: "" });
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("password", form.password);
      if (form.referralCode) {
        formData.append("referralCode", form.referralCode);
      }
      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }

      const { data } = await api.post("/auth/register", formData);
      setAuth(data.data.user, data.data.accessToken);
      toast.add(t("auth.created"), "success");
      navigate("/dashboard");
    } catch (err: unknown) {
      toast.add(getErrorMessage(err, t("auth.registerFailed")), "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePictureChange = (file: File | null) => {
    setProfilePicture(file);
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  return (
    <>
      <SEO
        title="Create your AI CV Builder BD account"
        description="Sign up for AI CV Builder BD and build AI-powered resumes, cover letters, and ATS-ready documents in minutes."
        noIndex
      />
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("auth.register")}</CardTitle>
            <CardDescription>{t("auth.registerSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-sm font-medium">{t("auth.photo")}</p>
                <div className="mt-2 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-secondary">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-muted">{t("auth.noImage")}</span>
                    )}
                  </div>
                  <label className="inline-flex cursor-pointer items-center rounded-lg border border-border px-3 py-2 text-sm font-medium focus-within:ring-2 focus-within:ring-primary">
                    {t("auth.chooseImage")}
                    <Input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => handlePictureChange(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>
              <TextField label={t("auth.name")} value={form.name} onChange={(name) => setForm({ ...form, name })} required autoComplete="name" />
              <TextField label={t("auth.email")} type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} required autoComplete="email" inputMode="email" />
              <TextField
                label={t("auth.password")}
                hint={t("auth.passwordHint")}
                type="password"
                value={form.password}
                onChange={(password) => setForm({ ...form, password })}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <TextField label={t("auth.referral")} value={form.referralCode} onChange={(referralCode) => setForm({ ...form, referralCode })} />
              <Button type="submit" className="w-full" variant="gradient" disabled={loading}>
                {loading ? t("common.loading") : t("nav.register")}
              </Button>
            </form>
            <p className="text-center text-sm mt-4">
              {t("auth.hasAccount")} {" "}
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
