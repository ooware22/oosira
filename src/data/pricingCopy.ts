/**
 * Fallback pricing copy, shown whenever `GET /subscriptions/plans/` is
 * unreachable. Shared by `src/app/pricing/page.tsx` and
 * `src/components/landing/LandingContent.tsx` — they used to each hardcode
 * their own near-duplicate copy of this, which had already drifted apart
 * (different wording, and both listed "premium templates" / "advanced color
 * palettes" as Pro-only even though every user already has all 5 templates
 * and all 20 palettes — nothing in the app actually gates them).
 *
 * The bullets below only claim what `useSubscription` actually enforces:
 * PDF download quota and OCR import quota. If the backend `PlanFeature` rows
 * (edited via Django admin) still list the old claims, update them there —
 * this file only controls what's shown when that fetch fails.
 */

export interface PricingFeature {
  text_en: string;
  text_fr: string;
  text_ar: string;
  is_included: boolean;
}

export interface PricingPlan {
  code: 'free' | 'pro';
  price_da: number;
  is_popular: boolean;
  icon_type: 'document' | 'sparkles';
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

export const FALLBACK_PLANS: PricingPlan[] = [
  {
    code: 'free',
    price_da: 0,
    is_popular: false,
    icon_type: 'document',
    name_en: 'Basic',
    name_fr: 'Basique',
    name_ar: 'أساسي',
    desc_en: 'Perfect for starting your job search.',
    desc_fr: "Parfait pour commencer votre recherche d'emploi.",
    desc_ar: 'مثالي لبدء البحث عن عمل.',
    features: [
      { text_en: 'Build professional CVs', text_fr: 'Créer des CV professionnels', text_ar: 'بناء سير ذاتية احترافية', is_included: true },
      { text_en: 'All templates and color palettes', text_fr: 'Tous les modèles et palettes de couleurs', text_ar: 'جميع القوالب ولوحات الألوان', is_included: true },
      { text_en: '5 PDF downloads per month', text_fr: '5 téléchargements PDF par mois', text_ar: '5 تنزيلات PDF شهرياً', is_included: true },
      { text_en: '1 free AI (OCR) import trial', text_fr: "1 essai gratuit d'importation par IA (OCR)", text_ar: 'تجربة واحدة مجانية للاستيراد بالذكاء الاصطناعي (OCR)', is_included: true },
    ],
  },
  {
    code: 'pro',
    price_da: 350,
    is_popular: true,
    icon_type: 'sparkles',
    name_en: 'Pro',
    name_fr: 'Pro',
    name_ar: 'برو',
    desc_en: 'For frequent applications and unlimited exports.',
    desc_fr: 'Pour les candidatures fréquentes et les exports illimités.',
    desc_ar: 'للتقديمات المتكررة والتصدير غير المحدود.',
    billed_text_en: 'Billed 4800 DA yearly',
    billed_text_fr: 'Facturé 4800 DA par an',
    billed_text_ar: 'يتم فوترتها 4800 دج سنويا',
    features: [
      { text_en: 'Unlimited PDF downloads', text_fr: 'Téléchargements PDF illimités', text_ar: 'تنزيلات PDF غير محدودة', is_included: true },
      { text_en: 'Unlimited AI (OCR) resume import', text_fr: 'Importation illimitée de CV par IA (OCR)', text_ar: 'استيراد غير محدود للسيرة الذاتية بالذكاء الاصطناعي (OCR)', is_included: true },
      { text_en: 'All templates and color palettes', text_fr: 'Tous les modèles et palettes de couleurs', text_ar: 'جميع القوالب ولوحات الألوان', is_included: true },
      { text_en: 'Priority support', text_fr: 'Support prioritaire', text_ar: 'دعم ذو أولوية', is_included: true },
    ],
  },
];
