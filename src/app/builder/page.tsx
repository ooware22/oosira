'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import {
  candidates,
  Candidate,
  Formation,
  Experience,
  Langue,
  TEMPLATE_NAMES,
} from '../data';
import { CVClassique, CVIngenieur, CVCadre, CVMedical, CVTech } from '../templates';
import { CVStyleConfig, TEMPLATE_DEFAULTS, applyPalette, styleToCSSVars, COLOR_PALETTES, FONT_OPTIONS } from '../templates/styleConfig';
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
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { ThemeToggle, LanguageToggle } from '@/components/Toggles';

/* ── Constants ── */
const CANDIDATE_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'cog': CogIcon,
  'chart-bar': ChartBarIcon,
  'clipboard-document': ClipboardDocumentIcon,
  'command-line': CommandLineIcon,
  'heart': HeartIcon,
};

const STEPS = [
  { id: 'template', icon: Squares2X2Icon },
  { id: 'personal', icon: UserIcon },
  { id: 'summary', icon: DocumentTextIcon },
  { id: 'experience', icon: BriefcaseIcon },
  { id: 'education', icon: AcademicCapIcon },
  { id: 'skills', icon: SparklesIcon },
  { id: 'design', icon: SwatchIcon },
  { id: 'preview', icon: EyeIcon },
];

const STEP_LABELS: Record<string, Record<string, string>> = {
  template: { en: 'Template', fr: 'Modèle', ar: 'القالب' },
  personal: { en: 'Personal Info', fr: 'Informations', ar: 'المعلومات' },
  summary: { en: 'Summary', fr: 'Résumé', ar: 'الملخص' },
  experience: { en: 'Experience', fr: 'Expériences', ar: 'الخبرات' },
  education: { en: 'Education', fr: 'Formations', ar: 'التعليم' },
  skills: { en: 'Skills & More', fr: 'Compétences', ar: 'المهارات' },
  design: { en: 'Design', fr: 'Design', ar: 'تصميم' },
  preview: { en: 'Preview', fr: 'Aperçu', ar: 'معاينة' },
};

/* ── Animation variants ── */
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

/* ── Input component ── */
function Input({ label, value, onChange, placeholder, type = 'text', list }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; list?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        list={list}
        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-txt outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-txt-dim"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: {id: string, label: string}[]
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-txt outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      >
        <option value="">Sélectionnez le type...</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-txt outline-none resize-y transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-txt-dim font-body"
      />
    </div>
  );
}

/* ── Main Builder Component ── */
export default function BuilderPage() {
  const { t, dir, language } = useLanguage();
  const [[currentStep, direction], setStep] = useState([0, 0]);
  const [activeCandidate, setActiveCandidate] = useState(-1);
  const [activeTemplate, setActiveTemplate] = useState(1);
  const [styleConfig, setStyleConfig] = useState<CVStyleConfig>(TEMPLATE_DEFAULTS[1]);
  const [formData, setFormData] = useState<Candidate>({
    id: -1,
    prenom: '', nom: '', titre: '', email: '', telephone: '', ville: '', linkedin: '', accroche: '',
    formations: [], experiences: [], competences: [], langues: [], logiciels: [],
    iconName: 'document', cardColor: '#64748b', recommendedTemplate: 1,
  });
  const [newSkill, setNewSkill] = useState('');
  const [newLogiciel, setNewLogiciel] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [ecolesList, setEcolesList] = useState<string[]>([]);
  const [ecolesData, setEcolesData] = useState<{ [key: string]: string[] }>({ lycee: [], univ: [], institut: [], formation: [], prive: [] });
  const previewRef = useRef<HTMLDivElement>(null);

  /* OCR State Integration */
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrProcessing(true);
    try {
      // 1. Upload to OCR backend
      const dataForm = new FormData();
      dataForm.append('file', file);
      
      const uploadRes = await fetch('http://localhost:8500/api/upload', {
        method: 'POST',
        body: dataForm
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.file_id) throw new Error(uploadData.detail?.message || 'Upload failed');
      
      // 2. Analyze
      const analyzeRes = await fetch(`http://localhost:8500/api/analyze/${uploadData.file_id}`, {
        method: 'POST'
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeData.cv_data) throw new Error(analyzeData.detail?.message || 'Analysis failed');
      
      const cvData = analyzeData.cv_data;

      // 3. Map to Oosira state
      const rawTechnical = cvData.skills.technical || [];
      const rawSoft = cvData.skills.soft || [];
      const allRawSkills = [...rawTechnical, ...rawSoft];

      // A skill is usually a short word or phrase. If it's too long (>45 chars) or has bullet points, the OCR misclassified an experience block!
      const cleanCompetences = allRawSkills.filter((s: string) => s.length < 45 && !s.startsWith('•') && !s.startsWith('-'));
      const misclassifiedLongText = allRawSkills.filter((s: string) => s.length >= 45 || s.startsWith('•') || s.startsWith('-'));

      let mappedExperiences = cvData.experience.map((e: any) => ({
        poste: e.job_title || '',
        entreprise: e.company || '',
        secteur: e.company_description || '',
        dateDebut: e.start_date || '',
        dateFin: e.is_current ? 'En cours' : e.end_date || '',
        description: e.description || '',
      }));

      // Rescue misclassified text into a generic experience block so the user doesn't lose their data and the UI doesn't break
      if (misclassifiedLongText.length > 0) {
        mappedExperiences.push({
          poste: 'Expériences (à trier)',
          entreprise: 'Import OCR',
          secteur: '',
          dateDebut: '',
          dateFin: '',
          description: misclassifiedLongText.join('\n'),
        });
      }

      const mapped: Candidate = {
        id: -2,
        prenom: cvData.personal_info.first_name || '',
        nom: cvData.personal_info.last_name || '',
        titre: cvData.professional_title || '',
        email: cvData.personal_info.email || '',
        telephone: cvData.personal_info.phone || '',
        ville: cvData.personal_info.city || '',
        linkedin: cvData.personal_info.linkedin || '',
        accroche: cvData.summary || '',
        formations: cvData.education.map((e: any) => ({
          diplome: e.degree || '',
          specialite: e.field_of_study || '',
          etablissement: e.institution || '',
          ville: e.location || '',
          annee: e.start_date || e.end_date ? `${e.start_date} ${e.end_date}`.trim() : '',
          mention: e.grade || '',
        })),
        experiences: mappedExperiences,
        competences: cleanCompetences,
        langues: cvData.skills.languages.map((l: any) => ({
          langue: l.language || '',
          niveau: l.level || 'Intermédiaire',
        })),
        logiciels: (cvData.skills.software || []).map((s: string) => s.split('(')[0].trim()),
        iconName: 'document',
        cardColor: '#3B82F6',
        recommendedTemplate: activeTemplate,
      };

      setFormData(mapped);
      setActiveCandidate(-2); // Custom flag for imported OCR CV
      
      // Automatically proceed to next step to show mapped info
      if (currentStep === 0) setStep([1, 1]);

    } catch (err: any) {
      alert(`OCR Error: ${err.message}`);
    } finally {
      setIsOcrProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    Promise.all([
      fetch('/data/lycees_algerie_complet.json').then(r => r.json()).catch(() => []),
      fetch('/data/oosseera_enseignement_superieur.json').then(r => r.json()).catch(() => []),
      fetch('/data/oosseera_instituts_specialises.json').then(r => r.json()).catch(() => []),
      fetch('/data/oosseera_formation_professionnelle.json').then(r => r.json()).catch(() => []),
      fetch('/data/oosseera_ecoles_privees.json').then(r => r.json()).catch(() => [])
    ]).then(([lycees, univs, instituts, formations, privees]) => {
      const getNames = (arr: any[], key: string) => arr.map(e => e[key]).filter(Boolean);
      const lyceeNames = Array.from(new Set(getNames(lycees, 'nom_etablissement_ar')));
      const univNames = Array.from(new Set(getNames(univs, 'nom_officiel')));
      const institutNames = Array.from(new Set(getNames(instituts, 'nom')));
      const formationNames = Array.from(new Set(getNames(formations, 'nom_etablissement')));
      const priveNames = Array.from(new Set(getNames(privees, 'nom')));

      setEcolesData({
        lycee: lyceeNames,
        univ: univNames,
        institut: institutNames,
        formation: formationNames,
        prive: priveNames
      });

      const names = new Set([
        ...lyceeNames,
        ...univNames,
        ...institutNames,
        ...formationNames,
        ...priveNames
      ]);
      setEcolesList(Array.from(names));
    });
  }, []);

  const goTo = (step: number) => {
    setStep([step, step > currentStep ? 1 : -1]);
  };
  const next = () => { if (currentStep < STEPS.length - 1) setStep([currentStep + 1, 1]); };
  const prev = () => { if (currentStep > 0) setStep([currentStep - 1, -1]); };

  const switchCandidate = useCallback((idx: number) => {
    setActiveCandidate(idx);
    if (idx === -1) {
      setFormData({
        id: -1,
        prenom: '', nom: '', titre: '', email: '', telephone: '', ville: '', linkedin: '', accroche: '',
        formations: [], experiences: [], competences: [], langues: [], logiciels: [],
        iconName: 'document', cardColor: '#64748b', recommendedTemplate: 1,
      });
      setStyleConfig(TEMPLATE_DEFAULTS[1]);
      return;
    }
    const c = candidates[idx];
    setFormData({
      ...c,
      formations: c.formations.map(f => ({ ...f })),
      experiences: c.experiences.map(e => ({ ...e })),
      langues: c.langues.map(l => ({ ...l })),
      competences: [...c.competences],
      logiciels: [...c.logiciels],
    });
    setActiveTemplate(c.recommendedTemplate);
    setStyleConfig(TEMPLATE_DEFAULTS[c.recommendedTemplate as keyof typeof TEMPLATE_DEFAULTS] || TEMPLATE_DEFAULTS[1]);
  }, []);

  const updateField = (key: keyof Candidate, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };
  const updateFormation = (idx: number, key: keyof Formation, value: string) => {
    setFormData(prev => {
      const formations = [...prev.formations];
      formations[idx] = { ...formations[idx], [key]: value };
      return { ...prev, formations };
    });
  };
  const addFormation = () => {
    setFormData(prev => ({
      ...prev,
      formations: [...prev.formations, { diplome: '', specialite: '', etablissement: '', ville: '', annee: '', mention: '' }],
    }));
  };
  const removeFormation = (idx: number) => {
    setFormData(prev => ({ ...prev, formations: prev.formations.filter((_, i) => i !== idx) }));
  };
  const updateExperience = (idx: number, key: keyof Experience, value: string) => {
    setFormData(prev => {
      const experiences = [...prev.experiences];
      experiences[idx] = { ...experiences[idx], [key]: value };
      return { ...prev, experiences };
    });
  };
  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experiences: [...prev.experiences, { poste: '', entreprise: '', secteur: '', dateDebut: '', dateFin: '', description: '' }],
    }));
  };
  const removeExperience = (idx: number) => {
    setFormData(prev => ({ ...prev, experiences: prev.experiences.filter((_, i) => i !== idx) }));
  };
  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !formData.competences.includes(trimmed)) {
      setFormData(prev => ({ ...prev, competences: [...prev.competences, trimmed] }));
      setNewSkill('');
    }
  };
  const removeSkill = (idx: number) => {
    setFormData(prev => ({ ...prev, competences: prev.competences.filter((_, i) => i !== idx) }));
  };
  const addLogiciel = () => {
    const trimmed = newLogiciel.trim();
    if (trimmed && !formData.logiciels.includes(trimmed)) {
      setFormData(prev => ({ ...prev, logiciels: [...prev.logiciels, trimmed] }));
      setNewLogiciel('');
    }
  };
  const removeLogiciel = (idx: number) => {
    setFormData(prev => ({ ...prev, logiciels: prev.logiciels.filter((_, i) => i !== idx) }));
  };
  const updateLangue = (idx: number, key: keyof Langue, value: string) => {
    setFormData(prev => {
      const langues = [...prev.langues];
      langues[idx] = { ...langues[idx], [key]: value };
      return { ...prev, langues };
    });
  };
  const addLangue = () => {
    setFormData(prev => ({ ...prev, langues: [...prev.langues, { langue: '', niveau: 'Intermediaire' }] }));
  };
  const removeLangue = (idx: number) => {
    setFormData(prev => ({ ...prev, langues: prev.langues.filter((_, i) => i !== idx) }));
  };
  const handlePrint = async () => {
    setIsDownloading(true);
    try {
      const desktopContainer = document.getElementById('cv-desktop-container');
      const mobileContainer = document.getElementById('cv-mobile-container');
      
      let targetElement: HTMLElement | null = null;
      if (desktopContainer && window.getComputedStyle(desktopContainer.parentElement!).display !== 'none') {
        targetElement = desktopContainer;
      } else if (mobileContainer) {
        targetElement = mobileContainer;
      }

      if (!targetElement) {
        throw new Error('CV container not found');
      }

      const scale = 2;
      const domtoimage = (await import('dom-to-image-more')).default;
      const imgData = await domtoimage.toPng(targetElement, {
        bgcolor: '#ffffff',
        width: targetElement.clientWidth * scale,
        height: targetElement.clientHeight * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        },
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (targetElement.clientHeight * pdfWidth) / targetElement.clientWidth;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`CV_${formData.prenom || 'Sira'}_${formData.nom || 'CV'}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const renderCV = () => {
    const cssVars = styleToCSSVars(styleConfig) as React.CSSProperties;
    const content = (() => {
      switch (activeTemplate) {
        case 1: return <CVClassique data={formData} config={styleConfig} />;
        case 2: return <CVIngenieur data={formData} config={styleConfig} />;
        case 3: return <CVCadre data={formData} config={styleConfig} />;
        case 4: return <CVMedical data={formData} config={styleConfig} />;
        case 5: return <CVTech data={formData} config={styleConfig} />;
        default: return <CVClassique data={formData} config={styleConfig} />;
      }
    })();
    return <div style={cssVars} className="w-full h-full">{content}</div>;
  };

  const stepLabel = (id: string) => STEP_LABELS[id]?.[language] || STEP_LABELS[id]?.en || id;

  /* ── Template thumbnails data ── */
  const templateThumbs = [
    { id: 1, name: 'Classique Pro', color: '#1B3A6B', style: 'elegant' },
    { id: 2, name: 'Ingenieur', color: '#2C3E50', style: 'technical' },
    { id: 3, name: 'Cadre Moderne', color: '#1A1A2E', style: 'executive' },
    { id: 4, name: 'Medical', color: '#2563EB', style: 'medical' },
    { id: 5, name: 'Tech & IT', color: '#0D1117', style: 'tech' },
    { id: 6, name: 'Minimaliste', color: '#f3f4f6', style: 'minimalist' },
    { id: 7, name: 'Créatif', color: '#ec4899', style: 'creative' },
    { id: 8, name: 'Exécutif Dark', color: '#0f172a', style: 'executive-dark' },
    { id: 9, name: 'Universitaire', color: '#7e22ce', style: 'academic' },
    { id: 10, name: 'Startup', color: '#14b8a6', style: 'startup' },
  ];

  /* ── Step content renderer ── */
  const renderStepContent = () => {
    switch (currentStep) {
      /* ══ STEP 0: Template Selection ══ */
      case 0:
        return (
          <motion.div key="template" variants={fadeUp} initial="hidden" animate="visible" transition={{ staggerChildren: 0.05 }} className="space-y-8">
            {/* Templates */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-txt mb-2">{t('builder.template')}</h2>
              <p className="text-txt-muted text-sm mb-6">{t('builder.templateDesc') || 'Choose a professional design optimized for your industry.'}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {templateThumbs.map((tmpl) => (
                  <motion.div
                    key={tmpl.id}
                    variants={fadeUp}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setActiveTemplate(tmpl.id);
                      setStyleConfig(TEMPLATE_DEFAULTS[tmpl.id as keyof typeof TEMPLATE_DEFAULTS] || TEMPLATE_DEFAULTS[1]);
                    }}
                    className={`relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300 group ${
                      activeTemplate === tmpl.id
                        ? 'border-blue-500 shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10'
                        : 'border-border hover:border-blue-500/40'
                    }`}
                  >
                    {/* Thumbnail preview */}
                    <div className="aspect-[0.707] bg-white relative overflow-hidden">
                      {tmpl.id === 1 && (<>
                        <div className="h-[30%] w-full" style={{ background: tmpl.color }} />
                        <div className="p-3 space-y-1.5">
                          <div className="h-1.5 bg-blue-500/60 w-[70%] rounded-full" />
                          <div className="h-1 bg-gray-200 w-full rounded-full" />
                          <div className="h-1 bg-gray-200 w-[85%] rounded-full" />
                          <div className="h-1 bg-gray-200 w-[60%] rounded-full" />
                        </div>
                      </>)}
                      {tmpl.id === 2 && (<>
                        <div className="h-[25%] w-full flex items-end p-2" style={{ background: tmpl.color }}>
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          </div>
                        </div>
                        <div className="flex p-2 gap-2">
                          <div className="flex-1 space-y-1.5">
                            <div className="h-1 bg-blue-500/50 w-[90%] rounded-full" />
                            <div className="h-1 bg-gray-200 w-full rounded-full" />
                            <div className="h-1 bg-gray-200 w-[75%] rounded-full" />
                          </div>
                          <div className="flex-1 space-y-1.5">
                            <div className="h-1 bg-blue-500/50 w-[60%] rounded-full" />
                            <div className="h-1 bg-gray-200 w-[85%] rounded-full" />
                          </div>
                        </div>
                      </>)}
                      {tmpl.id === 3 && (
                        <div className="flex h-full">
                          <div className="w-[35%] h-full" style={{ background: tmpl.color }} />
                          <div className="flex-1 p-2 space-y-1.5">
                            <div className="h-1 bg-gray-200 w-full rounded-full" />
                            <div className="h-1 bg-gray-200 w-[70%] rounded-full" />
                            <div className="h-1 bg-gray-200 w-[85%] rounded-full" />
                          </div>
                        </div>
                      )}
                      {tmpl.id === 4 && (<>
                        <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-blue-400" />
                        <div className="p-3 space-y-1.5 text-center">
                          <div className="h-1.5 bg-gray-200 w-[60%] mx-auto rounded-full" />
                          <div className="flex justify-center gap-1 pt-1">
                            <div className="w-6 h-2 bg-blue-500/15 rounded" />
                            <div className="w-6 h-2 bg-blue-500/15 rounded" />
                            <div className="w-6 h-2 bg-blue-500/15 rounded" />
                          </div>
                          <div className="h-1 bg-gray-200 w-full rounded-full mt-1" />
                        </div>
                      </>)}
                      {tmpl.id === 5 && (
                        <div className="h-full w-full bg-[#0D1117]">
                          <div className="h-[25%] bg-gradient-to-br from-[#161B22] to-[#0D1117] flex items-center p-2 gap-1">
                            <div className="w-4 h-1 bg-blue-500/30 rounded" />
                            <div className="w-4 h-1 bg-blue-500/30 rounded" />
                          </div>
                          <div className="p-2 space-y-1.5">
                            <div className="h-1 bg-blue-500/40 w-1/2 rounded-full" />
                            <div className="h-1 bg-[#21262D] w-full rounded-full" />
                            <div className="h-1 bg-[#21262D] w-[80%] rounded-full" />
                          </div>
                        </div>
                      )}
                      {tmpl.id === 6 && (
                        <div className="p-3 space-y-2 h-full flex flex-col justify-center">
                          <div className="flex justify-between items-end border-b pb-1">
                            <div className="h-1 bg-gray-600 w-[60%] rounded-full" />
                            <div className="h-1 bg-gray-300 w-[20%] rounded-full" />
                          </div>
                          <div className="space-y-1">
                            <div className="h-0.5 bg-gray-200 w-full" />
                            <div className="h-0.5 bg-gray-200 w-[85%]" />
                            <div className="h-0.5 bg-gray-200 w-[95%]" />
                          </div>
                        </div>
                      )}
                      {tmpl.id === 7 && (
                        <div className="h-full w-full bg-pink-50/10">
                          <div className="h-[25%] bg-gradient-to-r from-pink-500 to-rose-400 p-2 flex items-center justify-center">
                            <div className="h-1 bg-white/80 w-[50%] rounded-full" />
                          </div>
                          <div className="p-2 flex gap-1 justify-center mt-1">
                            <div className="w-8 h-2 bg-pink-500/20 rounded-full" />
                            <div className="w-6 h-2 bg-pink-500/20 rounded-full" />
                          </div>
                          <div className="p-2 space-y-1 mt-1 text-center">
                            <div className="h-0.5 bg-gray-200 w-[80%] mx-auto rounded-full" />
                            <div className="h-0.5 bg-gray-200 w-[60%] mx-auto rounded-full" />
                          </div>
                        </div>
                      )}
                      {tmpl.id === 8 && (
                        <div className="h-full w-full bg-slate-800">
                          <div className="h-[25%] bg-slate-900 p-2 border-b border-slate-700">
                            <div className="h-1 bg-amber-400 w-[40%] rounded-full mt-1" />
                          </div>
                          <div className="flex p-2 gap-2">
                            <div className="flex-[0.4] bg-slate-900 border-r border-slate-700 p-1 space-y-1 h-12">
                                <div className="h-0.5 bg-slate-600 w-full rounded" />
                                <div className="h-0.5 bg-slate-600 w-[70%] rounded" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="h-1 bg-amber-400/80 w-[40%] rounded" />
                                <div className="h-1 bg-slate-600 w-[90%] rounded" />
                            </div>
                          </div>
                        </div>
                      )}
                      {tmpl.id === 9 && (
                        <div className="h-full w-full bg-white relative">
                          <div className="absolute top-2 w-full flex justify-center">
                            <div className="h-8 w-1/2 bg-purple-900 rounded-b p-1 flex justify-center items-end">
                                <div className="h-1 bg-white/80 w-[60%] rounded-full mb-1" />
                            </div>
                          </div>
                          <div className="p-2 mt-10 space-y-1.5 text-center">
                            <div className="h-1 bg-purple-900 w-[30%] mx-auto rounded" />
                            <div className="h-0.5 bg-gray-200 w-full rounded" />
                            <div className="h-0.5 bg-gray-200 w-[80%] mx-auto rounded" />
                          </div>
                        </div>
                      )}
                      {tmpl.id === 10 && (
                        <div className="h-full w-full border-t-[6px] border-teal-500 bg-white">
                          <div className="p-2 flex gap-1 mt-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-teal-500/40" />
                             <div className="h-1.5 bg-gray-200 w-[50%] rounded" />
                          </div>
                          <div className="p-2 space-y-1.5">
                             <div className="h-1 bg-gray-200 border-l border-teal-500 pl-1 w-full" />
                             <div className="h-1 bg-gray-200 border-l border-teal-500 pl-1 w-[70%]" />
                          </div>
                        </div>
                      )}
                      {/* Selected checkmark */}
                      {activeTemplate === tmpl.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 end-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg"
                        >
                          <CheckIcon className="w-3.5 h-3.5 text-white" />
                        </motion.div>
                      )}
                    </div>
                    <div className="p-3 bg-surface2 text-center">
                      <span className="text-xs font-bold text-txt">{tmpl.name}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Pre-filled candidates */}
            <div>
              <h3 className="text-lg font-bold text-txt mb-1">{t('builder.theme') || 'Quick Start'}</h3>
              <p className="text-txt-muted text-sm mb-4">{t('builder.quickStartDesc') || 'Start with a pre-filled profile or begin from scratch.'}</p>
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
                      ? 'border-blue-500 bg-blue-500/5 shadow-md shadow-blue-500/10'
                      : 'border-border bg-surface hover:border-blue-500/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-500">
                    <DocumentPlusIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-txt truncate">{t('builder.blankCV') || 'Blank CV'}</div>
                    <div className="text-xs text-txt-muted truncate">{t('builder.blankCVDesc') || 'Start from scratch'}</div>
                  </div>
                  {activeCandidate === -1 && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </div>
                  )}
                </motion.div>

                {/* Import OCR Resume */}
                <motion.div
                  key="import"
                  variants={fadeUp}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative overflow-hidden flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
                    isOcrProcessing 
                      ? 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-900/20' 
                      : 'border-blue-500 hover:border-blue-600 bg-blue-50/30 hover:bg-blue-50/80 dark:bg-blue-900/10 dark:hover:bg-blue-900/30'
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
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <ArrowDownTrayIcon className="w-5 h-5 rotate-180" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 z-10">
                    <div className="text-sm font-bold text-blue-700 dark:text-blue-400 truncate">
                      {isOcrProcessing ? (language==='fr' ? 'Analyse par IA...' : language==='ar' ? 'جاري التحليل بالذكاء الاصطناعي...' : 'AI Analyzing...') : (language==='fr' ? 'Importer un CV' : language==='ar' ? 'استيراد سيرة ذاتية' : 'Import AI Resume')}
                    </div>
                    <div className="text-xs text-blue-600/70 dark:text-blue-400/70 truncate">
                      {isOcrProcessing ? (language==='fr' ? 'Extraction des donnees...' : language==='ar' ? 'استخراج البيانات...' : 'Extracting data...') : (language==='fr' ? 'PDF ou Image (Auto-remplissage)' : language==='ar' ? 'PDF أو صورة (تعبئة تلقائية)' : 'PDF or Image (Auto-fill)')}
                    </div>
                  </div>
                  {/* Background scanning animation if processing */}
                  {isOcrProcessing && (
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent w-[200%]"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    />
                  )}
                </motion.div>

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
                          ? 'border-blue-500 bg-blue-500/5 shadow-md shadow-blue-500/10'
                          : 'border-border bg-surface hover:border-blue-500/30'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${c.cardColor}18`, color: c.cardColor }}>
                        {Icon && <Icon className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-txt truncate">{c.prenom} {c.nom}</div>
                        <div className="text-xs text-txt-muted truncate">{c.titre}</div>
                        <div className="text-[10px] text-txt-dim flex items-center gap-1 mt-0.5">
                          <MapPinIcon className="w-3 h-3" />{c.ville}
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

      /* ══ STEP 1: Personal Info ══ */
      case 1:
        return (
          <motion.div key="personal" variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-txt mb-2">{t('builder.personal_info')}</h2>
              <p className="text-txt-muted text-sm">{t('builder.personalInfoDesc') || 'Let employers know how to reach you.'}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={t('builder.fullName').split(' ')[0] || 'First Name'} value={formData.prenom} onChange={v => updateField('prenom', v)} />
              <Input label={t('builder.fullName').split(' ')[1] || 'Last Name'} value={formData.nom} onChange={v => updateField('nom', v)} />
            </div>
            <Input label={t('builder.jobTitle')} value={formData.titre} onChange={v => updateField('titre', v)} placeholder="e.g. Senior Software Engineer" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={t('builder.email')} value={formData.email} onChange={v => updateField('email', v)} type="email" />
              <Input label={t('builder.phone')} value={formData.telephone} onChange={v => updateField('telephone', v)} type="tel" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label={t('builder.location')} value={formData.ville} onChange={v => updateField('ville', v)} />
              <Input label={t('builder.linkedin')} value={formData.linkedin} onChange={v => updateField('linkedin', v)} />
            </div>
          </motion.div>
        );

      /* ══ STEP 2: Summary ══ */
      case 2:
        return (
          <motion.div key="summary" variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-txt mb-2">{t('builder.summary')}</h2>
              <p className="text-txt-muted text-sm">{t('builder.summaryDesc') || 'Write a compelling overview of your career highlights and goals.'}</p>
            </div>
            <TextArea
              label={t('builder.summary')}
              value={formData.accroche}
              onChange={v => updateField('accroche', v)}
              placeholder={t('builder.summaryPlaceholder') || "Experienced professional with deep expertise in..."}
              rows={6}
            />
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{t('builder.summaryTip') || '💡 Tip: Keep it between 2-4 sentences. Highlight your biggest achievements and career direction.'}</p>
            </div>
          </motion.div>
        );

      /* ══ STEP 3: Experience ══ */
      case 3:
        return (
          <motion.div key="experience" variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-txt mb-2">{t('builder.experiences')}</h2>
                <p className="text-txt-muted text-sm">{t('builder.experienceDesc') || 'Add your professional experience, starting with the most recent.'}</p>
              </div>
              <button onClick={addExperience} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold transition-all hover:bg-blue-600 hover:text-white hover:shadow-md hover:shadow-blue-500/20">
                <PlusIcon className="w-4 h-4" />{t('builder.add')}
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
                  <button onClick={() => removeExperience(idx)} className="absolute top-4 end-4 w-7 h-7 rounded-full bg-surface2 border border-border flex items-center justify-center text-txt-muted hover:text-red-500 hover:border-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                  <div className="space-y-4">
                    <Input label={t('builder.position')} value={exp.poste} onChange={v => updateExperience(idx, 'poste', v)} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label={t('builder.company') || 'Company'} value={exp.entreprise} onChange={v => updateExperience(idx, 'entreprise', v)} />
                      <Input label={t('builder.secteur') || 'Secteur'} value={exp.secteur} onChange={v => updateExperience(idx, 'secteur', v)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label={t('builder.startDate')} value={exp.dateDebut} onChange={v => updateExperience(idx, 'dateDebut', v)} />
                      <Input label={t('builder.endDate')} value={exp.dateFin} onChange={v => updateExperience(idx, 'dateFin', v)} />
                    </div>
                    <TextArea label={t('builder.description')} value={exp.description} onChange={v => updateExperience(idx, 'description', v)} rows={3} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      /* ══ STEP 4: Education ══ */
      case 4:
        return (
          <motion.div key="education" variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-txt mb-2">{t('builder.education')}</h2>
                <p className="text-txt-muted text-sm">{t('builder.educationDesc') || 'Add your educational background.'}</p>
              </div>
              <button onClick={addFormation} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold transition-all hover:bg-blue-600 hover:text-white hover:shadow-md hover:shadow-blue-500/20">
                <PlusIcon className="w-4 h-4" />{t('builder.add')}
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
                  <button onClick={() => removeFormation(idx)} className="absolute top-4 end-4 w-7 h-7 rounded-full bg-surface2 border border-border flex items-center justify-center text-txt-muted hover:text-red-500 hover:border-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label={t('builder.degree') || 'Degree'} value={f.diplome} onChange={v => updateFormation(idx, 'diplome', v)} />
                      <Input label={t('builder.annee') || 'Annee'} value={f.annee} onChange={v => updateFormation(idx, 'annee', v)} />
                    </div>
                    <Input label={t('builder.specialite') || 'Specialite'} value={f.specialite} onChange={v => updateFormation(idx, 'specialite', v)} />
                    <Select 
                      label={t('builder.typeEtablissement') || "Type d'établissement"} 
                      value={f.type_etablissement || ''} 
                      onChange={v => updateFormation(idx, 'type_etablissement', v)}
                      options={[
                        { id: 'lycee', label: t('builder.typeLycee') || 'Lycée' },
                        { id: 'univ', label: t('builder.typeUniv') || 'Université' },
                        { id: 'institut', label: t('builder.typeInstitut') || 'Institut Spécialisé' },
                        { id: 'formation', label: t('builder.typeFormation') || 'Formation Professionnelle' },
                        { id: 'prive', label: t('builder.typePrive') || 'École Privée' },
                      ]}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label={t('builder.school')} value={f.etablissement} onChange={v => updateFormation(idx, 'etablissement', v)} list={`ecoles-list-${f.type_etablissement || 'all'}`} />
                      <Input label={t('builder.location')} value={f.ville} onChange={v => updateFormation(idx, 'ville', v)} />
                    </div>
                    <Input label={t('builder.mention') || 'Mention'} value={f.mention} onChange={v => updateFormation(idx, 'mention', v)} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      /* ══ STEP 5: Skills, Languages, Software ══ */
      case 5:
        return (
          <motion.div key="skills" variants={fadeUp} initial="hidden" animate="visible" className="space-y-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-txt mb-2">{t('builder.skills')} &amp; {t('builder.languages')}</h2>
              <p className="text-txt-muted text-sm">{t('builder.skillsDesc') || 'Highlight what makes you stand out.'}</p>
            </div>

            {/* Skills */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-txt">{t('builder.skills')}</h3>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-surface2 border border-border rounded-xl px-4 py-2.5 text-sm text-txt outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-txt-dim"
                  placeholder={t('builder.skillName') || 'Skill'}
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                />
                <button onClick={addSkill} className="shrink-0 px-4 py-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-bold transition-all hover:bg-blue-600 hover:text-white">
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.competences.map((s, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold"
                  >
                    {s}
                    <button onClick={() => removeSkill(i)} className="hover:text-red-500 transition-colors">
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-txt">{t('builder.languages')}</h3>
                <button onClick={addLangue} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold transition-all hover:bg-blue-600 hover:text-white">
                  <PlusIcon className="w-3.5 h-3.5" />{t('builder.add')}
                </button>
              </div>
              <div className="space-y-3">
                {formData.langues.map((l, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      className="flex-1 bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm text-txt outline-none transition-all focus:border-blue-500"
                      value={l.langue}
                      onChange={e => updateLangue(idx, 'langue', e.target.value)}
                      placeholder={t('builder.langName')}
                    />
                    <select
                      className="flex-1 bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm text-txt outline-none transition-all focus:border-blue-500 form-select-arrow appearance-none"
                      value={l.niveau}
                      onChange={e => updateLangue(idx, 'niveau', e.target.value)}
                    >
                      <option value="Natif">{t('builder.level_Natif') || 'Natif'}</option>
                      <option value="Courant">{t('builder.level_Courant') || 'Courant'}</option>
                      <option value="Intermediaire">{t('builder.level_Intermediaire') || 'Intermediaire'}</option>
                      <option value="Technique">{t('builder.level_Technique') || 'Technique'}</option>
                      <option value="Debutant">{t('builder.level_Debutant') || 'Debutant'}</option>
                    </select>
                    <button onClick={() => removeLangue(idx)} className="shrink-0 w-8 h-8 rounded-full bg-surface2 border border-border flex items-center justify-center text-txt-muted hover:text-red-500 hover:border-red-500 transition-all">
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Software */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-txt">{t('builder.software') || 'Logiciels / Outils'}</h3>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-surface2 border border-border rounded-xl px-4 py-2.5 text-sm text-txt outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-txt-dim"
                  placeholder="..."
                  value={newLogiciel}
                  onChange={e => setNewLogiciel(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLogiciel(); } }}
                />
                <button onClick={addLogiciel} className="shrink-0 px-4 py-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-bold transition-all hover:bg-blue-600 hover:text-white">
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.logiciels.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-full text-xs font-bold">
                    {s}
                    <button onClick={() => removeLogiciel(i)} className="hover:text-red-500 transition-colors">
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        );

      /* ══ STEP 6: Design & Customization ══ */
      case 6:
        return (
          <motion.div key="design" variants={fadeUp} initial="hidden" animate="visible" className="space-y-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-txt mb-2">{t('builder.design') || 'Design & Aesthetics'}</h2>
              <p className="text-txt-muted text-sm">{t('builder.designDesc') || 'Fine-tune the typography, colors, and layout of your CV.'}</p>
            </div>

            {/* Colors: Presets + Custom Pickers */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-txt">{t('builder.colorSystem') || 'Color System'}</h3>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 mb-4">
                {COLOR_PALETTES.map((palette) => (
                  <button
                    key={palette.id}
                    onClick={() => setStyleConfig(prev => applyPalette(prev, palette))}
                    className={`w-full aspect-square rounded-full transition-all ${styleConfig.primaryColor === palette.primary ? 'ring-2 ring-offset-2 ring-offset-surface ring-blue-500 scale-110' : 'hover:scale-105'}`}
                    style={{ background: `linear-gradient(135deg, ${palette.primary} 50%, ${palette.accent} 50%)` }}
                    title={palette.name}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">{t('builder.primaryColor') || 'Primary Color'}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-8 h-8 rounded cursor-pointer border-0 p-0" value={styleConfig.primaryColor} onChange={e => setStyleConfig(p => ({...p, primaryColor: e.target.value}))} />
                    <span className="text-xs font-mono">{styleConfig.primaryColor}</span>
                  </div>
                </div>
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">{t('builder.accentColor') || 'Accent Color'}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-8 h-8 rounded cursor-pointer border-0 p-0" value={styleConfig.accentColor} onChange={e => setStyleConfig(p => ({...p, accentColor: e.target.value}))} />
                    <span className="text-xs font-mono">{styleConfig.accentColor}</span>
                  </div>
                </div>
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">{t('builder.textColor') || 'Text Color'}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-8 h-8 rounded cursor-pointer border-0 p-0" value={styleConfig.bodyText} onChange={e => setStyleConfig(p => ({...p, bodyText: e.target.value}))} />
                    <span className="text-xs font-mono">{styleConfig.bodyText}</span>
                  </div>
                </div>
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">{t('builder.bgColor') || 'Background'}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-8 h-8 rounded cursor-pointer border-0 p-0" value={styleConfig.bodyBg} onChange={e => setStyleConfig(p => ({...p, bodyBg: e.target.value}))} />
                    <span className="text-xs font-mono">{styleConfig.bodyBg}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-txt">{t('builder.typography') || 'Typography'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{t('builder.headingFont') || 'Heading Font'}</label>
                  <select
                    className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm text-txt outline-none transition-all focus:border-blue-500 form-select-arrow appearance-none"
                    value={styleConfig.headingFont}
                    onChange={(e) => setStyleConfig(p => ({ ...p, headingFont: e.target.value }))}
                  >
                    {FONT_OPTIONS.map(f => (
                      <option key={f.id} value={f.value}>{f.name} ({f.category})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{t('builder.bodyFont') || 'Body Font'}</label>
                  <select
                    className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm text-txt outline-none transition-all focus:border-blue-500 form-select-arrow appearance-none"
                    value={styleConfig.bodyFont}
                    onChange={(e) => setStyleConfig(p => ({ ...p, bodyFont: e.target.value }))}
                  >
                    {FONT_OPTIONS.map(f => (
                      <option key={f.id} value={f.value}>{f.name} ({f.category})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Layout Options */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-txt">{t('builder.structure') || 'Structure & Layout'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{t('builder.columns') || 'Columns'}</label>
                  <select
                    className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm text-txt outline-none transition-all focus:border-blue-500 form-select-arrow appearance-none"
                    value={styleConfig.layoutCols}
                    onChange={(e) => setStyleConfig(p => ({ ...p, layoutCols: e.target.value as any }))}
                  >
                    <option value="1">{t('builder.col1') || '1 Column'}</option>
                    <option value="1fr 1fr">{t('builder.col2_50') || '2 Columns (50/50)'}</option>
                    <option value="1.4fr 1fr">{t('builder.col2_side') || '2 Columns (Sidebar)'}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{t('builder.fontSize') || 'Font Size'}</label>
                  <select
                    className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm text-txt outline-none transition-all focus:border-blue-500 form-select-arrow appearance-none"
                    value={styleConfig.fontSize}
                    onChange={(e) => setStyleConfig(p => ({ ...p, fontSize: e.target.value as any }))}
                  >
                    <option value="compact">{t('builder.fsCompact') || 'Compact'} (11px)</option>
                    <option value="default">{t('builder.fsDefault') || 'Default'} (12px)</option>
                    <option value="large">{t('builder.fsLarge') || 'Large'} (13px)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{t('builder.spacing') || 'Spacing'}</label>
                  <select
                    className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm text-txt outline-none transition-all focus:border-blue-500 form-select-arrow appearance-none"
                    value={styleConfig.spacing}
                    onChange={(e) => setStyleConfig(p => ({ ...p, spacing: e.target.value as any }))}
                  >
                    <option value="tight">{t('builder.tight') || 'Tight'}</option>
                    <option value="default">{t('builder.defaultSpacing') || 'Default'}</option>
                    <option value="relaxed">{t('builder.relaxed') || 'Relaxed'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section Ordering (Drag & Drop) */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-txt">{t('builder.sectionOrdering') || 'Section Ordering'}</h3>
                <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-1 rounded-full font-bold">{t('builder.dragReorder') || 'Drag to reorder'}</span>
              </div>
              <div className={`grid gap-4 ${styleConfig.layoutCols === '1' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {/* Main Column */}
                <div 
                  className="flex flex-col gap-2 p-3 bg-surface2/50 border border-dashed border-border rounded-xl min-h-[100px]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    try {
                      const data = e.dataTransfer.getData('application/json');
                      if (!data) return;
                      const { listType, index } = JSON.parse(data);
                      if (listType === 'main') return; // Handled by item drop if dropping on an item
                      // Dropping from side to main (at the end)
                      setStyleConfig(p => {
                        const newMain = [...(p.mainOrder || [])];
                        const newSide = [...(p.sideOrder || [])];
                        const [item] = newSide.splice(index, 1);
                        newMain.push(item);
                        return { ...p, mainOrder: newMain, sideOrder: newSide };
                      });
                    } catch(err) {}
                  }}
                >
                  <div className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-1">
                    {styleConfig.layoutCols === '1' ? (t('builder.topContent') || 'Top Content') : (t('builder.mainColumn') || 'Main Column')}
                  </div>
                  {(styleConfig.mainOrder || []).map((section, index) => (
                    <div 
                      key={`main-${section}`}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify({ listType: 'main', index }))}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          const { listType, index: fromIndex } = JSON.parse(e.dataTransfer.getData('application/json'));
                          setStyleConfig(p => {
                            const newMain = [...(p.mainOrder || [])];
                            const newSide = [...(p.sideOrder || [])];
                            if (listType === 'main') {
                              const [moved] = newMain.splice(fromIndex, 1);
                              newMain.splice(index, 0, moved);
                            } else {
                              const [moved] = newSide.splice(fromIndex, 1);
                              newMain.splice(index, 0, moved);
                            }
                            return { ...p, mainOrder: newMain, sideOrder: newSide };
                          });
                        } catch(err) {}
                      }}
                      className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl cursor-grab active:cursor-grabbing hover:border-blue-500/30 transition-colors"
                    >
                      <svg className="w-4 h-4 text-txt-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                      <span className="font-medium text-sm text-txt capitalize">{t(`builder.${section}`) || section}</span>
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
                      const data = e.dataTransfer.getData('application/json');
                      if (!data) return;
                      const { listType, index } = JSON.parse(data);
                      if (listType === 'side') return;
                      setStyleConfig(p => {
                        const newMain = [...(p.mainOrder || [])];
                        const newSide = [...(p.sideOrder || [])];
                        const [item] = newMain.splice(index, 1);
                        newSide.push(item);
                        return { ...p, mainOrder: newMain, sideOrder: newSide };
                      });
                    } catch(err) {}
                  }}
                >
                  <div className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-1">
                    {styleConfig.layoutCols === '1' ? (t('builder.bottomContent') || 'Bottom Content') : (t('builder.sidebarColumn') || 'Sidebar Column')}
                  </div>
                  {(styleConfig.sideOrder || []).map((section, index) => (
                    <div 
                      key={`side-${section}`}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify({ listType: 'side', index }))}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          const { listType, index: fromIndex } = JSON.parse(e.dataTransfer.getData('application/json'));
                          setStyleConfig(p => {
                            const newMain = [...(p.mainOrder || [])];
                            const newSide = [...(p.sideOrder || [])];
                            if (listType === 'side') {
                              const [moved] = newSide.splice(fromIndex, 1);
                              newSide.splice(index, 0, moved);
                            } else {
                              const [moved] = newMain.splice(fromIndex, 1);
                              newSide.splice(index, 0, moved);
                            }
                            return { ...p, mainOrder: newMain, sideOrder: newSide };
                          });
                        } catch(err) {}
                      }}
                      className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl cursor-grab active:cursor-grabbing hover:border-blue-500/30 transition-colors"
                    >
                      <svg className="w-4 h-4 text-txt-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                      <span className="font-medium text-sm text-txt capitalize">{t(`builder.${section}`) || section}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );

      /* ══ STEP 7: Preview ══ */
      case 7:
        return (
          <motion.div key="preview" variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-txt mb-2">{t('builder.preview')}</h2>
                <p className="text-txt-muted text-sm">{t('builder.previewDesc') || 'Review your CV and export when ready.'}</p>
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
                {isDownloading ? '...' : t('builder.download')}
              </button>
            </div>

            {/* Desktop preview */}
            <div className="hidden lg:flex justify-center">
              <div id="cv-desktop-container" className="shadow-2xl shadow-black/20 rounded-lg overflow-hidden bg-white" dir={dir}>
                {renderCV()}
              </div>
            </div>

            {/* Mobile preview */}
            <div className="lg:hidden">
              <div className="overflow-x-auto pb-4 -mx-4 px-4">
                <div id="cv-mobile-container" className="w-[595px] shadow-2xl shadow-black/20 rounded-lg overflow-hidden mx-auto bg-white" dir={dir}>
                  {renderCV()}
                </div>
              </div>
              <p className="text-center text-xs text-txt-dim mt-2 lg:hidden">{t('builder.scrollText') || '← Scroll horizontally to view full CV →'}</p>
            </div>

            {/* Save CV Promo */}
            <div className="mt-8 bg-blue-500/5 border border-blue-500/20 rounded-3xl p-6 sm:p-8 flex flex-col xl:flex-row items-center justify-between gap-6 text-center xl:text-start mb-6">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-txt mb-1">{t('builder.saveCVTitle') || 'Want to save your CV for later?'}</h3>
                <p className="text-sm text-txt-muted">{t('builder.saveCVDesc') || 'Create an account to save your progress, edit later, and unlock more templates.'}</p>
              </div>
              <div className="flex flex-row items-center gap-3 w-full xl:w-auto shrink-0 justify-center">
                <Link href="/login" className="flex-1 sm:flex-none text-center px-5 py-2.5 rounded-xl border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-semibold transition-all hover:bg-blue-500/10 hover:border-blue-500/40">
                  {t('nav.login') || 'Log In'}
                </Link>
                <Link href="/register" className="flex-1 sm:flex-none text-center px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95 shadow-md shadow-blue-500/20">
                  {t('nav.signup') || 'Sign Up'}
                </Link>
              </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <>
      <div className="flex flex-col h-screen bg-bg text-txt overflow-hidden">
        {/* ── Premium Top Bar ── */}
        <header className="h-16 min-h-[64px] flex items-center justify-between px-4 sm:px-6 bg-surface/80 backdrop-blur-xl border-b border-border z-50 shadow-sm">
          <Link href="/" dir="ltr" className="flex flex-row items-end group select-none hover:opacity-80 transition-opacity">
            <svg width="28" height="16" viewBox="1 6 22 12" className="text-blue-600 dark:text-blue-500 transition-transform group-hover:scale-105 overflow-visible mb-[4px]">
              <defs>
                <linearGradient id="infinityGradientBuilder" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z" fill="none" stroke="url(#infinityGradientBuilder)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[24px] font-display font-bold text-txt leading-none ml-1">sira</span>
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                      : isCompleted
                      ? 'text-blue-500/70 hover:bg-blue-500/5'
                      : 'text-txt-dim hover:text-txt-muted hover:bg-surface2'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    isCompleted ? 'bg-blue-500 text-white' : isActive ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : ''
                  }`}>
                    {isCompleted ? <CheckIcon className="w-3 h-3" /> : <StepIcon className="w-3 h-3" />}
                  </div>
                  <span className="hidden lg:inline">{stepLabel(step.id)}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <LanguageToggle />
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full text-[11px] font-bold">
              <Squares2X2Icon className="w-3.5 h-3.5" />
              {TEMPLATE_NAMES[activeTemplate - 1]}
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* ── Main content area ── */}
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
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : isCompleted
                        ? 'text-blue-500/70'
                        : 'text-txt-dim'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-blue-500 text-white' : isActive ? 'bg-blue-500/20' : 'bg-surface2'
                    }`}>
                      {isCompleted ? <CheckIcon className="w-2.5 h-2.5" /> : <span className="text-[8px]">{idx + 1}</span>}
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
                initial={{ width: '0%' }}
                animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </div>

            {/* Step content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
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
            <div className="shrink-0 border-t border-border bg-surface/80 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4">
              <div className="max-w-3xl mx-auto flex items-center justify-between">
                <button
                  onClick={prev}
                  disabled={currentStep === 0}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed text-txt hover:bg-surface2 active:scale-95"
                >
                  <ArrowLeftIcon className="w-4 h-4 rtl:rotate-180" />
                  <span className="hidden sm:inline">{t('builder.back')}</span>
                </button>

                <div className="flex items-center gap-2 text-xs text-txt-muted font-medium">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{currentStep + 1}</span>
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
                        ? (language === 'fr' ? 'Aperçu' : language === 'ar' ? 'معاينة' : 'Preview')
                        : (language === 'fr' ? 'Suivant' : language === 'ar' ? 'التالي' : 'Next')}
                    </span>
                    <ArrowRightIcon className="w-4 h-4 rtl:rotate-180" />
                  </button>
                ) : (
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full text-sm font-bold shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-0.5 active:scale-95"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('builder.download')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Desktop Live Preview Sidebar ── */}
          {currentStep < 7 && (
            <div className="hidden xl:flex flex-col w-[440px] 2xl:w-[500px] border-s border-border bg-surface2 overflow-hidden shrink-0">
              <div className="py-3 px-4 border-b border-border bg-surface flex items-center justify-between">
                <span className="text-[10px] font-bold text-txt-muted uppercase tracking-widest">{t('builder.preview')} — {TEMPLATE_NAMES[activeTemplate - 1]}</span>
                <button
                  onClick={() => goTo(7)}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t('builder.fullScreen') || 'Full Screen →'}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto preview-scrollbar p-4 flex justify-center items-start">
                <div className="origin-top-left" style={{ transform: 'scale(0.62)', transformOrigin: 'top center', width: '595px', minWidth: '595px' }}>
                  <div className="shadow-2xl shadow-black/15 rounded-lg overflow-hidden" dir={dir}>
                    {renderCV()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Mobile floating preview button ── */}
        {currentStep < 7 && (
          <button
            onClick={() => setMobilePreviewOpen(true)}
            className="xl:hidden fixed bottom-24 end-4 z-40 w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
        )}

        {/* ── Mobile preview modal ── */}
        <AnimatePresence>
          {mobilePreviewOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="xl:hidden fixed inset-0 z-50 bg-bg/95 backdrop-blur-xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-bold text-txt">{t('builder.preview')}</span>
                <button onClick={() => setMobilePreviewOpen(false)} className="w-8 h-8 rounded-full bg-surface2 border border-border flex items-center justify-center text-txt hover:bg-surface transition-all">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <div className="overflow-x-auto">
                  <div className="w-[595px] mx-auto shadow-2xl shadow-black/20 rounded-lg overflow-hidden" dir={dir}>
                    {renderCV()}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-border">
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-500/25"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  {t('builder.download')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Print area (hidden, used for PDF export) */}
      <div id="print-area" style={{ display: 'none' }} dir={dir}>
        {renderCV()}
      </div>

      <datalist id="ecoles-list-all">
        {ecolesList.map(ecole => <option key={ecole} value={ecole} />)}
      </datalist>
      <datalist id="ecoles-list-lycee">
        {ecolesData.lycee.map(ecole => <option key={ecole} value={ecole} />)}
      </datalist>
      <datalist id="ecoles-list-univ">
        {ecolesData.univ.map(ecole => <option key={ecole} value={ecole} />)}
      </datalist>
      <datalist id="ecoles-list-institut">
        {ecolesData.institut.map(ecole => <option key={ecole} value={ecole} />)}
      </datalist>
      <datalist id="ecoles-list-formation">
        {ecolesData.formation.map(ecole => <option key={ecole} value={ecole} />)}
      </datalist>
      <datalist id="ecoles-list-prive">
        {ecolesData.prive.map(ecole => <option key={ecole} value={ecole} />)}
      </datalist>
    </>
  );
}
