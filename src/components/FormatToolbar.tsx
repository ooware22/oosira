'use client';

import React from 'react';
import type { FormatKind } from './RichTextField';

/**
 * Bold / italic / bullet buttons for RichTextField. Actual formatting is
 * applied by the field itself (contentEditable + execCommand) — this
 * component is presentational, wired via a plain callback.
 */

type Props = {
  onFormat: (kind: FormatKind) => void;
  labels?: { bold: string; italic: string; bullet: string; hint?: string };
};

const BTN =
  'w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-surface text-txt-muted transition-all hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10';

export default function FormatToolbar({ onFormat, labels }: Props) {
  // mousedown (not click) + preventDefault keeps focus/selection inside the
  // contentEditable field, which execCommand needs to act on the right range.
  const handle = (kind: FormatKind) => (e: React.MouseEvent) => {
    e.preventDefault();
    onFormat(kind);
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onMouseDown={handle('bold')}
        className={BTN}
        title={labels?.bold}
        aria-label={labels?.bold}
      >
        <span className="text-sm font-black">B</span>
      </button>
      <button
        type="button"
        onMouseDown={handle('italic')}
        className={BTN}
        title={labels?.italic}
        aria-label={labels?.italic}
      >
        <span className="text-sm font-serif italic font-bold">I</span>
      </button>
      <button
        type="button"
        onMouseDown={handle('bullet')}
        className={BTN}
        title={labels?.bullet}
        aria-label={labels?.bullet}
      >
        <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor" aria-hidden="true">
          <circle cx="2.5" cy="4" r="1.5" />
          <circle cx="2.5" cy="8" r="1.5" />
          <circle cx="2.5" cy="12" r="1.5" />
          <rect x="6" y="3.25" width="9" height="1.5" rx="0.75" />
          <rect x="6" y="7.25" width="9" height="1.5" rx="0.75" />
          <rect x="6" y="11.25" width="9" height="1.5" rx="0.75" />
        </svg>
      </button>
      {labels?.hint && (
        <span className="ms-1 text-[11px] text-txt-dim hidden sm:inline">{labels.hint}</span>
      )}
    </div>
  );
}
