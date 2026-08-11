'use client';

/**
 * Statistics — what the job search is actually doing.
 *
 * Charts here follow a few fixed rules rather than per-chart taste:
 *
 *  · Colour is assigned by the job it does. Series identity uses the
 *    categorical slots; the funnel uses an ordinal ramp so the reader sees
 *    the stage order in the colour itself; the calendar uses a sequential
 *    ramp for magnitude; outcomes use reserved status tokens. Every hex is
 *    validated against this app's own surfaces for colour-blind separation —
 *    see the --viz-* block in globals.css before changing one.
 *  · One axis, always. Two measures of different scale get two charts, never
 *    a second y-scale, which invents a correlation the data does not have.
 *  · Every chart has a table view. Three of the light-mode series colours sit
 *    below the 3:1 contrast bar, so the values must be reachable without
 *    relying on colour or hover.
 *  · A rate over a tiny sample is not shown. The server returns null below
 *    its own threshold and these render "—" with the reason, because
 *    "33% response rate" from three applications is noise wearing a
 *    percentage sign.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowPathIcon, ArrowTrendingUpIcon, BriefcaseIcon, CalendarDaysIcon,
  ChartBarIcon, CheckBadgeIcon, ClockIcon, DocumentTextIcon,
  ExclamationTriangleIcon, InboxArrowDownIcon, PaperAirplaneIcon,
  TableCellsIcon, TrophyIcon,
} from '@heroicons/react/24/outline';

import { apiFetch } from '@/api/apiClient';
import { useLanguage } from '@/app/i18n/LanguageContext';

/* ─── API shape ──────────────────────────────────────────── */

type FunnelStage = {
  stage: 'created' | 'sent' | 'answered' | 'interview' | 'offer';
  count: number;
  pctOfTop: number;
  conversion: number | null;
};

type Analytics = {
  generatedAt: string;
  minRateSample: number;
  kpis: {
    applications: number; sent: number; answered: number; interviews: number;
    offers: number; awaiting: number; relancesSent: number;
    responseRate: number | null; interviewRate: number | null;
    medianResponseDays: number | null;
  };
  funnel: FunnelStage[];
  statusBreakdown: { status: string; count: number }[];
  monthly: { month: string; label: string; applications: number; sent: number; cvs: number }[];
  cvEffectiveness: {
    cvId: string; title: string; templateName: string; applications: number;
    sent: number; answered: number; interviews: number; offers: number;
    responseRate: number | null; downloads: number;
  }[];
  activity: { date: string; count: number }[];
  portfolio: {
    cvs: number; completed: number; drafts: number; shared: number;
    downloads: number; views: number; avgCompletion: number;
  };
};

/* ─── Formatting ─────────────────────────────────────────── */

/** Compact, for stat tiles. Proportional figures — never tabular at display size. */
function fmt(n: number | null | undefined): string {
  const v = n ?? 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 10_000) return `${Math.round(v / 1_000)}k`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return String(v);
}

const CARD = 'bg-surface/80 backdrop-blur-xl border border-border rounded-2xl';

/* ─── Tooltip ────────────────────────────────────────────── */

type TipState = {
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
 * Text goes in as React children rather than markup — series and CV titles
 * are user-supplied strings, and a CV called `<img onerror=…>` must render as
 * those characters and nothing else.
 */
function Tooltip({ tip }: { tip: TipState }) {
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

/* ─── Chart card shell, with the table-view toggle ───────── */

function ChartCard({
  title, subtitle, icon: Icon, table, children, className = '',
}: {
  title: string; subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  /** The WCAG-clean twin. Every chart has one; it is not optional. */
  table: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const { t } = useLanguage();
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
          title={t('analytics.tableView') || 'Table view'}
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

function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
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

function KpiTile({
  label, value, hint, icon: Icon, tone = 'neutral', provisional = false,
}: {
  label: string; value: string; hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'neutral' | 'good' | 'accent';
  /** Real, but computed from a sample small enough to swing on one more
   *  result. Marked rather than hidden — the reader decides. */
  provisional?: boolean;
}) {
  const { t } = useLanguage();
  const ring = {
    neutral: 'bg-surface2 text-txt-muted',
    accent: 'bg-blue-500/10 text-blue-500',
    good: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
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
            title={t('analytics.provisionalHint') || 'Basé sur peu d\'envois — ce chiffre bougera encore.'}
            className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400"
          >
            {t('analytics.provisional') || 'Provisoire'}
          </span>
        )}
      </div>
      {hint && <p className="mt-1.5 truncate text-[11px] text-txt-dim">{hint}</p>}
    </div>
  );
}

/* ─── Funnel ─────────────────────────────────────────────── */

const STAGE_STEP = ['--viz-step-1', '--viz-step-2', '--viz-step-3', '--viz-step-4', '--viz-step-5'];

function FunnelChart({ stages, labels }: { stages: FunnelStage[]; labels: Record<string, string> }) {
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
          const color = `var(${STAGE_STEP[i]})`;

          return (
            <div key={stage.stage}>
              {i > 0 && (
                <div className="flex items-center gap-2 py-1 ps-[104px]">
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
                    title: labels[stage.stage],
                    rows: [
                      { label: labels.applicationsWord, value: String(stage.count), color },
                      { label: labels.ofTotal, value: `${stage.pctOfTop}%` },
                    ],
                  });
                }}
                onPointerLeave={() => setTip(null)}
              >
                <span className="w-[92px] shrink-0 text-end text-[12px] font-medium text-txt-muted">
                  {labels[stage.stage]}
                </span>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div
                    // ≤24px thick, 4px rounded data-end, square at the baseline.
                    className="h-5 rounded-e transition-all duration-500 group-hover:brightness-110"
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

/* ─── Trend (two nested series) ──────────────────────────── */

function TrendChart({
  data, labels,
}: {
  data: Analytics['monthly'];
  labels: { applications: string; sent: string; month: string };
}) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 560, H = 170, PAD_T = 14, PAD_B = 26, PAD_X = 8;
  const max = Math.max(...data.map((d) => Math.max(d.applications, d.sent)), 1);
  // Round the ceiling to something a tick label can say cleanly.
  const ceil = max <= 4 ? 4 : Math.ceil(max / 5) * 5;
  const plotH = H - PAD_T - PAD_B;

  const x = (i: number) => PAD_X + (i / Math.max(data.length - 1, 1)) * (W - PAD_X * 2);
  const y = (v: number) => PAD_T + plotH - (v / ceil) * plotH;

  const line = (key: 'applications' | 'sent') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d[key])}`).join(' ');
  const area = (key: 'applications' | 'sent') =>
    `${line(key)} L${x(data.length - 1)},${PAD_T + plotH} L${x(0)},${PAD_T + plotH} Z`;

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

  const point = hover !== null ? data[hover] : null;

  return (
    <div>
      {/* Legend is always present for two or more series — identity must
          never rest on colour-matching alone. */}
      <div className="mb-3 flex items-center gap-4">
        {[
          { key: 'applications', color: 'var(--viz-series-1)', label: labels.applications },
          { key: 'sent', color: 'var(--viz-series-2)', label: labels.sent },
        ].map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-txt-muted">
            <span className="h-[2px] w-4 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <div className="relative" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {point && (
          <Tooltip
            tip={{
              // Percentage of the plot width, so the tooltip tracks the
              // crosshair without measuring the element during render.
              x: `${(x(hover!) / W) * 100}%`,
              y: 6,
              title: point.label,
              rows: [
                { label: labels.applications, value: String(point.applications), color: 'var(--viz-series-1)' },
                { label: labels.sent, value: String(point.sent), color: 'var(--viz-series-2)' },
              ],
            }}
          />
        )}

        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }} role="img">
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--viz-series-1)" stopOpacity="0.14" />
              <stop offset="100%" stopColor="var(--viz-series-1)" stopOpacity="0" />
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

          <path d={area('applications')} fill="url(#trendFill)" />
          <path d={line('applications')} fill="none" stroke="var(--viz-series-1)" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <path d={line('sent')} fill="none" stroke="var(--viz-series-2)" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

          {hover !== null && (
            <line
              x1={x(hover)} x2={x(hover)} y1={PAD_T} y2={PAD_T + plotH}
              stroke="var(--viz-neutral)" strokeWidth="1" vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Markers ≥8px with a 2px surface ring so they stay legible where
              the two lines cross. */}
          {data.map((d, i) => (
            <g key={d.month}>
              <circle cx={x(i)} cy={y(d.applications)} r={hover === i ? 5 : 4}
                      fill="var(--viz-series-1)" stroke="var(--color-surface)" strokeWidth="2" />
              <circle cx={x(i)} cy={y(d.sent)} r={hover === i ? 5 : 4}
                      fill="var(--viz-series-2)" stroke="var(--color-surface)" strokeWidth="2" />
            </g>
          ))}

          {data.map((d, i) => (
            <text key={d.month} x={x(i)} y={H - 6} textAnchor="middle"
                  className="fill-[var(--viz-neutral)] text-[10px]">
              {d.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ─── Pipeline (current state, part-to-whole) ────────────── */

/**
 * Where every application stands right now.
 *
 * The five progressive states take the ordinal ramp so their order is visible
 * in the colour; the two terminal states take reserved status tokens, because
 * "rejected" means something bad rather than merely being the sixth category.
 * Each colour still does exactly one job.
 */
const PIPELINE_COLOR: Record<string, string> = {
  draft: 'var(--viz-step-1)',
  sent: 'var(--viz-step-2)',
  followed_up: 'var(--viz-step-3)',
  interview: 'var(--viz-step-4)',
  offer: 'var(--viz-good)',
  rejected: 'var(--viz-critical)',
  no_response: 'var(--viz-neutral)',
};

function PipelineBar({
  rows, labels, total,
}: {
  rows: { status: string; count: number }[];
  labels: Record<string, string>;
  total: number;
}) {
  const [tip, setTip] = useState<TipState>(null);
  const present = rows.filter((r) => r.count > 0);

  if (!total) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-[12px] text-txt-dim">{labels.empty}</p>
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
            key={row.status}
            className="h-full min-w-[3px] transition-all duration-500 first:rounded-s-lg last:rounded-e-lg hover:brightness-110"
            style={{ width: `${(row.count / total) * 100}%`, background: PIPELINE_COLOR[row.status] }}
            onPointerMove={(e) => {
              const box = e.currentTarget.closest('.relative')!.getBoundingClientRect();
              setTip({
                x: e.clientX - box.left, y: e.clientY - box.top,
                title: labels[row.status],
                rows: [{
                  label: `${Math.round((row.count / total) * 100)}%`,
                  value: String(row.count),
                  color: PIPELINE_COLOR[row.status],
                }],
              });
            }}
            onPointerLeave={() => setTip(null)}
          />
        ))}
      </div>

      {/* One row per state, each an equal band of the leftover height with
          its content vertically centred — so the divider falls on the real
          row boundary instead of hugging the text above it. The single-line
          legend this replaces left most of the card empty beside the taller
          funnel. */}
      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        {present.map((row) => (
          <div
            key={row.status}
            className="flex min-h-[2.75rem] flex-1 items-center gap-3 border-b border-border/40 text-[12px] last:border-0"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: PIPELINE_COLOR[row.status] }}
            />
            <span className="truncate text-txt-muted">{labels[row.status]}</span>
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

function ActivityCalendar({ days, labels }: { days: { date: string; count: number }[]; labels: Record<string, string> }) {
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
                    rows: [{ label: labels.applicationsWord, value: String(day.count) }],
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
          {labels.activeDays}{' '}
          <span className="font-bold tabular-nums text-txt">{activeDays}</span>
          <span className="text-txt-dim"> / {days.length}</span>
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-txt-dim">{labels.less}</span>
          {['--viz-heat-0', '--viz-heat-1', '--viz-heat-2', '--viz-heat-3', '--viz-heat-4', '--viz-heat-5'].map((c) => (
            <span key={c} className="h-[11px] w-[11px] rounded-[3px]" style={{ background: `var(${c})` }} />
          ))}
          <span className="text-[10px] text-txt-dim">{labels.more}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── The view ───────────────────────────────────────────── */

export default function AnalyticsView() {
  const { t } = useLanguage();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refetching is a bump of this counter rather than a callable loader: it
  // keeps the fetch inside the effect, where the cleanup can disown a reply
  // that arrives after the user has navigated away.
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const payload = await apiFetch('/applications/analytics/');
        if (cancelled) return;
        setData(payload);
        setError(null);
      } catch (err: unknown) {
        if (!cancelled) setError((err as Error).message || 'Failed to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reloadKey]);

  const stageLabels = useMemo(() => ({
    created: t('analytics.stageCreated') || 'Créées',
    sent: t('analytics.stageSent') || 'Envoyées',
    answered: t('analytics.stageAnswered') || 'Réponses',
    interview: t('analytics.stageInterview') || 'Entretiens',
    offer: t('analytics.stageOffer') || 'Offres',
    applicationsWord: t('analytics.applicationsWord') || 'candidatures',
    ofTotal: t('analytics.ofTotal') || 'du total',
  }), [t]);

  const statusLabels = useMemo(() => ({
    draft: t('applications.statusDraft') || 'Brouillon',
    sent: t('applications.statusSent') || 'Envoyée',
    followed_up: t('applications.statusFollowedUp') || 'Relancée',
    interview: t('applications.statusInterview') || 'Entretien',
    offer: t('applications.statusOffer') || 'Offre',
    rejected: t('applications.statusRejected') || 'Refusée',
    no_response: t('applications.statusNoResponse') || 'Sans réponse',
    empty: t('analytics.noApplications') || 'Aucune candidature pour le moment.',
  }), [t]);

  if (loading) {
    return <div className="py-20 text-center text-[13px] text-txt-dim">{t('dashboard.loading') || 'Chargement...'}</div>;
  }

  if (error || !data) {
    return (
      <div className={`${CARD} p-8 text-center`}>
        <ExclamationTriangleIcon className="mx-auto mb-3 h-8 w-8 text-red-500" />
        <p className="text-[13px] text-red-500">{error}</p>
        <button
          onClick={() => { setLoading(true); reload(); }}
          className="mt-4 rounded-xl bg-surface2 px-4 py-2 text-[12px] font-medium text-txt hover:bg-border/50"
        >
          {t('analytics.retry') || 'Réessayer'}
        </button>
      </div>
    );
  }

  const { kpis, funnel, portfolio } = data;
  const hasApplications = kpis.applications > 0;

  // The rate is shown from the first send. What keeps it honest is printing
  // the fraction it came from, so 50% off two sends reads as "1 / 2" rather
  // than as a settled figure.
  const rateHint = (numerator: number, sent: number) =>
    sent === 0
      ? (t('analytics.noSendsYet') || 'Aucun envoi')
      : `${numerator} / ${sent} ${t('analytics.sends') || 'envois'}`;

  // Below the sample threshold the number still swings with one more reply,
  // so it is marked provisional rather than hidden.
  const isProvisional = kpis.sent > 0 && kpis.sent < data.minRateSample;

  return (
    <motion.div
      key="analytics"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          label={t('analytics.kpiSent') || 'Candidatures envoyées'}
          value={fmt(kpis.sent)}
          hint={`${kpis.applications} ${t('analytics.createdTotal') || 'créées au total'}`}
          icon={PaperAirplaneIcon}
          tone="accent"
        />
        <KpiTile
          label={t('analytics.kpiResponseRate') || 'Taux de réponse'}
          value={kpis.responseRate !== null ? `${kpis.responseRate}%` : '—'}
          hint={rateHint(kpis.answered, kpis.sent)}
          provisional={isProvisional && kpis.responseRate !== null}
          icon={InboxArrowDownIcon}
          tone={kpis.responseRate !== null && kpis.responseRate >= 15 ? 'good' : 'neutral'}
        />
        <KpiTile
          label={t('analytics.kpiInterviews') || 'Entretiens'}
          value={fmt(kpis.interviews)}
          hint={kpis.interviewRate !== null
            ? `${kpis.interviewRate}% ${t('analytics.ofSends') || 'des envois'}`
            : undefined}
          icon={CheckBadgeIcon}
          tone={kpis.interviews > 0 ? 'good' : 'neutral'}
        />
        <KpiTile
          label={t('analytics.kpiOffers') || 'Offres'}
          value={fmt(kpis.offers)}
          hint={kpis.awaiting > 0
            ? `${kpis.awaiting} ${t('analytics.awaiting') || 'en attente de réponse'}`
            : undefined}
          icon={TrophyIcon}
          tone={kpis.offers > 0 ? 'good' : 'neutral'}
        />
      </div>

      {/* ── Funnel + pipeline ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <ChartCard
          className="lg:col-span-3"
          icon={ChartBarIcon}
          title={t('analytics.funnelTitle') || 'Entonnoir de candidature'}
          subtitle={t('analytics.funnelSub') || 'Chaque étape est un sous-ensemble de la précédente. Le pourcentage entre deux barres est le taux de passage.'}
          table={
            <DataTable
              head={[
                t('analytics.stage') || 'Étape',
                t('analytics.count') || 'Nombre',
                t('analytics.ofTotalShort') || '% du total',
                t('analytics.conversion') || 'Passage',
              ]}
              rows={funnel.map((s) => [
                stageLabels[s.stage], s.count, `${s.pctOfTop}%`,
                s.conversion === null ? '—' : `${s.conversion}%`,
              ])}
            />
          }
        >
          {hasApplications
            ? <FunnelChart stages={funnel} labels={stageLabels} />
            : <p className="py-8 text-center text-[12px] text-txt-dim">{statusLabels.empty}</p>}
        </ChartCard>

        <ChartCard
          className="lg:col-span-2"
          icon={BriefcaseIcon}
          title={t('analytics.pipelineTitle') || 'État actuel'}
          subtitle={t('analytics.pipelineSub') || 'Où en est chaque candidature aujourd\'hui.'}
          table={
            <DataTable
              head={[t('analytics.status') || 'Statut', t('analytics.count') || 'Nombre']}
              rows={data.statusBreakdown.map((r) => [statusLabels[r.status as keyof typeof statusLabels], r.count])}
            />
          }
        >
          <PipelineBar rows={data.statusBreakdown} labels={statusLabels} total={kpis.applications} />
        </ChartCard>
      </div>

      {/* ── Trend ── */}
      <ChartCard
        icon={ArrowTrendingUpIcon}
        title={t('analytics.trendTitle') || 'Activité sur 6 mois'}
        subtitle={t('analytics.trendSub') || 'Candidatures créées et réellement envoyées, par mois.'}
        table={
          <DataTable
            head={[
              t('analytics.month') || 'Mois',
              t('analytics.created') || 'Créées',
              t('analytics.sentShort') || 'Envoyées',
            ]}
            rows={data.monthly.map((m) => [m.label, m.applications, m.sent])}
          />
        }
      >
        <TrendChart
          data={data.monthly}
          labels={{
            applications: t('analytics.created') || 'Créées',
            sent: t('analytics.sentShort') || 'Envoyées',
            month: t('analytics.month') || 'Mois',
          }}
        />
      </ChartCard>

      {/* ── CV effectiveness ── */}
      <ChartCard
        icon={DocumentTextIcon}
        title={t('analytics.cvTitle') || 'Efficacité par CV'}
        subtitle={t('analytics.cvSub') || 'Quel CV décroche réellement des réponses.'}
        table={
          <DataTable
            head={[
              t('analytics.cv') || 'CV',
              t('analytics.sentShort') || 'Envoyées',
              t('analytics.replies') || 'Réponses',
              t('analytics.kpiInterviews') || 'Entretiens',
            ]}
            rows={data.cvEffectiveness.map((r) => [r.title, r.sent, r.answered, r.interviews])}
          />
        }
      >
        {data.cvEffectiveness.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-txt-dim">{statusLabels.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  {[
                    t('analytics.cv') || 'CV',
                    t('analytics.sentShort') || 'Envoyées',
                    t('analytics.replies') || 'Réponses',
                    t('analytics.kpiInterviews') || 'Entretiens',
                    t('analytics.kpiResponseRate') || 'Taux',
                  ].map((h, i) => (
                    <th key={h} className={`pb-2 text-[10px] font-bold uppercase tracking-wider text-txt-muted ${i > 0 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.cvEffectiveness.map((row) => (
                  <tr key={row.cvId} className="transition-colors hover:bg-surface2/40">
                    <td className="py-2.5">
                      <p className="truncate text-[13px] font-medium text-txt">{row.title}</p>
                      <p className="truncate text-[11px] text-txt-dim">{row.templateName}</p>
                    </td>
                    <td className="py-2.5 text-right text-[13px] tabular-nums text-txt-muted">{row.sent}</td>
                    <td className="py-2.5 text-right text-[13px] tabular-nums text-txt-muted">{row.answered}</td>
                    <td className="py-2.5 text-right text-[13px] tabular-nums font-semibold text-txt">
                      {row.interviews}
                    </td>
                    <td className="py-2.5 text-right text-[13px] tabular-nums text-txt-muted">
                      {row.responseRate !== null ? `${row.responseRate}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>

      {/* ── Consistency + portfolio ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <ChartCard
          className="lg:col-span-3"
          icon={CalendarDaysIcon}
          title={t('analytics.calendarTitle') || 'Régularité — 12 semaines'}
          subtitle={t('analytics.calendarSub') || 'Candidatures créées par jour.'}
          table={
            <DataTable
              head={[t('analytics.date') || 'Date', t('analytics.count') || 'Nombre']}
              rows={data.activity.filter((d) => d.count > 0).map((d) => [d.date, d.count])}
            />
          }
        >
          <ActivityCalendar
            days={data.activity}
            labels={{
              applicationsWord: stageLabels.applicationsWord,
              activeDays: t('analytics.activeDays') || 'jours actifs sur 12 semaines',
              less: t('analytics.less') || 'moins',
              more: t('analytics.more') || 'plus',
            }}
          />
        </ChartCard>

        <div className={`${CARD} p-6 lg:col-span-2`}>
          <h3 className="mb-1 flex items-center gap-2 text-[14px] font-bold text-txt">
            <DocumentTextIcon className="h-4 w-4 text-blue-500" />
            {t('analytics.portfolioTitle') || 'Vos CV'}
          </h3>
          <p className="mb-5 text-[12px] text-txt-muted">
            {t('analytics.portfolioSub') || 'L\'état de votre bibliothèque.'}
          </p>

          <div className="space-y-3">
            {[
              { label: t('analytics.cvsTotal') || 'CV au total', value: portfolio.cvs },
              { label: t('analytics.cvsCompleted') || 'Terminés', value: portfolio.completed },
              { label: t('analytics.cvsDraft') || 'En cours', value: portfolio.drafts },
              { label: t('analytics.downloads') || 'Téléchargements', value: portfolio.downloads },
              { label: t('analytics.relances') || 'Relances envoyées', value: kpis.relancesSent },
            ].map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-2 last:border-0">
                <span className="text-[12px] text-txt-muted">{row.label}</span>
                <span className="text-[15px] font-bold tabular-nums text-txt">{row.value}</span>
              </div>
            ))}
          </div>

          {/* A single ratio against a limit is a meter, not a chart. The
              unfilled track is a lighter step of the same ramp so the state
              reads across the whole bar. */}
          <div className="mt-5">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-txt-muted">
                {t('analytics.avgCompletion') || 'Complétion moyenne'}
              </span>
              <span className="text-[12px] font-bold tabular-nums text-txt">{portfolio.avgCompletion}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--viz-heat-1)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${portfolio.avgCompletion}%`, background: 'var(--viz-series-1)' }}
              />
            </div>
          </div>

          {kpis.medianResponseDays !== null && (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-surface2 p-3">
              <ClockIcon className="h-4 w-4 shrink-0 text-blue-500" />
              <p className="text-[12px] text-txt-muted">
                <span className="font-bold text-txt">{kpis.medianResponseDays} {t('analytics.days') || 'jours'}</span>
                {' '}{t('analytics.medianResponse') || 'avant une réponse (médiane)'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-[11px] text-txt-dim">
          {t('analytics.updated') || 'Mis à jour'} {new Date(data.generatedAt).toLocaleString()}
        </p>
        <button
          onClick={reload}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-txt-muted transition-colors hover:bg-surface2 hover:text-txt"
        >
          <ArrowPathIcon className="h-3.5 w-3.5" />
          {t('analytics.refresh') || 'Actualiser'}
        </button>
      </div>
    </motion.div>
  );
}
