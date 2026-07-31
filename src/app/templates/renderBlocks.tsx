import React, { Fragment } from 'react';
import { CVBlock } from './blocks';

/**
 * Re-wrap a run of blocks in their group / inner wrappers.
 *
 * Two levels are needed because a section title sits inside `.cv-section-col`
 * but *outside* `.cv-timeline` — and the timeline rail has to restart on every
 * page it appears on, not stretch across a break.
 *
 * `measure` stamps each block with `data-measure` so the pagination engine can
 * read its height from the hidden measurement pass.
 */
export function renderBlocks(blocks: CVBlock[], measure = false): React.ReactNode {
  const outer: { group: string; wrapperClass?: string; items: CVBlock[] }[] = [];
  for (const b of blocks) {
    const last = outer[outer.length - 1];
    if (last && last.group === b.group) last.items.push(b);
    else outer.push({ group: b.group, wrapperClass: b.wrapperClass, items: [b] });
  }

  const node = (b: CVBlock) => {
    const extra: Record<string, unknown> = { key: b.id };
    if (measure) extra['data-measure'] = b.id;
    return React.cloneElement(b.node, extra as unknown as React.Attributes);
  };

  return outer.map((o, oi) => {
    const runs: { innerClass?: string; items: CVBlock[] }[] = [];
    for (const b of o.items) {
      const last = runs[runs.length - 1];
      if (last && last.innerClass === b.innerClass) last.items.push(b);
      else runs.push({ innerClass: b.innerClass, items: [b] });
    }

    const content = runs.map((r, ri) =>
      r.innerClass ? (
        <div key={ri} className={r.innerClass}>
          {r.items.map(node)}
        </div>
      ) : (
        <Fragment key={ri}>{r.items.map(node)}</Fragment>
      ),
    );

    return o.wrapperClass ? (
      <div key={oi} className={o.wrapperClass}>
        {content}
      </div>
    ) : (
      <Fragment key={oi}>{content}</Fragment>
    );
  });
}
