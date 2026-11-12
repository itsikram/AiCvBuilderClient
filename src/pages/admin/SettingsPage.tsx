import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, AlertCircle, Eye, EyeOff, RotateCcw, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { confirmAction } from "@/lib/confirm";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

interface Setting {
  key: string;
  label: string;
  type: "text" | "secret" | "number" | "boolean" | "textarea" | "url";
  help?: string;
  /** Example for account-specific values that have no default */
  placeholder?: string;
  secret: boolean;
  /** The value in use (saved, from .env or the default). Always empty for secrets: they are write-only */
  value: string;
  /** What applies when nothing is saved or set in .env ("" when there is none) */
  defaultValue?: string;
  preview?: string;
  isSet: boolean;
  source: "database" | "env" | "default" | "none";
  updatedAt?: string;
  updatedBy?: string;
}

interface SettingGroup {
  id: string;
  title: string;
  description: string;
  settings: Setting[];
}

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message;

function SourceBadge({ setting }: { setting: Setting }) {
  if (setting.source === "database") return <Badge variant="success">Saved here</Badge>;
  if (setting.source === "env") return <Badge variant="outline">From .env</Badge>;
  if (setting.source === "default") return <Badge variant="secondary">Default</Badge>;
  return <Badge variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300">Not set</Badge>;
}

const displayValue = (setting: Setting, value: string) =>
  setting.type === "boolean" ? (value === "true" ? "On" : "Off") : value;

interface GeminiKeyStatus {
  totalKeys: number;
  availableKeys: number;
  keys: Array<{ index: number; status: "active" | "rate_limited" | "disabled"; disabledReason?: string }>;
}

type GeminiTestResult =
  | { index: number; ok: true; model: string; ms: number }
  | { index: number; ok: false; model: string; problem: string; detail: string };

/** Live key health for the Gemini AI card, and a button that sends one tiny request per key. */
function GeminiStatus({ unsaved }: { unsaved: boolean }) {
  const toast = useToast();
  const status = useQuery({
    queryKey: ["admin-gemini-keys"],
    queryFn: async () => (await api.get("/admin/gemini-keys")).data.data as GeminiKeyStatus,
  });
  const test = useMutation({
    mutationFn: async () =>
      (await api.post("/admin/gemini-keys/test", {}, { timeout: 120_000 })).data.data.results as GeminiTestResult[],
    onSettled: () => status.refetch(),
    onError: (error) => toast.add(errorMessage(error) || "Could not run the test", "error"),
  });

  const blocked = status.data?.keys.filter((key) => key.status !== "active") ?? [];

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          <p className="font-medium">Key status</p>
          <p className="text-muted">
            {status.isLoading
              ? "Checking..."
              : !status.data?.totalKeys
                ? "No key set: AI features are off until you add one."
                : `${status.data.availableKeys} of ${status.data.totalKeys} key(s) ready`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => test.mutate()}
          disabled={unsaved || test.isPending || !status.data?.totalKeys}
          title={unsaved ? "Save your changes first" : undefined}
        >
          {test.isPending ? "Testing..." : "Test connection"}
        </Button>
      </div>
      {unsaved && <p className="text-xs text-amber-600">Save your Gemini changes before testing.</p>}
      {blocked.length > 0 && !test.data && (
        <ul className="space-y-1 text-xs text-red-600">
          {blocked.map((key) => (
            <li key={key.index}>
              Key #{key.index + 1}: {key.status === "rate_limited" ? "rate limited, retrying in a minute" : key.disabledReason || "disabled"}
            </li>
          ))}
        </ul>
      )}
      {test.data && (
        <ul className="space-y-2 text-sm">
          {test.data.map((result) => (
            <li key={result.index}>
              {result.ok ? (
                <span className="text-green-700 dark:text-green-400">
                  Key #{result.index + 1}: working with {result.model} ({result.ms} ms)
                </span>
              ) : (
                <>
                  <span className="text-red-600">
                    Key #{result.index + 1}: {result.problem}
                  </span>
                  <span className="mt-0.5 block break-words font-mono text-xs text-muted">{result.detail}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Sends a real email with the saved SMTP settings, to the admin or another address. */
function EmailTest({ unsaved }: { unsaved: boolean }) {
  const ownEmail = useAuthStore((state) => state.user?.email) ?? "";
  const [to, setTo] = useState("");
  const test = useMutation({
    mutationFn: async () =>
      (await api.post("/admin/settings/test-email", { to: to.trim() || undefined }, { timeout: 60_000 })).data as {
        message: string;
        data: { to: string; host: string; port: number; from: string };
      },
  });
  const failure = test.isError ? errorMessage(test.error) || "Could not send the test email" : "";

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div>
        <p className="text-sm font-medium">Send a test email</p>
        <p className="text-sm text-muted">
          Checks the saved settings by sending a real email. Admin notifications and verification emails use the same settings.
        </p>
      </div>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          test.mutate();
        }}
      >
        <Input
          type="email"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          placeholder={ownEmail ? `${ownEmail} (you)` : "you@example.com"}
          aria-label="Send the test email to"
          autoComplete="email"
          className="min-w-0 flex-1"
        />
        <Button type="submit" variant="outline" disabled={unsaved || test.isPending} title={unsaved ? "Save your changes first" : undefined}>
          <Send className="h-4 w-4" />
          {test.isPending ? "Sending..." : "Send test email"}
        </Button>
      </form>
      {unsaved && <p className="text-xs text-amber-600">Save your email changes before sending a test.</p>}
      {test.isSuccess && (
        <p className="text-sm text-green-700 dark:text-green-400" role="status">
          {test.data.message}{" "}
          <span className="text-muted">
            (via {test.data.data.host}:{test.data.data.port}, from {test.data.data.from})
          </span>
        </p>
      )}
      {failure && (
        <p className="break-words text-sm text-red-600" role="alert">
          {failure}
        </p>
      )}
    </div>
  );
}

/** UTF-8 safe base64 (settings can hold Bangla text, which btoa alone rejects). */
const toBase64 = (value: string) => {
  let binary = "";
  for (const byte of new TextEncoder().encode(value)) binary += String.fromCharCode(byte);
  return btoa(binary);
};

export default function AdminSettingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  // Only edited fields live here; everything else shows the saved value
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data } = await api.get("/admin/settings");
      return {
        groups: data.data.groups as SettingGroup[],
        acceptsBase64: Array.isArray(data.data.valueEncodings) && data.data.valueEncodings.includes("base64"),
      };
    },
  });
  const groups = settingsData?.groups;
  const [params, setParams] = useSearchParams();
  const activeGroup = groups?.find((group) => group.id === params.get("tab")) ?? groups?.[0];
  const selectTab = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("tab", id);
    setParams(next, { replace: true });
  };

  const saveMutation = useMutation({
    mutationFn: async (settings: Record<string, string>) => {
      // Firewalls in front of the API drop requests carrying a private key (a service account
      // JSON key), so send values base64-encoded once the server says it can decode them.
      const body = settingsData?.acceptsBase64
        ? {
            encoding: "base64",
            settings: Object.fromEntries(Object.entries(settings).map(([key, value]) => [key, toBase64(value)])),
          }
        : { settings };
      const { data } = await api.put("/admin/settings", body);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-gemini-keys"] });
      setEdits({});
      setRevealed(new Set());
      toast.add(data?.message || "Settings saved", "success");
    },
    onError: (error) => toast.add(errorMessage(error) || "Failed to save settings", "error"),
  });

  const clearMutation = useMutation({
    mutationFn: async (key: string) => api.delete(`/admin/settings/${key}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-gemini-keys"] });
      toast.add("Setting cleared", "success");
    },
    onError: (error) => toast.add(errorMessage(error) || "Failed to clear setting", "error"),
  });

  const change = (key: string, value: string) => setEdits((prev) => ({ ...prev, [key]: value }));

  const discard = (key: string) =>
    setEdits((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const toggleReveal = (key: string) =>
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const clearSetting = async (setting: Setting) => {
    const fallback = setting.defaultValue ? ` or else the default (${displayValue(setting, setting.defaultValue)})` : "";
    const ok = await confirmAction({
      title: setting.defaultValue ? `Reset ${setting.label} to its default?` : `Clear ${setting.label}?`,
      text: `The saved value is removed. The server then uses the .env value, if there is one${fallback}.`,
      confirmLabel: setting.defaultValue ? "Reset" : "Clear",
      destructive: true,
    });
    if (ok) clearMutation.mutate(setting.key);
  };

  const dirtyCount = Object.keys(edits).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Settings</h1>
          <p className="text-muted">Credentials and application settings</p>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((j) => (
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

  const renderInput = (setting: Setting) => {
    const edited = setting.key in edits;
    const value = edited ? edits[setting.key] : setting.value;

    if (setting.type === "boolean") {
      return (
        <div className="flex h-10 flex-1 items-center gap-3">
          <Switch
            id={`setting-${setting.key}`}
            checked={value === "true"}
            onCheckedChange={(checked) => change(setting.key, checked ? "true" : "false")}
            aria-label={setting.label}
          />
          <span className="text-sm text-muted">{value === "true" ? "On" : "Off"}</span>
        </div>
      );
    }

    if (setting.secret) {
      const isRevealed = revealed.has(setting.key);
      const placeholder = setting.isSet
        ? `Set (${setting.preview}). Type a new value to replace it`
        : setting.placeholder
          ? `Not set, e.g. ${setting.placeholder}`
          : "Not set";
      return (
        <div className="flex min-w-0 flex-1 gap-2">
          {setting.key === "GEMINI_API_KEYS" ? (
            <textarea
              id={`setting-${setting.key}`}
              className="min-h-20 w-full min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-sm"
              value={value}
              onChange={(e) => change(setting.key, e.target.value)}
              placeholder={placeholder}
              autoComplete="off"
              spellCheck={false}
            />
          ) : (
            <Input
              id={`setting-${setting.key}`}
              type={isRevealed ? "text" : "password"}
              value={value}
              onChange={(e) => change(setting.key, e.target.value)}
              placeholder={placeholder}
              autoComplete="new-password"
              className="min-w-0 flex-1"
            />
          )}
          {setting.key !== "GEMINI_API_KEYS" && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="shrink-0"
              onClick={() => toggleReveal(setting.key)}
              aria-label={isRevealed ? "Hide value" : "Show value"}
            >
              {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
        </div>
      );
    }

    return (
      <Input
        id={`setting-${setting.key}`}
        type={setting.type === "number" ? "number" : setting.type === "url" ? "url" : "text"}
        inputMode={setting.type === "number" ? "numeric" : undefined}
        value={value}
        onChange={(e) => change(setting.key, e.target.value)}
        placeholder={setting.defaultValue || (setting.placeholder ? `e.g. ${setting.placeholder}` : "")}
        className="min-w-0 flex-1"
      />
    );
  };

  /** Help, the default when the field shows something else, and who changed it last */
  const hints = (setting: Setting) => {
    const edited = setting.key in edits;
    const value = edited ? edits[setting.key] : setting.value;
    const parts: string[] = [];
    if (setting.help) parts.push(setting.help);
    if (!setting.secret && setting.defaultValue) {
      if (edited && !value.trim() && setting.type !== "boolean") parts.push(`Empty uses the default: ${setting.defaultValue}`);
      else if (value !== setting.defaultValue) parts.push(`Default: ${displayValue(setting, setting.defaultValue)}`);
    }
    if (setting.updatedAt) {
      parts.push(`Last updated ${new Date(setting.updatedAt).toLocaleString()}${setting.updatedBy ? ` by ${setting.updatedBy}` : ""}`);
    }
    return parts;
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Settings</h1>
          <p className="text-muted">Credentials and application settings. Every field shows the value in use.</p>
        </div>
        <Button
          variant="gradient"
          className="w-full sm:w-auto"
          onClick={() => saveMutation.mutate(edits)}
          disabled={dirtyCount === 0 || saveMutation.isPending}
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? "Saving..." : dirtyCount > 0 ? `Save changes (${dirtyCount})` : "Save changes"}
        </Button>
      </div>

      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
        <CardContent className="py-4 sm:pb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">Saved values override the server's .env file, which overrides the defaults</p>
              <p>
                Fields marked "Default" already use the value shown. Empty a field and save to go back to its default.
                Changes apply within a minute; secrets are never shown again after saving. Database, JWT and site URL
                settings stay in .env.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {groups && groups.length > 1 && (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div
            role="tablist"
            aria-label="Settings sections"
            className="flex w-max gap-1 rounded-xl bg-secondary p-1 sm:w-auto sm:flex-wrap"
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
              event.preventDefault();
              const index = groups.findIndex((group) => group.id === activeGroup?.id);
              const step = event.key === "ArrowRight" ? 1 : -1;
              const next = groups[(index + step + groups.length) % groups.length];
              selectTab(next.id);
              document.getElementById(`settings-tab-${next.id}`)?.focus();
            }}
          >
            {groups.map((group) => {
              const selected = group.id === activeGroup?.id;
              const unsaved = group.settings.filter((setting) => setting.key in edits).length;
              return (
                <button
                  key={group.id}
                  id={`settings-tab-${group.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`settings-${group.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectTab(group.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    selected ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground"
                  )}
                >
                  {group.title}
                  {unsaved > 0 && (
                    <span
                      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-semibold text-white"
                      aria-label={`${unsaved} unsaved`}
                    >
                      {unsaved}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeGroup && [activeGroup].map((group) => (
        <Card key={group.id} id={`settings-${group.id}`} role="tabpanel" aria-labelledby={`settings-tab-${group.id}`}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {group.settings.map((setting) => {
              const edited = setting.key in edits;
              const notes = hints(setting);
              return (
                <div
                  key={setting.key}
                  className="grid gap-2 py-4 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-6"
                >
                  <div className="min-w-0">
                    <label htmlFor={`setting-${setting.key}`} className="text-sm font-medium">
                      {setting.label}
                    </label>
                    <p className="break-all font-mono text-[11px] text-muted">{setting.key}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <SourceBadge setting={setting} />
                      {edited && <Badge variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300">Unsaved</Badge>}
                    </div>
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-start gap-2">
                      {renderInput(setting)}
                      {edited ? (
                        <Button size="icon" variant="ghost" className="shrink-0" onClick={() => discard(setting.key)} aria-label={`Undo change to ${setting.label}`} title="Undo change">
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        setting.source === "database" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="shrink-0"
                            onClick={() => clearSetting(setting)}
                            disabled={clearMutation.isPending}
                            aria-label={setting.defaultValue ? `Reset ${setting.label} to default` : `Clear ${setting.label}`}
                            title={setting.defaultValue ? "Reset to default" : "Clear"}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )
                      )}
                    </div>
                    {notes.length > 0 && <p className="break-words text-xs text-muted">{notes.join(" · ")}</p>}
                  </div>
                </div>
              );
            })}
            {group.id === "ai" && (
              <div className="pt-4">
                <GeminiStatus unsaved={group.settings.some((setting) => setting.key in edits)} />
              </div>
            )}
            {group.id === "email" && (
              <div className="pt-4">
                <EmailTest unsaved={group.settings.some((setting) => setting.key in edits)} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {dirtyCount > 0 && (
        <div
          role="region"
          aria-label="Unsaved changes"
          className="fixed inset-x-3 bottom-3 z-30 flex flex-col gap-2 rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur sm:inset-x-auto sm:right-6 sm:bottom-6 sm:flex-row sm:items-center sm:gap-3 sm:pl-4"
        >
          <p className="text-sm font-medium">
            {dirtyCount} unsaved change{dirtyCount === 1 ? "" : "s"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setEdits({})} disabled={saveMutation.isPending}>
              Discard
            </Button>
            <Button variant="gradient" className="flex-1 sm:flex-none" onClick={() => saveMutation.mutate(edits)} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
