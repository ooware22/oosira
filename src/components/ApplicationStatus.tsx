'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

/**
 * The application pipeline, shared by the cards, the detail header and the
 * list filters so the order and colours can't drift between them.
 *
 * Mirrors JobApplication.STATUS_CHOICES in the backend
 * (applications/models.py) — keep the two in step.
 */
export const APPLICATION_STATUSES = [
  'draft',
  'sent',
  'followed_up',
  'interview',
  'offer',
  'rejected',
  'no_response',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** i18n key for each status label. */
export const STATUS_LABEL_KEY: Record<ApplicationStatus, string> = {
  draft: 'applications.statusDraft',
  sent: 'applications.statusSent',
  followed_up: 'applications.statusFollowedUp',
  interview: 'applications.statusInterview',
  offer: 'applications.statusOffer',
  rejected: 'applications.statusRejected',
  no_response: 'applications.statusNoResponse',
};

/** Tone per status: neutral while nothing has happened, blue once in flight,
 *  amber while chasing, emerald for good news, red for a no. */
const STATUS_TONE: Record<ApplicationStatus, string> = {
  draft: 'bg-surface2 text-txt-muted border-border',
  sent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
  followed_up: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
  interview: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25',
  offer: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
  rejected: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25',
  no_response: 'bg-surface2 text-txt-dim border-border',
};

const STATUS_DOT: Record<ApplicationStatus, string> = {
  draft: 'bg-txt-dim',
  sent: 'bg-blue-500',
  followed_up: 'bg-amber-500',
  interview: 'bg-violet-500',
  offer: 'bg-emerald-500',
  rejected: 'bg-red-500',
  no_response: 'bg-txt-dim',
};

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value);
}

export function StatusPill({ status, label, className = '' }: {
  status: ApplicationStatus;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap ${STATUS_TONE[status]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
      {label}
    </span>
  );
}

/**
 * The pill, but clickable: opens a menu to move the application along the
 * pipeline. Used in the detail header.
 */
export function StatusSelect({ status, labelFor, onChange, disabled }: {
  status: ApplicationStatus;
  labelFor: (s: ApplicationStatus) => string;
  onChange: (next: ApplicationStatus) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold transition-colors disabled:opacity-60 hover:brightness-110 ${STATUS_TONE[status]}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
        {labelFor(status)}
        <ChevronDownIcon className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 end-0 w-52 bg-surface border border-border rounded-xl shadow-xl overflow-hidden py-1">
          {APPLICATION_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setOpen(false); if (s !== status) onChange(s); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-txt hover:bg-surface2 transition-colors text-start"
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[s]}`} />
              <span className="flex-1 truncate">{labelFor(s)}</span>
              {s === status && <CheckIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
