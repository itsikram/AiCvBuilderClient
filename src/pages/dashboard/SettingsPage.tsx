import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/editor/fields";
import api, { getErrorMessage } from "@/lib/api";
import { normalizeLanguage } from "@/lib/language";
import { setLanguage } from "@/i18n";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useToast } from "@/components/ui/toast";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const toast = useToast();
  const [name, setName] = useState(user?.name || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);

  const [shownAvatar, setShownAvatar] = useState(user?.avatar);
  if (user?.avatar !== shownAvatar) {
    setShownAvatar(user?.avatar);
    setAvatarPreview(user?.avatar || null);
  }

  const saveProfile = async () => {
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("language", normalizeLanguage(i18n.language));
      formData.append("theme", theme);
      if (avatarFile) {
        formData.append("profilePicture", avatarFile);
      }

      const { data } = await api.patch("/auth/profile", formData);
      const updatedUser = data.data;
      setUser({
        name: updatedUser.name,
        language: updatedUser.language,
        theme: updatedUser.theme,
        avatar: updatedUser.avatar,
      });
      setAvatarFile(null);
      toast.add(t("settings.saved"), "success");
    } catch (error) {
      toast.add(getErrorMessage(error, t("settings.saveFailed")), "error");
    }
  };

  const handleAvatarChange = (file: File | null) => {
    setAvatarFile(file);
    if (!file) {
      setAvatarPreview(user?.avatar || null);
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));
  };

  return (
    <div className="w-full space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboardNav.settings")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profile")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">{t("settings.picture")}</p>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-secondary">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-muted">{t("auth.noImage")}</span>
                )}
              </div>
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-border px-3 py-2 text-sm font-medium focus-within:ring-2 focus-within:ring-primary">
                {t("settings.uploadPicture")}
                <Input type="file" accept="image/*" className="sr-only" onChange={(e) => handleAvatarChange(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>
          <TextField label={t("auth.name")} value={name} onChange={setName} autoComplete="name" />
          <TextField label={t("auth.email")} value={user?.email || ""} onChange={() => undefined} disabled />
          <TextField label={t("settings.referralCode")} hint={t("settings.referralHint")} value={user?.referralCode || ""} onChange={() => undefined} readOnly />
          <Button variant="gradient" onClick={saveProfile}>
            {t("common.save")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.preferences")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SelectField
            label={t("settings.language")}
            value={normalizeLanguage(i18n.language)}
            onChange={(v) => setLanguage(normalizeLanguage(v))}
            options={[
              { value: "en", label: "English" },
              { value: "bn", label: "বাংলা" },
            ]}
          />
          <SelectField
            label={t("settings.theme")}
            value={theme}
            onChange={(v) => setTheme(v as "light" | "dark" | "system")}
            options={(["light", "dark", "system"] as const).map((v) => ({ value: v, label: t(`settings.themes.${v}`) }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
