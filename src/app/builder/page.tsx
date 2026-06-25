"use client";

import { useState, useCallback, useRef, useEffect, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  candidates,
  Candidate,
  Formation,
  Experience,
  Langue,
  TEMPLATE_NAMES,
} from "../data";
import {
  CVClassique,
  CVIngenieur,
  CVExecutif,
  CVMedical,
  CVTech,
} from "../templates";
import {
  CVStyleConfig,
  TEMPLATE_DEFAULTS,
  applyPalette,
  styleToCSSVars,
  COLOR_PALETTES,
  FONT_OPTIONS,
  getRandomStyleConfig,
  hexToRgba,
} from "../templates/styleConfig";
import TemplateThumbnail from "@/components/TemplateThumbnail";
import {
  CogIcon,
  ChartBarIcon,
  ClipboardDocumentIcon,
  CommandLineIcon,
  HeartIcon,
  MapPinIcon,
  UserIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  SparklesIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  DocumentPlusIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  Squares2X2Icon,
  SwatchIcon,
  MinusIcon,
  BookmarkIcon,
  LinkIcon,
  LockClosedIcon,
  ArrowPathIcon,
  BellIcon,
  CloudArrowUpIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/app/i18n/LanguageContext";
import { ThemeToggle, LanguageToggle } from "@/components/Toggles";
import { useAuth } from "@/app/auth/AuthContext";
import { apiFetch, getToken } from "@/api/apiClient";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { trackDownload } from "@/store/slices/statsSlice";
import { fetchDrafts } from "@/store/slices/cvsSlice";
import {
  useSubscription,
  invalidateSubscriptionCache,
} from "@/app/hooks/useSubscription";
import AutocompleteInput from "@/components/AutocompleteInput";
import PinchZoomPreview from "@/components/PinchZoomPreview";
import { SUGGESTIONS, getCertificationsForLanguage } from "@/data/cvSuggestions";

/* -- Constants -- */
const CANDIDATE_ICONS: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  cog: CogIcon,
  "chart-bar": ChartBarIcon,
  "clipboard-document": ClipboardDocumentIcon,
  "command-line": CommandLineIcon,
  heart: HeartIcon,
};

const STEPS = [
  { id: "template", icon: Squares2X2Icon },
  { id: "personal", icon: UserIcon },
  { id: "summary", icon: DocumentTextIcon },
  { id: "experience", icon: BriefcaseIcon },
  { id: "education", icon: AcademicCapIcon },
  { id: "skills", icon: SparklesIcon },
  { id: "design", icon: SwatchIcon },
  { id: "preview", icon: EyeIcon },
];

const STEP_LABELS: Record<string, Record<string, string>> = {
  template: { en: "Template", fr: "Modèle", ar: "القالب" },
  personal: {
    en: "Personal Info",
    fr: "Informations",
    ar: "المعلومات الشخصية",
  },
  summary: { en: "Summary", fr: "Résumé", ar: "الملخص" },
  experience: { en: "Experience", fr: "Expériences", ar: "الخبرات" },
  education: { en: "Education", fr: "Formations", ar: "التعليم" },
  skills: { en: "Skills & More", fr: "Compétences", ar: "المهارات" },
  design: { en: "Design", fr: "Design", ar: "التصميم" },
  preview: { en: "Preview", fr: "Aperçu", ar: "معاينة" },
};

/* -- Animation variants -- */
const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
  }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

/* -- Input component -- */
function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  list,
  isTemplateData,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  list?: string;
  isTemplateData?: boolean;
  id?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="block text-[11px] lg:text-[15px] font-bold text-txt-muted uppercase tracking-wider">
          {label}
        </label>
        {isTemplateData && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wide animate-pulse">
            <ExclamationTriangleIcon className="w-2.5 h-2.5" />
            Template
          </span>
        )}
      </div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        list={list}
        className={`w-full bg-surface border rounded-xl px-4 py-3 lg:py-3.5 text-sm lg:text-lg text-txt outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-txt-dim ${
          isTemplateData ? 'border-amber-400/50 ring-1 ring-amber-400/30 bg-amber-500/5' : 'border-border'
        }`}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] lg:text-[13px] font-bold text-txt-muted uppercase tracking-wider">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface border border-border rounded-xl px-4 py-3 lg:py-3.5 text-sm lg:text-lg text-txt outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      >
        <option value="">{placeholder || "Select..."}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  isTemplateData,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  isTemplateData?: boolean;
  id?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="block text-[11px] lg:text-[13px] font-bold text-txt-muted uppercase tracking-wider">
          {label}
        </label>
        {isTemplateData && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wide animate-pulse">
            <ExclamationTriangleIcon className="w-2.5 h-2.5" />
            Template
          </span>
        )}
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full bg-surface border rounded-xl px-4 py-3 lg:py-3.5 text-sm lg:text-lg text-txt outline-none resize-y transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-txt-dim font-body ${
          isTemplateData ? 'border-amber-400/50 ring-1 ring-amber-400/30 bg-amber-500/5' : 'border-border'
        }`}
      />
    </div>
  );
}

/* -- Main Builder Component -- */
export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>}>
      <BuilderPageContent />
    </Suspense>
  );
}

function BuilderPageContent() {
  const { t, dir, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const {
    subscription,
    isPro,
    canDownload,
    canOcr,
    refresh: refreshSubscription,
  } = useSubscription();
  const [[currentStep, direction], setStep] = useState(() => {
    const stepParam = searchParams.get("step");
    return [stepParam ? Number(stepParam) : 0, 0];
  });
  const [activeCandidate, setActiveCandidate] = useState(-1);
  const [activeTemplate, setActiveTemplate] = useState(1);
  const [styleConfig, setStyleConfig] = useState<CVStyleConfig>(
    TEMPLATE_DEFAULTS[1],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedCvId, setSavedCvId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [expandedExpLinks, setExpandedExpLinks] = useState<number[]>([]);
  const [expandedFormLinks, setExpandedFormLinks] = useState<number[]>([]);

  const [shuffledTemplates, setShuffledTemplates] = useState<any[] | null>(
    null,
  );
  const [shuffledPalettes, setShuffledPalettes] = useState<any[] | null>(null);

  useEffect(() => {
    const _templateThumbs = [
      { id: 1, name: "Classique Pro", color: "#1B3A6B", style: "elegant" },
      { id: 2, name: "Ingenieur", color: "#2C3E50", style: "technical" },
      { id: 3, name: "Executif", color: "#1e293b", style: "executive" },
      { id: 4, name: "Medical", color: "#2563EB", style: "medical" },
      { id: 5, name: "Tech & IT", color: "#0D1117", style: "tech" },
    ];
    setShuffledTemplates([..._templateThumbs].sort(() => Math.random() - 0.5));
    setShuffledPalettes([...COLOR_PALETTES].sort(() => Math.random() - 0.5));

    const editId = searchParams.get("id");
    if (editId && isAuthenticated) {
      apiFetch(`/cvs/${editId}/`)
        .then((data) => {
          if (data.cvData && Object.keys(data.cvData).length > 0)
            setFormData(data.cvData);
          if (data.styleConfig) {
            setStyleConfig({
              ...TEMPLATE_DEFAULTS[data.templateId || 1],
              ...data.styleConfig,
            });
          }
          if (data.templateId) setActiveTemplate(data.templateId);
          if (data.title && data.title !== "Untitled CV")
            setCvTitle(data.title);
          if (data.reminderDate)
            setReminderDate(data.reminderDate.split("T")[0]);
          setSavedCvId(data.id);
        })
        .catch((err) => console.error("Error loading CV:", err));
    } else if (!editId) {
      // Try to restore pending CV from localStorage (e.g. user went to login/register and came back)
      const pendingRaw = localStorage.getItem('oosira_pending_cv');
      if (pendingRaw) {
        try {
          const pending = JSON.parse(pendingRaw);
          if (pending.formData && (pending.formData.prenom || pending.formData.nom || pending.formData.email || pending.formData.experiences?.length)) {
            setFormData(pending.formData);
            if (pending.activeTemplate != null) setActiveTemplate(pending.activeTemplate);
            if (pending.styleConfig) setStyleConfig(pending.styleConfig);
            if (pending.cvTitle) setCvTitle(pending.cvTitle);
            // If authenticated, clear localStorage (it was saved to backend during login/register)
            if (isAuthenticated) {
              localStorage.removeItem('oosira_pending_cv');
            }
            return; // Skip random template since we restored
          }
        } catch {
          localStorage.removeItem('oosira_pending_cv');
        }
      }
      // Randomize initial template and style when entering the builder page
      const templateKeys = Object.keys(TEMPLATE_DEFAULTS).map(Number);
      const randomTemplateId =
        templateKeys[Math.floor(Math.random() * templateKeys.length)];
      setActiveTemplate(randomTemplateId);
      setStyleConfig(getRandomStyleConfig(TEMPLATE_DEFAULTS[randomTemplateId]));
    }
  }, [searchParams, isAuthenticated]);


  const [cvTitle, setCvTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("");

  const [formData, setFormData] = useState<Candidate>({
    id: -1,
    prenom: "",
    nom: "",
    titre: "",
    email: "",
    telephone: "",
    ville: "",
    linkedin: "",
    accroche: "",
    formations: [],
    experiences: [],
    competences: [],
    langues: [],
    logiciels: [],
    iconName: "document",
    cardColor: "#64748b",
    recommendedTemplate: 1,
  });
  const [newSkill, setNewSkill] = useState("");
  const [newLogiciel, setNewLogiciel] = useState("");

  // ── Template Data Snapshot (warns users about pre-filled data) ──
  const [templateSnapshot, setTemplateSnapshot] = useState<Candidate | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [ecolesList, setEcolesList] = useState<string[]>([]);
  const [ecolesData, setEcolesData] = useState<{ [key: string]: string[] }>({
    lycee: [],
    univ: [],
    institut: [],
    formation: [],
    prive: [],
  });
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewZoom, setPreviewZoom] = useState(0.75);
  const [sidePreviewZoom, setSidePreviewZoom] = useState(0.9);
  const [sidebarWidth, setSidebarWidth] = useState(typeof window !== 'undefined' ? Math.floor(window.innerWidth / 2) : 600);
  const isDraggingRef = useRef(false);
  const cvMeasureRef = useRef<HTMLDivElement>(null);
  const [totalPages, setTotalPages] = useState(1);
  const A4_WIDTH = 794; // px at 96dpi
  const A4_HEIGHT = 1123; // px at 96dpi
  // Page margins: bottom margin on every page, top margin on pages 2+
  const PAGE_MARGIN = 40; // ~15mm
  // Content that fits on page 1 (no top margin, has bottom margin)
  const FIRST_PAGE_CONTENT = A4_HEIGHT - PAGE_MARGIN;
  // Content that fits on pages 2+ (top + bottom margin)
  const OTHER_PAGE_CONTENT = A4_HEIGHT - 2 * PAGE_MARGIN;

  // ── CV Validation Warnings (yellow badges for missing fields) ──
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());

  const cvWarnings = useMemo(() => {
    const hasContent = formData.prenom || formData.nom || formData.email ||
      formData.experiences.length > 0 || formData.formations.length > 0;
    if (!hasContent) return [];

    type Warning = { id: string; label: Record<string, string>; step: number; severity: 'critical' | 'important' };
    const warnings: Warning[] = [];

    // ── Step 1: Personal Info ──
    if (!formData.prenom && !formData.nom) {
      warnings.push({ id: 'name', label: { en: 'Name missing', fr: 'Nom manquant', ar: 'الاسم مفقود' }, step: 1, severity: 'critical' });
    }
    if (!formData.email) {
      warnings.push({ id: 'email', label: { en: 'Email missing', fr: 'Email manquant', ar: 'البريد مفقود' }, step: 1, severity: 'important' });
    }
    if (!formData.titre) {
      warnings.push({ id: 'titre', label: { en: 'Job title missing', fr: 'Titre manquant', ar: 'المسمى الوظيفي مفقود' }, step: 1, severity: 'important' });
    }
    if (!formData.telephone) {
      warnings.push({ id: 'phone', label: { en: 'Phone missing', fr: 'Téléphone manquant', ar: 'الهاتف مفقود' }, step: 1, severity: 'important' });
    }
    if (!formData.ville) {
      warnings.push({ id: 'city', label: { en: 'City missing', fr: 'Ville manquante', ar: 'المدينة مفقودة' }, step: 1, severity: 'important' });
    }

    // ── Step 2: Summary ──
    if (!formData.accroche?.trim()) {
      warnings.push({ id: 'accroche', label: { en: 'Summary empty', fr: 'Résumé vide', ar: 'الملخص فارغ' }, step: 2, severity: 'important' });
    }

    // ── Step 3: Experiences ──
    if (formData.experiences.length === 0) {
      warnings.push({ id: 'no-exp', label: { en: 'No experience added', fr: 'Aucune expérience', ar: 'لا توجد خبرة' }, step: 3, severity: 'critical' });
    } else {
      const missingDates = formData.experiences.filter(exp => !exp.dateDebut && !exp.dateFin);
      if (missingDates.length > 0) {
        warnings.push({ id: 'exp-dates', label: { en: `${missingDates.length} exp. missing dates`, fr: `${missingDates.length} exp. sans dates`, ar: `${missingDates.length} خبرات بدون تواريخ` }, step: 3, severity: 'important' });
      }
      const missingPoste = formData.experiences.filter(exp => !exp.poste);
      if (missingPoste.length > 0) {
        warnings.push({ id: 'exp-titles', label: { en: `${missingPoste.length} exp. missing title`, fr: `${missingPoste.length} exp. sans poste`, ar: `${missingPoste.length} خبرات بدون منصب` }, step: 3, severity: 'important' });
      }
      const missingCompany = formData.experiences.filter(exp => !exp.entreprise);
      if (missingCompany.length > 0) {
        warnings.push({ id: 'exp-company', label: { en: `${missingCompany.length} exp. missing company`, fr: `${missingCompany.length} exp. sans entreprise`, ar: `${missingCompany.length} خبرات بدون شركة` }, step: 3, severity: 'important' });
      }
      const missingDesc = formData.experiences.filter(exp => !exp.description?.trim());
      if (missingDesc.length > 0) {
        warnings.push({ id: 'exp-desc', label: { en: `${missingDesc.length} exp. no description`, fr: `${missingDesc.length} exp. sans description`, ar: `${missingDesc.length} خبرات بدون وصف` }, step: 3, severity: 'important' });
      }
    }

    // ── Step 4: Education ──
    if (formData.formations.length === 0) {
      warnings.push({ id: 'no-edu', label: { en: 'No education', fr: 'Aucune formation', ar: 'لا يوجد تعليم' }, step: 4, severity: 'important' });
    } else {
      const missingDiplome = formData.formations.filter(f => !f.diplome);
      if (missingDiplome.length > 0) {
        warnings.push({ id: 'edu-diploma', label: { en: `${missingDiplome.length} edu. missing diploma`, fr: `${missingDiplome.length} form. sans diplôme`, ar: `${missingDiplome.length} تعليم بدون شهادة` }, step: 4, severity: 'important' });
      }
      const missingSchool = formData.formations.filter(f => !f.etablissement);
      if (missingSchool.length > 0) {
        warnings.push({ id: 'edu-school', label: { en: `${missingSchool.length} edu. missing school`, fr: `${missingSchool.length} form. sans établissement`, ar: `${missingSchool.length} تعليم بدون مؤسسة` }, step: 4, severity: 'important' });
      }
      const missingEduDates = formData.formations.filter(f => !f.dateDebut && !f.dateFin && !f.annee);
      if (missingEduDates.length > 0) {
        warnings.push({ id: 'edu-dates', label: { en: `${missingEduDates.length} edu. missing dates`, fr: `${missingEduDates.length} form. sans dates`, ar: `${missingEduDates.length} تعليم بدون تواريخ` }, step: 4, severity: 'important' });
      }
    }

    // ── Step 5: Skills & More ──
    if (formData.competences.length === 0) {
      warnings.push({ id: 'no-skills', label: { en: 'No skills listed', fr: 'Aucune compétence', ar: 'لا توجد مهارات' }, step: 5, severity: 'important' });
    }
    if (formData.langues.length === 0) {
      warnings.push({ id: 'no-lang', label: { en: 'No languages', fr: 'Aucune langue', ar: 'لا توجد لغات' }, step: 5, severity: 'important' });
    }
    if (formData.logiciels.length === 0) {
      warnings.push({ id: 'no-software', label: { en: 'No software listed', fr: 'Aucun logiciel', ar: 'لا توجد برامج' }, step: 5, severity: 'important' });
    }

    return warnings.filter(w => !dismissedWarnings.has(w.id));
  }, [formData, dismissedWarnings]);

  const dismissWarning = useCallback((id: string) => {
    setDismissedWarnings(prev => new Set([...prev, id]));
  }, []);

  // ── Template data detection helpers ──
  const isTemplateValue = useCallback((field: keyof Candidate): boolean => {
    if (!templateSnapshot) return false;
    const snapVal = templateSnapshot[field];
    const curVal = formData[field];
    if (!snapVal || !curVal) return false;
    return snapVal === curVal;
  }, [templateSnapshot, formData]);

  const isTemplateArrayValue = useCallback((arrayField: 'experiences' | 'formations' | 'langues', index: number, subField: string): boolean => {
    if (!templateSnapshot) return false;
    const snapArr = templateSnapshot[arrayField] as any[];
    if (!snapArr || index >= snapArr.length) return false;
    const snapVal = snapArr[index]?.[subField];
    const curArr = formData[arrayField] as any[];
    const curVal = curArr[index]?.[subField];
    if (!snapVal || !curVal) return false;
    return snapVal === curVal;
  }, [templateSnapshot, formData]);

  const isTemplateListItem = useCallback((listField: 'competences' | 'logiciels', value: string): boolean => {
    if (!templateSnapshot) return false;
    return templateSnapshot[listField]?.includes(value) ?? false;
  }, [templateSnapshot]);

  const templateFieldCount = useMemo(() => {
    if (!templateSnapshot) return 0;
    let count = 0;
    const fields: (keyof Candidate)[] = ['prenom', 'nom', 'titre', 'email', 'telephone', 'ville', 'linkedin', 'accroche'];
    for (const f of fields) {
      if (templateSnapshot[f] && templateSnapshot[f] === formData[f]) count++;
    }
    // Count array items
    for (const exp of formData.experiences) {
      const idx = formData.experiences.indexOf(exp);
      const snapExp = (templateSnapshot.experiences as any[])?.[idx];
      if (snapExp) {
        if (snapExp.poste && snapExp.poste === exp.poste) count++;
        if (snapExp.entreprise && snapExp.entreprise === exp.entreprise) count++;
        if (snapExp.description && snapExp.description === exp.description) count++;
      }
    }
    for (const f of formData.formations) {
      const idx = formData.formations.indexOf(f);
      const snapF = (templateSnapshot.formations as any[])?.[idx];
      if (snapF) {
        if (snapF.diplome && snapF.diplome === f.diplome) count++;
        if (snapF.etablissement && snapF.etablissement === f.etablissement) count++;
      }
    }
    count += formData.competences.filter(s => templateSnapshot.competences?.includes(s)).length;
    count += formData.logiciels.filter(s => templateSnapshot.logiciels?.includes(s)).length;
    count += formData.langues.filter((l, i) => templateSnapshot.langues?.[i]?.langue === l.langue).length;
    return count;
  }, [templateSnapshot, formData]);

  const clearTemplateSnapshot = useCallback(() => {
    setTemplateSnapshot(null);
  }, []);

  // Measure CV content height and compute page count
  useEffect(() => {
    const measure = () => {
      if (cvMeasureRef.current) {
        const h = cvMeasureRef.current.scrollHeight;
        if (h <= A4_HEIGHT) {
          setTotalPages(1);
        } else {
          setTotalPages(
            1 + Math.ceil((h - FIRST_PAGE_CONTENT) / OTHER_PAGE_CONTENT),
          );
        }
      }
    };
    measure();
    // Re-measure on window resize
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [formData, activeTemplate, styleConfig]);

  // ── Auto-save to localStorage for unauthenticated users ──
  useEffect(() => {
    if (isAuthenticated) return; // Authenticated users save to backend
    // Debounce: save 1s after last change
    const timer = setTimeout(() => {
      const hasContent = formData.prenom || formData.nom || formData.email || formData.experiences?.length || formData.formations?.length;
      if (hasContent) {
        const pendingCV = {
          formData,
          activeTemplate,
          styleConfig,
          cvTitle: cvTitle || `CV ${formData.prenom || ''} ${formData.nom || ''}`.trim(),
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem('oosira_pending_cv', JSON.stringify(pendingCV));
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData, activeTemplate, styleConfig, cvTitle, isAuthenticated]);

  // ── Guest overlay prompt ──
  const [showGuestOverlay, setShowGuestOverlay] = useState(!isAuthenticated);

  /* OCR State Integration */
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Gate: free users who already used their OCR trial
    if (isAuthenticated && !canOcr) {
      const msg =
        language === "fr"
          ? "Vous avez d\u00e9j\u00e0 utilis\u00e9 votre essai OCR gratuit. Passez \u00e0 Pro pour des importations illimit\u00e9es."
          : language === "ar"
            ? "\u0644\u0642\u062f \u0627\u0633\u062a\u062e\u062f\u0645\u062a \u062a\u062c\u0631\u0628\u062a\u0643 \u0627\u0644\u0645\u062c\u0627\u0646\u064a\u0629. \u0642\u0645 \u0628\u0627\u0644\u062a\u0631\u0642\u064a\u0629 \u0625\u0644\u0649 Pro \u0644\u0627\u0633\u062a\u064a\u0631\u0627\u062f \u063a\u064a\u0631 \u0645\u062d\u062f\u0648\u062f."
            : "You have already used your free OCR trial. Upgrade to Pro for unlimited imports.";
      if (confirm(msg)) router.push("/dashboard?view=pricing");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsOcrProcessing(true);
    try {
      // Upload file and run OCR via Django backend (single request)
      const dataForm = new FormData();
      dataForm.append("file", file);

      const ocrApiUrl =
        (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api") +
        "/cvs/ocr/";
      const token = getToken();
      const authHeaders: Record<string, string> = {};
      if (token) authHeaders["Authorization"] = `Bearer ${token}`;

      const ocrRes = await fetch(ocrApiUrl, {
        method: "POST",
        headers: authHeaders,
        body: dataForm,
      });
      const ocrData = await ocrRes.json();
      if (!ocrRes.ok || !ocrData.cv_data)
        throw new Error(
          ocrData.detail?.message || ocrData.detail || "Analysis failed",
        );

      const cvData = ocrData.cv_data;

      // 3. Map to Oosira state
      const safeArray = <T,>(value: any): T[] =>
        Array.isArray(value) ? value : [];
      const cleanInline = (value: any): string =>
        String(value || "")
          .replace(/[???]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      const cleanMultiline = (value: any): string =>
        String(value || "")
          .replace(/[???]/g, " ")
          .replace(/\n{3,}/g, "\n\n")
          .replace(/[ \t]+/g, " ")
          .trim();
      const dedupe = (items: string[]) =>
        Array.from(new Set(items.map((x) => cleanInline(x)).filter(Boolean)));
      const splitSkills = (items: string[]) =>
        dedupe(
          items
            .flatMap((s) => String(s || "").split(/[,;|/]/g))
            .map((s) => s.trim())
            .filter((s) => s.length > 1),
        );
      const pickYear = (start: string, end: string): string => {
        const endYear = (end || "").match(/(19|20)\d{2}/)?.[0];
        const startYear = (start || "").match(/(19|20)\d{2}/)?.[0];
        return endYear || startYear || cleanInline(end || start);
      };

      // Detect response format: French flat keys (from regex/Gemini) vs English nested (legacy)
      const isFrenchFormat = !!(cvData?.prenom !== undefined || cvData?.nom !== undefined || cvData?.formations || cvData?.competences);

      let mapped: Candidate;

      if (isFrenchFormat) {
        // ── French flat format from backend CVStructurer ──
        mapped = {
          id: -2,
          prenom: cleanInline(cvData?.prenom),
          nom: cleanInline(cvData?.nom),
          titre: cleanInline(cvData?.titre),
          email: cleanInline(cvData?.email),
          telephone: cleanInline(cvData?.telephone),
          ville: cleanInline(cvData?.ville),
          linkedin: cleanInline(cvData?.linkedin),
          accroche: cleanMultiline(cvData?.accroche),
          formations: safeArray<any>(cvData?.formations).map((f: any) => ({
            diplome: cleanInline(f?.diplome),
            specialite: cleanInline(f?.specialite),
            etablissement: cleanInline(f?.etablissement),
            ville: cleanInline(f?.ville),
            annee: cleanInline(f?.annee),
            mention: cleanInline(f?.mention),
          })),
          experiences: safeArray<any>(cvData?.experiences).map((e: any) => ({
            poste: cleanInline(e?.poste),
            entreprise: cleanInline(e?.entreprise),
            secteur: cleanInline(e?.secteur),
            dateDebut: cleanInline(e?.dateDebut),
            dateFin: cleanInline(e?.dateFin),
            description: cleanMultiline(e?.description),
          })).filter((e) => e.poste || e.entreprise || e.description),
          competences: splitSkills(safeArray<string>(cvData?.competences)),
          langues: safeArray<any>(cvData?.langues).map((l: any) => ({
            langue: cleanInline(l?.langue),
            niveau: cleanInline(l?.niveau) || "Intermédiaire",
          })),
          logiciels: dedupe(safeArray<string>(cvData?.logiciels)),
          iconName: "document",
          cardColor: "#3B82F6",
          recommendedTemplate: activeTemplate,
        };
      } else {
        // ── Legacy English nested format (old OCR service) ──
        const rawTechnical = safeArray<string>(cvData?.skills?.technical);
        const rawSoft = safeArray<string>(cvData?.skills?.soft);
        const rawSoftware = safeArray<string>(cvData?.skills?.software);
        const allRawSkills = splitSkills([...rawTechnical, ...rawSoft]);

        // Keep only short competency-like tokens; move long noisy lines to a rescue experience block.
        const cleanCompetences = allRawSkills.filter(
          (s) => s.length <= 40 && !/^\d{2,}/.test(s),
        );
        const misclassifiedLongText = allRawSkills.filter((s) => s.length > 40);

        let mappedExperiences = safeArray<any>(cvData?.experience).map(
          (e: any) => ({
            poste: cleanInline(e?.job_title || e?.title),
            entreprise: cleanInline(e?.company),
            secteur: cleanInline(e?.company_description || e?.contract_type),
            dateDebut: cleanInline(e?.start_date || e?.start),
            dateFin: cleanInline(
              e?.is_current ? "En cours" : e?.end_date || e?.end,
            ),
            description: cleanMultiline(
              e?.description || safeArray<string>(e?.achievements).join(". "),
            ),
          }),
        );

        // If OCR misses date blocks, still keep useful text in one normalized fallback item.
        if (misclassifiedLongText.length > 0) {
          mappedExperiences.push({
            poste: "Expériences (à trier)",
            entreprise: "Import OCR",
            secteur: "",
            dateDebut: "",
            dateFin: "",
            description: cleanMultiline(misclassifiedLongText.join(". ")),
          });
        }

        const fullName = cleanInline(cvData?.personal_info?.full_name);
        const firstName = cleanInline(cvData?.personal_info?.first_name);
        const lastName = cleanInline(cvData?.personal_info?.last_name);
        const nameParts = fullName ? fullName.split(" ") : [];
        const prenom = firstName || nameParts[0] || "";
        const nom =
          lastName || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");

        const rawSummary = cleanMultiline(cvData?.summary);
        const summaryLooksNoisy =
          rawSummary.length > 450 ||
          /(experience|experiences|skills|competences|formation|education)/i.test(
            rawSummary.slice(160),
          );
        const accroche = summaryLooksNoisy
          ? rawSummary
              .split(/(?<=[.!?])\s+/)
              .slice(0, 2)
              .join(" ")
              .slice(0, 380)
          : rawSummary.slice(0, 600);

        mapped = {
          id: -2,
          prenom,
          nom,
          titre: cleanInline(cvData?.professional_title),
          email: cleanInline(cvData?.personal_info?.email),
          telephone: cleanInline(cvData?.personal_info?.phone),
          ville: cleanInline(cvData?.personal_info?.city),
          linkedin: cleanInline(cvData?.personal_info?.linkedin),
          accroche,
          formations: safeArray<any>(cvData?.education).map((e: any) => ({
            diplome: cleanInline(e?.degree || e?.title),
            specialite: cleanInline(e?.field_of_study),
            etablissement: cleanInline(e?.institution || e?.company),
            ville: cleanInline(e?.location),
            annee: pickYear(cleanInline(e?.start_date), cleanInline(e?.end_date)),
            mention: cleanInline(e?.grade),
          })),
          experiences: mappedExperiences.filter(
            (e) => e.poste || e.entreprise || e.description,
          ),
          competences: cleanCompetences,
          langues: safeArray<any>(cvData?.skills?.languages).map((l: any) => ({
            langue: cleanInline(l?.language || l?.langue),
            niveau: cleanInline(l?.level || l?.niveau) || "Intermédiaire",
          })),
          logiciels: dedupe(
            rawSoftware.map((s: string) =>
              String(s || "")
                .split("(")[0]
                .trim(),
            ),
          ),
          iconName: "document",
          cardColor: "#3B82F6",
          recommendedTemplate: activeTemplate,
        };
      }

      setFormData(mapped);
      setActiveCandidate(-2); // Custom flag for imported OCR CV

      // Automatically proceed to next step to show mapped info
      if (currentStep === 0) setStep([1, 1]);

      // OCR trial was consumed – refresh subscription status
      invalidateSubscriptionCache();
      refreshSubscription();
    } catch (err: any) {
      alert(`OCR Error: ${err.message}`);
    } finally {
      setIsOcrProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    Promise.all([
      fetch("/data/lycees_algerie_complet.json")
        .then((r) => r.json())
        .catch(() => []),
      fetch("/data/oosseera_enseignement_superieur.json")
        .then((r) => r.json())
        .catch(() => []),
      fetch("/data/oosseera_instituts_specialises.json")
        .then((r) => r.json())
        .catch(() => []),
      fetch("/data/oosseera_formation_professionnelle.json")
        .then((r) => r.json())
        .catch(() => []),
      fetch("/data/oosseera_ecoles_privees.json")
        .then((r) => r.json())
        .catch(() => []),
    ]).then(([lycees, univs, instituts, formations, privees]) => {
      const getNames = (arr: any[], key: string) =>
        arr.map((e) => e[key]).filter(Boolean);
      const lyceeNames = Array.from(
        new Set(getNames(lycees, "nom_etablissement_ar")),
      );
      const univNames = Array.from(new Set(getNames(univs, "nom_officiel")));
      const institutNames = Array.from(new Set(getNames(instituts, "nom")));
      const formationNames = Array.from(
        new Set(getNames(formations, "nom_etablissement")),
      );
      const priveNames = Array.from(new Set(getNames(privees, "nom")));

      setEcolesData({
        lycee: lyceeNames,
        univ: univNames,
        institut: institutNames,
        formation: formationNames,
        prive: priveNames,
      });

      const names = new Set([
        ...lyceeNames,
        ...univNames,
        ...institutNames,
        ...formationNames,
        ...priveNames,
      ]);
      setEcolesList(Array.from(names));
    });
  }, []);

  // ── Save CV to backend ──
  const saveCV = async () => {
    if (!isAuthenticated) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const calculateCompletion = (data: Candidate): number => {
        let score = 0;

        // Step 1: Template (Assume done if CV is being saved) -> 15%
        score += 15;

        // Step 2: Personal Info (First name, last name, email, or phone) -> 15%
        if (data.prenom || data.nom || data.email || data.telephone) {
          score += 15;
        }

        // Step 3: Summary (Accroche) -> 15%
        if (data.accroche && data.accroche.trim().length > 0) {
          score += 15;
        }

        // Step 4: Experience -> 15%
        if (data.experiences && data.experiences.length > 0) {
          score += 15;
        }

        // Step 5: Education -> 15%
        if (data.formations && data.formations.length > 0) {
          score += 15;
        }

        // Step 6: Skills & More (Competences or Langues) -> 15%
        if (
          (data.competences && data.competences.length > 0) ||
          (data.langues && data.langues.length > 0) ||
          (data.logiciels && data.logiciels.length > 0)
        ) {
          score += 15;
        }

        // Step 7: Design (Assume defaults are applied) -> 10%
        score += 10;

        return Math.min(100, score);
      };

      const completionPercent = calculateCompletion(formData);
      const cvStatus = completionPercent === 100 ? "completed" : "draft";

      const defaultTitle =
        `${formData.prenom || "Mon"} ${formData.nom || "CV"}`.trim();
      const cvPayload = {
        title: cvTitle.trim() || defaultTitle,
        jobTitle: formData.titre || "",
        templateName: TEMPLATE_NAMES[activeTemplate] || "Classique Pro",
        templateId: activeTemplate,
        previewColor:
          styleConfig.sidebarBg || styleConfig.accentColor || "#0D1117",
        completionPercent,
        status: cvStatus,
        reminderDate: reminderDate || null,
        cvData: formData,
        styleConfig: styleConfig,
      };

      if (savedCvId) {
        // Update existing CV
        await apiFetch(`/cvs/${savedCvId}/`, {
          method: "PUT",
          body: JSON.stringify(cvPayload),
        });
        dispatch(fetchDrafts());
      } else {
        // Create new CV
        const created = await apiFetch("/cvs/", {
          method: "POST",
          body: JSON.stringify(cvPayload),
        });
        setSavedCvId(created.id);
        dispatch(fetchDrafts());
      }
    } catch (err: any) {
      console.error("Save CV error:", err);
      setSaveError(err.message || "Failed to save CV");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndExit = async () => {
    if (isAuthenticated) {
      await saveCV();
    }
    router.push("/dashboard");
  };

  const goTo = (step: number) => {
    setStep([step, step > currentStep ? 1 : -1]);
    // Auto-save when reaching the preview step
    if (step === STEPS.length - 1 && isAuthenticated) {
      setTimeout(() => saveCV(), 300);
    }
  };
  const next = () => {
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setStep([nextStep, 1]);
      // Auto-save when reaching the preview step
      if (nextStep === STEPS.length - 1 && isAuthenticated) {
        setTimeout(() => saveCV(), 300);
      }
    }
  };
  const prev = () => {
    if (currentStep > 0) setStep([currentStep - 1, -1]);
  };

  const switchCandidate = useCallback((idx: number) => {
    setActiveCandidate(idx);
    if (idx === -1) {
      setTemplateSnapshot(null);
      setFormData({
        id: -1,
        prenom: "",
        nom: "",
        titre: "",
        email: "",
        telephone: "",
        ville: "",
        linkedin: "",
        accroche: "",
        formations: [],
        experiences: [],
        competences: [],
        langues: [],
        logiciels: [],
        iconName: "document",
        cardColor: "#64748b",
        recommendedTemplate: 1,
      });
      setStyleConfig(getRandomStyleConfig(TEMPLATE_DEFAULTS[1]));
      return;
    }
    const c = candidates[idx];
    // Snapshot the template data for warning indicators
    setTemplateSnapshot({
      ...c,
      formations: c.formations.map((f) => ({ ...f })),
      experiences: c.experiences.map((e) => ({ ...e })),
      langues: c.langues.map((l) => ({ ...l })),
      competences: [...c.competences],
      logiciels: [...c.logiciels],
    });
    setFormData({
      ...c,
      formations: c.formations.map((f) => ({ ...f })),
      experiences: c.experiences.map((e) => ({ ...e })),
      langues: c.langues.map((l) => ({ ...l })),
      competences: [...c.competences],
      logiciels: [...c.logiciels],
    });
    setActiveTemplate(c.recommendedTemplate);
    setStyleConfig(
      getRandomStyleConfig(
        TEMPLATE_DEFAULTS[
          c.recommendedTemplate as keyof typeof TEMPLATE_DEFAULTS
        ] || TEMPLATE_DEFAULTS[1],
      ),
    );
  }, []);

  const updateField = (key: keyof Candidate, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };
  const updateFormation = (idx: number, key: keyof Formation, value: any) => {
    setFormData((prev) => {
      const formations = [...prev.formations];
      formations[idx] = { ...formations[idx], [key]: value };
      return { ...prev, formations };
    });
  };
  const addFormation = () => {
    setFormData((prev) => ({
      ...prev,
      formations: [
        ...prev.formations,
        {
          diplome: "",
          specialite: "",
          etablissement: "",
          ville: "",
          annee: "",
          dateDebut: "",
          dateFin: "",
          mention: "",
        },
      ],
    }));
  };
  const removeFormation = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      formations: prev.formations.filter((_, i) => i !== idx),
    }));
  };
  const updateExperience = (idx: number, key: keyof Experience, value: any) => {
    setFormData((prev) => {
      const experiences = [...prev.experiences];
      experiences[idx] = { ...experiences[idx], [key]: value };
      return { ...prev, experiences };
    });
  };
  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          poste: "",
          entreprise: "",
          secteur: "",
          dateDebut: "",
          dateFin: "",
          description: "",
        },
      ],
    }));
  };
  const removeExperience = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== idx),
    }));
  };
  const moveExperience = (idx: number, direction: 'up' | 'down') => {
    setFormData((prev) => {
      const arr = [...prev.experiences];
      const target = direction === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= arr.length) return prev;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return { ...prev, experiences: arr };
    });
  };
  const moveFormation = (idx: number, direction: 'up' | 'down') => {
    setFormData((prev) => {
      const arr = [...prev.formations];
      const target = direction === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= arr.length) return prev;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return { ...prev, formations: arr };
    });
  };
  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !formData.competences.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        competences: [...prev.competences, trimmed],
      }));
      setNewSkill("");
    }
  };
  const removeSkill = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      competences: prev.competences.filter((_, i) => i !== idx),
    }));
  };
  const addLogiciel = () => {
    const trimmed = newLogiciel.trim();
    if (trimmed && !formData.logiciels.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        logiciels: [...prev.logiciels, trimmed],
      }));
      setNewLogiciel("");
    }
  };
  const removeLogiciel = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      logiciels: prev.logiciels.filter((_, i) => i !== idx),
    }));
  };
  const updateLangue = (idx: number, key: keyof Langue, value: string) => {
    setFormData((prev) => {
      const langues = [...prev.langues];
      langues[idx] = { ...langues[idx], [key]: value };
      return { ...prev, langues };
    });
  };
  const addLangue = () => {
    setFormData((prev) => ({
      ...prev,
      langues: [...prev.langues, { langue: "", niveau: "Intermediaire", certification: "", score: "" }],
    }));
  };
  const removeLangue = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      langues: prev.langues.filter((_, i) => i !== idx),
    }));
  };
  const handlePrint = async () => {
    // Quota gate – block free users who exhausted 5 downloads
    if (isAuthenticated && !canDownload) {
      const msg =
        language === "fr"
          ? "Vous avez atteint votre limite de 5 téléchargements ce mois-ci. Passez à Pro pour des téléchargements illimités."
          : language === "ar"
            ? "لقد وصلت إلى حد 5 تنزيلات هذا الشهر. قم بالترقية إلى Pro للتنزيلات غير المحدودة."
            : "You have reached your 5 downloads limit this month. Upgrade to Pro for unlimited downloads.";
      if (confirm(msg)) {
        router.push("/dashboard?view=pricing");
      }
      return;
    }

    setIsDownloading(true);
    try {
      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const url = savedCvId
        ? `${API_BASE}/cvs/${savedCvId}/pdf/`
        : `${API_BASE}/cvs/pdf/`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(isAuthenticated
            ? {
                Authorization: `Bearer ${localStorage.getItem("oosira_token")}`,
              }
            : {}),
        },
        body: JSON.stringify({
          cv_data: formData,
          style_config: styleConfig,
          template_id: activeTemplate,
          language: language,
        }),
      });

      if (response.status === 402) {
        // Quota exceeded server-side
        invalidateSubscriptionCache();
        refreshSubscription();
        const msg =
          language === "fr"
            ? "Limite de téléchargements atteinte. Passez à Pro."
            : "Download limit reached. Upgrade to Pro.";
        if (confirm(msg)) router.push("/dashboard?view=pricing");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to generate PDF from server");
      }

      // Download the PDF blob
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `CV_${formData.prenom || "Sira"}_${formData.nom || "CV"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      // Refresh subscription cache after a download (quota changed)
      invalidateSubscriptionCache();
      refreshSubscription();

      if (isAuthenticated && savedCvId) {
        dispatch(trackDownload(savedCvId));
      }
    } catch (err) {
      console.error("Error generating PDF:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Draggable sidebar resize
  const startDragSidebar = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    const startX = e.clientX;
    const startW = sidebarWidth;
    const onMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const delta = startX - ev.clientX; // dragging left = bigger sidebar
      setSidebarWidth(Math.max(300, Math.min(Math.floor(window.innerWidth * 0.6), startW + delta)));
    };
    const onUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [sidebarWidth]);

  const getCVContent = () => {
    switch (activeTemplate) {
      case 1:
        return <CVClassique data={formData} config={styleConfig} />;
      case 2:
        return <CVIngenieur data={formData} config={styleConfig} />;
      case 3:
        return <CVExecutif data={formData} config={styleConfig} />;

      case 4:
        return <CVMedical data={formData} config={styleConfig} />;
      case 5:
        return <CVTech data={formData} config={styleConfig} />;
      default:
        return <CVClassique data={formData} config={styleConfig} />;
    }
  };

  const cssVars = styleToCSSVars(styleConfig) as React.CSSProperties;

  const renderCVFull = () => (
    <div
      style={{
        ...cssVars,
        minHeight: "1123px",
        height: "1123px",
      }}
      className="cv-page-wrapper"
    >
      {getCVContent()}
    </div>
  );

  /** Helper: compute the content offset for page i */
  const getContentOffset = (i: number) => {
    if (i === 0) return 0;
    return FIRST_PAGE_CONTENT + (i - 1) * OTHER_PAGE_CONTENT;
  };

  // ── Double-click-to-edit: Overleaf-style SyncTeX navigation ──
  const handlePreviewDoubleClick = useCallback((e: React.MouseEvent) => {
    // Walk up from the clicked element to find one with data-cv-field
    let el = e.target as HTMLElement;
    let field: string | null = null;
    while (el && !field) {
      field = el.getAttribute('data-cv-field');
      if (!field) el = el.parentElement as HTMLElement;
    }
    if (!field) return;

    // Flash feedback on the clicked element
    if (el) {
      el.style.transition = 'outline 0.2s, outline-offset 0.2s';
      el.style.outline = '2px solid #3b82f6';
      el.style.outlineOffset = '2px';
      el.style.borderRadius = '4px';
      setTimeout(() => {
        el.style.outline = 'none';
        el.style.outlineOffset = '0px';
      }, 600);
    }

    // Map field path to step number and input ID
    const fieldToStep: Record<string, number> = {
      prenom: 1, nom: 1, titre: 1, email: 1, telephone: 1, ville: 1, linkedin: 1,
      accroche: 2,
      competences: 5, logiciels: 5,
    };

    let targetStep: number;
    let focusId: string | undefined;

    if (field.startsWith('experiences.')) {
      targetStep = 3;
      // e.g. "experiences.0.poste" → focus input for that experience field
      focusId = `exp-${field.replace('experiences.', '').replace('.', '-')}`;
    } else if (field.startsWith('formations.')) {
      targetStep = 4;
      focusId = `edu-${field.replace('formations.', '').replace('.', '-')}`;
    } else if (field.startsWith('langues.')) {
      targetStep = 5;
      focusId = `lang-${field.replace('langues.', '').replace('.', '-')}`;
    } else {
      targetStep = fieldToStep[field] || 1;
      focusId = `field-${field}`;
    }

    // Close mobile preview if open, navigate to step
    setMobilePreviewOpen(false);
    goTo(targetStep);

    // After navigation renders, try to focus the target input
    setTimeout(() => {
      const input = document.getElementById(focusId || '');
      if (input) {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        input.focus();
        // Pulse animation
        input.style.transition = 'box-shadow 0.3s';
        input.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.4)';
        setTimeout(() => { input.style.boxShadow = ''; }, 1200);
      }
    }, 150);
  }, [goTo]);

  /** Render paginated A4 sheets with proper margins.
   *  Each sheet contains an inner clipping window that enforces
   *  top margin (pages 2+) and bottom margin (all pages). */
  const renderPaginatedSheets = (scale: number = 1) => {
    const sheetW = Math.round(A4_WIDTH * scale);
    const sheetH = Math.round(A4_HEIGHT * scale);
    const sheets = [];
    for (let i = 0; i < totalPages; i++) {
      const topMargin = i === 0 ? 0 : PAGE_MARGIN;
      const contentOffset = getContentOffset(i);
      sheets.push(
        <div
          key={i}
          style={{
            width: sheetW,
            height: sheetH,
            position: "relative",
            flexShrink: 0,
          }}
        >
          {/* Scaled cv-a4-sheet */}
          <div
            className="cv-a4-sheet"
            dir="ltr"
            style={{
              ...cssVars,
              background: "var(--cv-body-bg, #ffffff)",
              transform: `scale(${scale})`,
              transformOrigin: dir === "rtl" ? "top right" : "top left",
            }}
          >
            {/* Inner clipping window with margins */}
            <div
              style={{
                position: "absolute",
                top: topMargin,
                left: 0,
                right: 0,
                bottom: PAGE_MARGIN,
                overflow: "hidden",
              }}
            >
              {/* CV content positioned to show the right slice */}
              <div
                style={{
                  ...cssVars,
                  width: A4_WIDTH,
                  minHeight: A4_HEIGHT,
                  height: A4_HEIGHT,
                  position: "absolute",
                  top: -contentOffset,
                  left: 0,
                }}
                className="cv-page-wrapper"
              >
                {getCVContent()}
              </div>
            </div>
            {/* Page number badge */}
            <div className="cv-a4-sheet-badge">
              {i + 1} / {totalPages}
            </div>
          </div>
        </div>,
      );
    }
    return sheets;
  };

  const stepLabel = (id: string) =>
    STEP_LABELS[id]?.[language] || STEP_LABELS[id]?.en || id;

  // ── Warning badges overlay for CV preview ──
  const renderWarnings = () => {
    if (cvWarnings.length === 0) return null;
    return (
      <div className="shrink-0 px-3 py-2.5 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-amber-400/5 to-amber-500/5">
        <div className="flex items-center gap-1.5 mb-2">
          <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            {cvWarnings.length} {language === 'fr' ? 'champ(s) à compléter' : language === 'ar' ? 'حقول للإكمال' : 'field(s) to complete'}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cvWarnings.map(w => (
            <div key={w.id} className="group/warn relative">
              {/* Badge — click directly to jump to the step */}
              <button
                onClick={() => { setMobilePreviewOpen(false); goTo(w.step); }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-all duration-200 ${
                  w.severity === 'critical'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30 hover:bg-amber-500/25 hover:ring-amber-500/50'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20 hover:bg-amber-500/20 hover:ring-amber-500/40'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${w.severity === 'critical' ? 'bg-amber-500 animate-pulse' : 'bg-amber-400'}`} />
                {w.label[language] || w.label.en}
              </button>
              {/* Hover popover with Skip / Fix — pb-3 bridges the gap so hover doesn't break */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-3 hidden group-hover/warn:flex flex-col items-center z-50">
                <div className="bg-surface border border-border rounded-xl shadow-2xl shadow-black/20 p-1.5 flex items-center gap-1 whitespace-nowrap">
                  <button
                    onClick={(e) => { e.stopPropagation(); dismissWarning(w.id); }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-medium text-txt-muted hover:bg-surface2 hover:text-txt transition-all"
                  >
                    {language === 'fr' ? 'Ignorer' : language === 'ar' ? 'تجاهل' : 'Skip'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMobilePreviewOpen(false); goTo(w.step); }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all"
                  >
                    {language === 'fr' ? 'Corriger →' : language === 'ar' ? '← إصلاح' : 'Fix →'}
                  </button>
                </div>
                <div className="w-2.5 h-2.5 bg-surface border-b border-r border-border transform rotate-45 -mt-[6px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Template data floating overlay for CV preview ──
  const renderTemplateOverlay = () => {
    if (!templateSnapshot || templateFieldCount === 0) return null;

    // Categorize which sections still have template data
    const sections: { label: string; count: number; step: number; key: string }[] = [];
    const personalFields: (keyof Candidate)[] = ['prenom', 'nom', 'titre', 'email', 'telephone', 'ville', 'linkedin'];
    const personalCount = personalFields.filter(f => templateSnapshot[f] && templateSnapshot[f] === formData[f]).length;
    if (personalCount > 0) sections.push({ label: language === 'fr' ? 'Infos perso' : language === 'ar' ? 'معلومات شخصية' : 'Personal info', count: personalCount, step: 1, key: 'personal' });

    if (templateSnapshot.accroche && templateSnapshot.accroche === formData.accroche) {
      sections.push({ label: language === 'fr' ? 'Résumé' : language === 'ar' ? 'ملخص' : 'Summary', count: 1, step: 2, key: 'summary' });
    }

    let expCount = 0;
    formData.experiences.forEach((exp, idx) => {
      const snapExp = (templateSnapshot.experiences as any[])?.[idx];
      if (snapExp) {
        if (snapExp.poste && snapExp.poste === exp.poste) expCount++;
        if (snapExp.entreprise && snapExp.entreprise === exp.entreprise) expCount++;
        if (snapExp.description && snapExp.description === exp.description) expCount++;
      }
    });
    if (expCount > 0) sections.push({ label: language === 'fr' ? 'Expériences' : language === 'ar' ? 'خبرات' : 'Experience', count: expCount, step: 3, key: 'experiences' });

    let eduCount = 0;
    formData.formations.forEach((f, idx) => {
      const snapF = (templateSnapshot.formations as any[])?.[idx];
      if (snapF) {
        if (snapF.diplome && snapF.diplome === f.diplome) eduCount++;
        if (snapF.etablissement && snapF.etablissement === f.etablissement) eduCount++;
      }
    });
    if (eduCount > 0) sections.push({ label: language === 'fr' ? 'Formation' : language === 'ar' ? 'تعليم' : 'Education', count: eduCount, step: 4, key: 'formations' });

    const skillsCount = formData.competences.filter(s => templateSnapshot.competences?.includes(s)).length
      + formData.logiciels.filter(s => templateSnapshot.logiciels?.includes(s)).length
      + formData.langues.filter((l, i) => templateSnapshot.langues?.[i]?.langue === l.langue).length;
    if (skillsCount > 0) sections.push({ label: language === 'fr' ? 'Compétences' : language === 'ar' ? 'مهارات' : 'Skills', count: skillsCount, step: 5, key: 'skills' });

    // Dismiss a single section's template data by clearing those fields from the snapshot
    const clearSection = (key: string) => {
      if (!templateSnapshot) return;
      const updated = { ...templateSnapshot };
      if (key === 'personal') {
        personalFields.forEach(f => { (updated as any)[f] = ''; });
      } else if (key === 'summary') {
        updated.accroche = '';
      } else if (key === 'experiences') {
        updated.experiences = [];
      } else if (key === 'formations') {
        updated.formations = [];
      } else if (key === 'skills') {
        updated.competences = [];
        updated.logiciels = [];
        updated.langues = [];
      }
      setTemplateSnapshot(updated);
    };

    return (
      <div className="shrink-0 px-3 py-2.5 border-b border-orange-500/20 bg-gradient-to-r from-orange-500/5 via-amber-400/5 to-orange-500/5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-orange-500 shrink-0 animate-pulse" />
            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
              {language === 'fr'
                ? `${templateFieldCount} champ(s) pré-rempli(s)`
                : language === 'ar'
                  ? `${templateFieldCount} حقول معبأة مسبقاً`
                  : `${templateFieldCount} pre-filled field(s)`}
            </span>
          </div>
          <button
            onClick={clearTemplateSnapshot}
            className="text-[9px] font-bold text-orange-500 hover:text-orange-600 dark:hover:text-orange-300 uppercase tracking-wider transition-colors"
          >
            {language === 'fr' ? 'Ignorer tout' : language === 'ar' ? 'تجاهل الكل' : 'Dismiss all'}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sections.map(s => (
            <div key={s.key} className="group/sec relative">
              <button
                onClick={() => { setMobilePreviewOpen(false); goTo(s.step); }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-semibold ring-1 ring-orange-500/20 cursor-pointer transition-all duration-200 hover:bg-orange-500/20 hover:ring-orange-500/40"
              >
                {s.label} <span className="text-[9px] opacity-70">({s.count})</span>
              </button>
              {/* Hover popover with Dismiss / Fix */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-3 hidden group-hover/sec:flex flex-col items-center z-50">
                <div className="bg-surface border border-border rounded-xl shadow-2xl shadow-black/20 p-1.5 flex items-center gap-1 whitespace-nowrap">
                  <button
                    onClick={(e) => { e.stopPropagation(); clearSection(s.key); }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-medium text-txt-muted hover:bg-surface2 hover:text-txt transition-all"
                  >
                    {language === 'fr' ? 'Ignorer' : language === 'ar' ? 'تجاهل' : 'Dismiss'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMobilePreviewOpen(false); goTo(s.step); }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-all"
                  >
                    {language === 'fr' ? 'Corriger →' : language === 'ar' ? '← إصلاح' : 'Fix →'}
                  </button>
                </div>
                <div className="w-2.5 h-2.5 bg-surface border-b border-r border-border transform rotate-45 -mt-[6px]" />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-orange-500/70 mt-1.5 italic">
          {language === 'fr'
            ? 'Vérifiez et remplacez les données du modèle avant d\'exporter.'
            : language === 'ar'
              ? 'راجع واستبدل بيانات القالب قبل التصدير.'
              : 'Review and replace template data before exporting.'}
        </p>
      </div>
    );
  };

  /* -- Template thumbnails data -- */
  const templateThumbs = [
    { id: 1, name: "Classique Pro", color: "#1B3A6B", style: "elegant" },
    { id: 2, name: "Ingenieur", color: "#2C3E50", style: "technical" },
    { id: 3, name: "Executif", color: "#1e293b", style: "executive" },
    { id: 4, name: "Medical", color: "#2563EB", style: "medical" },
    { id: 5, name: "Tech & IT", color: "#0D1117", style: "tech" },
  ];

  /* -- Step content renderer -- */
  const renderStepContent = () => {
    switch (currentStep) {
      /* -- STEP 0: Template Selection -- */
      case 0:
        return (
          <motion.div
            key="template"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.05 }}
            className="space-y-8"
          >
            {/* Templates */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-txt mb-2">
                {t("builder.template")}
              </h2>
              <p className="text-txt-muted text-sm lg:text-lg mb-6">
                {t("builder.templateDesc") ||
                  "Choose a professional design optimized for your industry."}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
                {(shuffledTemplates || templateThumbs).map((tmpl, index) => {
                  const palette = shuffledPalettes ? shuffledPalettes[index % shuffledPalettes.length] : null;
                  const primary = palette ? palette.primary : tmpl.color;
                  const accent = palette ? palette.accent : "#2563EB";
                  const headerBg = palette ? palette.headerBg : tmpl.color;
                  const isSelected = activeTemplate === tmpl.id;

                  return (
                    <motion.div
                      key={tmpl.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: index * 0.04 }}
                      whileHover={{ y: -6, transition: { duration: 0.25 } }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        setActiveTemplate(tmpl.id);
                        const templateDefaults = TEMPLATE_DEFAULTS[tmpl.id as keyof typeof TEMPLATE_DEFAULTS] || TEMPLATE_DEFAULTS[1];
                        let newConfig = { ...templateDefaults };
                        if (palette) {
                          newConfig = applyPalette(newConfig, palette);
                          const tempRandom = getRandomStyleConfig(newConfig);
                          const isSidebarTemplate = false;
                          newConfig = { 
                            ...tempRandom, 
                            primaryColor: palette.primary, 
                            accentColor: palette.accent, 
                            headerBg: palette.headerBg, 
                            headerText: palette.headerText, 
                            sidebarBg: isSidebarTemplate ? palette.headerBg : palette.primary,
                            skillBg: hexToRgba(palette.accent, 0.1), 
                            skillText: palette.accent, 
                            sidebarText: isSidebarTemplate ? palette.headerText : palette.headerText,
                            // Preserve template layout structure
                            layoutCols: templateDefaults.layoutCols,
                            mainOrder: templateDefaults.mainOrder,
                            sideOrder: templateDefaults.sideOrder,
                          };
                        } else {
                          newConfig = {
                            ...getRandomStyleConfig(newConfig),
                            layoutCols: templateDefaults.layoutCols,
                            mainOrder: templateDefaults.mainOrder,
                            sideOrder: templateDefaults.sideOrder,
                          };
                        }
                        setStyleConfig(newConfig);
                      }}
                      className={`relative cursor-pointer rounded-2xl transition-all duration-400 group ${
                        isSelected
                          ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-bg shadow-xl shadow-blue-500/25"
                          : "ring-1 ring-border hover:ring-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10"
                      }`}
                    >
                      {/* Glow backdrop */}
                      <div className={`absolute -inset-px rounded-2xl transition-opacity duration-500 pointer-events-none ${
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                      }`} style={{ background: `linear-gradient(135deg, ${primary}30, ${accent}20)`, filter: 'blur(8px)' }} />

                      {/* Card body */}
                      <div className="relative rounded-2xl overflow-hidden bg-surface border border-transparent">
                      {/* Thumbnail preview */}
                      <div className="aspect-[0.707] relative overflow-hidden">
                        <TemplateThumbnail templateId={tmpl.id} primary={primary} accent={accent} headerBg={headerBg} />
                        {/* Selected checkmark */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2.5 end-2.5 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/40"
                          >
                            <CheckIcon className="w-3.5 h-3.5 text-white" />
                          </motion.div>
                        )}
                      </div>

                      {/* Label footer */}
                      <div className={`px-3 py-2.5 text-center transition-colors duration-300 ${
                        isSelected ? 'bg-blue-500/5' : 'bg-surface2/50 group-hover:bg-surface2'
                      }`}>
                        <span className={`text-[11px] font-bold tracking-wide transition-colors duration-300 ${
                          isSelected ? 'text-blue-500' : 'text-txt-muted group-hover:text-txt'
                        }`}>
                          {tmpl.name}
                        </span>
                      </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Pre-filled candidates */}
            <div>
              <h3 className="text-lg lg:text-2xl font-bold text-txt mb-1">
                {t("builder.theme") || "Quick Start"}
              </h3>
              <p className="text-txt-muted text-sm lg:text-lg mb-4">
                {t("builder.quickStartDesc") ||
                  "Start with a pre-filled profile or begin from scratch."}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Blank start */}
                <motion.div
                  key="blank"
                  variants={fadeUp}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => switchCandidate(-1)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                    activeCandidate === -1
                      ? "border-blue-500 bg-blue-500/5 shadow-md shadow-blue-500/10"
                      : "border-border bg-surface hover:border-blue-500/30"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-500">
                    <DocumentPlusIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-txt truncate">
                      {t("builder.blankCV") || "Blank CV"}
                    </div>
                    <div className="text-xs text-txt-muted truncate">
                      {t("builder.blankCVDesc") || "Start from scratch"}
                    </div>
                  </div>
                  {activeCandidate === -1 && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </div>
                  )}
                </motion.div>

                {/* Import OCR Resume */}
                {!isPro ? (
                  <motion.div
                    key="import-trial"
                    variants={fadeUp}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative overflow-hidden flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
                      isOcrProcessing
                        ? "border-blue-500/50 bg-blue-50/50 dark:bg-blue-900/20"
                        : "border-blue-500 hover:border-blue-600 bg-blue-50/30 hover:bg-blue-50/80 dark:bg-blue-900/10 dark:hover:bg-blue-900/30"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".pdf,image/*"
                      onChange={handleFileUpload}
                    />
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-500 text-white shadow-lg shadow-blue-500/30">
                      {isOcrProcessing ? (
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      ) : (
                        <SparklesIcon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 z-10">
                      <div className="text-sm font-bold text-txt truncate">
                        {language === "fr"
                          ? "Importer un CV"
                          : language === "ar"
                            ? "استيراد سيرة ذاتية"
                            : "Import AI Resume"}
                        <span className="ml-2 inline-flex items-center rounded-md bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-700/10">
                          {language === "fr"
                            ? "1 essai gratuit"
                            : language === "ar"
                              ? "1 تجربة مجانية"
                              : "1 free try"}
                        </span>
                      </div>
                      <div className="text-xs text-txt-muted truncate group-hover:hidden mt-0.5">
                        {language === "fr"
                          ? "PDF ou Image (Auto-remplissage)"
                          : language === "ar"
                            ? "PDF أو صورة (تعبئة تلقائية)"
                            : "PDF or Image (Auto-fill)"}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-bold truncate hidden group-hover:block transition-all mt-0.5">
                        {language === "fr"
                          ? "Essayer gratuitement \u2192"
                          : language === "ar"
                            ? "جرب مجاناً \u2190"
                            : "Try for free \u2192"}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="import"
                    variants={fadeUp}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative overflow-hidden flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
                      isOcrProcessing
                        ? "border-blue-500/50 bg-blue-50/50 dark:bg-blue-900/20"
                        : "border-blue-500 hover:border-blue-600 bg-blue-50/30 hover:bg-blue-50/80 dark:bg-blue-900/10 dark:hover:bg-blue-900/30"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      disabled={isOcrProcessing}
                    />
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-600 text-white shadow-lg shadow-blue-500/30 relative">
                      {isOcrProcessing ? (
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        <ArrowDownTrayIcon className="w-5 h-5 rotate-180" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 z-10">
                      <div className="text-sm font-bold text-blue-700 dark:text-blue-400 truncate">
                        {isOcrProcessing
                          ? language === "fr"
                            ? "Analyse par IA..."
                            : language === "ar"
                              ? "???? ??????? ??????? ?????????..."
                              : "AI Analyzing..."
                          : language === "fr"
                            ? "Importer un CV"
                            : language === "ar"
                              ? "استيراد سيرة ذاتية"
                              : "Import AI Resume"}
                        <span className="ml-2 inline-flex items-center rounded-md bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800 ring-1 ring-inset ring-blue-700/10">
                          <Link href="/dashboard?view=pricing">Pro</Link>
                        </span>
                      </div>
                      <div className="text-xs text-blue-600/70 dark:text-blue-400/70 truncate mt-0.5">
                        {isOcrProcessing
                          ? language === "fr"
                            ? "Extraction des données..."
                            : language === "ar"
                              ? "استخراج البيانات..."
                              : "Extracting data..."
                          : language === "fr"
                            ? "PDF ou Image (Auto-remplissage)"
                            : language === "ar"
                              ? "PDF أو صورة (تعبئة تلقائية)"
                              : "PDF or Image (Auto-fill)"}
                      </div>
                    </div>
                    {/* Background scanning animation if processing */}
                    {isOcrProcessing && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent w-[200%]"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5,
                          ease: "linear",
                        }}
                      />
                    )}
                  </motion.div>
                )}

                {candidates.map((c, idx) => {
                  const Icon = CANDIDATE_ICONS[c.iconName];
                  return (
                    <motion.div
                      key={c.id}
                      variants={fadeUp}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => switchCandidate(idx)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        activeCandidate === idx
                          ? "border-blue-500 bg-blue-500/5 shadow-md shadow-blue-500/10"
                          : "border-border bg-surface hover:border-blue-500/30"
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: `${c.cardColor}18`,
                          color: c.cardColor,
                        }}
                      >
                        {Icon && <Icon className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-txt truncate">
                          {c.prenom} {c.nom}
                        </div>
                        <div className="text-xs text-txt-muted truncate">
                          {c.titre}
                        </div>
                        <div className="text-[10px] text-txt-dim flex items-center gap-1 mt-0.5">
                          <MapPinIcon className="w-3 h-3" />
                          {c.ville}
                        </div>
                      </div>
                      {activeCandidate === idx && (
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                          <CheckIcon className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        );

      /* -- STEP 1: Personal Info -- */
      case 1:
        return (
          <motion.div
            key="personal"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-txt mb-2">
                {t("builder.personal_info")}
              </h2>
              <p className="text-txt-muted text-sm lg:text-lg">
                {t("builder.personalInfoDesc") ||
                  "Let employers know how to reach you."}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t("builder.firstName") || "First Name"}
                value={formData.prenom}
                onChange={(v) => updateField("prenom", v)}
                isTemplateData={isTemplateValue("prenom")}
                id="field-prenom"
              />
              <Input
                label={t("builder.lastName") || "Last Name"}
                value={formData.nom}
                onChange={(v) => updateField("nom", v)}
                isTemplateData={isTemplateValue("nom")}
                id="field-nom"
              />
            </div>
            <AutocompleteInput
              label={t("builder.jobTitle")}
              value={formData.titre}
              onChange={(v) => updateField("titre", v)}
              placeholder="e.g. Ingénieur Logiciel"
              suggestions={SUGGESTIONS.titres}
              isTemplateData={isTemplateValue("titre")}
              id="field-titre"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t("builder.email")}
                value={formData.email}
                onChange={(v) => updateField("email", v)}
                type="email"
                isTemplateData={isTemplateValue("email")}
                id="field-email"
              />
              <Input
                label={t("builder.phone")}
                value={formData.telephone}
                onChange={(v) => updateField("telephone", v)}
                type="tel"
                isTemplateData={isTemplateValue("telephone")}
                id="field-telephone"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AutocompleteInput
                label={t("builder.location")}
                value={formData.ville}
                onChange={(v) => updateField("ville", v)}
                suggestions={SUGGESTIONS.villes}
                isTemplateData={isTemplateValue("ville")}
                id="field-ville"
              />
              <Input
                label={t("builder.linkedin")}
                value={formData.linkedin}
                onChange={(v) => updateField("linkedin", v)}
                isTemplateData={isTemplateValue("linkedin")}
                id="field-linkedin"
              />
            </div>
          </motion.div>
        );

      /* -- STEP 2: Summary -- */
      case 2:
        return (
          <motion.div
            key="summary"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-txt mb-2">
                {t("builder.summary")}
              </h2>
              <p className="text-txt-muted text-sm">
                {t("builder.summaryDesc") ||
                  "Write a compelling overview of your career highlights and goals."}
              </p>
            </div>
            <TextArea
              label={t("builder.summary")}
              value={formData.accroche}
              onChange={(v) => updateField("accroche", v)}
              placeholder={
                t("builder.summaryPlaceholder") ||
                "Experienced professional with deep expertise in..."
              }
              rows={6}
              isTemplateData={isTemplateValue("accroche")}
              id="field-accroche"
            />
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <p className="text-xs lg:text-base text-blue-600 dark:text-blue-400 font-medium">
                {t("builder.summaryTip") ||
                  "?? Tip: Keep it between 2-4 sentences. Highlight your biggest achievements and career direction."}
              </p>
            </div>
          </motion.div>
        );

      /* -- STEP 3: Experience -- */
      case 3:
        return (
          <motion.div
            key="experience"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-txt mb-2">
                  {t("builder.experiences")}
                </h2>
                <p className="text-txt-muted text-sm">
                  {t("builder.experienceDesc") ||
                    "Add your professional experience, starting with the most recent."}
                </p>
              </div>
              <button
                onClick={addExperience}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs lg:text-base font-bold transition-all hover:bg-blue-600 hover:text-white hover:shadow-md hover:shadow-blue-500/20"
              >
                <PlusIcon className="w-4 h-4" />
                {t("builder.add")}
              </button>
            </div>
            <div className="space-y-4">
              {formData.experiences.map((exp, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-surface border border-border rounded-2xl p-5 relative group hover:border-blue-500/20 transition-all duration-300"
                >
                  <div className="absolute top-4 end-4 flex items-center gap-1 z-10 opacity-60 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => moveExperience(idx, 'up')}
                      disabled={idx === 0}
                      className="w-7 h-7 rounded-full bg-surface2 border border-border flex items-center justify-center text-txt-muted hover:text-blue-500 hover:border-blue-500 hover:bg-blue-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ChevronUpIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveExperience(idx, 'down')}
                      disabled={idx === formData.experiences.length - 1}
                      className="w-7 h-7 rounded-full bg-surface2 border border-border flex items-center justify-center text-txt-muted hover:text-blue-500 hover:border-blue-500 hover:bg-blue-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ChevronDownIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeExperience(idx)}
                      className="w-7 h-7 rounded-full bg-surface2 border border-border flex items-center justify-center text-txt-muted hover:text-red-500 hover:border-red-500 hover:bg-red-500/10 transition-all"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <AutocompleteInput
                      label={t("builder.position")}
                      value={exp.poste}
                      onChange={(v) => updateExperience(idx, "poste", v)}
                      suggestions={SUGGESTIONS.titres}
                      isTemplateData={isTemplateArrayValue("experiences", idx, "poste")}
                      id={`exp-${idx}-poste`}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <AutocompleteInput
                        label={t("builder.company") || "Company"}
                        value={exp.entreprise}
                        onChange={(v) => updateExperience(idx, "entreprise", v)}
                        suggestions={SUGGESTIONS.entreprises}
                        isTemplateData={isTemplateArrayValue("experiences", idx, "entreprise")}
                        id={`exp-${idx}-entreprise`}
                      />
                      <AutocompleteInput
                        label={t("builder.secteur") || "Secteur"}
                        value={exp.secteur}
                        onChange={(v) => updateExperience(idx, "secteur", v)}
                        suggestions={SUGGESTIONS.secteurs}
                        isTemplateData={isTemplateArrayValue("experiences", idx, "secteur")}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label={t("builder.startDate")}
                        value={exp.dateDebut}
                        onChange={(v) => updateExperience(idx, "dateDebut", v)}
                        type="month"
                        isTemplateData={isTemplateArrayValue("experiences", idx, "dateDebut")}
                        id={`exp-${idx}-dateDebut`}
                      />
                      <div className="space-y-1.5">
                        {exp.dateFin === "Present" || exp.dateFin === "En cours" ? (
                          <div>
                            <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider mb-1.5">
                              {t("builder.endDate")}
                            </label>
                            <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400 font-semibold text-center">
                              {language === "fr" ? "En cours" : language === "ar" ? "حاليا" : "Present"}
                            </div>
                          </div>
                        ) : (
                          <Input
                            label={t("builder.endDate")}
                            value={exp.dateFin}
                            onChange={(v) => updateExperience(idx, "dateFin", v)}
                            type="month"
                          />
                        )}
                        <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                          <input
                            type="checkbox"
                            checked={exp.dateFin === "Present" || exp.dateFin === "En cours"}
                            onChange={(e) =>
                              updateExperience(
                                idx,
                                "dateFin",
                                e.target.checked
                                  ? language === "fr" ? "En cours" : language === "ar" ? "حاليا" : "Present"
                                  : "",
                              )
                            }
                            className="w-4 h-4 rounded border-border text-emerald-500 focus:ring-emerald-500/30 accent-emerald-500"
                          />
                          <span className="text-xs font-medium text-txt-muted">
                            {language === "fr" ? "En cours" : language === "ar" ? "حاليا" : "Present"}
                          </span>
                        </label>
                      </div>
                    </div>
                    <TextArea
                      label={t("builder.description")}
                      value={exp.description}
                      onChange={(v) => updateExperience(idx, "description", v)}
                      rows={3}
                      isTemplateData={isTemplateArrayValue("experiences", idx, "description")}
                      id={`exp-${idx}-description`}
                    />

                    {/* Multiple URLs Toggle */}
                    <div className="pt-2">
                      <div className="space-y-4 pt-2">
                        {exp.links?.map((link, linkIdx) => (
                          <div
                            key={linkIdx}
                            className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-end bg-surface2/30 p-4 rounded-xl border border-border/50"
                          >
                            <Input
                              label={t("builder.linkUrl") || "Link URL"}
                              value={link.url}
                              onChange={(v) => {
                                const newLinks = [...(exp.links || [])];
                                newLinks[linkIdx].url = v;
                                updateExperience(idx, "links", newLinks);
                              }}
                            />
                            <Input
                              label={t("builder.linkLabel") || "Link Label"}
                              value={link.label}
                              onChange={(v) => {
                                const newLinks = [...(exp.links || [])];
                                newLinks[linkIdx].label = v;
                                updateExperience(idx, "links", newLinks);
                              }}
                            />
                            <button
                              onClick={() => {
                                const newLinks = exp.links?.filter(
                                  (_, i) => i !== linkIdx,
                                );
                                updateExperience(idx, "links", newLinks);
                              }}
                              className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all mb-0.5"
                              title={t("builder.deleteLink") || "Delete this link"}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          const newLinks = [
                            ...(exp.links || []),
                            { url: "", label: "" },
                          ];
                          updateExperience(idx, "links", newLinks);
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/5 text-blue-600 dark:text-blue-400 rounded-full text-[13px] font-bold transition-all hover:bg-blue-600 hover:text-white"
                      >
                        <LinkIcon className="w-4 h-4" />{" "}
                        {t("builder.addLink") ||
                          "Ajouter un lien (Projet, Certificat...)"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      /* -- STEP 4: Education -- */
      case 4:
        return (
          <motion.div
            key="education"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-txt mb-2">
                  {t("builder.education")}
                </h2>
                <p className="text-txt-muted text-sm">
                  {t("builder.educationDesc") ||
                    "Add your educational background."}
                </p>
              </div>
              <button
                onClick={addFormation}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold transition-all hover:bg-blue-600 hover:text-white hover:shadow-md hover:shadow-blue-500/20"
              >
                <PlusIcon className="w-4 h-4" />
                {t("builder.add")}
              </button>
            </div>
            <div className="space-y-4">
              {formData.formations.map((f, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-surface border border-border rounded-2xl p-5 relative group hover:border-blue-500/20 transition-all duration-300"
                >
                  <div className="absolute top-4 end-4 flex items-center gap-1 z-10 opacity-60 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => moveFormation(idx, 'up')}
                      disabled={idx === 0}
                      className="w-7 h-7 rounded-full bg-surface2 border border-border flex items-center justify-center text-txt-muted hover:text-blue-500 hover:border-blue-500 hover:bg-blue-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ChevronUpIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveFormation(idx, 'down')}
                      disabled={idx === formData.formations.length - 1}
                      className="w-7 h-7 rounded-full bg-surface2 border border-border flex items-center justify-center text-txt-muted hover:text-blue-500 hover:border-blue-500 hover:bg-blue-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ChevronDownIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeFormation(idx)}
                      className="w-7 h-7 rounded-full bg-surface2 border border-border flex items-center justify-center text-txt-muted hover:text-red-500 hover:border-red-500 hover:bg-red-500/10 transition-all"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <AutocompleteInput
                        label={t("builder.degree") || "Degree"}
                        value={f.diplome}
                        onChange={(v) => updateFormation(idx, "diplome", v)}
                        suggestions={SUGGESTIONS.diplomes}
                        isTemplateData={isTemplateArrayValue("formations", idx, "diplome")}
                        id={`edu-${idx}-diplome`}
                      />
                      <Input
                        label={t("builder.startDate") || "Start Date"}
                        value={f.dateDebut || ""}
                        onChange={(v) => updateFormation(idx, "dateDebut", v)}
                        type="month"
                      />
                      <div className="space-y-1.5">
                        {(f.dateFin === "Present" || f.dateFin === "En cours") ? (
                          <div>
                            <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider mb-1.5">
                              {t("builder.endDate") || "End Date"}
                            </label>
                            <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400 font-semibold text-center">
                              {language === "fr" ? "En cours" : language === "ar" ? "حاليا" : "Present"}
                            </div>
                          </div>
                        ) : (
                          <Input
                            label={t("builder.endDate") || "End Date"}
                            value={f.dateFin || f.annee || ""}
                            onChange={(v) => {
                              updateFormation(idx, "dateFin", v);
                              updateFormation(idx, "annee", v);
                            }}
                            type="month"
                          />
                        )}
                        <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                          <input
                            type="checkbox"
                            checked={f.dateFin === "Present" || f.dateFin === "En cours"}
                            onChange={(e) => {
                              const val = e.target.checked
                                ? language === "fr" ? "En cours" : language === "ar" ? "حاليا" : "Present"
                                : "";
                              updateFormation(idx, "dateFin", val);
                              updateFormation(idx, "annee", val);
                            }}
                            className="w-4 h-4 rounded border-border text-emerald-500 focus:ring-emerald-500/30 accent-emerald-500"
                          />
                          <span className="text-xs font-medium text-txt-muted">
                            {language === "fr" ? "En cours" : language === "ar" ? "حاليا" : "Present"}
                          </span>
                        </label>
                      </div>
                    </div>
                    <AutocompleteInput
                      label={t("builder.specialite") || "Specialite"}
                      value={f.specialite}
                      onChange={(v) => updateFormation(idx, "specialite", v)}
                      suggestions={SUGGESTIONS.specialites}
                      isTemplateData={isTemplateArrayValue("formations", idx, "specialite")}
                      id={`edu-${idx}-specialite`}
                    />
                    <Select
                      label={
                        t("builder.typeEtablissement") || "Institution Type"
                      }
                      value={f.type_etablissement || ""}
                      onChange={(v) =>
                        updateFormation(idx, "type_etablissement", v)
                      }
                      placeholder={t("builder.selectType") || "Select type..."}
                      options={[
                        {
                          id: "lycee",
                          label: t("builder.typeLycee") || "Lyce",
                        },
                        {
                          id: "univ",
                          label: t("builder.typeUniv") || "Universit",
                        },
                        {
                          id: "institut",
                          label:
                            t("builder.typeInstitut") || "Institut Spcialis",
                        },
                        {
                          id: "formation",
                          label:
                            t("builder.typeFormation") ||
                            "Formation Professionnelle",
                        },
                        {
                          id: "prive",
                          label: t("builder.typePrive") || "cole Prive",
                        },
                      ]}
                    />
                    <p className="text-[10px] text-txt-dim -mt-2 italic">
                      {language === "fr"
                        ? "Filtre les suggestions d'établissements ci-dessous"
                        : language === "ar"
                          ? "يُصفّي اقتراحات المؤسسات أدناه"
                          : "Filters school suggestions below"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label={t("builder.school")}
                        value={f.etablissement}
                        onChange={(v) =>
                          updateFormation(idx, "etablissement", v)
                        }
                        list={`ecoles-list-${f.type_etablissement || "all"}`}
                        isTemplateData={isTemplateArrayValue("formations", idx, "etablissement")}
                        id={`edu-${idx}-etablissement`}
                      />
                      <AutocompleteInput
                        label={t("builder.location")}
                        value={f.ville}
                        onChange={(v) => updateFormation(idx, "ville", v)}
                        suggestions={SUGGESTIONS.villes}
                        isTemplateData={isTemplateArrayValue("formations", idx, "ville")}
                        id={`edu-${idx}-ville`}
                      />
                    </div>
                    <AutocompleteInput
                      label={t("builder.mention") || "Mention"}
                      value={f.mention}
                      onChange={(v) => updateFormation(idx, "mention", v)}
                      suggestions={SUGGESTIONS.mentions}
                      isTemplateData={isTemplateArrayValue("formations", idx, "mention")}
                      id={`edu-${idx}-mention`}
                    />

                    {/* Multiple URLs Toggle */}
                    <div className="pt-2">
                      <div className="space-y-4 pt-2">
                        {f.links?.map((link, linkIdx) => (
                          <div
                            key={linkIdx}
                            className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-end bg-surface2/30 p-4 rounded-xl border border-border/50"
                          >
                            <Input
                              label={"Lien URL"}
                              value={link.url}
                              onChange={(v) => {
                                const newLinks = [...(f.links || [])];
                                newLinks[linkIdx].url = v;
                                updateFormation(idx, "links", newLinks);
                              }}
                            />
                            <Input
                              label={"Label du lien"}
                              value={link.label}
                              onChange={(v) => {
                                const newLinks = [...(f.links || [])];
                                newLinks[linkIdx].label = v;
                                updateFormation(idx, "links", newLinks);
                              }}
                            />
                            <button
                              onClick={() => {
                                const newLinks = f.links?.filter(
                                  (_, i) => i !== linkIdx,
                                );
                                updateFormation(idx, "links", newLinks);
                              }}
                              className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all mb-0.5"
                              title="Supprimer ce lien"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          const newLinks = [
                            ...(f.links || []),
                            { url: "", label: "" },
                          ];
                          updateFormation(idx, "links", newLinks);
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/5 text-blue-600 dark:text-blue-400 rounded-full text-[13px] font-bold transition-all hover:bg-blue-600 hover:text-white"
                      >
                        <LinkIcon className="w-4 h-4" />{" "}
                        {t("builder.addLink") ||
                          "Ajouter un lien (Certificat, Portfolio...)"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      /* -- STEP 5: Skills, Languages, Software -- */
      case 5:
        return (
          <motion.div
            key="skills"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-txt mb-2">
                {t("builder.skills")} &amp; {t("builder.languages")}
              </h2>
              <p className="text-txt-muted text-sm">
                {t("builder.skillsDesc") ||
                  "Highlight what makes you stand out."}
              </p>
            </div>

            {/* Skills */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <h3 className="text-base lg:text-xl font-bold text-txt">
                {t("builder.skills")}
              </h3>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-surface2 border border-border rounded-xl px-4 py-2.5 lg:py-3.5 text-sm lg:text-lg text-txt outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-txt-dim"
                  placeholder={t("builder.skillName") || "Skill"}
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  list="skills-suggestions"
                  autoComplete="off"
                />
                <button
                  onClick={addSkill}
                  className="shrink-0 px-4 py-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-bold transition-all hover:bg-blue-600 hover:text-white"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.competences.map((s, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`inline-flex items-center gap-1.5 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-xs lg:text-base font-bold ${
                      isTemplateListItem('competences', s)
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-1 ring-amber-400/40'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {isTemplateListItem('competences', s) && <ExclamationTriangleIcon className="w-3 h-3 animate-pulse" />}
                    {s}
                    <button
                      onClick={() => removeSkill(i)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-txt">
                  {t("builder.languages")}
                </h3>
                <button
                  onClick={addLangue}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs lg:text-base font-bold transition-all hover:bg-blue-600 hover:text-white"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  {t("builder.add")}
                </button>
              </div>
              <div className="space-y-3">
                {formData.langues.map((l, idx) => (
                  <div key={idx} className="bg-surface2/30 rounded-xl p-3 space-y-2 border border-border/50">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          className={`w-full bg-surface2 border rounded-xl px-3 py-2.5 lg:py-3.5 text-sm lg:text-lg text-txt outline-none transition-all focus:border-blue-500 ${
                            isTemplateArrayValue('langues', idx, 'langue') ? 'border-amber-400/50 ring-1 ring-amber-400/30 bg-amber-500/5' : 'border-border'
                          }`}
                          value={l.langue}
                          onChange={(e) =>
                            updateLangue(idx, "langue", e.target.value)
                          }
                          placeholder={t("builder.langName")}
                          list="langues-suggestions"
                          autoComplete="off"
                        />
                        <select
                          className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 lg:py-3.5 text-sm lg:text-lg text-txt outline-none transition-all focus:border-blue-500 form-select-arrow appearance-none"
                          value={l.niveau}
                          onChange={(e) =>
                            updateLangue(idx, "niveau", e.target.value)
                          }
                        >
                          <option value="Natif">
                            {t("builder.level_Natif") || "Natif"}
                          </option>
                          <option value="Courant">
                            {t("builder.level_Courant") || "Courant"}
                          </option>
                          <option value="Intermediaire">
                            {t("builder.level_Intermediaire") || "Intermediaire"}
                          </option>
                          <option value="Technique">
                            {t("builder.level_Technique") || "Technique"}
                          </option>
                          <option value="Debutant">
                            {t("builder.level_Debutant") || "Debutant"}
                          </option>
                        </select>
                      </div>
                      <button
                        onClick={() => removeLangue(idx)}
                        className="self-end sm:self-auto shrink-0 w-10 h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-500/20"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <AutocompleteInput
                      label={language === "fr" ? "Certification" : language === "ar" ? "الشهادة" : "Certification"}
                      value={l.certification || ""}
                      onChange={(v) =>
                        updateLangue(idx, "certification", v)
                      }
                      suggestions={getCertificationsForLanguage(l.langue)}
                      placeholder={language === "fr" ? "Ex: DELF B2, TOEFL 95..." : language === "ar" ? "مثال: DELF B2, TOEFL 95..." : "e.g. DELF B2, TOEFL 95..."}
                      showAllOnFocus
                    />
                    {l.certification && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            className="flex-1 bg-surface2 border border-border rounded-xl px-3 py-2 lg:py-3 text-xs lg:text-base text-txt outline-none transition-all focus:border-blue-500 placeholder:text-txt-dim"
                            value={l.score || ""}
                            onChange={(e) =>
                              updateLangue(idx, "score", e.target.value)
                            }
                            placeholder={language === "fr" ? "Score (ex: 7.5, B2, 95/120...)" : language === "ar" ? "النتيجة (مثال: 7.5, B2...)" : "Score (e.g. 7.5, B2, 95/120...)"}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-3.5 h-3.5 text-txt-muted shrink-0" />
                          <input
                            className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 lg:py-3 text-xs lg:text-base text-txt outline-none transition-all focus:border-blue-500 placeholder:text-txt-dim"
                            value={l.certificationLink || ""}
                            onChange={(e) =>
                              updateLangue(idx, "certificationLink", e.target.value)
                            }
                            placeholder={language === "fr" ? "Lien vers le certificat (URL)" : "Certificate link (URL)"}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Software */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-txt">
                {t("builder.software") || "Logiciels / Outils"}
              </h3>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-surface2 border border-border rounded-xl px-4 py-2.5 lg:py-3.5 text-sm lg:text-lg text-txt outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-txt-dim"
                  placeholder="..."
                  value={newLogiciel}
                  onChange={(e) => setNewLogiciel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLogiciel();
                    }
                  }}
                  list="logiciels-suggestions"
                  autoComplete="off"
                />
                <button
                  onClick={addLogiciel}
                  className="shrink-0 px-4 py-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-bold transition-all hover:bg-blue-600 hover:text-white"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.logiciels.map((s, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1.5 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-xs lg:text-base font-bold ${
                      isTemplateListItem('logiciels', s)
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-1 ring-amber-400/40'
                        : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                    }`}
                  >
                    {isTemplateListItem('logiciels', s) && <ExclamationTriangleIcon className="w-3 h-3 animate-pulse" />}
                    {s}
                    <button
                      onClick={() => removeLogiciel(i)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Hidden datalists for inline inputs */}
            <datalist id="skills-suggestions">
              {Array.from(new Set(SUGGESTIONS.competences)).map((s, i) => (
                <option key={i} value={s} />
              ))}
            </datalist>
            <datalist id="logiciels-suggestions">
              {Array.from(new Set(SUGGESTIONS.logiciels)).map((s, i) => (
                <option key={i} value={s} />
              ))}
            </datalist>
            <datalist id="langues-suggestions">
              {Array.from(new Set(SUGGESTIONS.langues)).map((s, i) => (
                <option key={i} value={s} />
              ))}
            </datalist>
          </motion.div>
        );

      /* -- STEP 6: Design & Customization -- */
      case 6:
        return (
          <motion.div
            key="design"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-txt mb-2">
                {t("builder.design") || "Design & Aesthetics"}
              </h2>
              <p className="text-txt-muted text-sm lg:text-lg">
                {t("builder.designDesc") ||
                  "Fine-tune the typography, colors, and layout of your CV."}
              </p>
            </div>

            {/* Colors: Presets + Custom Pickers */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-txt">
                  {t("builder.colorSystem") || "Color System"}
                </h3>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 mb-4">
                {(shuffledPalettes || COLOR_PALETTES).map((palette) => (
                  <button
                    key={palette.id}
                    onClick={() =>
                      setStyleConfig((prev) => applyPalette(prev, palette))
                    }
                    className={`w-full aspect-square rounded-full transition-all ${styleConfig.primaryColor === palette.primary ? "ring-2 ring-offset-2 ring-offset-surface ring-blue-500 scale-110" : "hover:scale-105"}`}
                    style={{
                      background: `linear-gradient(135deg, ${palette.primary} 50%, ${palette.accent} 50%)`,
                    }}
                    title={palette.name}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                    {t("builder.primaryColor") || "Primary Color"}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                      value={styleConfig.primaryColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStyleConfig((p) =>
                          p.primaryColor === val
                            ? p
                            : { ...p, primaryColor: val, headerBg: val, sidebarBg: val },
                        );
                      }}
                    />
                    <span className="text-xs lg:text-sm font-mono">
                      {styleConfig.primaryColor}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                    {t("builder.accentColor") || "Accent Color"}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                      value={styleConfig.accentColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStyleConfig((p) =>
                          p.accentColor === val
                            ? p
                            : { ...p, accentColor: val, skillBg: hexToRgba(val, 0.1), skillText: val },
                        );
                      }}
                    />
                    <span className="text-xs lg:text-sm font-mono">
                      {styleConfig.accentColor}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                    {t("builder.textColor") || "Text Color"}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                      value={styleConfig.bodyText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStyleConfig((p) => ({
                          ...p,
                          bodyText: val,
                          mutedText: val + 'aa',
                        }));
                      }}
                    />
                    <span className="text-xs lg:text-sm font-mono">
                      {styleConfig.bodyText}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                    {t("builder.bgColor") || "Background"}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                      value={styleConfig.bodyBg}
                      onChange={(e) =>
                        setStyleConfig((p) => ({
                          ...p,
                          bodyBg: e.target.value,
                        }))
                      }
                    />
                    <span className="text-xs lg:text-sm font-mono">
                      {styleConfig.bodyBg}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-txt">
                {t("builder.typography") || "Typography"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                    {t("builder.headingFont") || "Heading Font"}
                  </label>
                  <select
                    className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm text-txt outline-none transition-all focus:border-blue-500 form-select-arrow appearance-none"
                    value={styleConfig.headingFont}
                    onChange={(e) =>
                      setStyleConfig((p) => ({
                        ...p,
                        headingFont: e.target.value,
                      }))
                    }
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.id} value={f.value}>
                        {f.name} ({f.category})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                    {t("builder.bodyFont") || "Body Font"}
                  </label>
                  <select
                    className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm text-txt outline-none transition-all focus:border-blue-500 form-select-arrow appearance-none"
                    value={styleConfig.bodyFont}
                    onChange={(e) =>
                      setStyleConfig((p) => ({
                        ...p,
                        bodyFont: e.target.value,
                      }))
                    }
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.id} value={f.value}>
                        {f.name} ({f.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Layout Options */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-txt">
                {t("builder.structure") || "Structure & Layout"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                    {t("builder.columns") || "Columns"}
                  </label>
                  <select
                    className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm text-txt outline-none transition-all focus:border-blue-500 form-select-arrow appearance-none"
                    value={styleConfig.layoutCols}
                    disabled={activeTemplate === 3}
                    style={activeTemplate === 3 ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
                    onChange={(e) =>
                      setStyleConfig((p) => ({
                        ...p,
                        layoutCols: e.target.value as any,
                      }))
                    }
                  >
                    <option value="1">{t("builder.col1") || "1 Column"}</option>
                    <option value="1fr 1fr">
                      {t("builder.col2_50") || "2 Columns (50/50)"}
                    </option>
                    <option value="1.4fr 1fr">
                      {t("builder.col2_side") || "2 Columns (Sidebar)"}
                    </option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                    {t("builder.fontSize") || "Font Size"}
                  </label>
                  <select
                    className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm text-txt outline-none transition-all focus:border-blue-500 form-select-arrow appearance-none"
                    value={styleConfig.fontSize}
                    onChange={(e) =>
                      setStyleConfig((p) => ({
                        ...p,
                        fontSize: e.target.value as any,
                      }))
                    }
                  >
                    <option value="tiny">
                      {t("builder.fsTiny") || "Tiny"} (9.5px)
                    </option>
                    <option value="compact">
                      {t("builder.fsCompact") || "Compact"} (11px)
                    </option>
                    <option value="default">
                      {t("builder.fsDefault") || "Default"} (12px)
                    </option>
                    <option value="large">
                      {t("builder.fsLarge") || "Large"} (13px)
                    </option>
                    <option value="xlarge">
                      {t("builder.fsXlarge") || "X-Large"} (14px)
                    </option>
                    <option value="xxl">
                      {t("builder.fsXxl") || "XXL"} (15.5px)
                    </option>
                    <option value="jumbo">
                      {t("builder.fsJumbo") || "Jumbo"} (17px)
                    </option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                    {t("builder.spacing") || "Spacing"}
                  </label>
                  <select
                    className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm text-txt outline-none transition-all focus:border-blue-500 form-select-arrow appearance-none"
                    value={styleConfig.spacing}
                    onChange={(e) =>
                      setStyleConfig((p) => ({
                        ...p,
                        spacing: e.target.value as any,
                      }))
                    }
                  >
                    <option value="extra-tight">
                      {t("builder.extraTight") || "Extra Tight"}
                    </option>
                    <option value="tight">
                      {t("builder.tight") || "Tight"}
                    </option>
                    <option value="default">
                      {t("builder.defaultSpacing") || "Default"}
                    </option>
                    <option value="relaxed">
                      {t("builder.relaxed") || "Relaxed"}
                    </option>
                    <option value="airy">
                      {t("builder.airy") || "Airy"}
                    </option>
                    <option value="ultra">
                      {t("builder.ultra") || "Ultra"}
                    </option>
                    <option value="maximum">
                      {t("builder.maximum") || "Maximum"}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section Ordering (Drag & Drop) */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-txt">
                  {t("builder.sectionOrdering") || "Section Ordering"}
                </h3>
                <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-1 rounded-full font-bold">
                  {t("builder.dragReorder") || "Drag to reorder"}
                </span>
              </div>
              <div
                className={`grid gap-4 ${styleConfig.layoutCols === "1" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}
              >
                {/* Main Column */}
                <div
                  className="flex flex-col gap-2 p-3 bg-surface2/50 border border-dashed border-border rounded-xl min-h-[100px]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    try {
                      const data = e.dataTransfer.getData("application/json");
                      if (!data) return;
                      const { listType, index } = JSON.parse(data);
                      if (listType === "main") return; // Handled by item drop if dropping on an item
                      // Dropping from side to main (at the end)
                      setStyleConfig((p) => {
                        const newMain = [...(p.mainOrder || [])];
                        const newSide = [...(p.sideOrder || [])];
                        const [item] = newSide.splice(index, 1);
                        newMain.push(item);
                        return { ...p, mainOrder: newMain, sideOrder: newSide };
                      });
                    } catch (err) {}
                  }}
                >
                  <div className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-1">
                    {styleConfig.layoutCols === "1"
                      ? t("builder.topContent") || "Top Content"
                      : t("builder.mainColumn") || "Main Column"}
                  </div>
                  {(styleConfig.mainOrder || []).map((section, index) => (
                    <div
                      key={`main-${section}`}
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData(
                          "application/json",
                          JSON.stringify({ listType: "main", index }),
                        )
                      }
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          const { listType, index: fromIndex } = JSON.parse(
                            e.dataTransfer.getData("application/json"),
                          );
                          setStyleConfig((p) => {
                            const newMain = [...(p.mainOrder || [])];
                            const newSide = [...(p.sideOrder || [])];
                            if (listType === "main") {
                              const [moved] = newMain.splice(fromIndex, 1);
                              newMain.splice(index, 0, moved);
                            } else {
                              const [moved] = newSide.splice(fromIndex, 1);
                              newMain.splice(index, 0, moved);
                            }
                            return {
                              ...p,
                              mainOrder: newMain,
                              sideOrder: newSide,
                            };
                          });
                        } catch (err) {}
                      }}
                      className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl cursor-grab active:cursor-grabbing hover:border-blue-500/30 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-txt-muted shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8h16M4 16h16"
                        />
                      </svg>
                      <span className="font-medium text-sm text-txt capitalize flex-1">
                        {t(`builder.${section}`) || section}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setStyleConfig(p => { const arr = [...(p.mainOrder || [])]; if (index <= 0) return p; [arr[index], arr[index-1]] = [arr[index-1], arr[index]]; return { ...p, mainOrder: arr }; }); }}
                          disabled={index === 0}
                          className="w-6 h-6 rounded-md bg-surface2 flex items-center justify-center text-txt-muted hover:text-blue-500 transition-all disabled:opacity-30"
                        >
                          <ChevronUpIcon className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setStyleConfig(p => { const arr = [...(p.mainOrder || [])]; if (index >= arr.length - 1) return p; [arr[index], arr[index+1]] = [arr[index+1], arr[index]]; return { ...p, mainOrder: arr }; }); }}
                          disabled={index === (styleConfig.mainOrder || []).length - 1}
                          className="w-6 h-6 rounded-md bg-surface2 flex items-center justify-center text-txt-muted hover:text-blue-500 transition-all disabled:opacity-30"
                        >
                          <ChevronDownIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Side Column */}
                <div
                  className="flex flex-col gap-2 p-3 bg-surface2/50 border border-dashed border-border rounded-xl min-h-[100px]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    try {
                      const data = e.dataTransfer.getData("application/json");
                      if (!data) return;
                      const { listType, index } = JSON.parse(data);
                      if (listType === "side") return;
                      setStyleConfig((p) => {
                        const newMain = [...(p.mainOrder || [])];
                        const newSide = [...(p.sideOrder || [])];
                        const [item] = newMain.splice(index, 1);
                        newSide.push(item);
                        return { ...p, mainOrder: newMain, sideOrder: newSide };
                      });
                    } catch (err) {}
                  }}
                >
                  <div className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-1">
                    {styleConfig.layoutCols === "1"
                      ? t("builder.bottomContent") || "Bottom Content"
                      : t("builder.sidebarColumn") || "Sidebar Column"}
                  </div>
                  {(styleConfig.sideOrder || []).map((section, index) => (
                    <div
                      key={`side-${section}`}
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData(
                          "application/json",
                          JSON.stringify({ listType: "side", index }),
                        )
                      }
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          const { listType, index: fromIndex } = JSON.parse(
                            e.dataTransfer.getData("application/json"),
                          );
                          setStyleConfig((p) => {
                            const newMain = [...(p.mainOrder || [])];
                            const newSide = [...(p.sideOrder || [])];
                            if (listType === "side") {
                              const [moved] = newSide.splice(fromIndex, 1);
                              newSide.splice(index, 0, moved);
                            } else {
                              const [moved] = newMain.splice(fromIndex, 1);
                              newSide.splice(index, 0, moved);
                            }
                            return {
                              ...p,
                              mainOrder: newMain,
                              sideOrder: newSide,
                            };
                          });
                        } catch (err) {}
                      }}
                      className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl cursor-grab active:cursor-grabbing hover:border-blue-500/30 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-txt-muted shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8h16M4 16h16"
                        />
                      </svg>
                      <span className="font-medium text-sm text-txt capitalize flex-1">
                        {t(`builder.${section}`) || section}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setStyleConfig(p => { const arr = [...(p.sideOrder || [])]; if (index <= 0) return p; [arr[index], arr[index-1]] = [arr[index-1], arr[index]]; return { ...p, sideOrder: arr }; }); }}
                          disabled={index === 0}
                          className="w-6 h-6 rounded-md bg-surface2 flex items-center justify-center text-txt-muted hover:text-blue-500 transition-all disabled:opacity-30"
                        >
                          <ChevronUpIcon className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setStyleConfig(p => { const arr = [...(p.sideOrder || [])]; if (index >= arr.length - 1) return p; [arr[index], arr[index+1]] = [arr[index+1], arr[index]]; return { ...p, sideOrder: arr }; }); }}
                          disabled={index === (styleConfig.sideOrder || []).length - 1}
                          className="w-6 h-6 rounded-md bg-surface2 flex items-center justify-center text-txt-muted hover:text-blue-500 transition-all disabled:opacity-30"
                        >
                          <ChevronDownIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );

      /* -- STEP 7: Preview -- */
      case 7:
        return (
          <motion.div
            key="preview"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-txt mb-2">
                  {t("builder.preview")}
                </h2>
                <p className="text-txt-muted text-sm">
                  {t("builder.previewDesc") ||
                    "Review your CV and export when ready."}
                </p>
              </div>
              <button
                onClick={handlePrint}
                disabled={isDownloading}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/30 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowDownTrayIcon className="w-4 h-4" />
                )}
                {isDownloading ? "..." : t("builder.download")}
              </button>
            </div>

            {/* Save CV / Login prompt — right after download button */}
            {isAuthenticated ? (
              <div className="rounded-2xl border border-border/60 bg-surface overflow-hidden">
                {/* Status bar */}
                <div
                  className={`px-6 py-4 flex items-center gap-3 ${savedCvId ? "bg-emerald-50 dark:bg-emerald-500/10 border-b border-emerald-100 dark:border-emerald-500/20" : "bg-blue-50 dark:bg-blue-500/10 border-b border-blue-100 dark:border-blue-500/20"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${savedCvId ? "bg-emerald-500" : "bg-blue-500"}`}
                  >
                    {savedCvId ? (
                      <CheckIcon className="w-4.5 h-4.5 text-white" />
                    ) : (
                      <CloudArrowUpIcon className="w-4.5 h-4.5 text-white" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-bold ${savedCvId ? "text-emerald-800 dark:text-emerald-400" : "text-blue-800 dark:text-blue-400"}`}
                    >
                      {savedCvId
                        ? (
                            t("builder.cvSaved") || "CV saved to your account!"
                          ).replace("✓ ", "")
                        : t("builder.saveYourCV") ||
                          "Save this CV to your account"}
                    </p>
                    <p className="text-xs text-txt-muted mt-0.5">
                      {savedCvId
                        ? t("builder.cvSavedDesc") ||
                          "You can edit and download it anytime from your dashboard."
                        : t("builder.saveYourCVDesc") ||
                          "Keep your progress and access it from your dashboard anytime."}
                    </p>
                  </div>
                </div>

                {/* Form */}
                <div className="p-5 sm:p-6 space-y-5">
                  {/* Inputs row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                        {t("builder.cvTitleLabel") || "CV Title"}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          t("builder.cvTitlePlaceholder") ||
                          "e.g. Frontend Dev - Tech Corp"
                        }
                        value={cvTitle}
                        onChange={(e) => setCvTitle(e.target.value)}
                        className="w-full bg-surface2/50 border border-border rounded-xl px-4 py-2.5 text-sm text-txt font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                        <BellIcon className="w-3.5 h-3.5 text-blue-500" />
                        {t("builder.reminderLabel") || "Update Reminder"}
                      </label>
                      <input
                        type="date"
                        value={reminderDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setReminderDate(e.target.value)}
                        className="w-full bg-surface2/50 border border-border rounded-xl px-4 py-2.5 text-sm text-txt font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Buttons row */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-3 pt-1">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-border text-txt text-sm font-semibold transition-all hover:bg-surface2"
                    >
                      {t("builder.goToDashboard") || "My Dashboard"}
                    </Link>
                    <button
                      onClick={saveCV}
                      disabled={isSaving}
                      className="inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold transition-all hover:bg-emerald-700 active:scale-[0.97] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : savedCvId ? (
                        <CheckIcon className="w-4 h-4" />
                      ) : null}
                      {isSaving
                        ? t("builder.saving") || "Saving..."
                        : savedCvId
                          ? t("builder.updateCV") || "Update CV"
                          : t("builder.saveCV") || "Save CV"}
                    </button>
                  </div>

                  {saveError && (
                    <p className="text-sm text-red-500 font-medium">
                      {saveError}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-3xl p-6 sm:p-8 flex flex-col xl:flex-row items-center justify-between gap-6 text-center xl:text-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-txt mb-1">
                    {t("builder.saveCVTitle") ||
                      "Want to save your CV for later?"}
                  </h3>
                  <p className="text-sm text-txt-muted">
                    {t("builder.saveCVDesc") ||
                      "Create an account to save your progress, edit later, and unlock more templates."}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto xl:w-auto shrink-0 justify-center">
                  <button
                    onClick={() => {
                      // Save current CV to localStorage before navigating
                      const pendingCV = {
                        formData,
                        activeTemplate,
                        styleConfig,
                        cvTitle: cvTitle || `CV ${formData.prenom || ''} ${formData.nom || ''}`.trim(),
                        savedAt: new Date().toISOString(),
                      };
                      localStorage.setItem('oosira_pending_cv', JSON.stringify(pendingCV));
                      router.push('/login');
                    }}
                    className="flex-1 sm:flex-none text-center px-5 py-2.5 rounded-xl border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-semibold transition-all hover:bg-blue-500/10 hover:border-blue-500/40"
                  >
                    {t("nav.login") || "Log In"}
                  </button>
                  <button
                    onClick={() => {
                      // Save current CV to localStorage before navigating
                      const pendingCV = {
                        formData,
                        activeTemplate,
                        styleConfig,
                        cvTitle: cvTitle || `CV ${formData.prenom || ''} ${formData.nom || ''}`.trim(),
                        savedAt: new Date().toISOString(),
                      };
                      localStorage.setItem('oosira_pending_cv', JSON.stringify(pendingCV));
                      router.push('/register');
                    }}
                    className="flex-1 sm:flex-none text-center px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95 shadow-md shadow-blue-500/20"
                  >
                    {t("nav.signup") || "Sign Up"}
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-6">
              {/* Zoom Controls + Page Info */}
              <div className="hidden lg:flex items-center justify-center gap-4 bg-surface/50 backdrop-blur-md py-2 px-4 rounded-full border border-border w-fit mx-auto">
                <button
                  onClick={() =>
                    setPreviewZoom(
                      Math.max(0.3, +(previewZoom - 0.1).toFixed(1)),
                    )
                  }
                  className="p-1.5 hover:bg-surface2 rounded-full transition-colors text-txt-muted hover:text-txt"
                >
                  <MinusIcon className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-txt tabular-nums w-12 text-center">
                  {Math.round(previewZoom * 100)}%
                </span>
                <button
                  onClick={() =>
                    setPreviewZoom(
                      Math.min(1.2, +(previewZoom + 0.1).toFixed(1)),
                    )
                  }
                  className="p-1.5 hover:bg-surface2 rounded-full transition-colors text-txt-muted hover:text-txt"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-border" />
                <span className="text-[10px] font-bold text-txt-muted uppercase tracking-wider">
                  {totalPages} {totalPages === 1 ? "page" : "pages"}
                </span>
              </div>

              {/* Desktop preview — paginated A4 sheets */}
              <div className={`hidden lg:flex flex-col ${previewZoom > 0.8 ? 'items-start' : 'items-center'} gap-8 py-8 px-4 bg-surface2/30 rounded-3xl border border-border min-h-[500px] overflow-auto custom-scrollbar`}>
                <div className={`flex flex-col ${previewZoom > 0.8 ? 'items-start mx-auto' : 'items-center'} gap-6`} dir={dir} onDoubleClick={handlePreviewDoubleClick}>
                  {renderPaginatedSheets(previewZoom)}
                </div>
              </div>

              {/* Mobile preview — pinch-to-zoom A4 sheets */}
              <div className="lg:hidden">
                <div className="bg-surface2/30 rounded-2xl border border-border overflow-hidden" style={{ height: "55vh" }}>
                  <PinchZoomPreview minScale={0.3} maxScale={2.5} initialScale={0.48}>
                    <div
                      className="flex flex-col items-center gap-4"
                      style={{
                        margin: "0 auto",
                        width: Math.round(A4_WIDTH * 0.48),
                        maxWidth: "100%",
                      }}
                      dir={dir}
                    >
                      {renderPaginatedSheets(0.48)}
                    </div>
                  </PinchZoomPreview>
                </div>
                <p className="text-center text-xs text-txt-dim mt-2">
                  🤏 {language === "fr" ? "Pincez pour zoomer, double-tap pour réinitialiser" : language === "ar" ? "اضغط بإصبعين للتكبير، انقر مرتين للإعادة" : "Pinch to zoom, double-tap to reset"}
                </p>
              </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <>
      {/* ── Guest Sign-Up Overlay ── */}
      <AnimatePresence>
        {showGuestOverlay && !isAuthenticated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md px-4"
            onClick={() => setShowGuestOverlay(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-xl bg-surface border border-border rounded-3xl shadow-2xl shadow-black/25 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated gradient accent */}
              <div className="h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]" />

              <div className="p-7 sm:p-9">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600/10 to-cyan-500/10 border border-blue-500/15 flex items-center justify-center">
                    <CloudArrowUpIcon className="w-7 h-7 text-blue-500" />
                  </div>
                </div>

                {/* Title & Description */}
                <h2 className="text-[22px] font-bold text-txt text-center mb-2 tracking-tight">
                  {t('builder.guestOverlayTitle')}
                </h2>
                <p className="text-[13px] text-txt-muted text-center mb-7 leading-relaxed max-w-xs mx-auto">
                  {t('builder.guestOverlayDesc')}
                </p>

                {/* Feature grid with Heroicons */}
                <div className="grid grid-cols-2 gap-2.5 mb-8">
                  {[
                    { Icon: CloudArrowUpIcon, text: t('builder.guestFeature1'), color: 'text-blue-500 bg-blue-500/8 border-blue-500/10' },
                    { Icon: PencilSquareIcon, text: t('builder.guestFeature2'), color: 'text-cyan-500 bg-cyan-500/8 border-cyan-500/10' },
                    { Icon: SwatchIcon, text: t('builder.guestFeature3'), color: 'text-violet-500 bg-violet-500/8 border-violet-500/10' },
                    { Icon: ArrowDownTrayIcon, text: t('builder.guestFeature4'), color: 'text-emerald-500 bg-emerald-500/8 border-emerald-500/10' },
                  ].map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.06 }}
                      className={`flex items-center gap-2.5 text-[12px] font-medium rounded-xl px-3.5 py-3 border ${f.color}`}
                    >
                      <f.Icon className="w-4 h-4 shrink-0" />
                      <span className="text-txt-muted">{f.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const pendingCV = {
                        formData,
                        activeTemplate,
                        styleConfig,
                        cvTitle: cvTitle || `CV ${formData.prenom || ''} ${formData.nom || ''}`.trim(),
                        savedAt: new Date().toISOString(),
                      };
                      localStorage.setItem('oosira_pending_cv', JSON.stringify(pendingCV));
                      router.push('/register');
                    }}
                    className="group relative flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-white font-semibold text-[14px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 overflow-hidden cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-[length:200%_auto] bg-left group-hover:bg-right transition-all duration-700 z-0" />
                    <div className="absolute top-0 -left-[150%] group-hover:left-[150%] w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 transition-all duration-700 z-0 pointer-events-none" />
                    <span className="relative z-10">{t('nav.signup')}</span>
                  </button>
                  <button
                    onClick={() => {
                      const pendingCV = {
                        formData,
                        activeTemplate,
                        styleConfig,
                        cvTitle: cvTitle || `CV ${formData.prenom || ''} ${formData.nom || ''}`.trim(),
                        savedAt: new Date().toISOString(),
                      };
                      localStorage.setItem('oosira_pending_cv', JSON.stringify(pendingCV));
                      router.push('/login');
                    }}
                    className="flex-1 px-5 py-3.5 rounded-xl border border-border text-txt font-semibold text-[14px] transition-all duration-200 hover:bg-surface2 hover:border-blue-500/30 active:scale-[0.98] cursor-pointer"
                  >
                    {t('nav.login')}
                  </button>
                </div>

                {/* Dismiss link */}
                <button
                  onClick={() => setShowGuestOverlay(false)}
                  className="w-full mt-5 text-[12px] text-txt-dim hover:text-txt-muted transition-colors text-center py-1.5 cursor-pointer group"
                >
                  <span className="border-b border-transparent group-hover:border-txt-dim/40 pb-0.5 transition-all">
                    {t('builder.guestDismiss')}
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col h-screen h-[100dvh] bg-bg text-txt overflow-hidden overflow-x-hidden">
        {/* -- Premium Top Bar -- */}
        <header className="h-16 min-h-[64px] flex items-center justify-between px-4 sm:px-6 bg-surface/80 backdrop-blur-xl border-b border-border z-50 shadow-sm">
          <Link
            href="/dashboard"
            dir="ltr"
            className="flex flex-row items-end group select-none hover:opacity-80 transition-opacity"
          >
            {/* Beautiful Custom SVG Infinity Logo from Hero Section */}
            <svg
              width="36"
              height="20"
              viewBox="1 6 22 12"
              className="text-blue-600 dark:text-blue-500 transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] overflow-visible mb-1"
            >
              <defs>
                <linearGradient
                  id="infinityGradientBuilder"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="currentColor" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <path
                d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"
                fill="none"
                stroke="url(#infinityGradientBuilder)"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[32px] font-display font-bold text-txt leading-none ml-1">
              sira
            </span>
          </Link>

          {/* Desktop stepper in header */}
          <div className="hidden md:flex items-center gap-1">
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;
              return (
                <button
                  key={step.id}
                  onClick={() => goTo(idx)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-base font-bold transition-all duration-300 ${
                    isActive
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm"
                      : isCompleted
                        ? "text-blue-500/70 hover:bg-blue-500/5"
                        : "text-txt-dim hover:text-txt-muted hover:bg-surface2"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-blue-500 text-white"
                        : isActive
                          ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                          : ""
                    }`}
                  >
                    {isCompleted ? (
                      <CheckIcon className="w-3.5 h-3.5" />
                    ) : (
                      <StepIcon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className="hidden lg:inline">{stepLabel(step.id)}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleSaveAndExit}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[11px] font-bold hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <span className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <BookmarkIcon className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {t("builder.saveAndExit") || "Save & Exit"}
              </span>
              <span className="sm:hidden">{t("builder.save") || "Save"}</span>
            </button>
            <ThemeToggle />
            <LanguageToggle />
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full text-[11px] font-bold">
              <Squares2X2Icon className="w-3.5 h-3.5" />
              {TEMPLATE_NAMES[activeTemplate]}
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* -- Main content area -- */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile step indicator */}
            <div className="md:hidden flex items-center gap-1 px-4 py-3 bg-surface border-b border-border overflow-x-auto">
              {STEPS.map((step, idx) => {
                const isActive = idx === currentStep;
                const isCompleted = idx < currentStep;
                return (
                  <button
                    key={step.id}
                    onClick={() => goTo(idx)}
                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                      isActive
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : isCompleted
                          ? "text-blue-500/70"
                          : "text-txt-dim"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? "bg-blue-500 text-white"
                          : isActive
                            ? "bg-blue-500/20"
                            : "bg-surface2"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckIcon className="w-2.5 h-2.5" />
                      ) : (
                        <span className="text-[8px]">{idx + 1}</span>
                      )}
                    </div>
                    {isActive && <span>{stepLabel(step.id)}</span>}
                  </button>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-surface2 shrink-0">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-500"
                initial={{ width: "0%" }}
                animate={{
                  width: `${((currentStep + 1) / STEPS.length) * 100}%`,
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>

            {/* Mobile Navigation (Fixed to Top on Mobile, right below progress bar) */}
            <div className="lg:hidden shrink-0 border-b border-border bg-surface px-4 py-2.5 z-30 shadow-sm">
              <div className="flex items-center justify-between">
                <button
                  onClick={prev}
                  disabled={currentStep === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed text-txt hover:bg-surface2 active:scale-95"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5 rtl:rotate-180" />
                  <span>{t("builder.back")}</span>
                </button>

                <div className="flex items-center gap-1 text-[11px] text-txt-muted font-semibold">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    {currentStep + 1}
                  </span>
                  <span>/</span>
                  <span>{STEPS.length}</span>
                </div>

                {currentStep < STEPS.length - 1 ? (
                  <button
                    onClick={next}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95"
                  >
                    <span>
                      {currentStep === STEPS.length - 2
                        ? language === "fr"
                          ? "Aperçu"
                          : language === "ar"
                            ? "معاينة"
                            : "Preview"
                        : language === "fr"
                          ? "Suivant"
                          : language === "ar"
                            ? "التالي"
                            : "Next"}
                    </span>
                    <ArrowRightIcon className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                ) : (
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95"
                  >
                    <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                    <span>
                      {t("builder.download")}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Step content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={pageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {renderStepContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom navigation */}
            <div className="hidden lg:block shrink-0 sticky bottom-0 z-30 border-t border-border bg-surface/80 backdrop-blur-xl px-4 sm:px-6 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] sm:py-4">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <button
                  onClick={prev}
                  disabled={currentStep === 0}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed text-txt hover:bg-surface2 active:scale-95"
                >
                  <ArrowLeftIcon className="w-4 h-4 rtl:rotate-180" />
                  <span className="hidden sm:inline">{t("builder.back")}</span>
                </button>

                <div className="flex items-center gap-2 text-xs text-txt-muted font-medium">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    {currentStep + 1}
                  </span>
                  <span>/</span>
                  <span>{STEPS.length}</span>
                </div>

                {currentStep < STEPS.length - 1 ? (
                  <button
                    onClick={next}
                    className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full text-sm font-bold shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-0.5 active:scale-95"
                  >
                    <span className="hidden sm:inline">
                      {currentStep === STEPS.length - 2
                        ? language === "fr"
                          ? "Aperçu"
                          : language === "ar"
                            ? "معاينة"
                            : "Preview"
                        : language === "fr"
                          ? "Suivant"
                          : language === "ar"
                            ? "التالي"
                            : "Next"}
                    </span>
                    <ArrowRightIcon className="w-4 h-4 rtl:rotate-180" />
                  </button>
                ) : (
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full text-sm font-bold shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-0.5 active:scale-95"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {t("builder.download")}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* -- Desktop Live Preview Sidebar -- */}
          {currentStep < 7 && (
            <>
              {/* Drag handle */}
              <div
                onMouseDown={startDragSidebar}
                className="hidden xl:flex items-center justify-center w-2 cursor-col-resize hover:bg-blue-500/20 active:bg-blue-500/30 transition-colors group"
                title="Drag to resize"
              >
                <div className="w-0.5 h-8 rounded-full bg-border group-hover:bg-blue-500 transition-colors" />
              </div>
              <div
                className="hidden xl:flex flex-col border-s border-border bg-surface2 shrink-0"
                style={{ width: sidebarWidth }}
              >
              <div className="py-3 px-4 border-b border-border bg-surface flex items-center justify-between">
                <span className="text-[10px] font-bold text-txt-muted uppercase tracking-widest">
                  {t("builder.preview")} {TEMPLATE_NAMES[activeTemplate]}
                </span>
                <button
                  onClick={() => goTo(7)}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t("builder.fullScreen") || "Full Screen →"}
                </button>
              </div>
              {/* Zoom controls */}
              <div className="flex items-center justify-center gap-3 py-2 px-3 border-b border-border bg-surface/50">
                <button
                  onClick={() =>
                    setSidePreviewZoom(
                      Math.max(0.3, +(sidePreviewZoom - 0.05).toFixed(2)),
                    )
                  }
                  className="p-1 hover:bg-surface2 rounded-full transition-colors text-txt-muted hover:text-txt"
                >
                  <MinusIcon className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-bold text-txt tabular-nums w-10 text-center">
                  {Math.round(sidePreviewZoom * 100)}%
                </span>
                <button
                  onClick={() =>
                    setSidePreviewZoom(
                      Math.min(1.2, +(sidePreviewZoom + 0.05).toFixed(2)),
                    )
                  }
                  className="p-1 hover:bg-surface2 rounded-full transition-colors text-txt-muted hover:text-txt"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-3 bg-border" />
                <span className="text-[9px] font-bold text-txt-muted uppercase tracking-wider">
                  {totalPages} {totalPages === 1 ? "page" : "pages"}
                </span>
              </div>
              {renderWarnings()}
              {renderTemplateOverlay()}
              <div className="flex-1 overflow-auto preview-scrollbar p-4">
                <div className="flex flex-col items-center gap-4 min-w-fit" dir={dir} onDoubleClick={handlePreviewDoubleClick}>
                  {renderPaginatedSheets(sidePreviewZoom)}
                </div>
              </div>
              </div>
            </>
          )}
        </div>

        {/* -- Mobile floating preview button -- */}
        {currentStep < 7 && (
          <button
            onClick={() => setMobilePreviewOpen(true)}
            className="xl:hidden fixed bottom-24 end-4 z-40 w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
        )}

        {/* -- Mobile preview modal -- */}
        <AnimatePresence>
          {mobilePreviewOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="xl:hidden fixed inset-0 z-50 bg-bg/95 backdrop-blur-xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-bold text-txt">
                  {t("builder.preview")}
                </span>
                <button
                  onClick={() => setMobilePreviewOpen(false)}
                  className="w-8 h-8 rounded-full bg-surface2 border border-border flex items-center justify-center text-txt hover:bg-surface transition-all"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              {renderWarnings()}
              {renderTemplateOverlay()}
              <div className="flex-1 overflow-hidden">
                <PinchZoomPreview minScale={0.3} maxScale={2.5} initialScale={0.5}>
                  <div className="flex flex-col items-center gap-4 max-w-full" dir={dir} onDoubleClick={handlePreviewDoubleClick}>
                    {renderPaginatedSheets(0.5)}
                  </div>
                </PinchZoomPreview>
              </div>
              <p className="text-center text-xs text-txt-dim py-2">
                🤏 {language === "fr" ? "Pincez pour zoomer, double-tap pour réinitialiser" : language === "ar" ? "اضغط بإصبعين للتكبير، انقر مرتين للإعادة" : "Pinch to zoom, double-tap to reset"}
              </p>
              <div className="p-4 border-t border-border">
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-500/25"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  {t("builder.download")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden full-render div for measuring content height + PDF capture */}
      <div
        ref={cvMeasureRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          insetInlineStart: "-9999px",
          top: 0,
          width: A4_WIDTH,
          overflow: "visible",
          pointerEvents: "none",
          zIndex: -1,
          visibility: "hidden",
        }}
        dir={dir}
      >
        {renderCVFull()}
      </div>

      <datalist id="ecoles-list-all">
        {ecolesList.map((ecole) => (
          <option key={ecole} value={ecole} />
        ))}
      </datalist>
      <datalist id="ecoles-list-lycee">
        {ecolesData.lycee.map((ecole) => (
          <option key={ecole} value={ecole} />
        ))}
      </datalist>
      <datalist id="ecoles-list-univ">
        {ecolesData.univ.map((ecole) => (
          <option key={ecole} value={ecole} />
        ))}
      </datalist>
      <datalist id="ecoles-list-institut">
        {ecolesData.institut.map((ecole) => (
          <option key={ecole} value={ecole} />
        ))}
      </datalist>
      <datalist id="ecoles-list-formation">
        {ecolesData.formation.map((ecole) => (
          <option key={ecole} value={ecole} />
        ))}
      </datalist>
      <datalist id="ecoles-list-prive">
        {ecolesData.prive.map((ecole) => (
          <option key={ecole} value={ecole} />
        ))}
      </datalist>
    </>
  );
}
