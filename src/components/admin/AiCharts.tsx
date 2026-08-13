'use client';

/**
 * Hand-rolled SVG charts for the admin AI page.
 *
 * Deliberately not a charting library: the whole page needs four shapes, the
 * app ships no chart dependency today, and adding one for this would put
 * ~150 KB in front of a page three people will ever open. Each of these is
 * thirty lines of SVG and inherits the theme tokens for free.
 */

export const PROVIDER_COLORS: Record<string, string> = {
  gemini: '#3b82f6',
  groq: '#f59e0b',
};

export const OUTCOME_COLORS: Record<string, string> = {
  success: '#10b981',
  rate_limited: '#f59e0b',
  error: '#ef4444',
  empty: '#8b5cf6',
  skipped: '#94a3b8',
};

export const OUTCOME_LABELS: Record<string, string> = {
  success: 'Success',
  rate_limited: 'Rate limited',
  error: 'Error',
  empty: 'Empty reply',
  skipped: 'Skipped (no key)',
};

export function providerColor(provider: string) {
  return PROVIDER_COLORS[provider] || '#64748b';
}

export function formatNumber(value: number | null | undefined): string {
  const n = value ?? 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(n);
}

function shortDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/* ─────────────────────────────────────────────────────────
   Stacked bars: requests per day, split by provider.
   ───────────────────────────────────────────────────────── */

type DailyPoint = {
  date: string;
  requests: number;
  tokens: number;
  failures: number;
  byProvider: Record<string, { requests: number; tokens: number }>;
};

export function DailyRequestsChart({ data }: { data: DailyPoint[] }) {
  const max = Math.max(...data.map(d => d.requests), 1);
  const providers = Array.from(
    new Set(data.flatMap(d => Object.keys(d.byProvider)))
  ).sort();

  return (
    <div>
      {/* items-stretch, not items-end: the segments below size themselves in
          percent, and a percentage height only resolves against a parent with
          a definite one. Under `items-end` each column shrank to its content,
          so every bar computed to zero height and the chart rendered blank —
          while the fixed-height zero-day stub still showed, which made it look
          like the data was missing rather than the layout. */}
      <div className="flex items-stretch gap-1.5 h-40">
        {data.map(point => (
          <div key={point.date} className="flex-1 flex flex-col items-center gap-1.5 min-w-0 group">
            <span className="text-[10px] font-bold text-txt-muted opacity-0 group-hover:opacity-100 transition-opacity">
              {point.requests}
            </span>
            <div className="w-full flex flex-col-reverse justify-start flex-1 min-h-0 rounded-t-md overflow-hidden">
              {providers.map(provider => {
                const value = point.byProvider[provider]?.requests || 0;
                if (!value) return null;
                return (
                  <div
                    key={provider}
                    title={`${provider}: ${value} requests on ${point.date}`}
                    style={{
                      height: `${(value / max) * 100}%`,
                      backgroundColor: providerColor(provider),
                    }}
                    className="w-full transition-all duration-500"
                  />
                );
              })}
              {point.requests === 0 && (
                <div className="w-full h-[3px] bg-border rounded-full mt-auto" />
              )}
            </div>
            <span className="text-[9px] text-txt-dim truncate w-full text-center">
              {shortDate(point.date)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        {providers.map(provider => (
          <div key={provider} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: providerColor(provider) }}
            />
            <span className="text-[11px] text-txt-muted capitalize">{provider}</span>
          </div>
        ))}
        {providers.length === 0 && (
          <span className="text-[11px] text-txt-dim">No calls in this window.</span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Line + area: tokens per day.
   ───────────────────────────────────────────────────────── */

export function TokensChart({ data }: { data: DailyPoint[] }) {
  const width = 100;
  const height = 40;
  const max = Math.max(...data.map(d => d.tokens), 1);

  // A single point would make a zero-length path, which renders as nothing;
  // duplicating it draws a flat line, which is the honest picture.
  const points = data.length === 1 ? [data[0], data[0]] : data;
  const step = width / Math.max(points.length - 1, 1);

  const coords = points.map((point, i) => ({
    x: i * step,
    y: height - (point.tokens / max) * (height - 4) - 2,
  }));

  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-28">
        <defs>
          <linearGradient id="tokenFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#tokenFill)" />
        <path
          d={line}
          fill="none"
          stroke="#06b6d4"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex justify-between text-[10px] text-txt-dim mt-1">
        <span>{data.length ? shortDate(data[0].date) : ''}</span>
        <span className="text-txt-muted font-medium">peak {formatNumber(max)} tokens/day</span>
        <span>{data.length ? shortDate(data[data.length - 1].date) : ''}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Quota gauge: used against a published ceiling.
   ───────────────────────────────────────────────────────── */

export function QuotaBar({
  label, used, limit, unit,
}: { label: string; used: number; limit: number | null; unit: string }) {
  // No published limit is not the same as a limit of zero. Drawing it as a
  // full bar would invent a ceiling that does not exist.
  if (!limit) {
    return (
      <div>
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-[10px] font-bold text-txt-muted uppercase tracking-wider">{label}</span>
          <span className="text-[11px] text-txt-dim">{formatNumber(used)} {unit} · no cap</span>
        </div>
        <div className="h-1.5 rounded-full bg-surface2" />
      </div>
    );
  }

  const pct = Math.min((used / limit) * 100, 100);
  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981';

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[10px] font-bold text-txt-muted uppercase tracking-wider">{label}</span>
        <span className="text-[11px] text-txt-muted tabular-nums">
          {formatNumber(used)} / {formatNumber(limit)} {unit}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(pct, used > 0 ? 2 : 0)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Donut: how calls ended.
   ───────────────────────────────────────────────────────── */

export function OutcomeDonut({ data }: { data: { outcome: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  // Each arc starts where every arc before it ended. Computed as a prefix sum
  // rather than a running counter: a variable reassigned during render is both
  // a lint error and a real hazard, since React may re-run this body.
  const fractions = data.map(entry => (total ? entry.count / total : 0));
  const segments = data.map((entry, index) => {
    const start = fractions.slice(0, index).reduce((sum, f) => sum + f, 0);
    return {
      ...entry,
      dash: fractions[index] * circumference,
      offset: -start * circumference,
      pct: total ? Math.round(fractions[index] * 100) : 0,
    };
  });

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="12"
                  className="stroke-surface2" />
          {segments.map(segment => (
            <circle
              key={segment.outcome}
              cx="50" cy="50" r={radius} fill="none" strokeWidth="12"
              stroke={OUTCOME_COLORS[segment.outcome] || '#64748b'}
              strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
              strokeDashoffset={segment.offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-extrabold text-txt leading-none">{formatNumber(total)}</span>
          <span className="text-[9px] text-txt-dim uppercase tracking-wider mt-0.5">calls</span>
        </div>
      </div>

      <div className="flex-1 space-y-1.5 min-w-0">
        {segments.length === 0 && (
          <p className="text-[12px] text-txt-dim">Nothing recorded in this window.</p>
        )}
        {segments.map(segment => (
          <div key={segment.outcome} className="flex items-center gap-2 text-[12px]">
            <span className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: OUTCOME_COLORS[segment.outcome] || '#64748b' }} />
            <span className="text-txt-muted truncate">
              {OUTCOME_LABELS[segment.outcome] || segment.outcome}
            </span>
            <span className="ml-auto text-txt font-semibold tabular-nums">{segment.count}</span>
            <span className="text-txt-dim tabular-nums w-9 text-right">{segment.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
