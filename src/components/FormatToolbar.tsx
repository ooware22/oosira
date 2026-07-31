'use client';

import React, { useCallback } from 'react';
import { BULLET_RE } from '@/app/templates/richText';

/**
 * Formatting controls for the CV free-text fields. Operates directly on the
 * textarea's plain-text value using the lightweight markup that
 * `renderRichText` understands — no contentEditable, no stored HTML.
 */

export type FormatKind = 'bold' | 'italic' | 'bullet';

type FormatResult = { value: string; selectionStart: number; selectionEnd: number };

function applyBullet(value: string, start: number, end: number): FormatResult {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  let lineEnd = value.indexOf('\n', end);
  if (lineEnd === -1) lineEnd = value.length;

  const lines = value.slice(lineStart, lineEnd).split('\n');
  const meaningful = lines.filter((l) => l.trim());
  // Toggle off only when every non-blank line in the block is already a bullet.
  const allBulleted = meaningful.length > 0 && meaningful.every((l) => BULLET_RE.test(l));

  const next = lines
    .map((l) => {
      if (!l.trim()) return l;
      return allBulleted ? l.replace(BULLET_RE, '') : `- ${l}`;
    })
    .join('\n');

  return {
    value: value.slice(0, lineStart) + next + value.slice(lineEnd),
    selectionStart: lineStart,
    selectionEnd: lineStart + next.length,
  };
}

/**
 * Wrap or unwrap the current selection. Exported for testing — it is pure.
 */
export function applyFormat(
  kind: FormatKind,
  value: string,
  start: number,
  end: number,
): FormatResult {
  if (kind === 'bullet') return applyBullet(value, start, end);

  const marker = kind === 'bold' ? '**' : '*';
  const before = value.slice(0, start);
  const selected = value.slice(start, end);
  const after = value.slice(end);

  // Markers inside the selection → unwrap.
  if (
    selected.length > marker.length * 2 &&
    selected.startsWith(marker) &&
    selected.endsWith(marker)
  ) {
    const inner = selected.slice(marker.length, selected.length - marker.length);
    return {
      value: before + inner + after,
      selectionStart: start,
      selectionEnd: start + inner.length,
    };
  }

  // Markers immediately outside the selection → unwrap.
  // For italic, `before` ending in "**" is a bold marker, not an italic one.
  const outsideIsOwnMarker =
    before.endsWith(marker) &&
    after.startsWith(marker) &&
    !(kind === 'italic' && (before.endsWith('**') || after.startsWith('**')));
  if (outsideIsOwnMarker) {
    return {
      value: before.slice(0, -marker.length) + selected + after.slice(marker.length),
      selectionStart: start - marker.length,
      selectionEnd: end - marker.length,
    };
  }

  // Empty selection → drop a marker pair and park the caret inside.
  if (!selected) {
    return {
      value: before + marker + marker + after,
      selectionStart: start + marker.length,
      selectionEnd: start + marker.length,
    };
  }

  return {
    value: before + marker + selected + marker + after,
    selectionStart: start + marker.length,
    selectionEnd: end + marker.length,
  };
}

type Props = {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (v: string) => void;
  labels?: { bold: string; italic: string; bullet: string; hint?: string };
};

export function useFormatActions(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
  onChange: (v: string) => void,
) {
  return useCallback(
    (kind: FormatKind) => {
      const el = textareaRef.current;
      if (!el) return;
      const result = applyFormat(kind, value, el.selectionStart, el.selectionEnd);
      onChange(result.value);
      // React re-renders with the new value first; restore the selection after.
      requestAnimationFrame(() => {
        const node = textareaRef.current;
        if (!node) return;
        node.focus();
        node.setSelectionRange(result.selectionStart, result.selectionEnd);
      });
    },
    [textareaRef, value, onChange],
  );
}

/** Ctrl/Cmd+B and Ctrl/Cmd+I. Attach to the textarea's onKeyDown. */
export function makeFormatKeyDown(run: (kind: FormatKind) => void) {
  return (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!e.ctrlKey && !e.metaKey) return;
    const key = e.key.toLowerCase();
    if (key === 'b') {
      e.preventDefault();
      run('bold');
    } else if (key === 'i') {
      e.preventDefault();
      run('italic');
    }
  };
}

const BTN =
  'w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-surface text-txt-muted transition-all hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10';

export default function FormatToolbar({ textareaRef, value, onChange, labels }: Props) {
  const run = useFormatActions(textareaRef, value, onChange);

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => run('bold')}
        className={BTN}
        title={labels?.bold}
        aria-label={labels?.bold}
      >
        <span className="text-sm font-black">B</span>
      </button>
      <button
        type="button"
        onClick={() => run('italic')}
        className={BTN}
        title={labels?.italic}
        aria-label={labels?.italic}
      >
        <span className="text-sm font-serif italic font-bold">I</span>
      </button>
      <button
        type="button"
        onClick={() => run('bullet')}
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
