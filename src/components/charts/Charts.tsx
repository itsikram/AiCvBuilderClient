import { useId, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus, Table2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { bucketLabel, fmtCompact, fmtInt, niceTicks, share, type Delta } from "./format";
import { useElementWidth } from "./useElementWidth";

// Small SVG/HTML charts for the admin dashboards. Marks follow one spec: 2px lines, bars at
// most 24px thick with 4px rounded ends and a square base, hairline gridlines, a surface ring
// on dots, values in text colours (never the series colour), a legend for two or more series,
// a crosshair or per-bar tooltip, and a table view for every chart.

export interface ChartSeries {
  id: string;
  label: string;
  /** A CSS colour, normally var(--chart-N) */
  color: string;
  values: number[];
}

const AXIS_FONT = 11;
const charWidth = (text: string) => text.length * 6.6;

/* ------------------------------------------------------------------ chart card */

export function LegendItem({ label, color, kind = "line" }: { label: string; color: string; kind?: "line" | "rect" }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span
        aria-hidden
        className={kind === "line" ? "h-0.5 w-3.5 rounded-full" : "h-2.5 w-2.5 rounded-sm"}
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

interface ChartCardProps {
  title: string;
  description?: ReactNode;
  legend?: ReactNode;
  /** The same numbers as a table, shown instead of the chart on request */
  table?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, description, legend, table, action, children, className }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);
  return (
    <Card className={cn("min-w-0", className)}>
      <CardContent className="space-y-4 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-semibold">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          <div className="flex items-center gap-1">
            {action}
            {table && (
              <button
                type="button"
                onClick={() => setShowTable((value) => !value)}
                aria-pressed={showTable}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted hover:bg-secondary hover:text-foreground",
                  showTable && "bg-secondary text-foreground"
                )}
              >
                <Table2 className="h-3.5 w-3.5" aria-hidden />
                Table
              </button>
            )}
          </div>
        </div>
        {legend && !showTable && <div className="flex flex-wrap gap-x-4 gap-y-1">{legend}</div>}
        {showTable && table ? <div className="relative max-h-80 overflow-auto">{table}</div> : children}
      </CardContent>
    </Card>
  );
}

/** A plain table of chart values. */
export function SeriesTable({ keys, series, format, keyHeader = "Date" }: { keys: string[]; series: ChartSeries[]; format: (n: number) => string; keyHeader?: string }) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-card text-left text-xs text-muted">
        <tr>
          <th className="py-1.5 pr-3 font-medium">{keyHeader}</th>
          {series.map((s) => (
            <th key={s.id} className="py-1.5 pl-3 text-right font-medium">
              {s.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="tabular-nums">
        {keys.map((key, i) => (
          <tr key={key} className="border-t border-border">
            <td className="py-1.5 pr-3">{bucketLabel(key, true)}</td>
            {series.map((s) => (
              <td key={s.id} className="py-1.5 pl-3 text-right">
                {format(s.values[i] ?? 0)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ------------------------------------------------------------------ shared plot frame */

interface FrameProps {
  keys: string[];
  max: number;
  height: number;
  width: number;
  axisFormat: (n: number) => string;
  rightPad: number;
  /** Bars sit in bands; lines run edge to edge */
  banded: boolean;
}

const frameOf = ({ keys, max, height, width, axisFormat, rightPad, banded }: FrameProps) => {
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1] || 1;
  const left = Math.max(...ticks.map((t) => charWidth(axisFormat(t)))) + 10;
  const plot = { left, top: 10, right: width - rightPad, bottom: height - 24 };
  const plotW = Math.max(1, plot.right - plot.left);
  const plotH = plot.bottom - plot.top;
  const n = keys.length;
  const band = plotW / Math.max(1, n);
  const x = (i: number) => (banded ? plot.left + band * i + band / 2 : n <= 1 ? plot.left + plotW / 2 : plot.left + (plotW * i) / (n - 1));
  const y = (v: number) => plot.bottom - (Math.max(0, v) / top) * plotH;
  // Label every k-th date so labels never touch
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(plotW / 64))));
  const xLabels = keys.map((key, i) => ({ key, i })).filter(({ i }) => (n - 1 - i) % labelEvery === 0);
  const indexAt = (px: number) => {
    if (n <= 1) return 0;
    const raw = banded ? (px - plot.left) / band - 0.5 : ((px - plot.left) / plotW) * (n - 1);
    return Math.min(n - 1, Math.max(0, Math.round(raw)));
  };
  return { ticks, plot, plotW, plotH, band, x, y, xLabels, indexAt };
};

function Axes({ frame, axisFormat, width }: { frame: ReturnType<typeof frameOf>; axisFormat: (n: number) => string; width: number }) {
  return (
    <g aria-hidden>
      {frame.ticks.map((t) => (
        <g key={t}>
          <line
            x1={frame.plot.left}
            x2={frame.plot.right}
            y1={frame.y(t)}
            y2={frame.y(t)}
            stroke={t === 0 ? "var(--color-muted)" : "var(--color-border)"}
            strokeOpacity={t === 0 ? 0.5 : 1}
            strokeWidth={1}
            shapeRendering="crispEdges"
          />
          <text x={frame.plot.left - 8} y={frame.y(t)} dy="0.32em" textAnchor="end" fontSize={AXIS_FONT} fill="var(--color-muted)" className="tabular-nums">
            {axisFormat(t)}
          </text>
        </g>
      ))}
      {frame.xLabels.map(({ key, i }) => {
        const anchor = frame.x(i) < frame.plot.left + 24 ? "start" : frame.x(i) > width - 24 ? "end" : "middle";
        return (
          <text key={key} x={frame.x(i)} y={frame.plot.bottom + 16} textAnchor={anchor} fontSize={AXIS_FONT} fill="var(--color-muted)">
            {bucketLabel(key)}
          </text>
        );
      })}
    </g>
  );
}

function Tooltip({ x, width, title, rows }: { x: number; width: number; title: string; rows: Array<{ label: string; value: string; color: string; kind?: "line" | "rect" }> }) {
  const boxWidth = 168;
  const left = Math.min(Math.max(0, x + 12), Math.max(0, width - boxWidth));
  const flipped = x + 12 + boxWidth > width;
  return (
    <div
      role="presentation"
      className="pointer-events-none absolute top-0 z-10 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg"
      style={{ left: flipped ? Math.max(0, x - boxWidth - 12) : left, width: boxWidth }}
    >
      <p className="mb-1 text-muted">{title}</p>
      {rows.map((row) => (
        <p key={row.label} className="flex items-center gap-2">
          <span aria-hidden className={row.kind === "rect" ? "h-2.5 w-2.5 shrink-0 rounded-sm" : "h-0.5 w-3 shrink-0 rounded-full"} style={{ backgroundColor: row.color }} />
          <span className="font-semibold tabular-nums text-foreground">{row.value}</span>
          <span className="truncate text-muted">{row.label}</span>
        </p>
      ))}
    </div>
  );
}

/** Arrow keys move the highlighted point, so keyboard users get the tooltip too. */
const useKeyboardIndex = (count: number) => {
  const [index, setIndex] = useState<number | null>(null);
  const onKeyDown = (event: KeyboardEvent) => {
    if (!count) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      setIndex((current) => {
        const start = current ?? count - 1;
        return Math.min(count - 1, Math.max(0, start + (event.key === "ArrowLeft" ? -1 : 1)));
      });
    } else if (event.key === "Home") setIndex(0);
    else if (event.key === "End") setIndex(count - 1);
  };
  return { index, setIndex, onKeyDown, onFocus: () => setIndex((current) => current ?? count - 1), onBlur: () => setIndex(null) };
};

/* ------------------------------------------------------------------ line chart */

interface TrendChartProps {
  keys: string[];
  series: ChartSeries[];
  /** Accessible name, e.g. "New users per day" */
  label: string;
  format?: (n: number) => string;
  axisFormat?: (n: number) => string;
  height?: number;
  /** A 10% wash under a single line */
  area?: boolean;
}

export function TrendChart({ keys, series, label, format = fmtInt, axisFormat = fmtCompact, height = 220, area = series.length === 1 }: TrendChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const gradientId = useId();
  const { index, setIndex, onKeyDown, onFocus, onBlur } = useKeyboardIndex(keys.length);
  const max = Math.max(0, ...series.flatMap((s) => s.values));
  const lastValues = series.map((s) => s.values[s.values.length - 1] ?? 0);
  const endLabelWidth = Math.max(0, ...lastValues.map((v) => charWidth(format(v)))) + 14;
  const frame = width ? frameOf({ keys, max, height, width, axisFormat, rightPad: Math.min(72, endLabelWidth), banded: false }) : null;

  const onPointer = (event: PointerEvent<SVGRectElement>) => {
    if (!frame) return;
    const box = event.currentTarget.ownerSVGElement!.getBoundingClientRect();
    setIndex(frame.indexAt(event.clientX - box.left));
  };

  // End labels: the last value of each line, dropped when it would collide with one above it
  const endLabels: Array<{ id: string; y: number; text: string }> = [];
  if (frame) {
    series
      .map((s, i) => ({ id: s.id, y: frame.y(lastValues[i]), text: format(lastValues[i]) }))
      .sort((a, b) => a.y - b.y)
      .forEach((item) => {
        if (endLabels.every((placed) => Math.abs(placed.y - item.y) >= 14)) endLabels.push(item);
      });
  }

  const summary = series.map((s, i) => `${s.label}: ${format(lastValues[i])} on ${keys.length ? bucketLabel(keys[keys.length - 1], true) : "-"}`).join("; ");

  return (
    <div ref={ref} className="relative" style={{ height }}>
      {frame && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`${label}. ${summary}. Use the arrow keys to read each point.`}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          className="overflow-visible rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Axes frame={frame} axisFormat={axisFormat} width={width} />
          {series.map((s) => {
            const points = s.values.map((v, i) => `${frame.x(i)},${frame.y(v)}`);
            return (
              <g key={s.id}>
                {area && (
                  <>
                    <defs>
                      <linearGradient id={`${gradientId}-${s.id}`} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={s.color} stopOpacity={0.14} />
                        <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <path
                      d={`M${frame.x(0)},${frame.plot.bottom} L${points.join(" L")} L${frame.x(s.values.length - 1)},${frame.plot.bottom} Z`}
                      fill={`url(#${gradientId}-${s.id})`}
                    />
                  </>
                )}
                <polyline points={points.join(" ")} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                <circle cx={frame.x(s.values.length - 1)} cy={frame.y(s.values[s.values.length - 1] ?? 0)} r={4} fill={s.color} stroke="var(--color-card)" strokeWidth={2} />
              </g>
            );
          })}
          {endLabels.map((item) => (
            <text key={item.id} x={frame.plot.right + 8} y={item.y} dy="0.32em" fontSize={12} fill="var(--color-foreground)" className="tabular-nums">
              {item.text}
            </text>
          ))}
          {index !== null && (
            <g aria-hidden>
              <line x1={frame.x(index)} x2={frame.x(index)} y1={frame.plot.top} y2={frame.plot.bottom} stroke="var(--color-muted)" strokeWidth={1} />
              {series.map((s) => (
                <circle key={s.id} cx={frame.x(index)} cy={frame.y(s.values[index] ?? 0)} r={4} fill={s.color} stroke="var(--color-card)" strokeWidth={2} />
              ))}
            </g>
          )}
          <rect
            x={frame.plot.left}
            y={0}
            width={frame.plotW}
            height={frame.plot.bottom}
            fill="transparent"
            onPointerMove={onPointer}
            onPointerDown={onPointer}
            onPointerLeave={() => setIndex(null)}
          />
        </svg>
      )}
      {frame && index !== null && (
        <Tooltip
          x={frame.x(index)}
          width={width}
          title={bucketLabel(keys[index], true)}
          rows={series.map((s) => ({ label: s.label, value: format(s.values[index] ?? 0), color: s.color }))}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ column chart */

interface ColumnChartProps {
  keys: string[];
  values: number[];
  label: string;
  seriesLabel: string;
  color?: string;
  format?: (n: number) => string;
  axisFormat?: (n: number) => string;
  height?: number;
}

/** One value per date: a 4px-rounded top, a square base, at most 24px wide. */
const columnPath = (x: number, y: number, w: number, h: number) => {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} Z`;
};

export function ColumnChart({ keys, values, label, seriesLabel, color = "var(--chart-1)", format = fmtInt, axisFormat = fmtCompact, height = 220 }: ColumnChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const { index, setIndex, onKeyDown, onFocus, onBlur } = useKeyboardIndex(keys.length);
  const max = Math.max(0, ...values);
  const frame = width ? frameOf({ keys, max, height, width, axisFormat, rightPad: 8, banded: true }) : null;
  const peak = values.indexOf(max);
  const total = values.reduce((sum, v) => sum + v, 0);

  const onPointer = (event: PointerEvent<SVGRectElement>) => {
    if (!frame) return;
    const box = event.currentTarget.ownerSVGElement!.getBoundingClientRect();
    setIndex(frame.indexAt(event.clientX - box.left));
  };

  return (
    <div ref={ref} className="relative" style={{ height }}>
      {frame && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`${label}. Total ${format(total)}; highest ${max ? `${format(max)} on ${bucketLabel(keys[peak], true)}` : "none"}. Use the arrow keys to read each bar.`}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          className="overflow-visible rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Axes frame={frame} axisFormat={axisFormat} width={width} />
          {values.map((v, i) => {
            if (v <= 0) return null;
            // Touching bars keep a 2px gap
            const w = Math.max(1, Math.min(24, frame.band - 2));
            const h = Math.max(1, frame.plot.bottom - frame.y(v));
            return (
              <path
                key={keys[i]}
                d={columnPath(frame.x(i) - w / 2, frame.plot.bottom - h, w, h)}
                fill={color}
                opacity={index === null || index === i ? 1 : 0.55}
              />
            );
          })}
          {max > 0 && index === null && (
            <text
              x={frame.x(peak)}
              y={frame.y(max) - 6}
              textAnchor={frame.x(peak) > width - 40 ? "end" : frame.x(peak) < frame.plot.left + 40 ? "start" : "middle"}
              fontSize={12}
              fill="var(--color-foreground)"
              className="tabular-nums"
            >
              {format(max)}
            </text>
          )}
          <rect
            x={frame.plot.left}
            y={0}
            width={frame.plotW}
            height={frame.plot.bottom}
            fill="transparent"
            onPointerMove={onPointer}
            onPointerDown={onPointer}
            onPointerLeave={() => setIndex(null)}
          />
        </svg>
      )}
      {frame && index !== null && (
        <Tooltip
          x={frame.x(index)}
          width={width}
          title={bucketLabel(keys[index], true)}
          rows={[{ label: seriesLabel, value: format(values[index] ?? 0), color, kind: "rect" }]}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ ranked bars */

export interface BarItem {
  label: string;
  value: number;
  /** Right-hand text; defaults to the formatted value */
  valueText?: string;
  detail?: string;
}

/** Horizontal bars, longest first: one colour, value at the end of each label row. */
export function BarList({ items, format = fmtInt, color = "var(--chart-1)", max, empty = "No data for this period" }: { items: BarItem[]; format?: (n: number) => string; color?: string; max?: number; empty?: string }) {
  const top = max ?? Math.max(0, ...items.map((item) => item.value));
  if (!items.length || top <= 0) return <p className="py-6 text-center text-sm text-muted">{empty}</p>;
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label} className="min-w-0">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate" title={item.label}>
              {item.label}
            </span>
            <span className="shrink-0 font-medium tabular-nums">{item.valueText ?? format(item.value)}</span>
          </div>
          <div className="mt-1 h-2 w-full" aria-hidden>
            {item.value > 0 && (
              <div className="h-2 rounded-r" style={{ width: `${Math.max(0.5, (item.value / top) * 100)}%`, backgroundColor: color }} />
            )}
          </div>
          {item.detail && <p className="mt-0.5 text-xs text-muted">{item.detail}</p>}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ part-to-whole */

export interface Part {
  id: string;
  label: string;
  value: number;
  color: string;
  /** Near-black text inside light fills */
  darkText?: boolean;
}

const percentText = (ratio: number) => (ratio > 0 && ratio < 0.005 ? "<1%" : `${Math.round(ratio * 100)}%`);

/** One whole split into parts: a 28px bar with shares inside where they fit, then a legend. */
export function SegmentedBar({ parts, label, format = fmtInt }: { parts: Part[]; label: string; format?: (n: number) => string }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const total = parts.reduce((sum, part) => sum + Math.max(0, part.value), 0);
  if (total <= 0) return <p className="py-2 text-sm text-muted">No data for this period</p>;
  const visible = parts.filter((part) => part.value > 0);
  const gaps = (visible.length - 1) * 2;
  const describe = parts.map((part) => `${part.label} ${format(part.value)} (${percentText(share(part.value, total))})`).join(", ");
  return (
    <div className="space-y-2">
      <div ref={ref} role="img" aria-label={`${label}: ${describe}`} className="flex h-7 w-full gap-0.5">
        {visible.map((part) => {
          const ratio = share(part.value, total);
          const text = percentText(ratio);
          const fits = width > 0 && (width - gaps) * ratio >= charWidth(text) + 16;
          return (
            <div
              key={part.id}
              title={`${part.label}: ${format(part.value)} (${text})`}
              className="flex min-w-[2px] items-center rounded px-2 text-xs font-semibold tabular-nums"
              style={{ flexGrow: part.value, flexBasis: 0, backgroundColor: part.color, color: part.darkText ? "#0b0b0b" : "#ffffff" }}
            >
              {fits ? text : null}
            </div>
          );
        })}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {parts.map((part) => (
          <li key={part.id} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: part.color }} />
            <span>{part.label}</span>
            <span className="tabular-nums text-muted">
              {format(part.value)} · {percentText(share(part.value, total))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ KPI tile */

function Sparkline({ values }: { values: number[] }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const height = 28;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const y = (v: number) => height - 3 - (v / max) * (height - 6);
  return (
    <div ref={ref} className="h-7 w-full" aria-hidden>
      {width > 0 && values.length > 1 && (
        <svg width={width} height={height} className="overflow-visible">
          <polyline points={values.map((v, i) => `${i * step},${y(v)}`).join(" ")} fill="none" stroke="var(--chart-quiet)" strokeWidth={1.5} strokeLinejoin="round" />
          <circle cx={(values.length - 1) * step} cy={y(values[values.length - 1])} r={3} fill="var(--chart-1)" stroke="var(--color-card)" strokeWidth={1.5} />
        </svg>
      )}
    </div>
  );
}

export function DeltaText({ delta, comparison }: { delta?: Delta; comparison?: string }) {
  if (!delta) return comparison ? <p className="text-xs text-muted">{comparison}</p> : null;
  const Icon = delta.direction === "up" ? ArrowUpRight : delta.direction === "down" ? ArrowDownRight : Minus;
  const color = delta.tone === "good" ? "var(--delta-good)" : delta.tone === "bad" ? "var(--delta-bad)" : "var(--color-muted)";
  return (
    <p className="flex flex-wrap items-center gap-x-1 text-xs">
      <span className="inline-flex items-center gap-0.5 font-semibold" style={{ color }}>
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {delta.text}
        <span className="sr-only">{delta.tone === "good" ? "(better)" : delta.tone === "bad" ? "(worse)" : ""}</span>
      </span>
      {comparison && <span className="text-muted">{comparison}</span>}
    </p>
  );
}

interface StatTileProps {
  label: string;
  value: string;
  delta?: Delta;
  comparison?: string;
  spark?: number[];
  hint?: string;
  loading?: boolean;
}

export function StatTile({ label, value, delta, comparison, spark, hint, loading }: StatTileProps) {
  return (
    <Card className="min-w-0">
      <CardContent className="space-y-1.5 pt-5">
        <p className="text-sm text-muted">{label}</p>
        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-secondary" />
        ) : (
          <p className="truncate text-2xl font-semibold" title={value}>
            {value}
          </p>
        )}
        <DeltaText delta={delta} comparison={comparison} />
        {hint && <p className="text-xs text-muted">{hint}</p>}
        {spark && spark.length > 1 && <Sparkline values={spark} />}
      </CardContent>
    </Card>
  );
}
