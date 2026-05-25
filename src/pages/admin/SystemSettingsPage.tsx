import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";

interface SettingDefinition {
  key: string;
  label: string;
  type: "text" | "password" | "textarea";
  section: string;
  helpText?: string;
}

const settingDefinitions: SettingDefinition[] = [
  { key: "APP_NAME", label: "App Name", type: "text", section: "Core" },
  { key: "APP_URL", label: "App URL", type: "text", section: "Core" },
  { key: "CLIENT_URL", label: "Client URL", type: "text", section: "Core" },
  { key: "JWT_SECRET", label: "JWT Secret", type: "password", section: "Security" },
  { key: "JWT_EXPIRES_IN", label: "JWT Expiry", type: "text", section: "Security" },
  { key: "JWT_REFRESH_SECRET", label: "Refresh Secret", type: "password", section: "Security" },
  { key: "JWT_REFRESH_EXPIRES_IN", label: "Refresh Expiry", type: "text", section: "Security" },
  { key: "GOOGLE_CLIENT_ID", label: "Google Client ID", type: "text", section: "Google" },
  { key: "GOOGLE_CLIENT_SECRET", label: "Google Client Secret", type: "password", section: "Google" },
  { key: "GEMINI_API_KEY", label: "Gemini API Key", type: "password", section: "AI" },
  { key: "GEMINI_API_KEYS", label: "Gemini API Keys", type: "textarea", section: "AI", helpText: "Comma-separated list" },
  { key: "GEMINI_MODEL", label: "Gemini Model", type: "text", section: "AI" },
  { key: "PDFTXT_API_KEY", label: "PDFTXT API Key", type: "password", section: "AI" },
  { key: "CLOUDINARY_CLOUD_NAME", label: "Cloudinary Cloud Name", type: "text", section: "Media" },
  { key: "CLOUDINARY_API_KEY", label: "Cloudinary API Key", type: "password", section: "Media" },
  { key: "CLOUDINARY_API_SECRET", label: "Cloudinary API Secret", type: "password", section: "Media" },
  { key: "SMTP_HOST", label: "SMTP Host", type: "text", section: "Email" },
  { key: "SMTP_PORT", label: "SMTP Port", type: "text", section: "Email" },
  { key: "SMTP_USER", label: "SMTP User", type: "text", section: "Email" },
  { key: "SMTP_PASS", label: "SMTP Password", type: "password", section: "Email" },
  { key: "EMAIL_FROM", label: "Email From", type: "text", section: "Email" },
  { key: "SSL_STORE_ID", label: "SSL Store ID", type: "text", section: "Payments" },
  { key: "SSL_STORE_PASS", label: "SSL Store Password", type: "password", section: "Payments" },
  { key: "SSL_IS_LIVE", label: "SSL Live Mode", type: "text", section: "Payments", helpText: "true or false" },
  { key: "SSL_SUCCESS_URL", label: "SSL Success URL", type: "text", section: "Payments" },
  { key: "SSL_FAIL_URL", label: "SSL Fail URL", type: "text", section: "Payments" },
  { key: "SSL_CANCEL_URL", label: "SSL Cancel URL", type: "text", section: "Payments" },
  { key: "SSL_IPN_URL", label: "SSL IPN URL", type: "text", section: "Payments" },
];

const secretKeys = new Set([
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "GOOGLE_CLIENT_SECRET",
  "GEMINI_API_KEY",
  "PDFTXT_API_KEY",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "SMTP_PASS",
  "SSL_STORE_PASS",
]);

export default function SystemSettingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Record<string, boolean>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data } = await api.get("/admin/settings");
      return data.data as Array<{ key: string; value: string }>;
    },
  });

  useEffect(() => {
    if (!settings) return;
    const nextValues: Record<string, string> = {};
    for (const setting of settings) {
      nextValues[setting.key] = setting.value || "";
    }
    setValues(nextValues);
    setDirtyKeys({});
  }, [settings]);

  const groupedSettings = useMemo(() => {
    return settingDefinitions.reduce<Record<string, SettingDefinition[]>>((acc, setting) => {
      acc[setting.section] = acc[setting.section] || [];
      acc[setting.section].push(setting);
      return acc;
    }, {});
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = Object.entries(values).reduce<Record<string, string>>((acc, [key, value]) => {
        if (dirtyKeys[key]) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const { data } = await api.put("/admin/settings", { settings: payload });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      setDirtyKeys({});
      toast.add("Admin settings updated", "success");
    },
    onError: () => {
      toast.add("Failed to update admin settings", "error");
    },
  });

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDirtyKeys((prev) => ({ ...prev, [key]: true }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-muted">Manage runtime configuration values from the dashboard. Env values still take priority.</p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">Loading settings…</CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSettings).map(([section, sectionSettings]) => (
            <Card key={section}>
              <CardHeader>
                <CardTitle>{section}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {sectionSettings.map((setting) => {
                  const isSecret = secretKeys.has(setting.key);
                  return (
                    <div key={setting.key} className="space-y-2">
                      <label className="text-sm font-medium">{setting.label}</label>
                      {setting.type === "textarea" ? (
                        <textarea
                          className="min-h-28 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          value={values[setting.key] || ""}
                          onChange={(e) => handleChange(setting.key, e.target.value)}
                          placeholder={isSecret ? "Update to change this secret" : ""}
                        />
                      ) : (
                        <Input
                          type={isSecret ? "password" : "text"}
                          value={values[setting.key] || ""}
                          onChange={(e) => handleChange(setting.key, e.target.value)}
                          placeholder={isSecret ? "Update to change this secret" : ""}
                        />
                      )}
                      {setting.helpText && <p className="text-xs text-muted">{setting.helpText}</p>}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || Object.keys(dirtyKeys).length === 0}>
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
