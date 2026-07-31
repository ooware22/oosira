'use client';

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CVBlock, CVLayout } from '@/app/templates/blocks';
import { renderBlocks } from '@/app/templates/renderBlocks';

/** A4 at 96dpi. */
export const A4_WIDTH = 794;
export const A4_HEIGHT = 1123;

/** Safety gutter so content never touches the very bottom edge of a sheet. */
const BOTTOM_GUTTER = 16;

/**
 * A block's vertical extent measured *relative to its column*, not its own
 * height. Using offsets rather than summed heights means flex gaps, collapsed
 * margins and wrapper padding are all accounted for automatically — summing
 * heights silently drifts by a few pixels per block and desyncs long CVs.
 */
interface Box {
  top: number;
  bottom: number;
}

export type Metrics = {
  boxes: Record<string, Box>;
  headerHeight: number;
  /** Vertical padding of the body wrapper, consumed on every page. */
  bodyPadding: number;
};

export interface PageContent {
  lead: CVBlock[];
  main: CVBlock[];
  side: CVBlock[];
}

/* ────────────────────────── distribution ────────────────────────── */

/**
 * Take blocks off the front of `queue` while they still fit below `offset`.
 * Returns the taken blocks and the offset the next page should start from.
 */
function fillColumn(
  queue: CVBlock[],
  capacity: number,
  boxes: Record<string, Box>,
  offset: number,
): { taken: CVBlock[]; nextOffset: number } {
  const taken: CVBlock[] = [];

  while (queue.length) {
    const next = queue[0];
    const box = boxes[next.id];
    // Unmeasured blocks (first paint) are taken optimistically; the layout
    // effect re-runs with real numbers immediately after.
    if (box && taken.length > 0 && box.bottom - offset > capacity) break;
    taken.push(queue.shift() as CVBlock);
  }

  // A section title must never be left stranded at the foot of a page.
  while (taken.length > 1 && taken[taken.length - 1].keepWithNext && queue.length) {
    queue.unshift(taken.pop() as CVBlock);
  }

  const head = queue[0];
  const nextOffset = head && boxes[head.id] ? boxes[head.id].top : offset + capacity;
  return { taken, nextOffset };
}

export function paginate(layout: CVLayout, m: Metrics): PageContent[] {
  const main = layout.singleColumn ? [...layout.main, ...layout.side] : [...layout.main];
  const side = layout.singleColumn ? [] : [...layout.side];
  const lead = [...layout.lead];

  const pages: PageContent[] = [];
  let mainOffset = 0;
  let sideOffset = 0;
  let first = true;
  // Hard stop; a runaway loop here would freeze the builder.
  let guard = 0;

  while ((main.length || side.length || lead.length) && guard++ < 40) {
    let capacity = A4_HEIGHT - BOTTOM_GUTTER - m.bodyPadding;
    const pageLead: CVBlock[] = [];

    if (first) {
      capacity -= m.headerHeight;
      // The summary sits full-width above the columns on page 1.
      for (const b of lead.splice(0)) {
        pageLead.push(b);
        const box = m.boxes[b.id];
        if (box) capacity -= box.bottom - box.top;
      }
      first = false;
    }

    const columnCapacity = Math.max(capacity, 120);
    const mainFill = fillColumn(main, columnCapacity, m.boxes, mainOffset);
    const sideFill = fillColumn(side, columnCapacity, m.boxes, sideOffset);
    mainOffset = mainFill.nextOffset;
    sideOffset = sideFill.nextOffset;

    pages.push({ lead: pageLead, main: mainFill.taken, side: sideFill.taken });
  }

  if (pages.length === 0) pages.push({ lead: [], main: [], side: [] });
  return pages;
}

/* ────────────────────────── component ────────────────────────── */

interface Props {
  layout: CVLayout;
  cssVars: React.CSSProperties;
  dir?: 'ltr' | 'rtl';
  /** Print mode emits a page break between sheets and drops preview chrome. */
  print?: boolean;
  /** Scale each sheet (preview zoom). Ignored in print mode. */
  scale?: number;
  /** Preview chrome: drop shadow, rounded corners, "1 / 3" badge. */
  chrome?: boolean;
  onPageCountChange?: (n: number) => void;
  onReady?: () => void;
}

export default function PaginatedCV({
  layout,
  cssVars,
  dir = 'ltr',
  print = false,
  scale = 1,
  chrome = true,
  onPageCountChange,
  onReady,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<Metrics>({
    boxes: {},
    headerHeight: 0,
    bodyPadding: 0,
  });
  const [measured, setMeasured] = useState(false);

  const allBlocks = useMemo(
    () => [...layout.lead, ...layout.main, ...layout.side],
    [layout],
  );
  // Re-measure whenever the set of blocks or the styling changes.
  const signature = useMemo(
    () => allBlocks.map((b) => b.id).join('|') + '::' + JSON.stringify(cssVars),
    [allBlocks, cssVars],
  );

  const measure = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;

    const boxes: Record<string, Box> = {};
    // Each column is measured against its own container, so a block's offset is
    // its position within that flow — independent of the other column.
    host.querySelectorAll<HTMLElement>('[data-measure-col]').forEach((col) => {
      const colTop = col.getBoundingClientRect().top;
      col.querySelectorAll<HTMLElement>('[data-measure]').forEach((el) => {
        const id = el.getAttribute('data-measure');
        if (!id) return;
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        const mt = parseFloat(style.marginTop) || 0;
        const mb = parseFloat(style.marginBottom) || 0;
        boxes[id] = {
          top: rect.top - colTop - mt,
          bottom: rect.bottom - colTop + mb,
        };
      });
    });

    const head = host.querySelector<HTMLElement>('[data-measure-header]');
    const body = host.querySelector<HTMLElement>('[data-measure-body]');
    let bodyPadding = 0;
    if (body) {
      const bs = getComputedStyle(body);
      bodyPadding = (parseFloat(bs.paddingTop) || 0) + (parseFloat(bs.paddingBottom) || 0);
    }

    setMetrics({
      boxes,
      headerHeight: head ? head.getBoundingClientRect().height : 0,
      bodyPadding,
    });
    setMeasured(true);
  }, []);

  useLayoutEffect(() => {
    measure();
    // Web fonts change metrics after first paint; re-measure once they land.
    let cancelled = false;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) measure();
      });
    }
    return () => {
      cancelled = true;
    };
  }, [signature, measure]);

  const pages = useMemo(() => paginate(layout, metrics), [layout, metrics]);

  useEffect(() => {
    onPageCountChange?.(pages.length);
  }, [pages.length, onPageCountChange]);

  useEffect(() => {
    if (measured) onReady?.();
  }, [measured, onReady]);

  const col = layout.columnClass ?? 'flex flex-col gap-4';

  const renderPage = (page: PageContent, i: number) => {
    const body = (
      <div className={layout.bodyClass}>
        {page.lead.length > 0 && renderBlocks(page.lead)}
        {layout.singleColumn || !layout.gridClass ? (
          <div className={col}>{renderBlocks(page.main)}</div>
        ) : (
          <div className={layout.gridClass}>
            <div className={col}>{renderBlocks(page.main)}</div>
            <div className={col}>{renderBlocks(page.side)}</div>
          </div>
        )}
      </div>
    );

    const pageEl = (
      <div
        className={`cv-page ${layout.pageClass}`}
        data-page={i + 1}
        style={cssVars}
      >
        {layout.sidebar ? (
          <>
            <aside className={layout.sidebar.className}>
              {/* Later pages keep the coloured column but not its content, so
                  the band runs the full height of the document. */}
              {i === 0 ? layout.sidebar.node : null}
            </aside>
            <main className="exec-main">
              {i === 0 && layout.header}
              {body}
            </main>
          </>
        ) : (
          <>
            {i === 0 && layout.header}
            {body}
          </>
        )}
      </div>
    );

    if (print) {
      return (
        <div
          key={i}
          className="cv-print-page"
          style={{ breakAfter: i === pages.length - 1 ? 'auto' : 'page' }}
        >
          {pageEl}
        </div>
      );
    }

    return (
      <div
        key={i}
        style={{
          width: Math.round(A4_WIDTH * scale),
          height: Math.round(A4_HEIGHT * scale),
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div
          className={chrome ? 'cv-a4-sheet' : undefined}
          dir="ltr"
          style={{
            width: A4_WIDTH,
            height: A4_HEIGHT,
            overflow: 'hidden',
            position: 'relative',
            background: 'var(--cv-body-bg, #ffffff)',
            transform: `scale(${scale})`,
            transformOrigin: dir === 'rtl' ? 'top right' : 'top left',
            ...cssVars,
          }}
        >
          {pageEl}
          {chrome && (
            <div className="cv-a4-sheet-badge">
              {i + 1} / {pages.length}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Hidden measurement host: one full, unpaginated render at exact A4
          width. Everything is measured here once, then distributed — the old
          approach re-mounted the whole template once per page per preview. */}
      <div
        ref={hostRef}
        aria-hidden
        style={{
          position: 'fixed',
          insetInlineStart: -99999,
          top: 0,
          width: A4_WIDTH,
          visibility: 'hidden',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        {/* `height: auto` lets the content run past one page here — the whole
            point is to see its natural full height. */}
        <div className={`cv-page ${layout.pageClass}`} style={{ ...cssVars, height: 'auto' }}>
          {layout.sidebar ? (
            <>
              <aside className={layout.sidebar.className}>{layout.sidebar.node}</aside>
              <main className="exec-main">
                <div data-measure-header>{layout.header}</div>
                <div className={layout.bodyClass} data-measure-body>
                  <div data-measure-col="lead">{renderBlocks(layout.lead, true)}</div>
                  <div className={col} data-measure-col="main">
                    {renderBlocks([...layout.main, ...layout.side], true)}
                  </div>
                </div>
              </main>
            </>
          ) : (
            <>
              <div data-measure-header>{layout.header}</div>
              <div className={layout.bodyClass} data-measure-body>
                <div data-measure-col="lead">{renderBlocks(layout.lead, true)}</div>
                {layout.singleColumn || !layout.gridClass ? (
                  <div className={col} data-measure-col="main">
                    {renderBlocks([...layout.main, ...layout.side], true)}
                  </div>
                ) : (
                  <div className={layout.gridClass}>
                    <div className={col} data-measure-col="main">
                      {renderBlocks(layout.main, true)}
                    </div>
                    <div className={col} data-measure-col="side">
                      {renderBlocks(layout.side, true)}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {pages.map(renderPage)}
    </>
  );
}
