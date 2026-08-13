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
  TrophyIcon,
} from '@heroicons/react/24/outline';

import { apiFetch } from '@/api/apiClient';
import { useLanguage } from '@/app/i18n/LanguageContext';
import {
  ActivityCalendar, CARD, ChartCard, DataTable, FunnelChart, KpiTile,
  Meter, SegmentBar, TrendChart, fmt,
} from '@/components/charts/primitives';

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

/* ─── Local wiring ───────────────────────────────────────── */

/**
 * Where every application stands right now.
 *
 * The four progressive states take the ordinal ramp so their order is
 * visible in the colour; the terminal states take reserved status tokens,
 * because "rejected" means something bad rather than merely being the sixth
 * category. Each colour still does exactly one job.
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
          provisionalLabel={t('analytics.provisional') || 'Provisoire'}
          provisionalHint={t('analytics.provisionalHint')
            || 'Basé sur peu d\'envois — ce chiffre bougera encore.'}
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
            ? <FunnelChart
                stages={funnel}
                labels={stageLabels}
                unitLabel={stageLabels.applicationsWord}
                ofTotalLabel={stageLabels.ofTotal}
              />
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
          <SegmentBar
            rows={data.statusBreakdown.map((r) => ({ key: r.status, count: r.count }))}
            labels={statusLabels}
            colors={PIPELINE_COLOR}
            total={kpis.applications}
            emptyLabel={statusLabels.empty}
          />
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
          series={[
            { key: 'applications', color: 'var(--viz-series-1)', label: t('analytics.created') || 'Créées' },
            { key: 'sent', color: 'var(--viz-series-2)', label: t('analytics.sentShort') || 'Envoyées' },
          ]}
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
            unitLabel={stageLabels.applicationsWord}
            activeDaysLabel={t('analytics.activeDays') || 'jours actifs sur 12 semaines'}
            lessLabel={t('analytics.less') || 'moins'}
            moreLabel={t('analytics.more') || 'plus'}
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

          <div className="mt-5">
            <Meter
              label={t('analytics.avgCompletion') || 'Complétion moyenne'}
              value={portfolio.avgCompletion}
            />
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
