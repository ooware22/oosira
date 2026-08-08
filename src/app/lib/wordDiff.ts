/**
 * Word-level diff used to show what the proofreader changed before the user
 * accepts it. Whitespace is kept as its own token so line breaks and blank
 * lines survive into the rendered diff — a corrected letter must still look
 * like a letter.
 */

export type DiffSegment = { type: 'same' | 'removed' | 'added'; text: string };

/** Split into words and the whitespace between them, both preserved. */
function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((t) => t !== '');
}

/**
 * Classic LCS table. Inputs here are a CV field or a letter (hundreds of
 * tokens), so the O(n*m) table is comfortably small.
 */
function lcsLengths(a: string[], b: string[]): number[][] {
  const table: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  return table;
}

export function diffWords(original: string, corrected: string): DiffSegment[] {
  const a = tokenize(original);
  const b = tokenize(corrected);
  const table = lcsLengths(a, b);

  const segments: DiffSegment[] = [];
  const push = (type: DiffSegment['type'], text: string) => {
    const last = segments[segments.length - 1];
    if (last && last.type === type) last.text += text;
    else segments.push({ type, text });
  };

  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push('same', a[i]);
      i++; j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      push('removed', a[i]);
      i++;
    } else {
      push('added', b[j]);
      j++;
    }
  }
  while (i < a.length) push('removed', a[i++]);
  while (j < b.length) push('added', b[j++]);

  return segments;
}

/** True when the proofreader actually changed something. */
export function hasChanges(original: string, corrected: string): boolean {
  return original !== corrected;
}

/** Number of changed words, for a "N corrections" summary. */
export function countChanges(segments: DiffSegment[]): number {
  return segments.filter((s) => s.type !== 'same' && s.text.trim() !== '').length;
}
