'use client';

/**
 * Shared chart primitives for the Statistics and admin Overview pages.
 *
 * Extracted so both surfaces are literally the same components rather than
 * two drifting copies. The rules they encode:
 *
 *  · Colour is assigned by the job it does, from the validated --viz-* tokens
 *    in globals.css — categorical for series identity, ordinal for ordered
 *    stages, sequential for magnitude, status for reserved meaning. Those
 *    hexes are checked against this app's own surfaces for contrast and
 *    colour-blind separation; do not substitute eyeballed values.
 *  · One axis, always. Two measures of different scale get two charts, never
 *    a second y-scale, which invents a correlation the data does not have.
 *  · Every chart ships a table view, because three light-mode series colours
 *    sit below 3:1 contrast and values must never be gated behind colour or
 *    hover.
 *  · Marks are thin, gridlines are solid hairlines, and white space does the
 *    separating — never a stroke drawn around a mark.
 *
 * Labels arrive as props rather than through a translation hook: the user
 * dashboard is localised and the admin panel is English-only, and a hook here
 * would force one of them to lie.
 */

import { useCallback, useId, useMemo, useState } from 'react';
import { TableCellsIcon } from '@heroicons/react/24/outline';

export const CARD = 'bg-surface/80 backdrop-blur-xl border border-border rounded-2xl';

/** Compact, for stat tiles. Proportional figures — never tabular at display size. */
export function fmt(n: number | null | undefined): string {
  const v = n ?? 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 10_000) return `${Math.round(v / 1_000)}k`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return String(v);
}

/* ─── Tooltip ────────────────────────────────────────────── */

export type TipState = {
  /** Any CSS length — px from a pointer event, or a % for a chart position
   *  that must not require measuring the DOM during render. */
  x: number | string;
  y: number | string;
  rows: { label: string; value: string; color?: string }[];
  title: string;
} | null;

/**
 * One tooltip element per chart card, positioned inside the card.
 *
 * Text goes in as React children rather than markup — series names and user
 * titles are untrusted strings, and a CV called `<img onerror=…>` must render
 * as those characters and nothing else.
 */
export function Tooltip({ tip }: { tip: TipState }) {
  if (!tip) return null;
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 min-w-[9rem] rounded-xl border border-border bg-surface px-3 py-2 shadow-xl"
      style={{ left: tip.x, top: tip.y, transform: 'translate(-50%, -115%)' }}
    >
      <p className="mb-1 text-[11px] font-semibold text-txt-muted">{tip.title}</p>
      {tip.rows.map((row) => (
        <div key={row.label} className="flex items-baseline gap-2">
          {row.color && (
            // A short stroke, not a filled box: at tooltip density a box is
            // data-weight ink doing a label's job.
            <span className="h-[2px] w-3 shrink-0 rounded-full" style={{ background: row.color }} />
          )}
          {/* Value leads, label follows — the reader already knows the series. */}
          <span className="text-[13px] font-bold tabular-nums text-txt">{row.value}</span>
          <span className="truncate text-[11px] text-txt-muted">{row.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Card shell with the table-view toggle ──────────────── */

export function ChartCard({
  title, subtitle, icon: Icon, table, children, className = '', tableLabel = 'Table view',
}: {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  /** The WCAG-clean twin. Every chart has one; it is not optional. */
  table: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  tableLabel?: string;
}) {
  const [showTable, setShowTable] = useState(false);

  return (
    // A column so the body can claim the leftover height when the card is
    // stretched to match a taller neighbour in the same row.
    <div className={`${CARD} flex flex-col p-6 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-[14px] font-bold text-txt">
            <Icon className="h-4 w-4 shrink-0 text-blue-500" />
            {title}
          </h3>
          {subtitle && <p className="mt-0.5 text-[12px] text-txt-muted">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          aria-pressed={showTable}
          title={tableLabel}
          className={`shrink-0 rounded-lg p-1.5 transition-colors ${
            showTable ? 'bg-blue-500/10 text-blue-500' : 'text-txt-dim hover:bg-surface2 hover:text-txt'
          }`}
        >
          <TableCellsIcon className="h-4 w-4" />
        </button>
      </div>
      {showTable
        ? <div className="min-h-0 flex-1 overflow-x-auto">{table}</div>
        : <div className="flex min-h-0 flex-1 flex-col">{children}</div>}
    </div>
  );
}

export function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-left text-[12px]">
      <thead>
        <tr className="border-b border-border">
          {head.map((h, i) => (
            <th
              key={h}
              className={`pb-2 text-[10px] font-bold uppercase tracking-wider text-txt-muted ${i > 0 ? 'text-right' : ''}`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border/50">
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td
                key={j}
                className={`py-2 ${j > 0 ? 'text-right tabular-nums text-txt-muted' : 'font-medium text-txt'}`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ─── KPI tile ───────────────────────────────────────────── */

export function KpiTile({
  label, value, hint, icon: Icon, tone = 'neutral',
  provisional = false, provisionalLabel = 'Provisional',
  provisionalHint = 'Based on a small sample — this figure will still move.',
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'neutral' | 'good' | 'accent' | 'warning';
  /** Real, but computed from a sample small enough to swing on one more
   *  result. Marked rather than hidden — the reader decides. */
  provisional?: boolean;
  provisionalLabel?: string;
  provisionalHint?: string;
}) {
  const ring = {
    neutral: 'bg-surface2 text-txt-muted',
    accent: 'bg-blue-500/10 text-blue-500',
    good: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  }[tone];

  return (
    <div className={`${CARD} p-5`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-txt-muted">{label}</span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${ring}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        {/* Proportional figures: tabular-nums makes a number like 121 look
            loose at this size, and nothing here aligns vertically. */}
        <p className="text-[28px] font-extrabold leading-none text-txt">{value}</p>
        {provisional && (
          <span
            title={provisionalHint}
            className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400"
          >
            {provisionalLabel}
          </span>
        )}
      </div>
      {hint && <p className="mt-1.5 truncate text-[11px] text-txt-dim">{hint}</p>}
    </div>
  );
}

/* ─── Funnel ─────────────────────────────────────────────── */

const STAGE_STEP = ['--viz-step-1', '--viz-step-2', '--viz-step-3', '--viz-step-4', '--viz-step-5'];

export type FunnelStageData = {
  stage: string;
  count: number;
  pctOfTop: number;
  conversion: number | null;
};

/**
 * A strictly-nested funnel: each stage is a subset of the one above it.
 *
 * The ordinal ramp carries stage order in the colour itself, so the sequence
 * survives even when the bars are close in length. The percentage between two
 * bars is the share of the previous stage that made it here — the number that
 * says where the loss actually happens.
 */
export function FunnelChart({
  stages, labels, unitLabel, ofTotalLabel, labelWidth = 92,
}: {
  stages: FunnelStageData[];
  labels: Record<string, string>;
  unitLabel: string;
  ofTotalLabel: string;
  labelWidth?: number;
}) {
  const [tip, setTip] = useState<TipState>(null);
  const top = stages[0]?.count ?? 0;

  return (
    <div className="relative">
      <Tooltip tip={tip} />
      <div className="space-y-1">
        {stages.map((stage, i) => {
          // Zero-width bars are invisible; a hairline stub keeps the row
          // readable as "this stage exists and is empty".
          const width = top ? Math.max((stage.count / top) * 100, stage.count > 0 ? 2 : 0.6) : 0.6;
          const color = `var(${STAGE_STEP[i % STAGE_STEP.length]})`;

          return (
            <div key={stage.stage}>
              {i > 0 && (
                <div
                  className="flex items-center gap-2 py-1"
                  style={{ paddingInlineStart: labelWidth + 12 }}
                >
                  <span className="h-3 w-px bg-border" />
                  <span className="text-[10px] font-semibold tabular-nums text-txt-dim">
                    {stage.conversion === null ? '—' : `${stage.conversion}%`}
                  </span>
                </div>
              )}
              <div
                className="group flex items-center gap-3"
                onPointerMove={(e) => {
                  const box = e.currentTarget.parentElement!.parentElement!.getBoundingClientRect();
                  setTip({
                    x: e.clientX - box.left,
                    y: e.clientY - box.top,
                    title: labels[stage.stage] || stage.stage,
                    rows: [
                      { label: unitLabel, value: String(stage.count), color },
                      { label: ofTotalLabel, value: `${stage.pctOfTop}%` },
                    ],
                  });
                }}
                onPointerLeave={() => setTip(null)}
              >
                <span
                  className="shrink-0 text-end text-[12px] font-medium leading-tight text-txt-muted"
                  style={{ width: labelWidth }}
                >
                  {labels[stage.stage] || stage.stage}
                </span>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div
                    // ≤24px thick, 4px rounded data-end, square at the baseline.
                    className="h-5 transition-all duration-500 group-hover:brightness-110"
                    style={{ width: `${width}%`, background: color, borderRadius: '2px 4px 4px 2px' }}
                  />
                  {/* Direct label outside the bar: it never fits inside a
                      short one, and clipping it would be worse than none. */}
                  <span className="shrink-0 text-[13px] font-bold tabular-nums text-txt">
                    {stage.count}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Trend ──────────────────────────────────────────────── */

export type TrendSeries = { key: string; color: string; label: string; area?: boolean };

/**
 * Lines on one shared scale.
 *
 * Deliberately single-axis: plotting two measures of different magnitude
 * against two scales manufactures a correlation that is not in the data. If
 * two series genuinely cannot share a scale, they are two charts.
 */
export function TrendChart({
  data, series, height = 170, maxLabels = 7,
}: {
  data: ({ label: string } & Record<string, string | number>)[];
  series: TrendSeries[];
  height?: number;
  maxLabels?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  // Unique per instance: a hardcoded gradient id collides the moment two
  // trend charts share a page, and the second silently takes the first's fill.
  const gradientId = useId().replace(/:/g, '');

  const W = 560, PAD_T = 14, PAD_B = 26, PAD_X = 8;
  const H = height;
  const plotH = H - PAD_T - PAD_B;

  const max = Math.max(
    ...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0)),
    1,
  );
  // Round the ceiling to something a tick label can say cleanly.
  const ceil = max <= 4 ? 4 : Math.ceil(max / 5) * 5;

  const x = (i: number) => PAD_X + (i / Math.max(data.length - 1, 1)) * (W - PAD_X * 2);
  const y = (v: number) => PAD_T + plotH - (v / ceil) * plotH;

  const path = (key: string) =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(Number(d[key]) || 0)}`).join(' ');

  const onMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - box.left) / box.width) * W;
    let nearest = 0;
    for (let i = 1; i < data.length; i++) {
      if (Math.abs(x(i) - rel) < Math.abs(x(nearest) - rel)) nearest = i;
    }
    setHover(nearest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length]);

  // A dot per point is noise past a couple of weeks of daily data; the
  // crosshair marker still shows the hovered value.
  const showMarkers = data.length <= 14;
  // Thin the axis labels rather than letting 90 dates overlap into a smear.
  const labelStep = Math.max(1, Math.ceil(data.length / maxLabels));
  const point = hover !== null ? data[hover] : null;

  return (
    <div>
      {/* Legend is always present for two or more series — identity must
          never rest on colour-matching alone. */}
      {series.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center gap-4">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-txt-muted">
              <span className="h-[2px] w-4 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}

      <div className="relative" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {point && (
          <Tooltip
            tip={{
              // Percentage of the plot width, so the tooltip tracks the
              // crosshair without measuring the element during render.
              x: `${(x(hover!) / W) * 100}%`,
              y: 6,
              title: point.label,
              rows: series.map((s) => ({
                label: s.label,
                value: String(point[s.key] ?? 0),
                color: s.color,
              })),
            }}
          />
        )}

        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }} role="img">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={series[0]?.color} stopOpacity="0.14" />
              <stop offset="100%" stopColor={series[0]?.color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Solid hairline gridlines, one step off the surface. Dashes read
              as "threshold" when this is only a grid. */}
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line
                x1={PAD_X} x2={W - PAD_X}
                y1={PAD_T + plotH * f} y2={PAD_T + plotH * f}
                stroke="var(--viz-grid)" strokeWidth="1" vectorEffect="non-scaling-stroke"
              />
              <text
                x={0} y={PAD_T + plotH * f - 3}
                className="fill-[var(--viz-neutral)] text-[9px] tabular-nums"
              >
                {Math.round(ceil * (1 - f))}
              </text>
            </g>
          ))}

          {series.map((s) => (
            s.area !== false && s === series[0] ? (
              <path
                key={`${s.key}-area`}
                d={`${path(s.key)} L${x(data.length - 1)},${PAD_T + plotH} L${x(0)},${PAD_T + plotH} Z`}
                fill={`url(#${gradientId})`}
              />
            ) : null
          ))}

          {series.map((s) => (
            <path
              key={s.key}
              d={path(s.key)}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {hover !== null && (
            <line
              x1={x(hover)} x2={x(hover)} y1={PAD_T} y2={PAD_T + plotH}
              stroke="var(--viz-neutral)" strokeWidth="1" vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Markers ≥8px with a 2px surface ring so they stay legible where
              two lines cross. */}
          {data.map((d, i) => (
            (showMarkers || hover === i) && (
              <g key={`m-${i}`}>
                {series.map((s) => (
                  <circle
                    key={s.key}
                    cx={x(i)} cy={y(Number(d[s.key]) || 0)} r={hover === i ? 5 : 4}
                    fill={s.color} stroke="var(--color-surface)" strokeWidth="2"
                  />
                ))}
              </g>
            )
          ))}

          {data.map((d, i) => (
            (i % labelStep === 0 || i === data.length - 1) && (
              <text
                key={`x-${i}`} x={x(i)} y={H - 6} textAnchor="middle"
                className="fill-[var(--viz-neutral)] text-[10px]"
              >
                {d.label}
              </text>
            )
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ─── Segmented part-to-whole bar ────────────────────────── */

/**
 * A single stacked bar plus a keyed breakdown beneath it.
 *
 * Used where the question is "how does the whole divide right now" — a pie
 * would make close values impossible to compare and this reads at a glance.
 */
export function SegmentBar({
  rows, labels, colors, total, emptyLabel,
}: {
  rows: { key: string; count: number }[];
  labels: Record<string, string>;
  colors: Record<string, string>;
  total: number;
  emptyLabel: string;
}) {
  const [tip, setTip] = useState<TipState>(null);
  const present = rows.filter((r) => r.count > 0);

  if (!total || !present.length) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-[12px] text-txt-dim">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <Tooltip tip={tip} />
      {/* A 2px surface gap separates segments — never a stroke around them. */}
      <div className="flex h-6 w-full shrink-0 gap-[2px] overflow-hidden rounded-lg">
        {present.map((row) => (
          <div
            key={row.key}
            className="h-full min-w-[3px] transition-all duration-500 first:rounded-s-lg last:rounded-e-lg hover:brightness-110"
            style={{ width: `${(row.count / total) * 100}%`, background: colors[row.key] }}
            onPointerMove={(e) => {
              const box = e.currentTarget.closest('.relative')!.getBoundingClientRect();
              setTip({
                x: e.clientX - box.left, y: e.clientY - box.top,
                title: labels[row.key] || row.key,
                rows: [{
                  label: `${Math.round((row.count / total) * 100)}%`,
                  value: String(row.count),
                  color: colors[row.key],
                }],
              });
            }}
            onPointerLeave={() => setTip(null)}
          />
        ))}
      </div>

      {/* One row per segment, each an equal band of the leftover height with
          its content vertically centred — so the divider falls on the real
          row boundary instead of hugging the text above it. */}
      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        {present.map((row) => (
          <div
            key={row.key}
            className="flex min-h-[2.75rem] flex-1 items-center gap-3 border-b border-border/40 text-[12px] last:border-0"
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: colors[row.key] }} />
            <span className="truncate text-txt-muted">{labels[row.key] || row.key}</span>
            <span className="ms-auto shrink-0 tabular-nums text-[11px] text-txt-dim">
              {Math.round((row.count / total) * 100)}%
            </span>
            <span className="w-7 shrink-0 text-end text-[14px] font-bold tabular-nums text-txt">
              {row.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Activity calendar ──────────────────────────────────── */

/**
 * Daily magnitude on a sequential ramp — the "did anything happen that day"
 * view that a monthly total hides.
 */
export function ActivityCalendar({
  days, unitLabel, activeDaysLabel, lessLabel = 'less', moreLabel = 'more',
}: {
  days: { date: string; count: number }[];
  unitLabel: string;
  activeDaysLabel: string;
  lessLabel?: string;
  moreLabel?: string;
}) {
  const [tip, setTip] = useState<TipState>(null);

  const weeks = useMemo(() => {
    if (!days.length) return [];
    const out: ({ date: string; count: number } | null)[][] = [];
    let week: ({ date: string; count: number } | null)[] = [];
    // Pad so the first column starts on the right weekday rather than
    // sliding the whole calendar.
    const firstDow = (new Date(`${days[0].date}T00:00:00`).getDay() + 6) % 7;
    for (let i = 0; i < firstDow; i++) week.push(null);
    for (const day of days) {
      week.push(day);
      if (week.length === 7) { out.push(week); week = []; }
    }
    if (week.length) {
      while (week.length < 7) week.push(null);
      out.push(week);
    }
    return out;
  }, [days]);

  const max = Math.max(...days.map((d) => d.count), 1);
  const heat = (count: number) => {
    if (!count) return 'var(--viz-heat-0)';
    const ratio = count / max;
    if (ratio <= 0.2) return 'var(--viz-heat-1)';
    if (ratio <= 0.4) return 'var(--viz-heat-2)';
    if (ratio <= 0.6) return 'var(--viz-heat-3)';
    if (ratio <= 0.8) return 'var(--viz-heat-4)';
    return 'var(--viz-heat-5)';
  };

  const activeDays = days.filter((d) => d.count > 0).length;

  return (
    <div className="relative">
      <Tooltip tip={tip} />
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) => (
              <div
                key={di}
                // The hit target is the cell plus its gap, not just the paint.
                className={`h-[13px] w-[13px] rounded-[3px] ${day ? 'cursor-default' : 'opacity-0'}`}
                style={{ background: day ? heat(day.count) : 'transparent' }}
                onPointerMove={day ? (e) => {
                  const box = e.currentTarget.closest('.relative')!.getBoundingClientRect();
                  setTip({
                    x: e.clientX - box.left, y: e.clientY - box.top,
                    title: new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, {
                      day: 'numeric', month: 'short',
                    }),
                    rows: [{ label: unitLabel, value: String(day.count) }],
                  });
                } : undefined}
                onPointerLeave={() => setTip(null)}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        {/* Phrased as "label: n / total" rather than "n active days", which
            would need singular/plural agreement in three languages and read
            "1 jours actifs". The denominator is more useful anyway. */}
        <p className="text-[11px] text-txt-muted">
          {activeDaysLabel}{' '}
          <span className="font-bold tabular-nums text-txt">{activeDays}</span>
          <span className="text-txt-dim"> / {days.length}</span>
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-txt-dim">{lessLabel}</span>
          {['--viz-heat-0', '--viz-heat-1', '--viz-heat-2', '--viz-heat-3', '--viz-heat-4', '--viz-heat-5'].map((c) => (
            <span key={c} className="h-[11px] w-[11px] rounded-[3px]" style={{ background: `var(${c})` }} />
          ))}
          <span className="text-[10px] text-txt-dim">{moreLabel}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Meter ──────────────────────────────────────────────── */

/**
 * A single ratio against a limit. A meter, not a chart — the unfilled track
 * is a lighter step of the same ramp so the state reads across the whole bar.
 */
export function Meter({
  label, value, max = 100, suffix = '%', tone,
}: {
  label: string;
  value: number;
  max?: number;
  suffix?: string;
  /** Overrides the default accent fill when the ratio itself means health. */
  tone?: 'good' | 'warning' | 'critical';
}) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0;
  const fill = tone
    ? { good: 'var(--viz-good)', warning: 'var(--viz-warning)', critical: 'var(--viz-critical)' }[tone]
    : 'var(--viz-series-1)';

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-txt-muted">{label}</span>
        <span className="text-[12px] font-bold tabular-nums text-txt">{value}{suffix}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--viz-heat-1)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: fill }}
        />
      </div>
    </div>
  );
}
