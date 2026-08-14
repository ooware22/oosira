import {
  DocumentTextIcon,
  BoltIcon,
  RocketLaunchIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

/**
 * The icon for a plan, chosen by its `icon_type` column.
 *
 * One map rather than a ternary at each render site: the pricing page, the
 * landing modal, the dashboard and the admin list all draw the same plans, and
 * four independent `icon_type === 'sparkles' ? … : …` checks meant every plan
 * past the second one silently reused an earlier plan's icon.
 *
 * Keys are stable strings stored in the database, so adding a plan style is a
 * row edit plus one entry here.
 */
const ICONS = {
  document: DocumentTextIcon,
  bolt: BoltIcon,
  rocket: RocketLaunchIcon,
  sparkles: SparklesIcon,
} as const;

export type PlanIconType = keyof typeof ICONS;

/** The icon_type values offered in the admin editor. */
export const PLAN_ICON_TYPES = Object.keys(ICONS) as PlanIconType[];

export default function PlanIcon({
  type,
  className = 'w-6 h-6',
}: {
  type?: string | null;
  className?: string;
}) {
  // An unrecognised value falls back to the neutral document rather than
  // rendering nothing, which would collapse the heading layout.
  const Icon = ICONS[(type as PlanIconType) ?? 'document'] ?? DocumentTextIcon;
  return <Icon className={className} />;
}
