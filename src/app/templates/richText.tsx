import React from 'react';

/**
 * Minimal inline markup for CV free-text fields (summary, descriptions).
 *
 * Grammar:
 *   ***bold+italic***   → <strong><em>
 *   **bold**            → <strong>
 *   *italic*            → <em>
 *   "- " / "• " prefix  → <li> (consecutive lines group into one <ul>)
 *   blank line          → paragraph break
 *   single newline      → <br/>
 *   \* \\               → literal asterisk / backslash
 *
 * Everything is built from React elements — never `dangerouslySetInnerHTML` —
 * so stored values can never inject markup, and Playwright renders the exact
 * same tree the builder preview does.
 *
 * Plain text with none of these markers renders unchanged, so CVs saved before
 * the toolbar existed (including multi-line OCR imports) are unaffected apart
 * from their newlines finally being honoured.
 *
 * Marker matching runs across a whole paragraph (embedded `\n` included, only
 * turned into `<br/>` at the very end) rather than per physical line — a
 * bold/italic span that happens to contain a line break must still find its
 * closing marker; splitting into lines first (as this used to do) stranded
 * the opening and closing markers on different lines with neither matching.
 */

export const BULLET_RE = /^\s*[-•]\s+/;

/** Split a (possibly multi-line) paragraph into <strong>/<em>/<br/>/text nodes. */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let buffer = '';
  let i = 0;
  let n = 0;

  const flush = () => {
    if (buffer) {
      nodes.push(buffer);
      buffer = '';
    }
  };

  while (i < text.length) {
    const ch = text[i];

    // Escape: a backslash makes the next character literal.
    if (ch === '\\' && i + 1 < text.length) {
      buffer += text[i + 1];
      i += 2;
      continue;
    }

    if (ch === '\n') {
      flush();
      nodes.push(<br key={`${keyPrefix}-br-${n++}`} />);
      i += 1;
      continue;
    }

    if (ch === '*') {
      const isTriple = text[i + 1] === '*' && text[i + 2] === '*';
      const isBold = !isTriple && text[i + 1] === '*';
      const marker = isTriple ? '***' : isBold ? '**' : '*';
      const closeAt = findClosing(text, i + marker.length, marker);
      if (closeAt !== -1) {
        flush();
        const inner = text.slice(i + marker.length, closeAt);
        const key = `${keyPrefix}-${n++}`;
        nodes.push(
          isTriple
            ? <strong key={key}><em>{renderInline(inner, key)}</em></strong>
            : isBold
              ? <strong key={key}>{renderInline(inner, key)}</strong>
              : <em key={key}>{renderInline(inner, key)}</em>,
        );
        i = closeAt + marker.length;
        continue;
      }
      // No closing marker — treat as a literal asterisk.
    }

    buffer += ch;
    i += 1;
  }

  flush();
  return nodes;
}

/** Index of the next unescaped `marker`, or -1. Empty spans don't count. */
function findClosing(line: string, from: number, marker: string): number {
  for (let i = from; i < line.length; i++) {
    if (line[i] === '\\') {
      i += 1;
      continue;
    }
    if (line.startsWith(marker, i)) {
      // `**` must not be matched by a single-asterisk search at the same spot.
      if (marker === '*' && line[i + 1] === '*') continue;
      return i === from ? -1 : i;
    }
  }
  return -1;
}

/**
 * Render CV free text. Returns a fragment of paragraphs, lists and line breaks.
 */
export function renderRichText(text: string | undefined): React.ReactNode {
  if (!text) return null;

  const lines = text.split(/\r?\n/);
  const out: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];
  let key = 0;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const k = `p-${key++}`;
    out.push(
      <p key={k} className="rt-p">
        {renderInline(paragraph.join('\n'), k)}
      </p>,
    );
    paragraph = [];
  };

  const flushBullets = () => {
    if (!bullets.length) return;
    const k = `ul-${key++}`;
    out.push(
      <ul key={k} className="rt-ul">
        {bullets.map((item, i) => (
          <li key={i}>{renderInline(item, `${k}-${i}`)}</li>
        ))}
      </ul>,
    );
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

  return <>{out}</>;
}
