import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import api, { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  BarList,
  ChartCard,
  ColumnChart,
  DeltaText,
  LegendItem,
  SegmentedBar,
  SeriesTable,
  StatTile,
  TrendChart,
  type ChartSeries,
} from "@/components/charts/Charts";
import { bdDateLabel, bucketLabel, downloadText, fmtInt, fmtPct, fmtTaka, fmtTakaCompact, percentDelta, share, toCsv } from "@/components/charts/format";

type Range = "7d" | "30d" | "90d" | "365d";
const RANGES: Array<{ id: Range; label: string; comparison: string }> = [
  { id: "7d", label: "7 days", comparison: "vs previous 7 days" },
  { id: "30d", label: "30 days", comparison: "vs previous 30 days" },
  { id: "90d", label: "90 days", comparison: "vs previous 90 days" },
  { id: "365d", label: "12 months", comparison: "vs previous 12 months" },
];

interface Totals {
  newUsers: number;
  activeUsers: number;
  cvsCreated: number;
  pdfDownloads: number;
  aiRequests: number;
  trialsStarted: number;
  paidOrders: number;
  payingCustomers: number;
  revenue: number;
}
type Point = Totals & { key: string };
interface Counted {
  id?: string;
  label: string;
  count: number;
}
interface Insights {
  range: Range;
  bucket: "day" | "month";
  period: { start: string; end: string };
  totals: Totals;
  previousTotals: Totals;
  series: Point[];
  funnel: {
    stages: Counted[];
    returning: { cohort: number; returned: number };
    signupMethod: Counted[];
    signupLanguage: Counted[];
    referred: number;
  };
  revenueByItem: Array<{ label: string; revenue: number; count: number }>;
  revenueByMethod: Array<{ label: string; revenue: number; count: number }>;
  aiFeatures: Counted[];
  templates: Counted[];
  cvLanguages: Counted[];
  planMix: Counted[];
}

const METHOD_NAMES: Record<string, string> = { bkash: "bKash", sslcommerz: "Card / SSLCommerz", nagad: "Nagad" };
const SLOTS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

export default function AnalyticsPage() {
  const [params, setParams] = useSearchParams();
  const range = (RANGES.find((r) => r.id === params.get("range"))?.id ?? "30d") as Range;
  const rangeInfo = RANGES.find((r) => r.id === range)!;
  const { data, isLoading, isPlaceholderData, error } = useQuery({
    queryKey: ["admin-analytics", range],
    queryFn: async () => (await api.get(`/admin/analytics?range=${range}`)).data.data as Insights,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const setRange = (id: Range) => {
    const next = new URLSearchParams(params);
    next.set("range", id);
    setParams(next, { replace: true });
  };

  const keys = data?.series.map((p) => p.key) ?? [];
  const column = (field: keyof Totals) => data?.series.map((p) => p[field]) ?? [];
  const t = data?.totals;
  const p = data?.previousTotals;
  const tile = (field: keyof Totals) => ({ delta: t && p ? percentDelta(t[field], p[field]) : undefined, comparison: rangeInfo.comparison, spark: column(field) });
  const perBucket = data?.bucket === "month" ? "per month" : "per day";

  const userSeries: ChartSeries[] = [
    { id: "new", label: "New users", color: SLOTS[0], values: column("newUsers") },
    { id: "active", label: "Active users", color: SLOTS[1], values: column("activeUsers") },
  ];
  const cvSeries: ChartSeries[] = [
    { id: "cvs", label: "CVs created", color: SLOTS[0], values: column("cvsCreated") },
    { id: "pdfs", label: "PDF downloads", color: SLOTS[1], values: column("pdfDownloads") },
  ];

  const exportCsv = () => {
    if (!data) return;
    const fields: Array<[keyof Totals, string]> = [
      ["newUsers", "New users"],
      ["activeUsers", "Active users"],
      ["cvsCreated", "CVs created"],
      ["pdfDownloads", "PDF downloads"],
      ["aiRequests", "AI requests"],
      ["trialsStarted", "Free trials started"],
      ["paidOrders", "Paid orders"],
      ["revenue", "Revenue (BDT)"],
    ];
    const rows = [[data.bucket === "month" ? "Month" : "Date", ...fields.map(([, name]) => name)], ...data.series.map((point) => [point.key, ...fields.map(([field]) => point[field])])];
    downloadText(`aicvbuilderbd-analytics-${range}-${keys[keys.length - 1] ?? "export"}.csv`, toCsv(rows));
  };

  const stages = data?.funnel.stages ?? [];
  const signedUp = stages[0]?.count ?? 0;
  const returning = data?.funnel.returning;
  const avgOrder = t && t.paidOrders ? t.revenue / t.paidOrders : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted">How people sign up, build CVs and pay. Dates are Bangladesh time.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/seo">
              <Search className="mr-1.5 h-4 w-4" aria-hidden />
              SEO & keywords
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!data}>
            <Download className="mr-1.5 h-4 w-4" aria-hidden />
            Download CSV
          </Button>
        </div>
      </div>

      {/* Filters: one row above everything they scope */}
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Date range" className="inline-flex rounded-lg border border-border p-0.5">
          {RANGES.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={range === option.id}
              onClick={() => setRange(option.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                range === option.id ? "bg-primary text-primary-foreground" : "text-muted hover:bg-secondary hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {data && (
          <p className="text-sm text-muted">
            {bdDateLabel(data.period.start)} – {bdDateLabel(data.period.end)}
          </p>
        )}
      </div>

      {error && !data && (
        <Card>
          <CardContent className="pt-6 text-sm text-red-600">{getErrorMessage(error, "Couldn't load analytics.")}</CardContent>
        </Card>
      )}

      <div className={cn("space-y-6 transition-opacity", isPlaceholderData && "opacity-60")} aria-busy={isLoading || isPlaceholderData}>
        {/* Hero: revenue */}
        <Card>
          <CardContent className="flex flex-wrap items-end justify-between gap-6 pt-6">
            <div>
              <p className="text-sm text-muted">Revenue</p>
              {isLoading ? (
                <div className="mt-2 h-12 w-48 animate-pulse rounded bg-secondary" />
              ) : (
                <p className="text-5xl font-semibold tracking-tight">{fmtTaka(t?.revenue ?? 0)}</p>
              )}
              <div className="mt-2">
                <DeltaText delta={t && p ? percentDelta(t.revenue, p.revenue) : undefined} comparison={`${rangeInfo.comparison} (${fmtTaka(p?.revenue ?? 0)})`} />
              </div>
            </div>
            <dl className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <dt className="text-muted">Paid orders</dt>
                <dd className="text-lg font-semibold tabular-nums">{fmtInt(t?.paidOrders ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-muted">Paying customers</dt>
                <dd className="text-lg font-semibold tabular-nums">{fmtInt(t?.payingCustomers ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-muted">Average order</dt>
                <dd className="text-lg font-semibold tabular-nums">{fmtTaka(avgOrder)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatTile label="New users" value={fmtInt(t?.newUsers ?? 0)} loading={isLoading} {...tile("newUsers")} />
          <StatTile label="Active users" value={fmtInt(t?.activeUsers ?? 0)} loading={isLoading} {...tile("activeUsers")} />
          <StatTile label="CVs created" value={fmtInt(t?.cvsCreated ?? 0)} loading={isLoading} {...tile("cvsCreated")} />
          <StatTile label="PDF downloads" value={fmtInt(t?.pdfDownloads ?? 0)} loading={isLoading} {...tile("pdfDownloads")} />
          <StatTile label="AI requests" value={fmtInt(t?.aiRequests ?? 0)} loading={isLoading} {...tile("aiRequests")} />
          <StatTile label="Free trials started" value={fmtInt(t?.trialsStarted ?? 0)} loading={isLoading} {...tile("trialsStarted")} />
          <StatTile
            label="Sign-up to paid"
            value={fmtPct(share(stages[4]?.count ?? 0, signedUp))}
            loading={isLoading}
            hint={`${fmtInt(stages[4]?.count ?? 0)} of ${fmtInt(signedUp)} new users have paid`}
          />
          <StatTile
            label="Came back"
            value={fmtPct(share(returning?.returned ?? 0, returning?.cohort ?? 0))}
            loading={isLoading}
            hint="New users active again a day or more after signing up"
          />
        </div>

        <ChartCard
          title="New and active users"
          description={`People ${perBucket}. Active = did anything (logged in, edited a CV, used AI).`}
          legend={userSeries.map((s) => <LegendItem key={s.id} label={s.label} color={s.color} />)}
          table={<SeriesTable keys={keys} series={userSeries} format={fmtInt} keyHeader={data?.bucket === "month" ? "Month" : "Date"} />}
        >
          <TrendChart keys={keys} series={userSeries} label={`New and active users ${perBucket}`} />
        </ChartCard>

        <div className="grid gap-6 lg:grid-cols-5 [&>*]:min-w-0">
          <ChartCard
            className="lg:col-span-3"
            title="Revenue"
            description={`Completed payments ${perBucket}, in taka`}
            table={
              <SeriesTable
                keys={keys}
                series={[
                  { id: "revenue", label: "Revenue", color: SLOTS[0], values: column("revenue") },
                  { id: "orders", label: "Orders", color: SLOTS[1], values: column("paidOrders") },
                ]}
                format={fmtInt}
                keyHeader={data?.bucket === "month" ? "Month" : "Date"}
              />
            }
          >
            <ColumnChart keys={keys} values={column("revenue")} label={`Revenue ${perBucket}`} seriesLabel="Revenue" format={fmtTaka} axisFormat={fmtTakaCompact} height={340} />
          </ChartCard>

          <ChartCard
            className="lg:col-span-2"
            title="What sells"
            description="Revenue by item and payment method"
            table={
              <table className="w-full text-sm">
                <tbody className="tabular-nums">
                  {[...(data?.revenueByItem ?? []), ...(data?.revenueByMethod ?? []).map((m) => ({ ...m, label: METHOD_NAMES[m.label] ?? m.label }))].map((row, i) => (
                    <tr key={`${row.label}-${i}`} className="border-t border-border">
                      <td className="py-1.5 pr-3">{row.label}</td>
                      <td className="py-1.5 text-right">{fmtInt(row.count)} orders</td>
                      <td className="py-1.5 pl-3 text-right">{fmtTaka(row.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          >
            <BarList
              items={(data?.revenueByItem ?? []).slice(0, 5).map((item) => ({ label: item.label, value: item.revenue, valueText: fmtTaka(item.revenue), detail: `${fmtInt(item.count)} orders` }))}
              empty="No payments in this period"
            />
            <div className="border-t border-border pt-4">
              <p className="mb-2 text-sm font-medium">Payment method</p>
              <SegmentedBar
                label="Revenue by payment method"
                format={fmtTaka}
                parts={(data?.revenueByMethod ?? []).slice(0, 3).map((m, i) => ({ id: m.label, label: METHOD_NAMES[m.label] ?? m.label, value: m.revenue, color: SLOTS[i] }))}
              />
            </div>
          </ChartCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
          <ChartCard
            title="From sign-up to paid"
            description="What the people who signed up in this period went on to do"
            table={
              <table className="w-full text-sm">
                <tbody className="tabular-nums">
                  {stages.map((stage) => (
                    <tr key={stage.label} className="border-t border-border">
                      <td className="py-1.5 pr-3">{stage.label}</td>
                      <td className="py-1.5 text-right">{fmtInt(stage.count)}</td>
                      <td className="py-1.5 pl-3 text-right">{fmtPct(share(stage.count, signedUp))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          >
            <BarList
              max={signedUp}
              items={stages.map((stage, i) => ({
                label: stage.label,
                value: stage.count,
                valueText: i === 0 ? fmtInt(stage.count) : `${fmtInt(stage.count)} · ${fmtPct(share(stage.count, signedUp), 0)}`,
                detail: i > 1 ? `${fmtPct(share(stage.count, stages[i - 1].count), 0)} of the step before` : undefined,
              }))}
              empty="No sign-ups in this period"
            />
          </ChartCard>

          <ChartCard title="Who signs up" description="New users in this period, and everyone's plan today">
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-medium">Sign-up method</p>
                <SegmentedBar label="Sign-up method" parts={(data?.funnel.signupMethod ?? []).map((part, i) => ({ id: part.id ?? part.label, label: part.label, value: part.count, color: SLOTS[i] }))} />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Language</p>
                <SegmentedBar label="Sign-up language" parts={(data?.funnel.signupLanguage ?? []).map((part, i) => ({ id: part.id ?? part.label, label: part.label, value: part.count, color: SLOTS[i] }))} />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Invited by a friend</p>
                <SegmentedBar
                  label="Invited by a friend"
                  parts={[
                    { id: "invited", label: "Invited", value: data?.funnel.referred ?? 0, color: SLOTS[0] },
                    { id: "direct", label: "Came on their own", value: signedUp - (data?.funnel.referred ?? 0), color: SLOTS[1] },
                  ]}
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Plan today (all users)</p>
                <SegmentedBar label="Plan today" parts={(data?.planMix ?? []).map((part, i) => ({ id: part.id ?? part.label, label: part.label, value: part.count, color: SLOTS[i] }))} />
              </div>
            </div>
          </ChartCard>
        </div>

        <ChartCard
          title="CVs and downloads"
          description={`CVs created and PDFs downloaded ${perBucket}`}
          legend={cvSeries.map((s) => <LegendItem key={s.id} label={s.label} color={s.color} />)}
          table={<SeriesTable keys={keys} series={cvSeries} format={fmtInt} keyHeader={data?.bucket === "month" ? "Month" : "Date"} />}
        >
          <TrendChart keys={keys} series={cvSeries} label={`CVs created and PDF downloads ${perBucket}`} />
        </ChartCard>

        <div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
          <ChartCard title="AI tools used" description="Successful AI requests by tool">
            <BarList items={(data?.aiFeatures ?? []).map((row) => ({ label: row.label, value: row.count }))} empty="No AI use in this period" />
          </ChartCard>
          <ChartCard title="Popular templates" description="Templates of the CVs created">
            <BarList items={(data?.templates ?? []).map((row) => ({ label: row.label, value: row.count }))} empty="No CVs in this period" />
          </ChartCard>
          <ChartCard title="CV language" description="Language of the CVs created">
            <SegmentedBar label="CV language" parts={(data?.cvLanguages ?? []).map((row, i) => ({ id: row.label, label: row.label, value: row.count, color: SLOTS[i] }))} />
            <p className="text-xs text-muted">
              Busiest {data?.bucket === "month" ? "month" : "day"} for new users:{" "}
              {(() => {
                const values = column("newUsers");
                const max = Math.max(0, ...values);
                return max ? `${bucketLabel(keys[values.indexOf(max)], true)} (${fmtInt(max)})` : "–";
              })()}
            </p>
          </ChartCard>
        </div>

        <p className="text-xs text-muted">
          Active users and AI tools come from the activity log, which is trimmed after the number of days set in Admin → Settings (180 by
          default). Revenue counts completed payments on the day they completed. CVs, downloads and AI requests are daily counters, so
          deleted CVs still count.
        </p>
      </div>
    </div>
  );
}
