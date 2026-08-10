'use client';

/**
 * Admin → AI: the models we call, the order we call them in, and what they
 * cost.
 *
 * The page is built around one idea: what it shows must be what actually
 * runs. So the cascade editor writes the same rows the runtime registry
 * reads, a step whose model is globally disabled is drawn as skipped rather
 * than as configured, and the quota gauges are fed by recorded calls rather
 * than by estimates.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowPathIcon, ArrowDownIcon, ArrowUpIcon, BeakerIcon, CheckCircleIcon,
  ExclamationTriangleIcon, KeyIcon, PencilSquareIcon, PlusIcon, TrashIcon,
  XMarkIcon, BoltIcon, CpuChipIcon, ClockIcon, EyeIcon,
} from '@heroicons/react/24/outline';

import {
  DailyRequestsChart, OutcomeDonut, QuotaBar, TokensChart,
  formatNumber, providerColor,
} from './AiCharts';

/* ─── Types mirroring the admin API ───────────────────── */

type Limits = { rpm: number | null; rpd: number | null; tpm: number | null; tpd: number | null };

type AiModelRow = {
  id: number;
  provider: string;
  modelId: string;
  label: string;
  capability: string;
  isReasoning: boolean;
  isEnabled: boolean;
  limits: Limits;
  notes: string;
};

type CascadeStep = {
  modelId: string;
  modelPk: number;
  provider: string;
  label: string;
  position: number;
  isEnabled: boolean;
  isLive: boolean;
};

type TaskRow = {
  slug: string;
  label: string;
  description: string;
  capability: string;
  maxTokens: number;
  temperature: number;
  cascade: CascadeStep[];
};

type ProviderRow = {
  id: string; label: string; envVar: string; hasKey: boolean; consoleUrl: string;
};

type ConfigPayload = {
  providers: ProviderRow[];
  models: AiModelRow[];
  tasks: TaskRow[];
  capabilities: { id: string; label: string }[];
};

type UsagePayload = {
  days: number;
  summary: {
    requests: number; tokens: number; promptTokens: number; completionTokens: number;
    successes: number; failures: number; successRate: number | null; avgLatencyMs: number;
  };
  daily: {
    date: string; requests: number; tokens: number; failures: number;
    byProvider: Record<string, { requests: number; tokens: number }>;
  }[];
  byModel: {
    modelId: string; provider: string; requests: number; tokens: number;
    successRate: number | null; avgLatencyMs: number;
  }[];
  byTask: {
    taskSlug: string; requests: number; tokens: number;
    successRate: number | null; fallbackHits: number;
  }[];
  outcomes: { outcome: string; count: number }[];
  recentErrors: {
    id: number; taskSlug: string; provider: string; modelId: string;
    outcome: string; error: string; at: string;
  }[];
  live: {
    modelId: string; provider: string; label: string; isEnabled: boolean;
    used: { minuteRequests: number; minuteTokens: number; dayRequests: number; dayTokens: number };
    limits: Limits;
  }[];
};

type TestResult = { ok: boolean; outcome: string; latencyMs: number; error: string };

const WINDOWS = [
  { days: 1, label: '24 h' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
];

const CARD = 'bg-surface/80 backdrop-blur-xl border border-border rounded-2xl';

/* ─── Component ───────────────────────────────────────── */

export default function AiModelsPanel({
  apiBase, getToken,
}: { apiBase: string; getToken: () => string }) {
  const [config, setConfig] = useState<ConfigPayload | null>(null);
  const [usage, setUsage] = useState<UsagePayload | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Cascade edits are held locally until saved, so reordering three steps is
  // one write rather than three — and so a half-finished reorder never
  // reaches the runtime.
  const [drafts, setDrafts] = useState<Record<string, TaskRow>>({});
  const [savingTask, setSavingTask] = useState('');
  const [testing, setTesting] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, TestResult>>({});
  const [editingModel, setEditingModel] = useState<Partial<AiModelRow> | null>(null);

  const request = useCallback(async (path: string, init?: RequestInit) => {
    const res = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || `Request failed (${res.status})`);
    return data;
  }, [apiBase, getToken]);

  const load = useCallback(async (windowDays: number) => {
    setError('');
    try {
      const [cfg, use] = await Promise.all([
        request('/admin/ai/config/'),
        request(`/admin/ai/usage/?days=${windowDays}`),
      ]);
      setConfig(cfg);
      setUsage(use);
      setDrafts(Object.fromEntries((cfg.tasks as TaskRow[]).map(t => [t.slug, t])));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load AI configuration.');
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => { load(days); }, [load, days]);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 4000);
  };

  const modelsByPk = useMemo(
    () => Object.fromEntries((config?.models || []).map(m => [m.id, m])),
    [config],
  );

  const liveByModelId = useMemo(
    () => Object.fromEntries((usage?.live || []).map(l => [l.modelId, l])),
    [usage],
  );

  const statsByModelId = useMemo(
    () => Object.fromEntries((usage?.byModel || []).map(m => [m.modelId, m])),
    [usage],
  );

  /* ─── Cascade editing ─── */

  const isDirty = (slug: string) => {
    const original = config?.tasks.find(t => t.slug === slug);
    const draft = drafts[slug];
    if (!original || !draft) return false;
    return JSON.stringify({
      c: draft.cascade.map(s => [s.modelPk, s.isEnabled]),
      m: draft.maxTokens, t: draft.temperature,
    }) !== JSON.stringify({
      c: original.cascade.map(s => [s.modelPk, s.isEnabled]),
      m: original.maxTokens, t: original.temperature,
    });
  };

  const updateDraft = (slug: string, patch: Partial<TaskRow>) =>
    setDrafts(prev => ({ ...prev, [slug]: { ...prev[slug], ...patch } }));

  const moveStep = (slug: string, index: number, direction: -1 | 1) => {
    const cascade = [...drafts[slug].cascade];
    const target = index + direction;
    if (target < 0 || target >= cascade.length) return;
    [cascade[index], cascade[target]] = [cascade[target], cascade[index]];
    updateDraft(slug, { cascade });
  };

  const removeStep = (slug: string, index: number) => {
    const cascade = drafts[slug].cascade.filter((_, i) => i !== index);
    updateDraft(slug, { cascade });
  };

  const addStep = (slug: string, modelPk: number) => {
    const model = modelsByPk[modelPk];
    if (!model) return;
    updateDraft(slug, {
      cascade: [...drafts[slug].cascade, {
        modelId: model.modelId, modelPk: model.id, provider: model.provider,
        label: model.label, position: drafts[slug].cascade.length + 1,
        isEnabled: true, isLive: model.isEnabled,
      }],
    });
  };

  const saveTask = async (slug: string) => {
    const draft = drafts[slug];
    setSavingTask(slug);
    setError('');
    try {
      const saved = await request(`/admin/ai/tasks/${slug}/`, {
        method: 'PUT',
        body: JSON.stringify({
          cascade: draft.cascade.map(s => ({ modelPk: s.modelPk, isEnabled: s.isEnabled })),
          maxTokens: draft.maxTokens,
          temperature: draft.temperature,
        }),
      });
      setConfig(prev => prev && {
        ...prev, tasks: prev.tasks.map(t => (t.slug === slug ? saved : t)),
      });
      setDrafts(prev => ({ ...prev, [slug]: saved }));
      flash(`${draft.label} updated — this takes effect on the next call.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSavingTask('');
    }
  };

  const resetTask = (slug: string) => {
    const original = config?.tasks.find(t => t.slug === slug);
    if (original) setDrafts(prev => ({ ...prev, [slug]: original }));
  };

  /* ─── Model catalogue ─── */

  const toggleModel = async (model: AiModelRow) => {
    setError('');
    try {
      const saved = await request(`/admin/ai/models/${model.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ isEnabled: !model.isEnabled }),
      });
      setConfig(prev => prev && {
        ...prev, models: prev.models.map(m => (m.id === saved.id ? saved : m)),
      });
      flash(`${saved.label} ${saved.isEnabled ? 'enabled' : 'disabled'}.`);
      load(days);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed.');
    }
  };

  const saveModel = async (draft: Partial<AiModelRow>) => {
    setError('');
    const body = JSON.stringify({
      provider: draft.provider,
      modelId: draft.modelId,
      label: draft.label,
      capability: draft.capability,
      isReasoning: draft.isReasoning,
      limits: draft.limits,
      notes: draft.notes,
    });
    try {
      if (draft.id) {
        await request(`/admin/ai/models/${draft.id}/`, { method: 'PATCH', body });
      } else {
        await request('/admin/ai/models/', { method: 'POST', body });
      }
      setEditingModel(null);
      flash(draft.id ? 'Model updated.' : 'Model added to the catalogue.');
      load(days);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    }
  };

  const deleteModel = async (model: AiModelRow) => {
    if (!window.confirm(`Remove ${model.label} from the catalogue?`)) return;
    setError('');
    try {
      await request(`/admin/ai/models/${model.id}/`, { method: 'DELETE' });
      flash(`${model.label} removed.`);
      load(days);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.');
    }
  };

  const testModel = async (model: AiModelRow) => {
    setTesting(model.id);
    setError('');
    try {
      const result = await request(`/admin/ai/models/${model.id}/test/`, { method: 'POST' });
      setTestResults(prev => ({ ...prev, [model.id]: result }));
    } catch (e) {
      setTestResults(prev => ({
        ...prev,
        [model.id]: {
          ok: false, outcome: 'error', latencyMs: 0,
          error: e instanceof Error ? e.message : 'Test failed.',
        },
      }));
    } finally {
      setTesting(null);
    }
  };

  /* ─── Render ─── */

  if (loading) {
    return <div className="py-20 text-center text-txt-dim text-sm">Loading AI configuration…</div>;
  }
  if (!config || !usage) {
    return (
      <div className={`${CARD} p-6 text-center`}>
        <p className="text-sm text-red-500">{error || 'AI configuration unavailable.'}</p>
      </div>
    );
  }

  const { summary } = usage;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }} className="space-y-6"
    >
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-txt">AI models</h3>
          <p className="text-[12px] text-txt-muted mt-0.5">
            Which model runs each task, in what order, and what it costs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface2 border border-border rounded-xl p-1">
            {WINDOWS.map(w => (
              <button
                key={w.days}
                onClick={() => setDays(w.days)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                  days === w.days ? 'bg-blue-500 text-white' : 'text-txt-muted hover:text-txt'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => load(days)}
            className="p-2.5 rounded-xl bg-surface2 border border-border text-txt-muted hover:text-txt transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {(error || notice) && (
        <div className={`flex items-start gap-2 px-4 py-3 rounded-xl text-[13px] border ${
          error
            ? 'bg-red-500/10 border-red-500/20 text-red-500'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
        }`}>
          {error ? <ExclamationTriangleIcon className="w-4 h-4 mt-0.5 shrink-0" />
                 : <CheckCircleIcon className="w-4 h-4 mt-0.5 shrink-0" />}
          <span>{error || notice}</span>
        </div>
      )}

      {/* ── Provider keys ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        {config.providers.map(provider => (
          <div key={provider.id} className={`${CARD} p-5 flex items-center gap-4`}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${providerColor(provider.id)}1a` }}
            >
              <KeyIcon className="w-5 h-5" style={{ color: providerColor(provider.id) }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-txt">{provider.label}</p>
              <p className="text-[11px] text-txt-muted font-mono truncate">{provider.envVar}</p>
            </div>
            {provider.hasKey ? (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Key loaded
              </span>
            ) : (
              <a
                href={provider.consoleUrl} target="_blank" rel="noopener noreferrer"
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors"
              >
                Missing
              </a>
            )}
          </div>
        ))}
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Calls', value: formatNumber(summary.requests), icon: BoltIcon,
            color: 'from-blue-600 to-cyan-400', sub: `${summary.failures} failed` },
          { label: 'Tokens', value: formatNumber(summary.tokens), icon: CpuChipIcon,
            color: 'from-purple-600 to-pink-400',
            sub: `${formatNumber(summary.promptTokens)} in · ${formatNumber(summary.completionTokens)} out` },
          { label: 'Success rate', value: summary.successRate === null ? '—' : `${summary.successRate}%`,
            icon: CheckCircleIcon, color: 'from-emerald-600 to-teal-400',
            sub: `${summary.successes} of ${summary.requests}` },
          { label: 'Avg latency', value: summary.avgLatencyMs ? `${formatNumber(summary.avgLatencyMs)} ms` : '—',
            icon: ClockIcon, color: 'from-amber-500 to-orange-400', sub: 'successful calls' },
        ].map(card => (
          <div key={card.label} className={`${CARD} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                {card.label}
              </span>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-txt">{card.value}</p>
            <p className="text-[11px] text-txt-dim mt-1 truncate">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className={`${CARD} p-6 lg:col-span-2`}>
          <h4 className="text-[13px] font-bold text-txt mb-5">Calls per day, by provider</h4>
          <DailyRequestsChart data={usage.daily} />
        </div>
        <div className={`${CARD} p-6`}>
          <h4 className="text-[13px] font-bold text-txt mb-5">How calls ended</h4>
          <OutcomeDonut data={usage.outcomes} />
        </div>
      </div>

      <div className={`${CARD} p-6`}>
        <h4 className="text-[13px] font-bold text-txt mb-4">Tokens per day</h4>
        <TokensChart data={usage.daily} />
      </div>

      {/* ── Live quota ── */}
      <div className={`${CARD} p-6`}>
        <div className="flex items-baseline justify-between mb-1">
          <h4 className="text-[13px] font-bold text-txt">Quota headroom</h4>
          <span className="text-[11px] text-txt-dim">rolling windows, from recorded calls</span>
        </div>
        <p className="text-[11px] text-txt-muted mb-5">
          Measured from what we sent. Providers count their own way and reset on their own
          clocks, so treat these as close, not exact.
        </p>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
          {usage.live.map(entry => (
            <div key={entry.modelId} className={entry.isEnabled ? '' : 'opacity-50'}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: providerColor(entry.provider) }} />
                <span className="text-[12px] font-semibold text-txt truncate">{entry.label}</span>
                {!entry.isEnabled && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface2 text-txt-dim">
                    Off
                  </span>
                )}
              </div>
              <div className="space-y-2.5">
                <QuotaBar label="Requests / min" used={entry.used.minuteRequests}
                          limit={entry.limits.rpm} unit="req" />
                <QuotaBar label="Requests / day" used={entry.used.dayRequests}
                          limit={entry.limits.rpd} unit="req" />
                <QuotaBar label="Tokens / min" used={entry.used.minuteTokens}
                          limit={entry.limits.tpm} unit="tok" />
                <QuotaBar label="Tokens / day" used={entry.used.dayTokens}
                          limit={entry.limits.tpd} unit="tok" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cascades ── */}
      <div>
        <h4 className="text-[15px] font-bold text-txt mb-1">Cascades</h4>
        <p className="text-[12px] text-txt-muted mb-4">
          The first model is tried first. Everything below it runs only when the ones above
          it fail. Changes apply to the next call — nothing in flight is affected.
        </p>

        <div className="space-y-4">
          {config.tasks.map(task => {
            const draft = drafts[task.slug];
            if (!draft) return null;
            const dirty = isDirty(task.slug);
            const stats = usage.byTask.find(t => t.taskSlug === task.slug);
            const used = new Set(draft.cascade.map(s => s.modelPk));
            const addable = config.models.filter(m =>
              !used.has(m.id) &&
              (task.capability !== 'vision' || m.capability === 'vision'));

            return (
              <div key={task.slug} className={`${CARD} p-6`}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="text-[14px] font-bold text-txt">{task.label}</h5>
                      {task.capability === 'vision' && (
                        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-500 border border-violet-500/20">
                          <EyeIcon className="w-3 h-3" /> Vision
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-txt-muted mt-1">{task.description}</p>
                    <code className="text-[10px] text-txt-dim font-mono">{task.slug}</code>
                  </div>
                  {stats && (
                    <div className="flex gap-5 text-right shrink-0">
                      <div>
                        <p className="text-[10px] font-bold text-txt-muted uppercase tracking-wider">Calls</p>
                        <p className="text-[15px] font-bold text-txt">{formatNumber(stats.requests)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-txt-muted uppercase tracking-wider">Fell back</p>
                        <p className={`text-[15px] font-bold ${stats.fallbackHits ? 'text-amber-500' : 'text-txt'}`}>
                          {stats.fallbackHits}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ordered cascade */}
                <div className="space-y-2 mb-4">
                  {draft.cascade.map((step, index) => {
                    const model = modelsByPk[step.modelPk];
                    const live = model ? model.isEnabled && step.isEnabled : step.isLive;
                    const modelStats = statsByModelId[step.modelId];
                    return (
                      <div
                        key={step.modelPk}
                        className={`flex flex-wrap items-center gap-3 p-3 rounded-xl border transition-colors ${
                          live ? 'bg-surface2 border-border' : 'bg-surface2/40 border-border/50'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                          index === 0
                            ? 'bg-blue-500 text-white'
                            : 'bg-border text-txt-muted'
                        }`}>
                          {index + 1}
                        </span>

                        <span className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: providerColor(step.provider) }} />

                        <div className="min-w-0 flex-1">
                          <p className={`text-[13px] font-medium truncate ${live ? 'text-txt' : 'text-txt-dim line-through'}`}>
                            {model?.label || step.label}
                          </p>
                          <p className="text-[10px] text-txt-dim font-mono truncate">{step.modelId}</p>
                        </div>

                        {modelStats && (
                          <span className="text-[11px] text-txt-muted tabular-nums hidden sm:block">
                            {modelStats.successRate ?? 0}% · {formatNumber(modelStats.avgLatencyMs)} ms
                          </span>
                        )}

                        {index === 0 && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            Primary
                          </span>
                        )}
                        {model && !model.isEnabled && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                            Model off
                          </span>
                        )}

                        <div className="flex items-center gap-0.5 ml-auto sm:ml-0">
                          <button
                            onClick={() => moveStep(task.slug, index, -1)}
                            disabled={index === 0}
                            className="p-1.5 rounded-lg text-txt-muted hover:text-txt hover:bg-border disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                            title="Move up"
                          >
                            <ArrowUpIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveStep(task.slug, index, 1)}
                            disabled={index === draft.cascade.length - 1}
                            className="p-1.5 rounded-lg text-txt-muted hover:text-txt hover:bg-border disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                            title="Move down"
                          >
                            <ArrowDownIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeStep(task.slug, index)}
                            disabled={draft.cascade.length <= 1}
                            className="p-1.5 rounded-lg text-txt-muted hover:text-red-500 hover:bg-red-500/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                            title={draft.cascade.length <= 1
                              ? 'A task needs at least one model'
                              : 'Remove from this cascade'}
                          >
                            <XMarkIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add + budgets */}
                <div className="flex flex-wrap items-end gap-4 pt-4 border-t border-border">
                  {addable.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-txt-muted uppercase tracking-wider">
                        Add a fallback
                      </label>
                      <select
                        value=""
                        onChange={e => e.target.value && addStep(task.slug, Number(e.target.value))}
                        className="bg-surface2 border border-border rounded-xl px-3 py-2 text-[12px] text-txt outline-none focus:border-blue-500"
                      >
                        <option value="">Choose a model…</option>
                        {addable.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.label} ({m.provider})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-txt-muted uppercase tracking-wider">
                      Max tokens
                    </label>
                    <input
                      type="number" min={256} max={32000} step={128}
                      value={draft.maxTokens}
                      onChange={e => updateDraft(task.slug, { maxTokens: Number(e.target.value) })}
                      className="w-28 bg-surface2 border border-border rounded-xl px-3 py-2 text-[12px] text-txt outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-txt-muted uppercase tracking-wider">
                      Temperature
                    </label>
                    <input
                      type="number" min={0} max={2} step={0.05}
                      value={draft.temperature}
                      onChange={e => updateDraft(task.slug, { temperature: Number(e.target.value) })}
                      className="w-24 bg-surface2 border border-border rounded-xl px-3 py-2 text-[12px] text-txt outline-none focus:border-blue-500"
                    />
                  </div>

                  {dirty && (
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => resetTask(task.slug)}
                        className="px-4 py-2 rounded-xl bg-surface2 border border-border text-[12px] font-medium text-txt hover:bg-border/50 transition-colors"
                      >
                        Discard
                      </button>
                      <button
                        onClick={() => saveTask(task.slug)}
                        disabled={savingTask === task.slug}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium transition-colors disabled:opacity-50"
                      >
                        {savingTask === task.slug ? 'Saving…' : 'Save cascade'}
                      </button>
                    </div>
                  )}
                </div>

                {draft.cascade.some(s => {
                  const m = modelsByPk[s.modelPk];
                  return m?.isReasoning && draft.maxTokens < 2000;
                }) && (
                  <p className="flex items-start gap-2 mt-4 text-[11px] text-amber-500">
                    <ExclamationTriangleIcon className="w-3.5 h-3.5 mt-px shrink-0" />
                    This cascade contains a reasoning model, which spends part of the token
                    budget thinking before it answers. Below ~2000 tokens it tends to return
                    an empty reply rather than an error.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Catalogue ── */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h4 className="text-[13px] font-bold text-txt">Model catalogue</h4>
            <p className="text-[11px] text-txt-muted mt-0.5">
              Adding a model here does not use it — put it in a cascade above first.
            </p>
          </div>
          <button
            onClick={() => setEditingModel({
              provider: 'gemini', capability: 'text', isReasoning: false,
              limits: { rpm: null, rpd: null, tpm: null, tpd: null }, notes: '',
            })}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-[12px] font-medium transition-colors shrink-0"
          >
            <PlusIcon className="w-4 h-4" /> Add model
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                {['Model', 'Limits (rpm / rpd / tpm / tpd)', `Usage (${days}d)`, 'Status', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-[10px] font-bold text-txt-muted uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {config.models.map(model => {
                const stats = statsByModelId[model.modelId];
                const live = liveByModelId[model.modelId];
                const result = testResults[model.id];
                return (
                  <tr key={model.id} className="hover:bg-surface2/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: providerColor(model.provider) }} />
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-txt flex items-center gap-1.5">
                            {model.label}
                            {model.isReasoning && (
                              <span className="text-[9px] font-bold bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded">
                                REASONING
                              </span>
                            )}
                            {model.capability === 'vision' && (
                              <span className="text-[9px] font-bold bg-violet-500/10 text-violet-500 px-1.5 py-0.5 rounded">
                                VISION
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-txt-muted font-mono truncate">{model.modelId}</p>
                          {result && (
                            <p className={`text-[11px] mt-1 ${result.ok ? 'text-emerald-500' : 'text-red-500'}`}>
                              {result.ok
                                ? `Responded in ${result.latencyMs} ms`
                                : `${result.outcome}: ${result.error.slice(0, 90)}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-txt-muted tabular-nums whitespace-nowrap">
                      {[model.limits.rpm, model.limits.rpd, model.limits.tpm, model.limits.tpd]
                        .map(v => (v ? formatNumber(v) : '∞')).join(' / ')}
                    </td>
                    <td className="px-5 py-3.5 text-[12px] whitespace-nowrap">
                      {stats ? (
                        <span className="text-txt-muted">
                          {formatNumber(stats.requests)} calls · {formatNumber(stats.tokens)} tok
                        </span>
                      ) : (
                        <span className="text-txt-dim">unused</span>
                      )}
                      {live && live.used.dayRequests > 0 && (
                        <p className="text-[10px] text-txt-dim">{live.used.dayRequests} in last 24 h</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleModel(model)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          model.isEnabled ? 'bg-emerald-500' : 'bg-border'
                        }`}
                        title={model.isEnabled ? 'Enabled' : 'Disabled everywhere'}
                      >
                        <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                          model.isEnabled ? 'translate-x-5' : ''
                        }`} />
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => testModel(model)}
                          disabled={testing === model.id}
                          className="p-2 rounded-lg text-txt-muted hover:text-blue-500 hover:bg-blue-500/10 transition-colors disabled:opacity-40"
                          title="Send one test prompt to this model"
                        >
                          <BeakerIcon className={`w-4 h-4 ${testing === model.id ? 'animate-pulse' : ''}`} />
                        </button>
                        <button
                          onClick={() => setEditingModel({ ...model })}
                          className="p-2 rounded-lg text-txt-muted hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                          title="Edit"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteModel(model)}
                          className="p-2 rounded-lg text-txt-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          title="Remove from catalogue"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Recent failures ── */}
      <div className={`${CARD} p-6`}>
        <h4 className="text-[13px] font-bold text-txt mb-4">Recent failures</h4>
        {usage.recentErrors.length === 0 ? (
          <p className="text-[12px] text-txt-dim">
            No failed calls recorded. Every request has been answered by its primary model.
          </p>
        ) : (
          <div className="space-y-2">
            {usage.recentErrors.map(row => (
              <div key={row.id} className="flex flex-wrap items-start gap-3 p-3 rounded-xl bg-surface2 border border-border">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shrink-0"
                      style={{
                        backgroundColor: row.outcome === 'rate_limited' ? '#f59e0b1a' : '#ef44441a',
                        color: row.outcome === 'rate_limited' ? '#f59e0b' : '#ef4444',
                      }}>
                  {row.outcome.replace('_', ' ')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-txt">
                    <span className="font-semibold">{row.taskSlug}</span>
                    <span className="text-txt-dim"> · </span>
                    <span className="font-mono text-[11px] text-txt-muted">{row.modelId}</span>
                  </p>
                  {row.error && (
                    <p className="text-[11px] text-txt-muted mt-0.5 break-words">{row.error}</p>
                  )}
                </div>
                <span className="text-[11px] text-txt-dim shrink-0">
                  {new Date(row.at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Model modal ── */}
      {editingModel && (
        <ModelModal
          draft={editingModel}
          capabilities={config.capabilities}
          providers={config.providers}
          onChange={setEditingModel}
          onClose={() => setEditingModel(null)}
          onSave={saveModel}
        />
      )}
    </motion.div>
  );
}

/* ─── Add / edit model ─────────────────────────────────── */

function ModelModal({
  draft, capabilities, providers, onChange, onClose, onSave,
}: {
  draft: Partial<AiModelRow>;
  capabilities: { id: string; label: string }[];
  providers: ProviderRow[];
  onChange: (draft: Partial<AiModelRow>) => void;
  onClose: () => void;
  onSave: (draft: Partial<AiModelRow>) => void;
}) {
  const isNew = !draft.id;
  const limits = draft.limits || { rpm: null, rpd: null, tpm: null, tpd: null };

  const setLimit = (key: keyof Limits, value: string) =>
    onChange({ ...draft, limits: { ...limits, [key]: value === '' ? null : Number(value) } });

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-surface/95 backdrop-blur-2xl border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <h3 className="text-[15px] font-bold text-txt">{isNew ? 'Add model' : 'Edit model'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface2 text-txt-muted">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={e => { e.preventDefault(); onSave(draft); }}
          className="p-6 space-y-4 overflow-y-auto"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                Provider
              </label>
              <select
                value={draft.provider || 'gemini'}
                disabled={!isNew}
                onChange={e => onChange({ ...draft, provider: e.target.value })}
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-[13px] text-txt outline-none focus:border-blue-500 disabled:opacity-50"
              >
                {providers.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                Capability
              </label>
              <select
                value={draft.capability || 'text'}
                onChange={e => onChange({ ...draft, capability: e.target.value })}
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-[13px] text-txt outline-none focus:border-blue-500"
              >
                {capabilities.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">
              Model id
            </label>
            <input
              required
              value={draft.modelId || ''}
              disabled={!isNew}
              onChange={e => onChange({ ...draft, modelId: e.target.value })}
              placeholder="gemini-2.0-flash"
              className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-[13px] font-mono text-txt outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <p className="text-[11px] text-txt-dim">
              Exactly as the provider spells it. Test it after saving — a wrong id fails
              silently into the fallback.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">
              Display name
            </label>
            <input
              required
              value={draft.label || ''}
              onChange={e => onChange({ ...draft, label: e.target.value })}
              placeholder="Gemini 2.0 Flash"
              className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-[13px] text-txt outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider mb-2">
              Published limits — leave blank for none
            </label>
            <div className="grid grid-cols-4 gap-2">
              {([
                ['rpm', 'req/min'], ['rpd', 'req/day'],
                ['tpm', 'tok/min'], ['tpd', 'tok/day'],
              ] as [keyof Limits, string][]).map(([key, label]) => (
                <div key={key}>
                  <input
                    type="number" min={0}
                    value={limits[key] ?? ''}
                    onChange={e => setLimit(key, e.target.value)}
                    className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-[12px] text-txt outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-txt-dim text-center mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between bg-surface2 border border-border rounded-xl p-4">
            <div>
              <p className="text-[13px] font-medium text-txt">Reasoning model</p>
              <p className="text-[11px] text-txt-muted">Thinking tokens come out of max_tokens</p>
            </div>
            <button
              type="button"
              onClick={() => onChange({ ...draft, isReasoning: !draft.isReasoning })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                draft.isReasoning ? 'bg-blue-500' : 'bg-border'
              }`}
            >
              <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                draft.isReasoning ? 'translate-x-5' : ''
              }`} />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">
              Notes
            </label>
            <textarea
              rows={2}
              value={draft.notes || ''}
              onChange={e => onChange({ ...draft, notes: e.target.value })}
              className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-[13px] text-txt outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-3 bg-surface2 border border-border hover:bg-border/50 rounded-xl text-[13px] font-medium text-txt transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white text-[13px] font-medium transition-colors"
            >
              {isNew ? 'Add to catalogue' : 'Save changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
