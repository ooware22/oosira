'use client';

import { Candidate } from '../data';
import { CVStyleConfig } from './styleConfig';
import { CVLayout } from './blocks';
import { Translate } from './types';
import { CVClassique, buildClassiqueLayout } from './CVClassique';
import { CVIngenieur, buildIngenieurLayout } from './CVIngenieur';
import { CVExecutif, buildExecutifLayout } from './CVExecutif';
import { CVMedical, buildMedicalLayout } from './CVMedical';
import { CVTech, buildTechLayout } from './CVTech';

export { CVClassique } from './CVClassique';
export { CVIngenieur } from './CVIngenieur';
export { CVExecutif } from './CVExecutif';
export { CVMedical } from './CVMedical';
export { CVTech } from './CVTech';

type LayoutBuilder = (
  data: Candidate,
  config: CVStyleConfig | undefined,
  t: Translate,
  language: string,
) => CVLayout;

/** Template id → block-layout builder, consumed by <PaginatedCV>. */
export const LAYOUT_BUILDERS: Record<number, LayoutBuilder> = {
  1: buildClassiqueLayout,
  2: buildIngenieurLayout,
  3: buildExecutifLayout,
  4: buildMedicalLayout,
  5: buildTechLayout,
};

/** Template id → single-page component (unpaginated continuous render). */
export const TEMPLATE_COMPONENTS: Record<
  number,
  (props: { data: Candidate; config?: CVStyleConfig }) => React.ReactElement
> = {
  1: CVClassique,
  2: CVIngenieur,
  3: CVExecutif,
  4: CVMedical,
  5: CVTech,
};

export function getLayoutBuilder(templateId: number): LayoutBuilder {
  return LAYOUT_BUILDERS[templateId] || LAYOUT_BUILDERS[1];
}
