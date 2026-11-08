import { useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BarChart3, CheckCircle2, ExternalLink, Pencil, Plus, RefreshCw, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { confirmAction } from "@/lib/confirm";
import { useToast } from "@/components/ui/toast";
import api, { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { BarList, ChartCard, SegmentedBar, SeriesTable, StatTile, TrendChart } from "@/components/charts/Charts";
import { bdDateLabel, fmtCompact, fmtInt, fmtPct, percentDelta, type Delta } from "@/components/charts/format";

type Range = "7d" | "28d" | "90d" | "365d";
type Country = "bgd" | "all";
type Device = "all" | "mobile" | "desktop" | "tablet";

const RANGES: Array<{ id: Range; label: string; comparison: string }> = [
  { id: "7d", label: "7 days", comparison: "vs previous 7 days" },
  { id: "28d", label: "28 days", comparison: "vs previous 28 days" },
  { id: "90d", label: "3 months", comparison: "vs previous 3 months" },
  { id: "365d", label: "12 months", comparison: "" },
];

interface Metrics {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number | null;
}
interface QueryRow extends Metrics {
  query: string;
  previousPosition?: number | null;
  bangla: boolean;
  expectedCtr?: number;
}
interface Keyword {
  id: string;
  keyword: string;
  language: "en" | "bn";
  targetPath: string | null;
  notes: string | null;
}
interface TrackedKeyword extends Keyword, Metrics {
  previousPosition?: number | null;
  rankingPage: string | null;
  wrongPage: boolean;
  related: { queries: number; clicks: number; impressions: number };
}
interface SearchReport {
  property: string;
  serviceAccount: string;
  fetchedAt: string;
  period: { startDate: string; endDate: string };
  previousPeriod: { startDate: string; endDate: string } | null;
  totals: Metrics;
  previousTotals: Metrics | null;
  trend: Array<Metrics & { date: string }>;
  queryCount: number;
  queries: QueryRow[];
  pages: Array<Metrics & { page: string; url: string }>;
  devices: Array<Metrics & { device: string }>;
  countries: Array<Metrics & { country: string }>;
  scriptSplit: Record<"bangla" | "latin", { clicks: number; impressions: number; queries: number }>;
  opportunities: Record<"almostPageOne" | "lowCtr" | "newQueries" | "dropping", QueryRow[]>;
  keywords: TrackedKeyword[];
}
interface SeoData {
  connected: boolean;
  property: string;
  searchError: string | null;
  search: SearchReport | null;
  keywords: Keyword[];
  cvKeywords: { cvsScanned: number; jobTitles: Array<{ label: string; users: number }>; skills: Array<{ label: string; users: number }> };
}

const COUNTRY_NAMES: Record<string, string> = {
  bgd: "Bangladesh", ind: "India", sau: "Saudi Arabia", are: "United Arab Emirates", usa: "United States", mys: "Malaysia",
  gbr: "United Kingdom", qat: "Qatar", omn: "Oman", kwt: "Kuwait", sgp: "Singapore", can: "Canada", ita: "Italy", aus: "Australia", pak: "Pakistan", npl: "Nepal",
};

const positionText = (position: number | null | undefined) => (position == null ? "–" : position.toFixed(1));

/** Moving up the results means a smaller position number. */
const positionDelta = (current: number | null, previous: number | null | undefined): Delta | undefined => {
  if (previous === undefined) return undefined;
  if (current === null) return undefined;
  if (previous === null) return { text: "New", tone: "good", direction: "up" };
  const change = previous - current;
  if (Math.abs(change) < 0.1) return { text: "Same", tone: "neutral", direction: "flat" };
  return { text: `${change > 0 ? "Up" : "Down"} ${Math.abs(change).toFixed(1)}`, tone: change > 0 ? "good" : "bad", direction: change > 0 ? "up" : "down" };
};

const statusOf = (position: number | null) =>
  position === null
    ? { label: "Not showing yet", className: "bg-secondary text-muted" }
    : position <= 3
      ? { label: "Top 3", className: "bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-100" }
      : position <= 10
        ? { label: "Page 1", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-100" }
        : position <= 20
          ? { label: "Page 2", className: "bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100" }
          : { label: "Page 3+", className: "bg-secondary text-foreground" };

function PositionCell({ position, previous }: { position: number | null; previous?: number | null }) {
  const delta = positionDelta(position, previous);
  const color = delta?.tone === "good" ? "var(--delta-good)" : delta?.tone === "bad" ? "var(--delta-bad)" : "var(--color-muted)";
  return (
    <span className="inline-flex flex-col items-end leading-tight">
      <span className="font-medium">{positionText(position)}</span>
      {delta && (
        <span className="whitespace-nowrap text-[11px] font-medium" style={{ color }}>
          {delta.direction === "up" ? "▲ " : delta.direction === "down" ? "▼ " : ""}
          {delta.text}
        </span>
      )}
    </span>
  );
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Array<{ id: T; label: string }>; onChange: (id: T) => void }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-border p-0.5">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === option.id ? "bg-primary text-primary-foreground" : "text-muted hover:bg-secondary hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const th = "px-3 py-2 text-left text-xs font-medium text-muted";
const td = "px-3 py-2";

function QueryTable({ rows, extra, onTrack, tracked }: { rows: QueryRow[]; extra?: "expected" | "before"; onTrack?: (query: string) => void; tracked: Set<string> }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted">Nothing here for this period.</p>;
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="border-b border-border">
          <tr>
            <th className={th}>Search</th>
            <th className={cn(th, "text-right")}>Clicks</th>
            <th className={cn(th, "text-right")}>Impressions</th>
            <th className={cn(th, "text-right")}>CTR</th>
            {extra === "expected" && <th className={cn(th, "text-right")}>Usual CTR</th>}
            <th className={cn(th, "text-right")}>Position</th>
            {extra === "before" && <th className={cn(th, "text-right")}>Before</th>}
            {onTrack && <th className={th}><span className="sr-only">Track</span></th>}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((row) => (
            <tr key={row.query} className="border-b border-border last:border-0">
              <td className={cn(td, "max-w-[280px]")}>
                <span className="break-words">{row.query}</span>
                {row.bangla && <span className="ml-1.5 rounded bg-secondary px-1 py-0.5 text-[10px] font-semibold text-muted">BN</span>}
              </td>
              <td className={cn(td, "text-right")}>{fmtInt(row.clicks)}</td>
              <td className={cn(td, "text-right")}>{fmtInt(row.impressions)}</td>
              <td className={cn(td, "text-right")}>{fmtPct(row.ctr)}</td>
              {extra === "expected" && <td className={cn(td, "text-right text-muted")}>{fmtPct(row.expectedCtr ?? 0, 0)}</td>}
              <td className={cn(td, "text-right")}>
                <PositionCell position={row.position} previous={extra === "before" ? undefined : row.previousPosition} />
              </td>
              {extra === "before" && <td className={cn(td, "text-right text-muted")}>{positionText(row.previousPosition)}</td>}
              {onTrack && (
                <td className={cn(td, "text-right")}>
                  {tracked.has(row.query.toLowerCase()) ? (
                    <span className="text-xs text-muted">Tracked</span>
                  ) : (
                    <button type="button" onClick={() => onTrack(row.query)} className="text-xs font-medium text-primary hover:underline">
                      Track
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const OPPORTUNITIES = [
  {
    id: "almostPageOne",
    label: "Almost on page 1",
    help: "Searches where you rank 8–20. A small push moves these onto page one: answer the search directly on the page, use the phrase in a heading, and link to the page from other guides.",
  },
  {
    id: "lowCtr",
    label: "Low click rate",
    help: "On page one, but clicked less than half as often as that position usually gets. Rewrite the page title and meta description so they match the search and promise a clear benefit.",
  },
  { id: "newQueries", label: "New searches", help: "Searches that showed your site in this period but not in the one before. Consider covering the ones that fit in a guide or FAQ." },
  { id: "dropping", label: "Losing positions", help: "Searches where your average position dropped by 3 or more. Check the page is up to date and still answers the search better than the pages above it." },
] as const;

export default function SeoPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const range = (RANGES.find((r) => r.id === params.get("range"))?.id ?? "28d") as Range;
  const country: Country = params.get("country") === "all" ? "all" : "bgd";
  const device = (["mobile", "desktop", "tablet"].includes(params.get("device") ?? "") ? params.get("device") : "all") as Device;
  const rangeInfo = RANGES.find((r) => r.id === range)!;
  const [refreshing, setRefreshing] = useState(false);

  const queryKey = ["admin-seo", range, country, device];
  const { data, isLoading, isPlaceholderData, error } = useQuery({
    queryKey,
    queryFn: async () => (await api.get(`/admin/seo?range=${range}&country=${country}&device=${device}`)).data.data as SeoData,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next, { replace: true });
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      const fresh = (await api.get(`/admin/seo?range=${range}&country=${country}&device=${device}&refresh=1`)).data.data as SeoData;
      queryClient.setQueryData(queryKey, fresh);
    } catch (err) {
      toast.add(getErrorMessage(err, "Couldn't refresh"), "error");
    } finally {
      setRefreshing(false);
    }
  };

  const reload = () => queryClient.invalidateQueries({ queryKey: ["admin-seo"] });
  const addKeywords = useMutation({
    mutationFn: async (body: { keywords: string[]; targetPath?: string }) => (await api.post("/admin/seo/keywords", body)).data.data as { added: number; skipped: number },
    onSuccess: (result) => {
      toast.add(result.skipped ? `Added ${result.added}; ${result.skipped} already tracked` : `Added ${result.added} keyword${result.added === 1 ? "" : "s"}`, "success");
      reload();
    },
    onError: (err) => toast.add(getErrorMessage(err, "Couldn't add the keywords"), "error"),
  });

  const search = data?.search ?? null;
  const tracked = useMemo(() => new Set((data?.keywords ?? []).map((k) => k.keyword.toLowerCase())), [data?.keywords]);
  const track = (query: string) => addKeywords.mutate({ keywords: [query] });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">SEO & keywords</h1>
          <p className="text-muted">The Google searches that show your site, and the keywords you want to rank for.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/analytics">
              <BarChart3 className="mr-1.5 h-4 w-4" aria-hidden />
              Analytics
            </Link>
          </Button>
          {search && (
            <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
              <RefreshCw className={cn("mr-1.5 h-4 w-4", refreshing && "animate-spin")} aria-hidden />
              Refresh
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="Date range" value={range} options={RANGES} onChange={(id) => setParam("range", id)} />
        <Segmented
          label="Country"
          value={country}
          options={[
            { id: "bgd", label: "Bangladesh" },
            { id: "all", label: "All countries" },
          ]}
          onChange={(id) => setParam("country", id)}
        />
        <label className="inline-flex items-center gap-2 text-sm">
          <span className="text-muted">Device</span>
          <select
            value={device}
            onChange={(event) => setParam("device", event.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
          >
            <option value="all">All devices</option>
            <option value="mobile">Mobile</option>
            <option value="desktop">Desktop</option>
            <option value="tablet">Tablet</option>
          </select>
        </label>
        {search && (
          <p className="text-sm text-muted">
            {bdDateLabel(search.period.startDate)} – {bdDateLabel(search.period.endDate)} · updated {new Date(search.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      {error && !data && (
        <Card>
          <CardContent className="pt-6 text-sm text-red-600">{getErrorMessage(error, "Couldn't load the SEO report.")}</CardContent>
        </Card>
      )}
      {isLoading && <div className="h-40 animate-pulse rounded-xl bg-secondary" />}

      <div className={cn("space-y-6 transition-opacity", isPlaceholderData && "opacity-60")}>
        {data && !search && <ConnectCard property={data.property} connected={data.connected} error={data.searchError} />}

        {search && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatTile
                label="Clicks from Google"
                value={fmtInt(search.totals.clicks)}
                delta={percentDelta(search.totals.clicks, search.previousTotals?.clicks)}
                comparison={rangeInfo.comparison}
                spark={search.trend.map((d) => d.clicks)}
              />
              <StatTile
                label="Impressions"
                value={fmtCompact(search.totals.impressions)}
                delta={percentDelta(search.totals.impressions, search.previousTotals?.impressions)}
                comparison={rangeInfo.comparison}
                spark={search.trend.map((d) => d.impressions)}
              />
              <StatTile
                label="Click-through rate"
                value={fmtPct(search.totals.ctr)}
                delta={percentDelta(search.totals.ctr, search.previousTotals?.ctr)}
                comparison={rangeInfo.comparison}
              />
              <StatTile
                label="Average position"
                value={positionText(search.totals.position)}
                delta={positionDelta(search.totals.position, search.previousTotals ? search.previousTotals.position : undefined)}
                comparison={search.previousTotals ? rangeInfo.comparison : "1 is the top result"}
              />
            </div>
            {!search.previousTotals && <p className="-mt-3 text-xs text-muted">Search Console keeps 16 months of data, so 12 months has no earlier period to compare with.</p>}

            <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
              <ChartCard
                title="Clicks per day"
                description="Visits from Google search"
                table={<SeriesTable keys={search.trend.map((d) => d.date)} series={[{ id: "clicks", label: "Clicks", color: "var(--chart-1)", values: search.trend.map((d) => d.clicks) }]} format={fmtInt} />}
              >
                <TrendChart keys={search.trend.map((d) => d.date)} series={[{ id: "clicks", label: "Clicks", color: "var(--chart-1)", values: search.trend.map((d) => d.clicks) }]} label="Clicks from Google per day" height={180} />
              </ChartCard>
              <ChartCard
                title="Impressions per day"
                description="Times your pages appeared in Google results"
                table={<SeriesTable keys={search.trend.map((d) => d.date)} series={[{ id: "impressions", label: "Impressions", color: "var(--chart-1)", values: search.trend.map((d) => d.impressions) }]} format={fmtInt} />}
              >
                <TrendChart keys={search.trend.map((d) => d.date)} series={[{ id: "impressions", label: "Impressions", color: "var(--chart-1)", values: search.trend.map((d) => d.impressions) }]} label="Impressions per day" height={180} />
              </ChartCard>
            </div>

            <Opportunities search={search} tracked={tracked} onTrack={track} />
          </>
        )}

        {data && (
          <KeywordTracker
            keywords={search?.keywords ?? data.keywords.map((k) => ({ ...k, clicks: 0, impressions: 0, ctr: 0, position: null, rankingPage: null, wrongPage: false, related: { queries: 0, clicks: 0, impressions: 0 } }))}
            hasMetrics={Boolean(search)}
            comparison={Boolean(search?.previousTotals)}
            pages={search?.pages.map((p) => p.page) ?? []}
            onAdd={(body) => addKeywords.mutateAsync(body)}
            adding={addKeywords.isPending}
            onChanged={reload}
          />
        )}

        {search && <TopSearches search={search} tracked={tracked} onTrack={track} />}

        {search && (
          <div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
            <ChartCard
              className="lg:col-span-2"
              title="Top pages"
              description="Your pages with the most clicks from Google"
              table={undefined}
            >
              <div className="relative overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className={th}>Page</th>
                      <th className={cn(th, "text-right")}>Clicks</th>
                      <th className={cn(th, "text-right")}>Impressions</th>
                      <th className={cn(th, "text-right")}>CTR</th>
                      <th className={cn(th, "text-right")}>Position</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {search.pages.slice(0, 15).map((page) => (
                      <tr key={page.url} className="border-b border-border last:border-0">
                        <td className={cn(td, "max-w-[260px]")}>
                          <a href={page.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all hover:text-primary">
                            {page.page}
                            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                          </a>
                        </td>
                        <td className={cn(td, "text-right")}>{fmtInt(page.clicks)}</td>
                        <td className={cn(td, "text-right")}>{fmtInt(page.impressions)}</td>
                        <td className={cn(td, "text-right")}>{fmtPct(page.ctr)}</td>
                        <td className={cn(td, "text-right")}>{positionText(page.position)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
            <ChartCard title="Audience" description="Who sees you on Google">
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-sm font-medium">Search language (by impressions)</p>
                  <SegmentedBar
                    label="Search language"
                    parts={[
                      { id: "latin", label: "English / Banglish", value: search.scriptSplit.latin.impressions, color: "var(--chart-1)" },
                      { id: "bangla", label: "Bangla script", value: search.scriptSplit.bangla.impressions, color: "var(--chart-2)" },
                    ]}
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Device (by clicks)</p>
                  <SegmentedBar
                    label="Clicks by device"
                    parts={["mobile", "desktop", "tablet"].map((id, i) => ({
                      id,
                      label: id[0].toUpperCase() + id.slice(1),
                      value: search.devices.find((d) => d.device === id)?.clicks ?? 0,
                      color: ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"][i],
                    }))}
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Countries (clicks, all countries)</p>
                  <BarList items={search.countries.slice(0, 6).map((c) => ({ label: COUNTRY_NAMES[c.country] ?? c.country.toUpperCase(), value: c.clicks }))} />
                </div>
              </div>
            </ChartCard>
          </div>
        )}

        {data && <CvKeywordIdeas ideas={data.cvKeywords} tracked={tracked} onTrack={track} days={rangeInfo.label} />}
      </div>
    </div>
  );
}

function ConnectCard({ property, connected, error }: { property: string; connected: boolean; error: string | null }) {
  const toast = useToast();
  const test = useMutation({
    mutationFn: async () =>
      (await api.post("/admin/seo/test")).data.data as { serviceAccount: string; property: string; hasAccess: boolean; sites: Array<{ siteUrl: string; permissionLevel: string }> },
    onError: (err) => toast.add(getErrorMessage(err, "Connection test failed"), "error"),
  });
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden />
          <div>
            <h2 className="font-semibold">{connected ? "Google Search Console didn't answer" : "Connect Google Search Console"}</h2>
            <p className="text-sm text-muted">
              {connected
                ? error
                : "See the searches that bring people from Google: clicks, impressions, position and click rate for every search and page. Your tracked keywords and CV keyword ideas below work without it."}
            </p>
          </div>
        </div>
        {!connected && (
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li>
              In{" "}
              <a href="https://console.cloud.google.com/apis/library/searchconsole.googleapis.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                Google Cloud Console
              </a>
              , pick a project (the one for Google Sign-In is fine) and click <strong>Enable</strong> on the Google Search Console API.
            </li>
            <li>
              Go to <strong>IAM & Admin → Service accounts → Create service account</strong> (no roles needed). Open it, then{" "}
              <strong>Keys → Add key → Create new key → JSON</strong>. A .json file downloads.
            </li>
            <li>
              In{" "}
              <a href="https://search.google.com/search-console/users" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                Search Console → Settings → Users and permissions
              </a>{" "}
              for <code className="rounded bg-secondary px-1">{property}</code>, click <strong>Add user</strong>, paste the service account's email (it ends in
              .iam.gserviceaccount.com) and choose <strong>Restricted</strong>.
            </li>
            <li>
              Open the .json file in a text editor, copy everything, and paste it into <strong>Admin → Settings → Google Search Console → Service account JSON key</strong>.
            </li>
          </ol>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/settings">
              <Settings className="mr-1.5 h-4 w-4" aria-hidden />
              Open settings
            </Link>
          </Button>
          {connected && (
            <Button size="sm" onClick={() => test.mutate()} disabled={test.isPending}>
              {test.isPending ? "Testing…" : "Test connection"}
            </Button>
          )}
        </div>
        {test.data && (
          <div className="rounded-lg border border-border p-3 text-sm">
            <p className="flex items-center gap-1.5">
              {test.data.hasAccess ? <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden /> : <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />}
              {test.data.hasAccess ? `${test.data.serviceAccount} can read ${test.data.property}.` : `${test.data.serviceAccount} can't read ${test.data.property} yet.`}
            </p>
            {!test.data.hasAccess && (
              <p className="mt-1 text-muted">
                Properties it can read: {test.data.sites.length ? test.data.sites.map((site) => site.siteUrl).join(", ") : "none"}. Add the email as a user of your property, or set
                the property in Settings to one of these.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Opportunities({ search, tracked, onTrack }: { search: SearchReport; tracked: Set<string>; onTrack: (q: string) => void }) {
  const [tab, setTab] = useState<(typeof OPPORTUNITIES)[number]["id"]>("almostPageOne");
  const current = OPPORTUNITIES.find((o) => o.id === tab)!;
  const comparison = Boolean(search.previousTotals);
  return (
    <ChartCard title="Quick wins" description="Searches worth working on first, from this period's Search Console data">
      <div role="tablist" aria-label="Opportunities" className="flex flex-wrap gap-2">
        {OPPORTUNITIES.filter((o) => comparison || (o.id !== "newQueries" && o.id !== "dropping")).map((o) => (
          <button
            key={o.id}
            role="tab"
            type="button"
            aria-selected={tab === o.id}
            onClick={() => setTab(o.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium",
              tab === o.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted hover:text-foreground"
            )}
          >
            {o.label} <span className="tabular-nums">({search.opportunities[o.id].length})</span>
          </button>
        ))}
      </div>
      <p className="text-sm text-muted">{current.help}</p>
      <QueryTable
        rows={search.opportunities[tab]}
        extra={tab === "lowCtr" ? "expected" : tab === "dropping" ? "before" : undefined}
        tracked={tracked}
        onTrack={onTrack}
      />
    </ChartCard>
  );
}

function TopSearches({ search, tracked, onTrack }: { search: SearchReport; tracked: Set<string>; onTrack: (q: string) => void }) {
  const [filter, setFilter] = useState("");
  const [script, setScript] = useState<"all" | "bangla" | "latin">("all");
  const [limit, setLimit] = useState(25);
  const rows = search.queries.filter(
    (row) => row.query.toLowerCase().includes(filter.trim().toLowerCase()) && (script === "all" || (script === "bangla") === row.bangla)
  );
  return (
    <ChartCard
      title="Top searches"
      description={`${fmtInt(search.queryCount)} searches showed your site; the top ${fmtInt(search.queries.length)} by clicks are listed. Google hides rare searches for privacy.`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter searches…" aria-label="Filter searches" className="h-9 max-w-xs" />
        <Segmented
          label="Script"
          value={script}
          options={[
            { id: "all", label: "All" },
            { id: "latin", label: "English" },
            { id: "bangla", label: "Bangla" },
          ]}
          onChange={setScript}
        />
      </div>
      <QueryTable rows={rows.slice(0, limit)} tracked={tracked} onTrack={onTrack} />
      {rows.length > limit && (
        <Button variant="ghost" size="sm" onClick={() => setLimit((n) => n + 50)}>
          Show more ({fmtInt(rows.length - limit)} left)
        </Button>
      )}
    </ChartCard>
  );
}

interface KeywordTrackerProps {
  keywords: TrackedKeyword[];
  hasMetrics: boolean;
  comparison: boolean;
  pages: string[];
  onAdd: (body: { keywords: string[]; targetPath?: string }) => Promise<unknown>;
  adding: boolean;
  onChanged: () => void;
}

function KeywordTracker({ keywords, hasMetrics, comparison, pages, onAdd, adding, onChanged }: KeywordTrackerProps) {
  const toast = useToast();
  const [text, setText] = useState("");
  const [target, setTarget] = useState("");
  const [language, setLanguage] = useState<"all" | "en" | "bn">("all");
  const [sort, setSort] = useState<"impressions" | "position" | "page">(hasMetrics ? "impressions" : "page");
  const [editing, setEditing] = useState<TrackedKeyword | null>(null);

  const knownPages = [...new Set([...keywords.map((k) => k.targetPath).filter((p): p is string => Boolean(p)), ...pages])].sort();
  const list = keywords
    .filter((k) => language === "all" || k.language === language)
    .sort((a, b) =>
      sort === "impressions"
        ? b.impressions - a.impressions || a.keyword.localeCompare(b.keyword)
        : sort === "position"
          ? (a.position ?? 999) - (b.position ?? 999)
          : (a.targetPath ?? "~").localeCompare(b.targetPath ?? "~") || a.keyword.localeCompare(b.keyword)
    );
  const ranking = keywords.filter((k) => k.position !== null);
  const onPageOne = ranking.filter((k) => (k.position ?? 99) <= 10).length;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const items = text.split(/\n|,/).map((line) => line.trim()).filter(Boolean);
    if (!items.length) return;
    try {
      await onAdd({ keywords: items, targetPath: target.trim() || undefined });
      setText("");
    } catch {
      /* the mutation shows the error */
    }
  };

  const remove = async (keyword: TrackedKeyword) => {
    const ok = await confirmAction({
      title: `Stop tracking "${keyword.keyword}"?`,
      text: "It is removed from this list. Your Search Console data isn't affected.",
      confirmLabel: "Stop tracking",
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/seo/keywords/${keyword.id}`);
      toast.add(`Stopped tracking "${keyword.keyword}"`, "success");
      onChanged();
    } catch (err) {
      toast.add(getErrorMessage(err, "Couldn't remove it"), "error");
    }
  };

  return (
    <ChartCard
      title="Tracked keywords"
      description={
        hasMetrics
          ? `${fmtInt(keywords.length)} keywords · ${fmtInt(ranking.length)} showing on Google · ${fmtInt(onPageOne)} on page 1`
          : `${fmtInt(keywords.length)} keywords. Connect Search Console to see their positions.`
      }
    >
      <form onSubmit={submit} className="grid gap-2 rounded-lg border border-dashed border-border p-3 sm:grid-cols-[minmax(0,1fr)_200px_auto] sm:items-start">
        <label className="sr-only" htmlFor="new-keywords">
          Keywords to track
        </label>
        <textarea
          id="new-keywords"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={2}
          placeholder={"Keywords to track, one per line\ne.g. cv format for nurse job"}
          className="min-h-[44px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <div>
          <label className="sr-only" htmlFor="new-keyword-page">
            Target page
          </label>
          <Input id="new-keyword-page" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="Target page, e.g. /bank-job-cv" list="seo-known-pages" className="h-10" />
          <datalist id="seo-known-pages">
            {knownPages.map((page) => (
              <option key={page} value={page} />
            ))}
          </datalist>
        </div>
        <Button type="submit" disabled={adding || !text.trim()}>
          <Plus className="mr-1 h-4 w-4" aria-hidden />
          Add
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          label="Language"
          value={language}
          options={[
            { id: "all", label: "All" },
            { id: "en", label: "English" },
            { id: "bn", label: "Bangla" },
          ]}
          onChange={setLanguage}
        />
        <label className="inline-flex items-center gap-2 text-sm">
          <span className="text-muted">Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
            {hasMetrics && <option value="impressions">Most impressions</option>}
            {hasMetrics && <option value="position">Best position</option>}
            <option value="page">Target page</option>
          </select>
        </label>
      </div>

      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border">
            <tr>
              <th className={th}>Keyword</th>
              <th className={th}>Target page</th>
              {hasMetrics && (
                <>
                  <th className={th}>Status</th>
                  <th className={cn(th, "text-right")}>Position</th>
                  <th className={cn(th, "text-right")}>Clicks</th>
                  <th className={cn(th, "text-right")}>Impressions</th>
                  <th className={cn(th, "text-right")}>CTR</th>
                  <th className={th}>Google shows</th>
                </>
              )}
              <th className={th}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {list.map((k) => {
              const status = statusOf(k.position);
              return (
                <tr key={k.id} className="border-b border-border last:border-0 align-top">
                  <td className={cn(td, "max-w-[240px]")}>
                    <span className="break-words font-medium">{k.keyword}</span>
                    {k.language === "bn" && <span className="ml-1.5 rounded bg-secondary px-1 py-0.5 text-[10px] font-semibold text-muted">BN</span>}
                    {hasMetrics && k.related.queries > 1 && (
                      <p className="text-xs text-muted">
                        +{fmtInt(k.related.queries - 1)} similar searches · {fmtInt(k.related.clicks)} clicks in all
                      </p>
                    )}
                    {k.notes && <p className="text-xs text-muted">{k.notes}</p>}
                  </td>
                  <td className={cn(td, "whitespace-nowrap text-muted")}>{k.targetPath ?? "–"}</td>
                  {hasMetrics && (
                    <>
                      <td className={td}>
                        <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", status.className)}>{status.label}</span>
                      </td>
                      <td className={cn(td, "text-right")}>
                        <PositionCell position={k.position} previous={comparison ? k.previousPosition : undefined} />
                      </td>
                      <td className={cn(td, "text-right")}>{fmtInt(k.clicks)}</td>
                      <td className={cn(td, "text-right")}>{fmtInt(k.impressions)}</td>
                      <td className={cn(td, "text-right")}>{k.impressions ? fmtPct(k.ctr) : "–"}</td>
                      <td className={cn(td, "whitespace-nowrap")}>
                        {k.rankingPage ? (
                          <span className={cn("inline-flex items-center gap-1", k.wrongPage && "font-medium")} style={k.wrongPage ? { color: "var(--delta-bad)" } : undefined}>
                            {k.wrongPage && <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                            {k.rankingPage}
                            {k.wrongPage && <span className="sr-only">(not the target page)</span>}
                          </span>
                        ) : (
                          <span className="text-muted">–</span>
                        )}
                      </td>
                    </>
                  )}
                  <td className={cn(td, "whitespace-nowrap text-right")}>
                    <button type="button" onClick={() => setEditing(k)} className="rounded p-1.5 text-muted hover:bg-secondary hover:text-foreground" aria-label={`Edit ${k.keyword}`}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => remove(k)} className="rounded p-1.5 text-muted hover:bg-secondary hover:text-red-600" aria-label={`Stop tracking ${k.keyword}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!list.length && <p className="py-6 text-center text-sm text-muted">No keywords yet. Add the searches you want to rank for above.</p>}
      </div>
      {hasMetrics && keywords.some((k) => k.wrongPage) && (
        <p className="flex items-start gap-1.5 text-xs text-muted">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "var(--delta-bad)" }} aria-hidden />
          Google shows a different page than the target for some keywords. Link from that page to the target page with the keyword as the link text, or make the target page answer the
          search better.
        </p>
      )}

      {editing && <EditKeywordDialog keyword={editing} pages={knownPages} onClose={() => setEditing(null)} onSaved={onChanged} />}
    </ChartCard>
  );
}

function EditKeywordDialog({ keyword, pages, onClose, onSaved }: { keyword: TrackedKeyword; pages: string[]; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ keyword: keyword.keyword, targetPath: keyword.targetPath ?? "", notes: keyword.notes ?? "", language: keyword.language });
  const [saving, setSaving] = useState(false);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/admin/seo/keywords/${keyword.id}`, form);
      toast.add("Keyword saved", "success");
      onSaved();
      onClose();
    } catch (err) {
      toast.add(getErrorMessage(err, "Couldn't save it"), "error");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Edit keyword"
      description="Positions are matched to Google searches with exactly this wording."
      busy={saving}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="edit-keyword-form" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <form id="edit-keyword-form" onSubmit={save} className="space-y-4">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Keyword</span>
          <Input value={form.keyword} onChange={(event) => setForm({ ...form, keyword: event.target.value })} required minLength={2} maxLength={120} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Target page</span>
          <Input value={form.targetPath} onChange={(event) => setForm({ ...form, targetPath: event.target.value })} placeholder="/cv-format-bangladesh" list="seo-edit-pages" />
          <datalist id="seo-edit-pages">
            {pages.map((page) => (
              <option key={page} value={page} />
            ))}
          </datalist>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Language</span>
          <select value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value as "en" | "bn" })} className="h-10 w-full rounded-lg border border-border bg-background px-2">
            <option value="en">English</option>
            <option value="bn">Bangla</option>
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Notes</span>
          <Input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} maxLength={500} />
        </label>
      </form>
    </Dialog>
  );
}

function CvKeywordIdeas({ ideas, tracked, onTrack, days }: { ideas: SeoData["cvKeywords"]; tracked: Set<string>; onTrack: (q: string) => void; days: string }) {
  const suggestions = ideas.jobTitles.slice(0, 10).map((title) => ({ ...title, keyword: `${title.label.toLowerCase()} cv format` }));
  return (
    <ChartCard
      title="Keyword ideas from your users' CVs"
      description={`The jobs your users are applying for (CVs edited in the last ${days}, each person counted once). People search for "<job> CV format", so these make good guides and keywords.`}
    >
      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <div>
          <p className="mb-3 text-sm font-medium">Most common target jobs</p>
          <BarList items={ideas.jobTitles.slice(0, 10).map((title) => ({ label: title.label, value: title.users, valueText: `${fmtInt(title.users)} people` }))} empty="No CVs with a job title yet" />
        </div>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Suggested keywords</p>
            {suggestions.length ? (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {suggestions.map((s) => (
                  <li key={s.keyword} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate">{s.keyword}</span>
                    {tracked.has(s.keyword) ? (
                      <span className="shrink-0 text-xs text-muted">Tracked</span>
                    ) : (
                      <button type="button" onClick={() => onTrack(s.keyword)} className="shrink-0 text-xs font-medium text-primary hover:underline">
                        Track
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Suggestions appear once users add job titles to their CVs.</p>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Most listed skills</p>
            <ul className="flex flex-wrap gap-1.5">
              {ideas.skills.slice(0, 18).map((skill) => (
                <li key={skill.label} className="rounded-full bg-secondary px-2.5 py-1 text-xs">
                  {skill.label} <span className="tabular-nums text-muted">{fmtInt(skill.users)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted">Based on {fmtInt(ideas.cvsScanned)} CVs. Only counts are shown; no one's CV is displayed.</p>
    </ChartCard>
  );
}
