import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface SettingValue {
  value: string;
  updatedAt: string;
  updatedBy?: string;
}

interface SettingsMap {
  [key: string]: SettingValue;
}

const settingCategories = [
  {
    title: "Site Configuration",
    description: "Basic site settings and branding",
    keys: ["SITE_NAME", "SITE_TAGLINE", "SUPPORT_EMAIL", "CONTACT_EMAIL"],
  },
  {
    title: "Company Information",
    description: "Company details for invoices and legal",
    keys: ["COMPANY_NAME", "COMPANY_ADDRESS", "COMPANY_PHONE"],
  },
  {
    title: "Payment Settings",
    description: "Payment gateway and currency configuration",
    keys: ["DEFAULT_CURRENCY", "TAX_RATE", "SSL_COMMERZ_STORE_ID", "SSL_COMMERZ_STORE_PASSWD", "NAGAD_MERCHANT_NUMBER", "NAGAD_MERCHANT_PASSWORD"],
  },
  {
    title: "User Limits",
    description: "Free and premium user limits",
    keys: ["MAX_RESUMES_FREE", "MAX_AI_REQUESTS_FREE", "MAX_RESUMES_PREMIUM", "MAX_AI_REQUESTS_PREMIUM", "REFERRAL_BONUS_AMOUNT"],
  },
  {
    title: "Email Configuration",
    description: "SMTP settings for email notifications",
    keys: ["SMTP_HOST", "SMTP_PORT", "SMTP_FROM_EMAIL", "SMTP_FROM_NAME"],
  },
  {
    title: "Storage Configuration",
    description: "Cloudinary settings for file uploads",
    keys: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY"],
  },
  {
    title: "Feature Toggles",
    description: "Enable or disable features",
    keys: ["MAINTENANCE_MODE", "REGISTRATION_ENABLED", "GOOGLE_CLIENT_ID"],
  },
];

const friendlyNames: Record<string, string> = {
  SITE_NAME: "Site Name",
  SITE_TAGLINE: "Site Tagline",
  SUPPORT_EMAIL: "Support Email",
  CONTACT_EMAIL: "Contact Email",
  COMPANY_NAME: "Company Name",
  COMPANY_ADDRESS: "Company Address",
  COMPANY_PHONE: "Company Phone",
  DEFAULT_CURRENCY: "Default Currency",
  TAX_RATE: "Tax Rate (%)",
  REFERRAL_BONUS_AMOUNT: "Referral Bonus Amount",
  MAX_RESUMES_FREE: "Max Resumes (Free)",
  MAX_AI_REQUESTS_FREE: "Max AI Requests (Free)",
  MAX_RESUMES_PREMIUM: "Max Resumes (Premium)",
  MAX_AI_REQUESTS_PREMIUM: "Max AI Requests (Premium)",
  MAINTENANCE_MODE: "Maintenance Mode",
  REGISTRATION_ENABLED: "Registration Enabled",
  GOOGLE_CLIENT_ID: "Google Client ID",
  SSL_COMMERZ_STORE_ID: "SSLCommerz Store ID",
  SSL_COMMERZ_STORE_PASSWD: "SSLCommerz Store Password",
  SMTP_HOST: "SMTP Host",
  SMTP_PORT: "SMTP Port",
  SMTP_FROM_EMAIL: "SMTP From Email",
  SMTP_FROM_NAME: "SMTP From Name",
  CLOUDINARY_CLOUD_NAME: "Cloudinary Cloud Name",
  CLOUDINARY_API_KEY: "Cloudinary API Key",
  NAGAD_MERCHANT_NUMBER: "Nagad Merchant Number",
  NAGAD_MERCHANT_PASSWORD: "Nagad Merchant Password",
};

export default function AdminSettingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<SettingsMap>({});
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set());

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data } = await api.get("/admin/settings");
      return data.data as { settings: SettingsMap; allowedKeys: string[] };
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data } = await api.put("/admin/settings", { key, value });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.add("Setting updated successfully!", "success");
      setUnsavedChanges(new Set());
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.add(msg || "Failed to update setting", "error");
    },
  });

  const saveSetting = (key: string) => {
    const value = settings[key]?.value || "";
    updateMutation.mutate({ key, value });
  };

  const saveAll = () => {
    unsavedChanges.forEach((key) => {
      saveSetting(key);
    });
  };

  const handleSettingChange = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: { ...prev[key], value },
    }));
    setUnsavedChanges((prev) => new Set(prev).add(key));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Settings</h1>
          <p className="text-muted">Configure application settings and environment variables</p>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="grid gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Settings</h1>
          <p className="text-muted">Configure application settings and environment variables</p>
        </div>
        {unsavedChanges.size > 0 && (
          <Button variant="gradient" onClick={saveAll} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Save All ({unsavedChanges.size})
          </Button>
        )}
      </div>

      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Configuration Priority</p>
              <p>Environment variables have the highest priority. Values set here will only be used if the corresponding environment variable is not set. After changing environment variables, you may need to restart the server.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {settingCategories.map((category) => {
        const categorySettings = category.keys.filter(
          (key) => settingsData?.settings?.[key] !== undefined
        );
        
        if (categorySettings.length === 0) return null;

        return (
          <Card key={category.title}>
            <CardHeader>
              <CardTitle>{category.title}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {categorySettings.map((key) => {
                const currentValue = settings[key]?.value ?? settingsData?.settings?.[key]?.value ?? "";
                const isUnsaved = unsavedChanges.has(key);
                const isUpdating = updateMutation.isPending;

                return (
                  <div key={key} className="grid gap-2">
                    <label className="text-sm font-medium flex items-center justify-between">
                      <span>{friendlyNames[key] || key}</span>
                      {isUnsaved && (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Unsaved
                        </span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={currentValue}
                        onChange={(e) => handleSettingChange(key, e.target.value)}
                        placeholder={`Enter ${friendlyNames[key] || key}`}
                        className="flex-1"
                      />
                      {isUnsaved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => saveSetting(key)}
                          disabled={isUpdating}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {settingsData?.settings?.[key]?.updatedAt && (
                      <p className="text-xs text-muted">
                        Last updated: {new Date(settingsData.settings[key].updatedAt).toLocaleString()}
                        {settingsData.settings[key].updatedBy && ` by ${settingsData.settings[key].updatedBy}`}
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}