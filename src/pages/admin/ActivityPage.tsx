import { useState, type ComponentType, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Activity,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Crown,
  Download,
  FilePlus,
  KeyRound,
  LogIn,
  Mail,
  MailCheck,
  Search,
  Share2,
  ShoppingCart,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface ActivityEntry {
  _id: string;
  type: string;
  label: string;
  message: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  user: { _id: string; name: string; email?: string } | null;
}

interface ActivityUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  subscription: { plan: string; status: string; expiresAt?: string };
  resumes: number;
  createdAt: string;
  lastLoginAt?: string | null;
}

interface ActivityResponse {
  activities: ActivityEntry[];
  total: number;
  page: number;
  pages: number;
  types: Array<{ type: string; label: string }>;
  last24h: Record<string, number>;
  user?: ActivityUser;
}

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "user.registered": UserPlus,
  "user.login": LogIn,
  "user.email_verified": MailCheck,
  "user.password_reset": KeyRound,
  "cv.created": FilePlus,
  "cv.deleted": Trash2,
  "cv.shared": Share2,
  "cv.exported": Download,
  "cover_letter.created": Mail,
  "ai.used": Sparkles,
  "payment.requested": ShoppingCart,
  "payment.completed": BadgeCheck,
  "payment.failed": CircleX,
  "plan.changed": Crown,
};

/** Colour by the part before the dot (user, cv, ai, payment...) */
const TONES: Record<string, string> = {
  user: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
  cv: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200",
  cover_letter: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200",
  ai: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  payment: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200",
  plan: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200",
};
const toneOf = (type: string) => (type === "payment.failed" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200" : TONES[type.split(".")[0]] ?? "bg-secondary text-foreground");

/** The counts shown at the top, for the last 24 hours */
const HEADLINE: Array<[type: string, label: string]> = [
  ["user.registered", "Sign-ups"],
  ["user.login", "Logins"],
  ["cv.created", "CVs created"],
  ["ai.used", "AI requests"],
  ["payment.requested", "Purchase requests"],
];

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const timeAgo = (iso: string) => {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const steps: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.35, "week"],
    [12, "month"],
  ];
  let value = seconds;
  for (const [size, unit] of steps) {
    if (Math.abs(value) < size) return relative.format(Math.round(value), unit);
    value /= size;
  }
  return relative.format(Math.round(value), "year");
};

/** "Chrome on Android" from a user-agent string; good enough for spotting devices */
const deviceOf = (ua?: string) => {
  if (!ua) return undefined;
  const browser = /Edg\//.test(ua) ? "Edge" : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /OPR\/|Opera/.test(ua) ? "Opera"
    : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : undefined;
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad|iOS/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows"
    : /Mac OS X|Macintosh/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : undefined;
  if (browser && os) return `${browser} on ${os}`;
  return browser ?? os ?? ua.slice(0, 40);
};

const formatDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : "Never");

const detailValue = (value: unknown) =>
  value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);

export default function ActivityPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const type = params.get("type") ?? "";
  const userId = params.get("userId") ?? "";
  const search = params.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(search);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["admin-activity", { page, type, userId, search }],
    queryFn: async () => {
      const query = new URLSearchParams({ page: String(page), limit: "50" });
      if (type) query.set("type", type);
      if (userId) query.set("userId", userId);
      if (search) query.set("search", search);
      return (await api.get(`/admin/activity?${query}`)).data.data as ActivityResponse;
    },
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });

  /** Changes filters in the URL (so they survive reloads and can be linked); resets the page */
  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!("page" in changes)) next.delete("page");
    setParams(next);
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    update({ search: searchInput.trim() });
  };

  const user = data?.user;
  const filtered = Boolean(type || search || userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User activity</h1>
        <p className="text-muted">
          What users do on the site: sign-ups, logins, CVs, AI tools and payments. Updates every minute.
        </p>
      </div>

      {user && (
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted">Showing one user</p>
              <p className="mt-1 truncate text-lg font-semibold">{user.name}</p>
              <p className="truncate text-sm text-muted">{user.email}</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-muted">Plan</dt>
                  <dd className="capitalize">{user.subscription.plan}{user.role === "admin" ? " (admin)" : ""}</dd>
                </div>
                <div>
                  <dt className="text-muted">CVs now</dt>
                  <dd>{user.resumes}</dd>
                </div>
                <div>
                  <dt className="text-muted">Joined</dt>
                  <dd>{new Date(user.createdAt).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-muted">Last login</dt>
                  <dd>{formatDate(user.lastLoginAt)}</dd>
                </div>
              </dl>
              {!user.isEmailVerified && <p className="mt-2 text-xs text-amber-600">Email not verified yet</p>}
            </div>
            <Button variant="outline" size="sm" onClick={() => update({ userId: "" })}>
              <X className="h-4 w-4" />
              All users
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Last 24 hours; each count filters the list */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {HEADLINE.map(([key, label]) => {
          const Icon = ICONS[key] ?? Activity;
          const active = type === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => update({ type: active ? "" : key })}
              aria-pressed={active}
              className={cn(
                "flex flex-col items-start rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary",
                active && "border-primary ring-1 ring-primary"
              )}
            >
              <span className={cn("mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg", toneOf(key))}>
                <Icon className="h-4 w-4" />
              </span>
              <p className="text-2xl font-bold">{isLoading ? "–" : (data?.last24h[key] ?? 0)}</p>
              <p className="text-sm text-muted">{label}, last 24 h</p>
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 md:flex-row">
            <form onSubmit={submitSearch} className="flex flex-1 gap-2" role="search">
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by user name or email"
                aria-label="Search by user name or email"
                className="min-w-0 flex-1"
              />
              <Button type="submit" variant="outline">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </form>
            <select
              value={type}
              onChange={(event) => update({ type: event.target.value })}
              aria-label="Activity type"
              className="h-10 rounded-lg border border-border bg-background px-3 text-base sm:text-sm"
            >
              <option value="">All activity</option>
              {data?.types.map((option) => (
                <option key={option.type} value={option.type}>
                  {option.label}
                </option>
              ))}
            </select>
            {filtered && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchInput("");
                  setParams(new URLSearchParams());
                }}
              >
                Clear filters
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-muted">
            <span>
              {data ? `${data.total.toLocaleString()} ${data.total === 1 ? "entry" : "entries"}` : " "}
              {isFetching && !isLoading ? " · updating…" : ""}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : isError ? (
            <p className="py-10 text-center text-red-600">Could not load activity. Try again in a moment.</p>
          ) : !data?.activities.length ? (
            <p className="py-10 text-center text-muted">
              {filtered ? "No activity matches these filters." : "No activity yet. It appears here as users sign up, build CVs and pay."}
            </p>
          ) : (
            <ol className="divide-y divide-border">
              {data.activities.map((entry) => {
                const Icon = ICONS[entry.type] ?? Activity;
                const device = deviceOf(entry.userAgent);
                const details = Object.entries(entry.metadata ?? {}).filter(([, value]) => detailValue(value) !== "");
                return (
                  <li key={entry._id} className="flex gap-3 py-3">
                    <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", toneOf(entry.type))}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium">{entry.message}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                        {entry.user ? (
                          <button
                            type="button"
                            className="max-w-full truncate text-primary hover:underline"
                            onClick={() => update({ userId: entry.user!._id })}
                            title="Show only this user's activity"
                          >
                            {entry.user.name}
                            {entry.user.email ? ` (${entry.user.email})` : ""}
                          </button>
                        ) : (
                          <span>System</span>
                        )}
                        <span aria-hidden>·</span>
                        <time dateTime={entry.createdAt} title={new Date(entry.createdAt).toLocaleString()}>
                          {timeAgo(entry.createdAt)}
                        </time>
                        <span aria-hidden>·</span>
                        <span>{entry.label}</span>
                        {device && (
                          <>
                            <span aria-hidden>·</span>
                            <span title={entry.userAgent}>{device}</span>
                          </>
                        )}
                        {entry.ip && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="font-mono">{entry.ip}</span>
                          </>
                        )}
                      </p>
                      {details.length > 0 && (
                        <details className="mt-1 text-xs">
                          <summary className="cursor-pointer text-muted hover:text-foreground">Details</summary>
                          <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 rounded-lg bg-secondary/50 p-2">
                            {details.map(([key, value]) => (
                              <div key={key} className="contents">
                                <dt className="text-muted">{key}</dt>
                                <dd className="break-all font-mono">{detailValue(value)}</dd>
                              </div>
                            ))}
                          </dl>
                        </details>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      {data && data.pages > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label="Pages">
          <Button variant="outline" size="sm" onClick={() => update({ page: String(page - 1) })} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" />
            Newer
          </Button>
          <span className="px-3 text-sm">
            Page {page} of {data.pages}
          </span>
          <Button variant="outline" size="sm" onClick={() => update({ page: String(page + 1) })} disabled={page >= data.pages}>
            Older
            <ChevronRight className="h-4 w-4" />
          </Button>
        </nav>
      )}

      <p className="text-xs text-muted">
        Entries older than the retention period (Admin → Settings → Features, 180 days by default) are deleted
        automatically. <Link to="/admin/settings#settings-notifications" className="text-primary hover:underline">Email notifications</Link> for
        sign-ups, CVs and purchase requests are set up in Settings.
      </p>
    </div>
  );
}
