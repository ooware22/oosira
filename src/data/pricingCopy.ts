/**
 * Shapes for the plan catalogue returned by `GET /subscriptions/plans/`.
 *
 * Types only, deliberately. This file used to also export FALLBACK_PLANS with
 * hardcoded amounts, shown whenever that fetch failed — and those amounts drifted:
 * it advertised 350 DA/month above the line "Facturé 4800 DA par an" (350 × 12 is
 * 4200), while the backend charged something else again. A price that lives in
 * two places is a price that will eventually disagree with itself, so the plans
 * table is now the only one. When the fetch fails, surfaces show a loading or
 * error state rather than a number nobody can be sure of.
 */

export interface PricingFeature {
  text_en: string;
  text_fr: string;
  text_ar: string;
  is_included: boolean;
}

export interface PricingPlan {
  code: string;
  price_da: number;
  /** Days of access bought; null on the free plan, which never expires. */
  duration_days: number | null;
  is_popular: boolean;
  icon_type: 'document' | 'sparkles';
  order: number;
  name_en: string;
  name_fr: string;
  name_ar: string;
  desc_en: string;
  desc_fr: string;
  desc_ar: string;
  billed_text_en?: string;
  billed_text_fr?: string;
  billed_text_ar?: string;
  features: PricingFeature[];
}

/** Pick the field for the active language, falling back through fr then en. */
export function planField(
  plan: Record<string, unknown> | null | undefined,
  base: string,
  language: string,
): string {
  if (!plan) return '';
  return (
    (plan[`${base}_${language}`] as string) ||
    (plan[`${base}_fr`] as string) ||
    (plan[`${base}_en`] as string) ||
    ''
  );
}
