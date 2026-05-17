import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useToast } from "@/components/ui/toast";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const toast = useToast();
  const [name, setName] = useState(user?.name || "");

  const saveProfile = async () => {
    try {
      await api.patch("/auth/profile", {
        name,
        language: i18n.language,
        theme,
      });
      setUser({ name, language: i18n.language as "en" | "bn", theme });
      toast.add("Settings saved!", "success");
    } catch {
      toast.add("Failed to save", "error");
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input value={user?.email || ""} disabled className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Referral Code</label>
            <Input value={user?.referralCode || ""} disabled className="mt-1" />
            <p className="text-xs text-muted mt-1">Share this code to earn referral rewards</p>
          </div>
          <Button variant="gradient" onClick={saveProfile}>
            {t("common.save")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Language</label>
            <select
              className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Theme</label>
            <select
              className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={theme}
              onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
