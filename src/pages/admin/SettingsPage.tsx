import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, AlertCircle, Eye, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { confirmAction } from "@/lib/confirm";
import api from "@/lib/api";

interface Setting {
  key: string;
  label: string;
  type: "text" | "secret" | "number" | "boolean" | "textarea" | "url";
  help?: string;
  secret: boolean;
  /** Always empty for secrets: they are write-only */
  value: string;
  preview?: string;
  isSet: boolean;
  source: "database" | "env" | "none";
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
  return <Badge variant="secondary">Not set</Badge>;
}

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

export default function AdminSettingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  // Only edited fields live here; everything else shows the saved value
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const { data: groups, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data } = await api.get("/admin/settings");
      return data.data.groups as SettingGroup[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (settings: Record<string, string>) => {
      const { data } = await api.put("/admin/settings", { settings });
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
    const ok = await confirmAction({
      title: `Clear ${setting.label}?`,
      text: "The saved value is removed. The server then uses the .env value, if there is one.",
      confirmLabel: "Clear",
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
        <Switch
          checked={value === "true"}
          onCheckedChange={(checked) => change(setting.key, checked ? "true" : "false")}
          aria-label={setting.label}
        />
      );
    }

    if (setting.secret) {
      const isRevealed = revealed.has(setting.key);
      const placeholder = setting.isSet
        ? `Set (${setting.preview}). Type a new value to replace it`
        : "Not set";
      return (
        <div className="flex flex-1 gap-2">
          {setting.key === "GEMINI_API_KEYS" ? (
            <textarea
              className="min-h-20 w-full flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
              value={value}
              onChange={(e) => change(setting.key, e.target.value)}
              placeholder={placeholder}
              autoComplete="off"
              spellCheck={false}
            />
          ) : (
            <Input
              type={isRevealed ? "text" : "password"}
              value={value}
              onChange={(e) => change(setting.key, e.target.value)}
              placeholder={placeholder}
              autoComplete="new-password"
              className="flex-1"
            />
          )}
          {setting.key !== "GEMINI_API_KEYS" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
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
        type={setting.type === "number" ? "number" : setting.type === "url" ? "url" : "text"}
        value={value}
        onChange={(e) => change(setting.key, e.target.value)}
        placeholder={setting.label}
        className="flex-1"
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin Settings</h1>
          <p className="text-muted">Credentials and application settings</p>
        </div>
        <div className="flex gap-2">
          {dirtyCount > 0 && (
            <Button variant="outline" onClick={() => setEdits({})} disabled={saveMutation.isPending}>
              Discard
            </Button>
          )}
          <Button
            variant="gradient"
            onClick={() => saveMutation.mutate(edits)}
            disabled={dirtyCount === 0 || saveMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : dirtyCount > 0 ? `Save changes (${dirtyCount})` : "Save changes"}
          </Button>
        </div>
      </div>

      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p className="font-medium">Values saved here take priority over the server's .env file</p>
              <p>
                Changes apply within a minute, with no restart. Settings marked "From .env" still use the
                server's environment until you save a value here. Secrets are never shown again after saving.
                Database, JWT secrets, site URL and port stay in .env because the server needs them to start.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {groups?.map((group) => (
        <Card key={group.id}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {group.settings.map((setting) => {
              const edited = setting.key in edits;
              return (
                <div key={setting.key} className="grid gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-sm font-medium">
                      {setting.label}
                      <span className="ml-2 font-mono text-xs text-muted">{setting.key}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {edited && <span className="text-xs text-amber-600">Unsaved</span>}
                      <SourceBadge setting={setting} />
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    {renderInput(setting)}
                    {edited ? (
                      <Button size="sm" variant="ghost" onClick={() => discard(setting.key)} aria-label="Undo change">
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      setting.source === "database" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => clearSetting(setting)}
                          disabled={clearMutation.isPending}
                        >
                          Clear
                        </Button>
                      )
                    )}
                  </div>
                  {(setting.help || setting.updatedAt) && (
                    <p className="text-xs text-muted">
                      {setting.help}
                      {setting.help && setting.updatedAt && " · "}
                      {setting.updatedAt &&
                        `Last updated ${new Date(setting.updatedAt).toLocaleString()}${setting.updatedBy ? ` by ${setting.updatedBy}` : ""}`}
                    </p>
                  )}
                </div>
              );
            })}
            {group.id === "ai" && <GeminiStatus unsaved={group.settings.some((setting) => setting.key in edits)} />}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
