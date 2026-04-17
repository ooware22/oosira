// ═══════════════════════════════════════════════════
// CV Style Configuration — Dynamic theming system
// Every visual property is customizable to maximize
// uniqueness across user-generated CVs.
// ═══════════════════════════════════════════════════

export interface CVStyleConfig {
  // ── Colors ──
  primaryColor: string; // Main accent (header bg, section titles, badges)
  accentColor: string; // Secondary accent (highlights, links, date labels)
  headerBg: string; // Header background
  headerText: string; // Header text color
  bodyBg: string; // Body background
  bodyText: string; // Body text color
  mutedText: string; // Secondary text (descriptions, subheadings)
  borderColor: string; // Borders and dividers
  skillBg: string; // Skill pill/tag background
  skillText: string; // Skill pill/tag text
  sidebarBg: string; // Sidebar bg (for Cadre template)
  sidebarText: string; // Sidebar text (for Cadre template)

  // ── Typography ──
  headingFont: string; // Font for names and section titles
  bodyFont: string; // Font for body text
  fontSize: "compact" | "default" | "large";

  // ── Layout & Shape ──
  borderRadius: "none" | "small" | "medium" | "rounded";
  sectionDivider: "solid" | "double" | "gradient" | "dots" | "none";
  skillStyle: "pill" | "tag" | "outline" | "bar";
  headerLayout: "default" | "centered" | "minimal";
  layoutCols: "1" | "1.4fr 1fr" | "1fr 1fr"; // Grid template columns

  // ── Spacing ──
  spacing: "tight" | "default" | "relaxed";

  // ── Ordering ──
  mainOrder: string[]; // e.g. ['experiences', 'formations']
  sideOrder: string[]; // e.g. ['competences', 'langues', 'logiciels']
}

// ── Font Options ──
export const FONT_OPTIONS = [
  {
    id: "dm-sans",
    name: "DM Sans",
    value: "'DM Sans', sans-serif",
    category: "modern",
  },
  {
    id: "inter",
    name: "Inter",
    value: "'Inter', sans-serif",
    category: "modern",
  },
  {
    id: "outfit",
    name: "Outfit",
    value: "'Outfit', sans-serif",
    category: "modern",
  },
  {
    id: "raleway",
    name: "Raleway",
    value: "'Raleway', sans-serif",
    category: "modern",
  },
  {
    id: "poppins",
    name: "Poppins",
    value: "'Poppins', sans-serif",
    category: "modern",
  },
  { id: "lora", name: "Lora", value: "'Lora', serif", category: "classic" },
  {
    id: "libre-baskerville",
    name: "Libre Baskerville",
    value: "'Libre Baskerville', serif",
    category: "classic",
  },
  {
    id: "playfair",
    name: "Playfair Display",
    value: "'Playfair Display', serif",
    category: "classic",
  },
  {
    id: "merriweather",
    name: "Merriweather",
    value: "'Merriweather', serif",
    category: "classic",
  },
  {
    id: "ibm-plex-mono",
    name: "IBM Plex Mono",
    value: "'IBM Plex Mono', monospace",
    category: "tech",
  },
  {
    id: "source-code",
    name: "Source Code Pro",
    value: "'Source Code Pro', monospace",
    category: "tech",
  },
  {
    id: "jetbrains",
    name: "JetBrains Mono",
    value: "'JetBrains Mono', monospace",
    category: "tech",
  },
];

// ── Color Palette Presets ──
export const COLOR_PALETTES = [
  {
    id: "navy",
    name: "Navy Classic",
    primary: "#1B3A6B",
    accent: "#2563EB",
    headerBg: "#1B3A6B",
    headerText: "#ffffff",
  },
  {
    id: "midnight",
    name: "Midnight",
    primary: "#0F172A",
    accent: "#3B82F6",
    headerBg: "#0F172A",
    headerText: "#ffffff",
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    primary: "#1E40AF",
    accent: "#06B6D4",
    headerBg: "#1E40AF",
    headerText: "#ffffff",
  },
  {
    id: "emerald",
    name: "Emerald",
    primary: "#064E3B",
    accent: "#10B981",
    headerBg: "#064E3B",
    headerText: "#ffffff",
  },
  {
    id: "forest",
    name: "Forest",
    primary: "#1A3C2A",
    accent: "#22C55E",
    headerBg: "#1A3C2A",
    headerText: "#ffffff",
  },
  {
    id: "wine",
    name: "Wine Red",
    primary: "#7F1D1D",
    accent: "#DC2626",
    headerBg: "#7F1D1D",
    headerText: "#ffffff",
  },
  {
    id: "burgundy",
    name: "Burgundy",
    primary: "#4C1D37",
    accent: "#E11D48",
    headerBg: "#4C1D37",
    headerText: "#ffffff",
  },
  {
    id: "royal",
    name: "Royal Purple",
    primary: "#3B0764",
    accent: "#A855F7",
    headerBg: "#3B0764",
    headerText: "#ffffff",
  },
  {
    id: "plum",
    name: "Plum",
    primary: "#581C87",
    accent: "#C084FC",
    headerBg: "#581C87",
    headerText: "#ffffff",
  },
  {
    id: "charcoal",
    name: "Charcoal",
    primary: "#1F2937",
    accent: "#6B7280",
    headerBg: "#1F2937",
    headerText: "#ffffff",
  },
  {
    id: "slate",
    name: "Slate",
    primary: "#334155",
    accent: "#64748B",
    headerBg: "#334155",
    headerText: "#ffffff",
  },
  {
    id: "copper",
    name: "Copper",
    primary: "#78350F",
    accent: "#D97706",
    headerBg: "#78350F",
    headerText: "#ffffff",
  },
  {
    id: "teal",
    name: "Teal",
    primary: "#134E4A",
    accent: "#14B8A6",
    headerBg: "#134E4A",
    headerText: "#ffffff",
  },
  {
    id: "indigo",
    name: "Indigo",
    primary: "#312E81",
    accent: "#6366F1",
    headerBg: "#312E81",
    headerText: "#ffffff",
  },
  {
    id: "coral",
    name: "Coral",
    primary: "#9A3412",
    accent: "#F97316",
    headerBg: "#9A3412",
    headerText: "#ffffff",
  },
  {
    id: "rose",
    name: "Rose",
    primary: "#9F1239",
    accent: "#F43F5E",
    headerBg: "#9F1239",
    headerText: "#ffffff",
  },
  {
    id: "sky",
    name: "Sky",
    primary: "#075985",
    accent: "#0EA5E9",
    headerBg: "#075985",
    headerText: "#ffffff",
  },
  {
    id: "github",
    name: "GitHub Dark",
    primary: "#0D1117",
    accent: "#58A6FF",
    headerBg: "#161B22",
    headerText: "#F0F6FC",
  },
  {
    id: "terminal",
    name: "Terminal",
    primary: "#0C0C0C",
    accent: "#00FF41",
    headerBg: "#0C0C0C",
    headerText: "#00FF41",
  },
  {
    id: "dracula",
    name: "Dracula",
    primary: "#282A36",
    accent: "#BD93F9",
    headerBg: "#282A36",
    headerText: "#F8F8F2",
  },
];

// ── Default style configs per template ──
export const TEMPLATE_DEFAULTS: Record<number, CVStyleConfig> = {
  1: {
    // Classique
    primaryColor: "#1B3A6B",
    accentColor: "#2563EB",
    headerBg: "#1B3A6B",
    headerText: "#ffffff",
    bodyBg: "#ffffff",
    bodyText: "#1a1a1a",
    mutedText: "#555555",
    borderColor: "#e5e7eb",
    skillBg: "rgba(37,99,235,0.1)",
    skillText: "#2563EB",
    sidebarBg: "#1A1A2E",
    sidebarText: "#ffffff",
    headingFont: "'Libre Baskerville', serif",
    bodyFont: "'Lora', serif",
    fontSize: "default",
    borderRadius: "small",
    sectionDivider: "solid",
    skillStyle: "pill",
    headerLayout: "default",
    spacing: "default",
    layoutCols: "1fr 1fr",
    mainOrder: ["experiences", "formations"],
    sideOrder: ["competences", "langues", "logiciels"],
  },
  2: {
    // Ingenieur
    primaryColor: "#2C3E50",
    accentColor: "#2563EB",
    headerBg: "#2C3E50",
    headerText: "#ffffff",
    bodyBg: "#ffffff",
    bodyText: "#1a1a1a",
    mutedText: "#555555",
    borderColor: "#e5e7eb",
    skillBg: "rgba(37,99,235,0.1)",
    skillText: "#2563EB",
    sidebarBg: "#1A1A2E",
    sidebarText: "#ffffff",
    headingFont: "'DM Sans', sans-serif",
    bodyFont: "'DM Sans', sans-serif",
    fontSize: "default",
    borderRadius: "small",
    sectionDivider: "solid",
    skillStyle: "bar",
    headerLayout: "default",
    spacing: "default",
    layoutCols: "1.4fr 1fr",
    mainOrder: ["experiences", "formations"],
    sideOrder: ["competences", "langues", "logiciels"],
  },
  3: {
    // Cadre
    primaryColor: "#1A1A2E",
    accentColor: "#2563EB",
    headerBg: "#1A1A2E",
    headerText: "#ffffff",
    bodyBg: "#ffffff",
    bodyText: "#1a1a1a",
    mutedText: "#555555",
    borderColor: "#e5e7eb",
    skillBg: "rgba(37,99,235,0.15)",
    skillText: "#e2e8f0",
    sidebarBg: "#1A1A2E",
    sidebarText: "#ffffff",
    headingFont: "'Raleway', sans-serif",
    bodyFont: "'Raleway', sans-serif",
    fontSize: "default",
    borderRadius: "small",
    sectionDivider: "solid",
    skillStyle: "tag",
    headerLayout: "default",
    spacing: "default",
    layoutCols: "1fr 1fr",
    mainOrder: ["experiences", "formations"],
    sideOrder: ["competences", "langues", "logiciels"],
  },
  4: {
    // Medical
    primaryColor: "#2563EB",
    accentColor: "#60A5FA",
    headerBg: "#ffffff",
    headerText: "#2563EB",
    bodyBg: "#ffffff",
    bodyText: "#1a1a1a",
    mutedText: "#555555",
    borderColor: "#e5e7eb",
    skillBg: "rgba(37,99,235,0.08)",
    skillText: "#2563EB",
    sidebarBg: "#1A1A2E",
    sidebarText: "#ffffff",
    headingFont: "'DM Sans', sans-serif",
    bodyFont: "'DM Sans', sans-serif",
    fontSize: "default",
    borderRadius: "medium",
    sectionDivider: "gradient",
    skillStyle: "pill",
    headerLayout: "centered",
    spacing: "default",
    layoutCols: "1fr 1fr",
    mainOrder: ["experiences", "formations"],
    sideOrder: ["competences", "langues", "logiciels"],
  },
  5: {
    // Tech
    primaryColor: "#0D1117",
    accentColor: "#2563EB",
    headerBg: "#161B22",
    headerText: "#f0f6fc",
    bodyBg: "#0D1117",
    bodyText: "#c9d1d9",
    mutedText: "#8b949e",
    borderColor: "#21262D",
    skillBg: "rgba(37,99,235,0.12)",
    skillText: "#58a6ff",
    sidebarBg: "#0D1117",
    sidebarText: "#c9d1d9",
    headingFont: "'DM Sans', sans-serif",
    bodyFont: "'DM Sans', sans-serif",
    fontSize: "default",
    borderRadius: "small",
    sectionDivider: "solid",
    skillStyle: "tag",
    headerLayout: "default",
    spacing: "default",
    layoutCols: "1.4fr 1fr",
    mainOrder: ["experiences", "formations"],
    sideOrder: ["competences", "langues", "logiciels"],
  },
  6: {
    // Minimaliste
    primaryColor: "#111827",
    accentColor: "#4b5563",
    headerBg: "#ffffff",
    headerText: "#111827",
    bodyBg: "#ffffff",
    bodyText: "#374151",
    mutedText: "#6b7280",
    borderColor: "#e5e7eb",
    skillBg: "#f3f4f6",
    skillText: "#374151",
    sidebarBg: "#ffffff",
    sidebarText: "#374151",
    headingFont: "'Inter', sans-serif",
    bodyFont: "'Inter', sans-serif",
    fontSize: "compact",
    borderRadius: "none",
    sectionDivider: "solid",
    skillStyle: "outline",
    headerLayout: "minimal",
    spacing: "relaxed",
    layoutCols: "1",
    mainOrder: [
      "experiences",
      "formations",
      "competences",
      "langues",
      "logiciels",
    ],
    sideOrder: [],
  },
  7: {
    // Créatif
    primaryColor: "#db2777",
    accentColor: "#ec4899",
    headerBg: "#fdf2f8",
    headerText: "#9d174d",
    bodyBg: "#ffffff",
    bodyText: "#1f2937",
    mutedText: "#4b5563",
    borderColor: "#fce7f3",
    skillBg: "#fdf2f8",
    skillText: "#db2777",
    sidebarBg: "#fdf2f8",
    sidebarText: "#831843",
    headingFont: "'Outfit', sans-serif",
    bodyFont: "'Outfit', sans-serif",
    fontSize: "large",
    borderRadius: "rounded",
    sectionDivider: "gradient",
    skillStyle: "pill",
    headerLayout: "centered",
    spacing: "relaxed",
    layoutCols: "1fr 1fr",
    mainOrder: ["experiences", "formations"],
    sideOrder: ["competences", "langues", "logiciels"],
  },
  8: {
    // Exécutif (Dark)
    primaryColor: "#0f172a",
    accentColor: "#fbbf24",
    headerBg: "#0f172a",
    headerText: "#f8fafc",
    bodyBg: "#1e293b",
    bodyText: "#cbd5e1",
    mutedText: "#94a3b8",
    borderColor: "#334155",
    skillBg: "#334155",
    skillText: "#fbbf24",
    sidebarBg: "#0f172a",
    sidebarText: "#f8fafc",
    headingFont: "'Playfair Display', serif",
    bodyFont: "'DM Sans', sans-serif",
    fontSize: "default",
    borderRadius: "small",
    sectionDivider: "solid",
    skillStyle: "bar",
    headerLayout: "default",
    spacing: "default",
    layoutCols: "1.4fr 1fr",
    mainOrder: ["experiences", "formations"],
    sideOrder: ["competences", "langues", "logiciels"],
  },
  9: {
    // Universitaire
    primaryColor: "#4c1d95",
    accentColor: "#7c3aed",
    headerBg: "#4c1d95",
    headerText: "#ffffff",
    bodyBg: "#ffffff",
    bodyText: "#1e1e1e",
    mutedText: "#525252",
    borderColor: "#ede9fe",
    skillBg: "#ede9fe",
    skillText: "#5b21b6",
    sidebarBg: "#4c1d95",
    sidebarText: "#ffffff",
    headingFont: "'Merriweather', serif",
    bodyFont: "'Merriweather', serif",
    fontSize: "default",
    borderRadius: "small",
    sectionDivider: "solid",
    skillStyle: "tag",
    headerLayout: "centered",
    spacing: "relaxed",
    layoutCols: "1",
    mainOrder: [
      "formations",
      "experiences",
      "competences",
      "langues",
      "logiciels",
    ],
    sideOrder: [],
  },
  10: {
    // Tech & Code
    primaryColor: "#14b8a6",
    accentColor: "#0d9488",
    headerBg: "#14b8a6",
    headerText: "#ffffff",
    bodyBg: "#ffffff",
    bodyText: "#1f2937",
    mutedText: "#4b5563",
    borderColor: "#e5e7eb",
    skillBg: "#ccfbf1",
    skillText: "#0f766e",
    sidebarBg: "#f0fdfa",
    sidebarText: "#115e59",
    headingFont: "'JetBrains Mono', monospace",
    bodyFont: "'Inter', sans-serif",
    fontSize: "compact",
    borderRadius: "rounded",
    sectionDivider: "dots",
    skillStyle: "tag",
    headerLayout: "minimal",
    spacing: "tight",
    layoutCols: "1.4fr 1fr",
    mainOrder: ["experiences", "formations"],
    sideOrder: ["competences", "langues", "logiciels"],
  },
};

// ── Helper: convert hex to rgba ──
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Helper: generate CSS variables from config ──
export function styleToCSSVars(config: CVStyleConfig): Record<string, string> {
  const radiusMap = {
    none: "0px",
    small: "3px",
    medium: "6px",
    rounded: "12px",
  };
  const fontSizeMap = { compact: "11px", default: "12px", large: "13px" };
  const spacingMap = { tight: "14px", default: "18px", relaxed: "24px" };
  const layoutColMap = {
    "1": "1fr",
    "1fr 1fr": "1fr 1fr",
    "1.4fr 1fr": "1.4fr 1fr",
  };

  return {
    "--cv-primary": config.primaryColor,
    "--cv-accent": config.accentColor,
    "--cv-header-bg": config.headerBg,
    "--cv-header-text": config.headerText,
    "--cv-body-bg": config.bodyBg,
    "--cv-body-text": config.bodyText,
    "--cv-muted": config.mutedText,
    "--cv-border": config.borderColor,
    "--cv-skill-bg": config.skillBg,
    "--cv-skill-text": config.skillText,
    "--cv-sidebar-bg": config.sidebarBg,
    "--cv-sidebar-text": config.sidebarText,
    "--cv-heading-font": config.headingFont,
    "--cv-body-font": config.bodyFont,
    "--cv-radius": radiusMap[config.borderRadius],
    "--cv-font-size": fontSizeMap[config.fontSize],
    "--cv-spacing": spacingMap[config.spacing],
    "--cv-accent-10": hexToRgba(config.accentColor, 0.1),
    "--cv-accent-15": hexToRgba(config.accentColor, 0.15),
    "--cv-accent-08": hexToRgba(config.accentColor, 0.08),
    "--cv-accent-04": hexToRgba(config.accentColor, 0.04),
    "--cv-primary-10": hexToRgba(config.primaryColor, 0.1),
    "--cv-primary-15": hexToRgba(config.primaryColor, 0.15),
    "--cv-layout-cols": layoutColMap[config.layoutCols] || "1fr 1fr",
  };
}

// ── Helper: apply palette to a config ──
export function applyPalette(
  config: CVStyleConfig,
  palette: (typeof COLOR_PALETTES)[number],
): CVStyleConfig {
  return {
    ...config,
    primaryColor: palette.primary,
    accentColor: palette.accent,
    headerBg: palette.headerBg,
    headerText: palette.headerText,
    skillBg: hexToRgba(palette.accent, 0.1),
    skillText: palette.accent,
    sidebarBg: palette.primary,
    sidebarText: palette.headerText,
  };
}

// ── Helper: generate a completely random style config based on a base template ──
export function getRandomStyleConfig(baseConfig: CVStyleConfig): CVStyleConfig {
  const randomItem = <T>(arr: T[]): T =>
    arr[Math.floor(Math.random() * arr.length)];

  const palette = randomItem(COLOR_PALETTES);
  const headingFont = randomItem(FONT_OPTIONS);
  const bodyFont = randomItem(FONT_OPTIONS);
  const fontSizes: CVStyleConfig["fontSize"][] = [
    "compact",
    "default",
    "large",
  ];
  const radiuses: CVStyleConfig["borderRadius"][] = [
    "none",
    "small",
    "medium",
    "rounded",
  ];
  const dividers: CVStyleConfig["sectionDivider"][] = [
    "solid",
    "double",
    "gradient",
    "dots",
    "none",
  ];
  const skillStyles: CVStyleConfig["skillStyle"][] = [
    "pill",
    "tag",
    "outline",
    "bar",
  ];
  const headerLayouts: CVStyleConfig["headerLayout"][] = [
    "default",
    "centered",
    "minimal",
  ];
  const layoutCols: CVStyleConfig["layoutCols"][] = [
    "1",
    "1.4fr 1fr",
    "1fr 1fr",
  ];
  const spacings: CVStyleConfig["spacing"][] = ["tight", "default", "relaxed"];

  return {
    ...baseConfig,
    primaryColor: palette.primary,
    accentColor: palette.accent,
    headerBg: palette.headerBg,
    headerText: palette.headerText,
    skillBg: hexToRgba(palette.accent, 0.1),
    skillText: palette.accent,
    sidebarBg: palette.primary,
    sidebarText: palette.headerText,
    headingFont: headingFont.value,
    bodyFont: bodyFont.value,
    fontSize: randomItem(fontSizes),
    borderRadius: randomItem(radiuses),
    sectionDivider: randomItem(dividers),
    skillStyle: randomItem(skillStyles),
    headerLayout: randomItem(headerLayouts),
    layoutCols: randomItem(layoutCols),
    spacing: randomItem(spacings),
  };
}
