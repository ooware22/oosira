import { ReactElement, ReactNode } from 'react';

/**
 * A CV described as an ordered list of atomic, measurable blocks instead of one
 * monolithic tree.
 *
 * This exists so pagination can be computed rather than guessed. The old
 * preview clipped a single tall render every 1123px, which cut through lines of
 * text, while the PDF let Chromium fragment independently — the two never
 * agreed. With blocks, the same engine produces real page elements for both the
 * preview and the Playwright export, so they cannot diverge.
 */
export interface CVBlock {
  /** Stable within one layout; used as the measurement key. */
  id: string;
  /**
   * Consecutive blocks sharing a group are re-wrapped in `wrapperClass` on
   * whichever page they land, so section styling survives a page break.
   */
  group: string;
  /** Outer wrapper for the group, e.g. `cv-section-col`. */
  wrapperClass?: string;
  /** Inner wrapper for a run of blocks, e.g. `cv-timeline` (its left rail). */
  innerClass?: string;
  /** A section title must never be the last thing on a page. */
  keepWithNext?: boolean;
  node: ReactElement;
}

export interface CVLayout {
  /** Modifier class on the page root, e.g. `cv-classique`. */
  pageClass: string;
  /** Body wrapper class, e.g. `cv-body` — carries the page padding. */
  bodyClass: string;
  /** Two-column grid class, e.g. `cv-grid`. Omit for a single flow. */
  gridClass?: string;
  /**
   * Wrapper applied to each column of blocks. Must be identical in the
   * measurement pass and the rendered pages, otherwise measured offsets drift
   * from the real layout by one flex gap per block.
   */
  columnClass?: string;
  /** Rendered once, at the top of page 1. */
  header?: ReactNode;
  /** Full-width blocks above the columns (the summary). */
  lead: CVBlock[];
  main: CVBlock[];
  side: CVBlock[];
  /**
   * A fixed column repeated on every page (CVExecutif). Its content is drawn on
   * page 1 only; later pages keep the empty coloured column so the band runs
   * the full height of the document.
   */
  sidebar?: { className: string; node: ReactNode };
  /** True when main/side should be concatenated into one flow. */
  singleColumn?: boolean;
}

/**
 * Convenience constructor. Ids must be deterministic — they are the
 * measurement keys, so they have to survive a re-render unchanged.
 */
export function block(
  id: string,
  group: string,
  node: ReactElement,
  opts: Omit<Partial<CVBlock>, 'id' | 'group' | 'node'> = {},
): CVBlock {
  return { id, group, node, ...opts };
}
