'use client';

/**
 * Admin overview — how the platform itself is doing.
 *
 * Built from the same chart primitives as the user-facing Statistics page, so
 * the two surfaces read identically and there is one place to fix a chart.
 * The questions are ordered the way an operator asks them:
 *
 *   1. Are we growing?          → signups per day
 *   2. Do signups become users? → the activation funnel
 *   3. Are they coming back?    → daily-active calendar
 *   4. Are we earning?          → plan mix
 *   5. Is anything broken?      → send + AI health
 *
 * The activation funnel is the important one. Most people who register a SaaS
 * account never reach the thing it does, and this shows exactly which step
 * loses them. It is strictly nested by the schema — an application requires a
 * CV, a send requires an application — so the percentage between two stages
 * is a real conversion rather than two unrelated numbers divided.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowPathIcon, BanknotesIcon, BoltIcon, ChartBarIcon, CheckBadgeIcon,
  CpuChipIcon, CurrencyDollarIcon, DocumentTextIcon, ExclamationTriangleIcon,
  FunnelIcon, PaperAirplaneIcon, SparklesIcon, UserGroupIcon, UsersIcon,
} from '@heroicons/react/24/outline';

import {
  ActivityCalendar, CARD, ChartCard, DataTable, FunnelChart, KpiTile,
  Meter, SegmentBar, TrendChart, fmt,
} from '@/components/charts/primitives';

/* ─── API shape ──────────────────────────────────────────── */

type DayPoint = { date: string; count: number };

type AdminAnalytics = {
  generatedAt: string;
  days: number;
  kpis: {
    totalUsers: number; newUsers: number; activeUsers: number;
    proUsers: number; freeUsers: number;
    conversionRate: number | null; activationRate: number | null;
    revenueWindow: number; revenueAllTime: number; paidCheckouts: number;
    staffUsers: number; mailboxesConnected: number;
  };
  signups: DayPoint[];
  activation: { stage: string; count: number; pctOfTop: number; conversion: number | null }[];
  production: { cvs: DayPoint[]; applications: DayPoint[] };
  activeByDay: DayPoint[];
  planMix: { plan: string; count: number }[];
  checkouts: { status: string; count: number }[];
  sendHealth: {
    sent: number; failed: number; queued: number; sending: number;
    cancelled: number; successRate: number | null;
  };
  aiHealth: {
    calls: number; tokens: number; successRate: number | null; fallbackRate: number | null;
    byProvider: { provider: string; calls: number; tokens: number; successRate: number | null }[];
  };
  content: {
    cvs: number; cvsInWindow: number; applications: number;
    applicationsInWindow: number; downloads: number; downloadsInWindow: number;
  };
  templates: { name: string; count: number }[];
  topUsers: {
    id: string; name: string; email: string; plan: string;
    cvs: number; applications: number; sent: number;
  }[];
  recentSignups: { id: string; name: string; email: string; plan: string; joinedAt: string }[];
};

const WINDOWS = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

const STAGE_LABELS: Record<string, string> = {
  signedUp: 'Signed up',
  builtCv: 'Built a CV',
  startedApplication: 'Wrote an application',
  sentApplication: 'Sent it',
  gotReply: 'Got a reply',
};

// Free and pro are an ordered pair (free precedes paid), so they take two
// steps of the ordinal ramp rather than two unrelated identity hues.
const PLAN_COLORS: Record<string, string> = {
  free: 'var(--viz-step-2)',
  pro: 'var(--viz-step-4)',
};
const PLAN_LABELS: Record<string, string> = { free: 'Free', pro: 'Pro' };

// Checkout outcomes carry meaning, not identity, so they wear status tokens.
const CHECKOUT_COLORS: Record<string, string> = {
  paid: 'var(--viz-good)',
  pending: 'var(--viz-warning)',
  failed: 'var(--viz-critical)',
  canceled: 'var(--viz-neutral)',
  expired: 'var(--viz-serious)',
};
const CHECKOUT_LABELS: Record<string, string> = {
  paid: 'Paid', pending: 'Pending', failed: 'Failed',
  canceled: 'Canceled', expired: 'Expired',
};

/** Short axis label for a daily point: "12 Aug". */
function dayLabel(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short',
  });
}

function money(da: number) {
  return `${new Intl.NumberFormat().format(da)} DA`;
}

/* ─── Health strip ───────────────────────────────────────── */

/**
 * A subsystem's state as a labelled row, not a bare coloured dot.
 *
 * Status colour never carries meaning alone here — every row pairs it with a
 * word, which is what keeps it readable for a colour-blind operator and in
 * forced-colors mode.
 */
function HealthRow({
  label, value, tone, detail,
}: {
  label: string;
  value: string;
  tone: 'good' | 'warning' | 'critical' | 'neutral';
  detail?: string;
}) {
  const color = {
    good: 'var(--viz-good)',
    warning: 'var(--viz-warning)',
    critical: 'var(--viz-critical)',
    neutral: 'var(--viz-neutral)',
  }[tone];

  return (
    <div className="flex items-center gap-3 border-b border-border/40 py-2.5 last:border-0">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
      <span className="text-[12px] text-txt-muted">{label}</span>
      <span className="ms-auto text-[13px] font-bold tabular-nums text-txt">{value}</span>
      {detail && <span className="shrink-0 text-[11px] text-txt-dim">{detail}</span>}
    </div>
  );
}

/* ─── The view ───────────────────────────────────────────── */

export default function AdminOverview({
  apiBase, getToken,
}: { apiBase: string; getToken: () => string }) {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/admin/analytics/?days=${days}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const payload = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(payload.detail || `Request failed (${res.status})`);
        setData(payload);
        setError(null);
      } catch (err: unknown) {
        if (!cancelled) setError((err as Error).message || 'Failed to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [apiBase, getToken, days, reloadKey]);

  // One series per production measure, on one shared scale. CVs and
  // applications are both "things created", so a single axis is honest.
  const production = useMemo(() => {
    if (!data) return [];
    return data.production.cvs.map((point, i) => ({
      label: dayLabel(point.date),
      cvs: point.count,
      applications: data.production.applications[i]?.count ?? 0,
    }));
  }, [data]);

  const signups = useMemo(() => {
    if (!data) return [];
    return data.signups.map((p) => ({ label: dayLabel(p.date), signups: p.count }));
  }, [data]);

  if (loading) {
    return <div className="py-20 text-center text-[13px] text-txt-dim">Loading analytics…</div>;
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
          Retry
        </button>
      </div>
    );
  }

  const { kpis, sendHealth, aiHealth, content } = data;
  const totalSignups = data.signups.reduce((sum, p) => sum + p.count, 0);

  // A cascade answering from its fallback most of the time means the primary
  // provider is down or out of quota, and nothing else would say so.
  const fallbackTone = aiHealth.fallbackRate === null ? 'neutral'
    : aiHealth.fallbackRate >= 50 ? 'critical'
      : aiHealth.fallbackRate >= 20 ? 'warning' : 'good';

  const sendTone = sendHealth.successRate === null ? 'neutral'
    : sendHealth.successRate >= 95 ? 'good'
      : sendHealth.successRate >= 80 ? 'warning' : 'critical';

  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* ── Window filter: one row, above everything it scopes ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-txt">Platform analytics</h3>
          <p className="mt-0.5 text-[12px] text-txt-muted">
            Growth, activation and the health of the systems behind them.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border bg-surface2 p-1">
            {WINDOWS.map((w) => (
              <button
                key={w.days}
                onClick={() => setDays(w.days)}
                className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  days === w.days ? 'bg-blue-500 text-white' : 'text-txt-muted hover:text-txt'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
          <button
            onClick={reload}
            title="Refresh"
            className="rounded-xl border border-border bg-surface2 p-2.5 text-txt-muted transition-colors hover:text-txt"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          label="Total users"
          value={fmt(kpis.totalUsers)}
          hint={`+${kpis.newUsers} in ${days} days`}
          icon={UsersIcon}
          tone="accent"
        />
        <KpiTile
          label="Active users"
          value={fmt(kpis.activeUsers)}
          hint={kpis.totalUsers
            ? `${Math.round((kpis.activeUsers / kpis.totalUsers) * 100)}% of all users`
            : undefined}
          icon={BoltIcon}
          tone={kpis.activeUsers > 0 ? 'good' : 'neutral'}
        />
        <KpiTile
          label="Pro conversion"
          value={kpis.conversionRate !== null ? `${kpis.conversionRate}%` : '—'}
          hint={`${kpis.proUsers} / ${kpis.totalUsers} users`}
          icon={SparklesIcon}
          tone={kpis.proUsers > 0 ? 'good' : 'neutral'}
        />
        <KpiTile
          label="Revenue"
          value={money(kpis.revenueAllTime)}
          hint={`${kpis.paidCheckouts} paid checkout${kpis.paidCheckouts === 1 ? '' : 's'} all time`}
          icon={BanknotesIcon}
          tone={kpis.revenueAllTime > 0 ? 'good' : 'neutral'}
        />
      </div>

      {/* ── Activation funnel + plan mix ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <ChartCard
          className="lg:col-span-3"
          icon={FunnelIcon}
          title="Activation funnel"
          subtitle="How far each registered user gets. Every stage is a subset of the one above, so the percentage between two bars is a real conversion."
          table={
            <DataTable
              head={['Stage', 'Users', '% of all', 'Conversion']}
              rows={data.activation.map((s) => [
                STAGE_LABELS[s.stage] || s.stage, s.count, `${s.pctOfTop}%`,
                s.conversion === null ? '—' : `${s.conversion}%`,
              ])}
            />
          }
        >
          <FunnelChart
            stages={data.activation}
            labels={STAGE_LABELS}
            unitLabel="users"
            ofTotalLabel="of all users"
            labelWidth={128}
          />
        </ChartCard>

        <ChartCard
          className="lg:col-span-2"
          icon={CurrencyDollarIcon}
          title="Plan mix"
          subtitle="Free against paid, right now."
          table={
            <DataTable
              head={['Plan', 'Users']}
              rows={data.planMix.map((p) => [PLAN_LABELS[p.plan] || p.plan, p.count])}
            />
          }
        >
          <SegmentBar
            rows={data.planMix.map((p) => ({ key: p.plan, count: p.count }))}
            labels={PLAN_LABELS}
            colors={PLAN_COLORS}
            total={kpis.totalUsers}
            emptyLabel="No users yet."
          />
        </ChartCard>
      </div>

      {/* ── Growth ── */}
      <ChartCard
        icon={UserGroupIcon}
        title="New signups"
        subtitle={`Registrations per day over the last ${days} days.`}
        table={
          <DataTable
            head={['Date', 'Signups']}
            rows={data.signups.filter((p) => p.count > 0).map((p) => [p.date, p.count])}
          />
        }
      >
        <TrendChart
          data={signups}
          series={[{ key: 'signups', color: 'var(--viz-series-1)', label: 'Signups' }]}
        />
        <p className="mt-2 text-[11px] text-txt-dim">
          <span className="font-bold text-txt">{totalSignups}</span> in this window ·{' '}
          <span className="font-bold text-txt">{kpis.totalUsers}</span> all time
        </p>
      </ChartCard>

      {/* ── Production ── */}
      <ChartCard
        icon={ChartBarIcon}
        title="What users are producing"
        subtitle="CVs and applications created per day, on one shared scale."
        table={
          <DataTable
            head={['Date', 'CVs', 'Applications']}
            rows={data.production.cvs.map((p, i) => [
              p.date, p.count, data.production.applications[i]?.count ?? 0,
            ]).filter((r) => Number(r[1]) > 0 || Number(r[2]) > 0)}
          />
        }
      >
        <TrendChart
          data={production}
          series={[
            { key: 'cvs', color: 'var(--viz-series-1)', label: 'CVs' },
            { key: 'applications', color: 'var(--viz-series-2)', label: 'Applications' },
          ]}
        />
      </ChartCard>

      {/* ── Engagement + health ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <ChartCard
          className="lg:col-span-3"
          icon={CheckBadgeIcon}
          title="Daily active users — 12 weeks"
          subtitle="Distinct users who did something the product counts as work."
          table={
            <DataTable
              head={['Date', 'Active users']}
              rows={data.activeByDay.filter((d) => d.count > 0).map((d) => [d.date, d.count])}
            />
          }
        >
          <ActivityCalendar
            days={data.activeByDay}
            unitLabel="active users"
            activeDaysLabel="Days with activity:"
          />
        </ChartCard>

        <div className={`${CARD} flex flex-col p-6 lg:col-span-2`}>
          <h3 className="mb-1 flex items-center gap-2 text-[14px] font-bold text-txt">
            <CpuChipIcon className="h-4 w-4 text-blue-500" />
            System health
          </h3>
          <p className="mb-4 text-[12px] text-txt-muted">
            The two subsystems that fail quietly.
          </p>

          <div className="mb-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-txt-dim">
              Outbound email
            </p>
            <HealthRow
              label="Delivery success"
              value={sendHealth.successRate !== null ? `${sendHealth.successRate}%` : '—'}
              tone={sendTone}
              detail={`${sendHealth.sent} sent`}
            />
            {sendHealth.failed > 0 && (
              <HealthRow label="Failed" value={String(sendHealth.failed)} tone="critical" />
            )}
            {sendHealth.queued > 0 && (
              <HealthRow label="Queued" value={String(sendHealth.queued)} tone="warning" />
            )}
          </div>

          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-txt-dim">
              AI providers
            </p>
            <HealthRow
              label="Call success"
              value={aiHealth.successRate !== null ? `${aiHealth.successRate}%` : '—'}
              tone={aiHealth.successRate === null ? 'neutral'
                : aiHealth.successRate >= 90 ? 'good'
                  : aiHealth.successRate >= 60 ? 'warning' : 'critical'}
              detail={`${aiHealth.calls} calls`}
            />
            {/* The number worth watching: a high fallback rate means the
                primary provider is failing on nearly every call. */}
            <HealthRow
              label="Answered by fallback"
              value={aiHealth.fallbackRate !== null ? `${aiHealth.fallbackRate}%` : '—'}
              tone={fallbackTone}
            />
            <HealthRow label="Tokens used" value={fmt(aiHealth.tokens)} tone="neutral" />
          </div>

          {fallbackTone === 'critical' && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-[11px] text-amber-600 dark:text-amber-400">
              <ExclamationTriangleIcon className="mt-px h-3.5 w-3.5 shrink-0" />
              Most successful calls are coming from a fallback model. Check the
              primary provider&apos;s quota on the AI Models page.
            </p>
          )}

          <div className="mt-auto pt-4">
            <Meter
              label="Mailboxes connected"
              value={kpis.mailboxesConnected}
              max={Math.max(kpis.totalUsers, 1)}
              suffix=""
            />
          </div>
        </div>
      </div>

      {/* ── Content + templates ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className={`${CARD} p-6 lg:col-span-2`}>
          <h3 className="mb-1 flex items-center gap-2 text-[14px] font-bold text-txt">
            <DocumentTextIcon className="h-4 w-4 text-blue-500" />
            Content
          </h3>
          <p className="mb-4 text-[12px] text-txt-muted">All time, with this window beside it.</p>
          <div className="space-y-1">
            {[
              { label: 'CVs', total: content.cvs, window: content.cvsInWindow },
              { label: 'Applications', total: content.applications, window: content.applicationsInWindow },
              { label: 'PDF downloads', total: content.downloads, window: content.downloadsInWindow },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-baseline gap-3 border-b border-border/40 py-2.5 text-[12px] last:border-0"
              >
                <span className="text-txt-muted">{row.label}</span>
                <span className="ms-auto text-[15px] font-bold tabular-nums text-txt">{row.total}</span>
                <span className="w-14 shrink-0 text-end text-[11px] tabular-nums text-txt-dim">
                  +{row.window}
                </span>
              </div>
            ))}
          </div>
        </div>

        <ChartCard
          className="lg:col-span-3"
          icon={PaperAirplaneIcon}
          title="Template popularity"
          subtitle="Which designs users actually pick."
          table={
            <DataTable
              head={['Template', 'CVs']}
              rows={data.templates.map((tpl) => [tpl.name, tpl.count])}
            />
          }
        >
          {data.templates.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-txt-dim">No CVs yet.</p>
          ) : (
            <div className="space-y-2.5">
              {data.templates.map((tpl) => {
                const max = Math.max(...data.templates.map((x) => x.count), 1);
                return (
                  <div key={tpl.name} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 truncate text-end text-[12px] text-txt-muted">
                      {tpl.name}
                    </span>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      {/* One series, one colour: colouring each bar by its own
                          value would re-encode length as hue for nothing. */}
                      <div
                        className="h-4 transition-all duration-500"
                        style={{
                          width: `${Math.max((tpl.count / max) * 100, 2)}%`,
                          background: 'var(--viz-series-1)',
                          borderRadius: '2px 4px 4px 2px',
                        }}
                      />
                      <span className="shrink-0 text-[12px] font-bold tabular-nums text-txt">
                        {tpl.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── People ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={`${CARD} overflow-hidden`}>
          <div className="px-6 py-5">
            <h3 className="flex items-center gap-2 text-[14px] font-bold text-txt">
              <UserGroupIcon className="h-4 w-4 text-blue-500" />
              Most active users
            </h3>
            <p className="mt-0.5 text-[12px] text-txt-muted">Ordered by applications sent.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  {['User', 'CVs', 'Apps', 'Sent'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 pb-2 text-[10px] font-bold uppercase tracking-wider text-txt-muted ${i > 0 ? 'text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.topUsers.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-[12px] text-txt-dim">No activity yet.</td></tr>
                ) : data.topUsers.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-surface2/40">
                    <td className="px-5 py-2.5">
                      <p className="flex items-center gap-1.5 truncate text-[13px] font-medium text-txt">
                        {user.name}
                        {user.plan === 'pro' && (
                          <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-500">
                            PRO
                          </span>
                        )}
                      </p>
                      <p className="truncate text-[11px] text-txt-dim">{user.email}</p>
                    </td>
                    <td className="px-5 py-2.5 text-right text-[13px] tabular-nums text-txt-muted">{user.cvs}</td>
                    <td className="px-5 py-2.5 text-right text-[13px] tabular-nums text-txt-muted">{user.applications}</td>
                    <td className="px-5 py-2.5 text-right text-[13px] font-semibold tabular-nums text-txt">{user.sent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`${CARD} p-6`}>
          <h3 className="mb-1 flex items-center gap-2 text-[14px] font-bold text-txt">
            <SparklesIcon className="h-4 w-4 text-blue-500" />
            Newest signups
          </h3>
          <p className="mb-4 text-[12px] text-txt-muted">Who arrived most recently.</p>
          <div className="space-y-1">
            {data.recentSignups.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 border-b border-border/40 py-2.5 last:border-0"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 text-[11px] font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-txt">{user.name}</p>
                  <p className="truncate text-[11px] text-txt-dim">{user.email}</p>
                </div>
                <span className="shrink-0 text-[11px] text-txt-dim">
                  {new Date(user.joinedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Checkouts ── */}
      {data.checkouts.some((c) => c.count > 0) && (
        <ChartCard
          icon={BanknotesIcon}
          title="Checkouts"
          subtitle={`Payment attempts in the last ${days} days.`}
          table={
            <DataTable
              head={['Status', 'Count']}
              rows={data.checkouts.map((c) => [CHECKOUT_LABELS[c.status] || c.status, c.count])}
            />
          }
        >
          <SegmentBar
            rows={data.checkouts.map((c) => ({ key: c.status, count: c.count }))}
            labels={CHECKOUT_LABELS}
            colors={CHECKOUT_COLORS}
            total={data.checkouts.reduce((sum, c) => sum + c.count, 0)}
            emptyLabel="No checkouts in this window."
          />
        </ChartCard>
      )}

      <p className="px-1 text-[11px] text-txt-dim">
        Updated {new Date(data.generatedAt).toLocaleString()}
      </p>
    </motion.div>
  );
}
