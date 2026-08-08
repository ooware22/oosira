'use client';

import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { BULLET_RE } from '@/app/templates/richText';

/**
 * Live WYSIWYG editor for the same lightweight markup `richText.tsx` renders
 * (**bold**, *italic*, "- " bullets) — a contentEditable div instead of a
 * plain textarea, so formatting shows live instead of as raw markers.
 *
 * The plain-markup string stays the single source of truth (same as before):
 * on every edit we serialize the live DOM back into that string and hand it
 * to `onChange`, so storage, CV template rendering and PDF export are all
 * untouched. We only ever push `value` into the DOM when it changed from
 * *outside* this component (switching CV, OCR import) — matching what we
 * last emitted ourselves is what keeps the caret from jumping while typing.
 */

export type FormatKind = 'bold' | 'italic' | 'bullet';
export type RichTextFieldHandle = { runFormat: (kind: FormatKind) => void };

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeMarkupChars(s: string): string {
  // Literal `\` and `*` typed by the user must round-trip as literal text,
  // matching the `\* \\` escape convention documented in richText.tsx.
  return s.replace(/\\/g, '\\\\').replace(/\*/g, '\\*');
}

/** Index of the next unescaped `marker`, or -1. Mirrors richText.tsx's findClosing. */
function findClosing(line: string, from: number, marker: string): number {
  for (let i = from; i < line.length; i++) {
    if (line[i] === '\\') { i += 1; continue; }
    if (line.startsWith(marker, i)) {
      if (marker === '*' && line[i + 1] === '*') continue;
      return i === from ? -1 : i;
    }
  }
  return -1;
}

/** Mirrors richText.tsx's renderInline, but emits an HTML string. Marker
 * matching runs across the whole (possibly multi-line) text — a formatting
 * span containing a line break must still find its closing marker. */
function inlineToHtml(text: string): string {
  let html = '';
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\\' && i + 1 < text.length) {
      html += escapeHtml(text[i + 1]);
      i += 2;
      continue;
    }
    if (ch === '\n') {
      html += '<br>';
      i += 1;
      continue;
    }
    if (ch === '*') {
      const isTriple = text[i + 1] === '*' && text[i + 2] === '*';
      const isBold = !isTriple && text[i + 1] === '*';
      const marker = isTriple ? '***' : isBold ? '**' : '*';
      const closeAt = findClosing(text, i + marker.length, marker);
      if (closeAt !== -1) {
        const inner = text.slice(i + marker.length, closeAt);
        html += isTriple
          ? `<strong><em>${inlineToHtml(inner)}</em></strong>`
          : isBold
            ? `<strong>${inlineToHtml(inner)}</strong>`
            : `<em>${inlineToHtml(inner)}</em>`;
        i = closeAt + marker.length;
        continue;
      }
    }
    html += escapeHtml(ch);
    i += 1;
  }
  return html;
}

/** Plain markup text → HTML for (re)populating the contentEditable DOM. */
function markupToHtml(text: string): string {
  // Genuinely empty (no children at all), not `<p><br></p>` — lets the
  // `:empty:before` placeholder CSS trick work, and CSS `:empty` never
  // matches an element containing a `<br>` child.
  if (!text) return '';

  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    out.push(`<p>${inlineToHtml(paragraph.join('\n'))}</p>`);
    paragraph = [];
  };
  const flushBullets = () => {
    if (!bullets.length) return;
    out.push(`<ul>${bullets.map((b) => `<li>${inlineToHtml(b)}</li>`).join('')}</ul>`);
    bullets = [];
  };

  for (const line of lines) {
    if (BULLET_RE.test(line)) {
      flushParagraph();
      bullets.push(line.replace(BULLET_RE, ''));
    } else if (!line.trim()) {
      flushBullets();
      flushParagraph();
    } else {
      flushBullets();
      paragraph.push(line);
    }
  }
  flushBullets();
  flushParagraph();

  return out.join('');
}

const BOLD_TAGS = new Set(['STRONG', 'B']);
const ITALIC_TAGS = new Set(['EM', 'I']);

/** Live DOM → plain markup text, the reverse of markupToHtml. */
function serializeNode(node: Node): string {
  let out = '';
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out += escapeMarkupChars(child.textContent || '');
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const el = child as HTMLElement;
    const tag = el.tagName;

    if (BOLD_TAGS.has(tag) || ITALIC_TAGS.has(tag)) {
      const isBold = BOLD_TAGS.has(tag);
      // execCommand nests bold-inside-italic (or vice versa) when both are
      // applied to the same selection — collapse that single-child nesting
      // into one `***text***` run rather than emitting ambiguous adjacent
      // markers (e.g. `*​**text**​*`) that the reader can't unambiguously
      // re-split back into two markers.
      const onlyChild = el.childNodes.length === 1 ? el.childNodes[0] : null;
      const onlyChildIsOpposite =
        onlyChild?.nodeType === Node.ELEMENT_NODE &&
        (isBold ? ITALIC_TAGS.has((onlyChild as HTMLElement).tagName) : BOLD_TAGS.has((onlyChild as HTMLElement).tagName));
      if (onlyChildIsOpposite) {
        out += `***${serializeNode(onlyChild as HTMLElement)}***`;
      } else {
        out += isBold ? `**${serializeNode(el)}**` : `*${serializeNode(el)}*`;
      }
      return;
    }

    switch (tag) {
      case 'BR':
        out += '\n';
        break;
      case 'LI':
        out += `- ${serializeNode(el)}\n`;
        break;
      case 'UL':
      case 'OL':
        out += serializeNode(el);
        break;
      case 'P':
      case 'DIV':
        out += `${serializeNode(el)}\n\n`;
        break;
      default:
        out += serializeNode(el);
    }
  });
  return out;
}

function serializeRoot(root: HTMLElement): string {
  return serializeNode(root)
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
  dir?: 'ltr' | 'rtl';
  className?: string;
  style?: React.CSSProperties;
};

const RichTextField = forwardRef<RichTextFieldHandle, Props>(function RichTextField(
  { value, onChange, placeholder, id, dir, className, style },
  ref,
) {
  const elRef = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef<string>(value);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    el.innerHTML = markupToHtml(value);
    // Mount only — external updates are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    if (value === lastEmitted.current) return; // our own edit round-tripped back — DOM already matches
    el.innerHTML = markupToHtml(value);
    lastEmitted.current = value;
  }, [value]);

  const emitChange = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    const serialized = serializeRoot(el);
    lastEmitted.current = serialized;
    onChange(serialized);
  }, [onChange]);

  const runFormat = useCallback(
    (kind: FormatKind) => {
      const el = elRef.current;
      if (!el) return;
      el.focus();
      if (kind === 'bold') document.execCommand('bold');
      else if (kind === 'italic') document.execCommand('italic');
      else document.execCommand('insertUnorderedList');
      emitChange();
    },
    [emitChange],
  );

  useImperativeHandle(ref, () => ({ runFormat }), [runFormat]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!e.ctrlKey && !e.metaKey) return;
      const key = e.key.toLowerCase();
      if (key === 'b') { e.preventDefault(); runFormat('bold'); }
      else if (key === 'i') { e.preventDefault(); runFormat('italic'); }
    },
    [runFormat],
  );

  return (
    <div
      ref={elRef}
      id={id}
      dir={dir}
      contentEditable
      suppressContentEditableWarning
      onInput={emitChange}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      data-placeholder={placeholder}
      className={className}
      style={style}
    />
  );
});

export default RichTextField;
