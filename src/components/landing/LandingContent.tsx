'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { ThemeToggle, LanguageToggle } from '@/components/Toggles';
import { 
  ArrowRightIcon,
  SparklesIcon,
  SwatchIcon,
  CloudArrowUpIcon,
  PencilSquareIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  CheckIcon,
  StarIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  Bars3Icon,
  UserIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  PaintBrushIcon,
  TrophyIcon,
  CursorArrowRaysIcon,
  PlayIcon,
  ComputerDesktopIcon,
  RocketLaunchIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } },
};

const LOCAL_TRANSLATIONS: Record<string, any> = {
  en: {
    featuresTitle: "Why Choose Sira?",
    featuresDesc: "Features customized specifically for the Algerian job market and applicants.",
    f1_title: "ATS-Compliant for Algeria",
    f1_desc: "Validated templates tailored for major national employers like Sonatrach, Cosider, banks, and tech startups.",
    f1_tag: "DZ Standard",
    f2_title: "Trilingual CV Builder",
    f2_desc: "Build in French, Arabic, or English. Match official public sector demands or multinational private sector requirements.",
    f2_tag: "AR / FR / EN",
    f3_title: "Low Bandwidth Optimization",
    f3_desc: "Optimized for Mobilis, Djezzy, Ooredoo, and ADSL. Seamlessly auto-saves without consuming data or causing lag.",
    f3_tag: "Data Saver",
    f4_title: "Smart AI OCR Import",
    f4_desc: "Upload old local-format resumes. Our AI extracts academic and professional details in seconds.",
    f4_tag: "AI Scanner",
    f5_title: "Local Academic Integration",
    f5_desc: "Writing assistants adapted to the Algerian LMD system, state engineering diplomas, and local school titles.",
    f5_tag: "LMD Conforme",
    f6_title: "Vector Export & Print Ready",
    f6_desc: "Get ultra-lightweight vector PDF files. Highly optimized for digital job portals or printing at local cybercafés.",
    f6_tag: "Vector PDF",
    
    pricingTitle: "Choose Your Plan",
    pricingDesc: "Unlock professional tools and unlimited templates to boost your career.",
    proTitle: "Pro",
    proPrice: "990 DA",
    proPeriod: "/ month",
    proFeature1: "All premium templates",
    proFeature2: "Unlimited active drafts",
    proFeature3: "High-speed PDF export",
    
    premiumTitle: "Premium",
    premiumPrice: "1,990 DA",
    premiumPeriod: "/ year",
    premiumFeature1: "Everything in Pro",
    premiumFeature2: "Priority customer support",
    premiumFeature3: "Cover letter generator",
    
    close: "Close",
    getStarted: "Get Started Free",
    h1: "ATS-Compliant & Trilingual",
    h2: "DZ Academic Standards (LMD)",
    h3: "Lightweight & Data-Saving",
    mockAts: "ATS Friendly",

    // New Hero Content
    badgeText: "First CV Platform in Algeria",
    heroTitle: "Your CV,",
    heroHighlight: "Your Chance.",
    heroSubtitle: "The first CV platform designed for Algeria. Build an ATS-compliant, trilingual CV in minutes.",
    heroCtaPrimary: "Start Building Free",
    heroCtaSecondary: "Explore Features",
    trust1: "ATS-Compliant & Trilingual",
    trust2: "DZ Academic Standards (LMD)",
    trust3: "Lightweight & Data-Saving",
    illustrationBadge: "#1 RESUME BUILDER IN ALGERIA",
    illustrationCardTitle: "Amine Rahmani",
    illustrationCardSubtitle: "State Engineer in Computer Science",
    illustrationCardLocation: "Alger, Algeria",
    illustrationCardAts: "ATS Friendly",
    illustrationProgressLabel: "CV Strength Score",
    illustrationItem1: "Personal Details",
    illustrationItem2: "Work Experience",
    illustrationItem3: "DZ Degree & LMD Conforme",
    floatLmd: "DZ Standards 🇩🇿",
    floatPdf: "Instant PDF Export",
    floatUsers: "12k+ Resumes Created",
    floatInterviews: "More Interviews",
    floatAts: "ATS Success Rate",
    floatTime: "Avg Time",
    floatLanguages: "AR / FR / EN"
  },
  fr: {
    featuresTitle: "Pourquoi choisir Sira ?",
    featuresDesc: "Des fonctionnalités sur mesure, pensées pour les candidats et le marché de l'emploi en Algérie.",
    f1_title: "Modèles Conformes ATS Algérie",
    f1_desc: "Validés pour postuler dans les grandes entreprises (Sonatrach, Cosider, banques) et les startups d'Alger.",
    f1_tag: "Standard DZ",
    f2_title: "Création Trilingue",
    f2_desc: "Rédigez en Arabe, Français ou Anglais selon le poste (administration publique, secteur technique, multinationales).",
    f2_tag: "AR / FR / EN",
    f3_title: "Optimisé Connexions DZ",
    f3_desc: "Conçu pour fonctionner sans coupure sur les réseaux Mobilis, Djezzy, Ooredoo et Algérie Télécom.",
    f3_tag: "Économe en Data",
    f4_title: "Importation IA Intelligente",
    f4_desc: "Téléversez vos anciens CV locaux. Notre IA extrait vos expériences et diplômes en un instant.",
    f4_tag: "OCR Intelligent",
    f5_title: "Diplômes LMD & Écoles DZ",
    f5_desc: "Assistance rédactionnelle alignée sur le système LMD algérien, diplômes d'ingénieur d'État et universités locales.",
    f5_tag: "Conforme LMD",
    f6_title: "Export Vectoriel Léger",
    f6_desc: "Obtenez un PDF vectoriel léger et net, parfait pour l'envoi par e-mail ou l'impression en cybercafé.",
    f6_tag: "Qualité Impression",
    
    pricingTitle: "Choisissez votre forfait",
    pricingDesc: "Débloquez les outils professionnels et des modèles illimités pour propulser votre carrière.",
    proTitle: "Pro",
    proPrice: "990 DA",
    proPeriod: "/ mois",
    proFeature1: "Tous les modèles premium",
    proFeature2: "Brouillons actifs illimités",
    proFeature3: "Exportation PDF haute vitesse",
    
    premiumTitle: "Premium",
    premiumPrice: "1 990 DA",
    premiumPeriod: "/ an",
    premiumFeature1: "Tout ce qui est dans Pro",
    premiumFeature2: "Support client prioritaire",
    premiumFeature3: "Générateur de lettre de motivation",
    
    close: "Fermer",
    getStarted: "Créer gratuitement",
    h1: "Conforme ATS & Trilingue",
    h2: "Normes Académiques Algériennes",
    h3: "Ultra-léger & Économe en Data",
    mockAts: "Conforme ATS",

    // New Hero Content
    badgeText: "1ère Plateforme de CV en Algérie",
    heroTitle: "Votre CV,",
    heroHighlight: "Votre Opportunité.",
    heroSubtitle: "La première plateforme de CV conçue pour l'Algérie. Créez un CV trilingue conforme ATS en quelques minutes.",
    heroCtaPrimary: "Créer mon CV gratuitement",
    heroCtaSecondary: "Découvrir les fonctionnalités",
    trust1: "Conforme ATS & Trilingue",
    trust2: "Normes Académiques (LMD)",
    trust3: "Économe en Data & Léger",
    illustrationBadge: "#1 CRÉATEUR DE CV EN ALGÉRIE",
    illustrationCardTitle: "Amine Rahmani",
    illustrationCardSubtitle: "Ingénieur d'État en Informatique",
    illustrationCardLocation: "Alger, Algérie",
    illustrationCardAts: "Conforme ATS",
    illustrationProgressLabel: "Score de force du CV",
    illustrationItem1: "Informations Personnelles",
    illustrationItem2: "Expérience Professionnelle",
    illustrationItem3: "Diplômes DZ & Conforme LMD",
    floatLmd: "Norme DZ 🇩🇿",
    floatPdf: "Export PDF Instantané",
    floatUsers: "12k+ CVs créés",
    floatInterviews: "Plus d'entretiens",
    floatAts: "Taux Réussite ATS",
    floatTime: "Temps moyen",
    floatLanguages: "3 Langues"
  },
  ar: {
    featuresTitle: "لماذا تختار سيرا؟",
    featuresDesc: "مزايا وخصائص مصممة خصيصاً لتناسب سوق العمل والباحثين عن وظائف في الجزائر.",
    f1_title: "قوالب متوافقة مع الشركات الوطنية",
    f1_desc: "تصاميم معتمدة للتقديم في المؤسسات الكبرى (سوناطراك، كوسيدار، البنوك الوطنية) والشركات الناشئة.",
    f1_tag: "معيار جزائري",
    f2_title: "دعم كامل للغات الثلاث",
    f2_desc: "صمم سيرتك بالعربية (للإدارات العمومية)، الفرنسية (للشركات الخاصة)، أو الإنجليزية للمجالات التقنية.",
    f2_tag: "عربي / فرنسي / إنجليزي",
    f3_title: "خفيف ومناسب للشبكة المحلية",
    f3_desc: "مطور ليعمل بسلاسة حتى مع سرعات الإنترنت الضعيفة وشبكات الهاتف (موبيليس، جيزي، أوريدو).",
    f3_tag: "توفير البيانات",
    f4_title: "استيراد ذكي للسيرة القديمة",
    f4_desc: "ارفع ملفك القديم وسيقوم الذكاء الاصطناعي باستخراج مؤهلاتك وتنسيقها في ثوانٍ معدودة.",
    f4_tag: "مسح بالذكاء الاصطناعي",
    f5_title: "متوافق مع نظام LMD والشهادات",
    f5_desc: "مساعد كتابة ذكي متكامل مع مسميات الشهادات الجزائرية (مهندس دولة، ماستر، ليسانس، مدارس عليا).",
    f5_tag: "مطابق للشهادات",
    f6_title: "تصدير بصيغة PDF خفيفة",
    f6_desc: "تحميل ملف سيرة ذاتية خفيف وعالي الجودة، ممتاز للإرسال الإلكتروني أو الطباعة المباشرة.",
    f6_tag: "جاهز للطباعة",
    
    pricingTitle: "اختر خطتك المناسبة",
    pricingDesc: "افتح الأدوات الاحترافية وقوالب غير محدودة لتطوير مسيرتك المهنية.",
    proTitle: "برو (Pro)",
    proPrice: "990 دج",
    proPeriod: "/ شهرياً",
    proFeature1: "الوصول لجميع القوالب المميزة",
    proFeature2: "مسودات نشطة غير محدودة",
    proFeature3: "تصدير سريع للغاية بصيغة PDF",
    
    premiumTitle: "بريميوم (Premium)",
    premiumPrice: "1990 دج",
    premiumPeriod: "/ سنوياً",
    premiumFeature1: "كل ما تشمله الخطة الاحترافية",
    premiumFeature2: "دعم فني ذو أولوية",
    premiumFeature3: "محرر رسائل التغطية والاهتمام",
    
    close: "إغلاق",
    getStarted: "ابدأ التصميم مجاناً",
    h1: "متوافق مع الـ ATS وثلاثي اللغات",
    h2: "مطابق للمعايير الدراسية الجزائرية",
    h3: "خفيف جداً وموفر للبيانات",
    mockAts: "متوافق مع ATS",

    // New Hero Content
    badgeText: "أول منصة سيرة ذاتية في الجزائر",
    heroTitle: "سيرتك الذاتية،",
    heroHighlight: "بوابتك للنجاح.",
    heroSubtitle: "أول منصة سيرة ذاتية مصممة للجزائر. أنشئ سيرة ذاتية متوافقة مع ATS وبثلاث لغات في دقائق.",
    heroCtaPrimary: "أنشئ سيرتك مجاناً",
    heroCtaSecondary: "استكشف المزايا",
    trust1: "متوافق مع ATS وثلاثي اللغات",
    trust2: "مطابق للمعايير الأكاديمية (LMD)",
    trust3: "خفيف وموفر للبيانات",
    illustrationBadge: "محرر السيرة الذاتية رقم ١ في الجزائر",
    illustrationCardTitle: "أمين رحماني",
    illustrationCardSubtitle: "مهندس دولة في الإعلام الآلي",
    illustrationCardLocation: "الجزائر العاصمة",
    illustrationCardAts: "متوافق مع ATS",
    illustrationProgressLabel: "مقياس قوة السيرة الذاتية",
    illustrationItem1: "المعلومات الشخصية",
    illustrationItem2: "الخبرة المهنية",
    illustrationItem3: "الشهادات الجزائرية ونظام LMD",
    floatLmd: "معيار جزائري 🇩🇿",
    floatPdf: "تصدير PDF فوري",
    floatUsers: "١٢ ألف+ سيرة ذاتية",
    floatInterviews: "دعوات مقابلة أكثر",
    floatAts: "نسبة قبول ATS",
    floatTime: "متوسط الوقت",
    floatLanguages: "٣ لغات مدعومة"
  }
};

export default function LandingContent() {
  const { t, dir, language } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const localT = LOCAL_TRANSLATIONS[language] || LOCAL_TRANSLATIONS.fr;

  const getLocalizedField = (obj: any, baseField: string) => {
    if (!obj) return '';
    const field = `${baseField}_${language}`;
    return obj[field] || obj[`${baseField}_fr`] || obj[`${baseField}_en`] || '';
  };

  const handleUpgrade = async (planCode: string) => {
    if (planCode === 'free') {
      window.location.href = '/builder';
      return;
    }
    if (!isLoggedIn) {
      window.location.href = `/login?redirect=checkout`;
      return;
    }
    setIsCheckingOut(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API_BASE}/subscriptions/checkout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('oosira_token')}`,
        },
        body: JSON.stringify({
          billing_cycle: 'yearly',
          locale: language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en',
        }),
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert(data.detail || 'Failed to create checkout');
      }
    } catch (err: any) {
      alert(err.message || 'Payment service error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  useEffect(() => {
    // Check if user has a valid token stored
    const token = localStorage.getItem('oosira_token');
    setIsLoggedIn(!!token);

    // Fetch subscription plans from backend
    async function fetchPlans() {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const res = await fetch(`${API_BASE}/subscriptions/plans/`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
            setPlans(data);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch subscription plans from backend:", err);
      }
    }
    fetchPlans();
  }, []);

  return (
    <>
      {/* ── Floating Navigation ── */}
      <nav className="relative z-50 px-6 lg:px-12 py-6 flex items-center justify-between bg-transparent">
        <motion.div
          initial={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex items-center shrink-0 sm:w-1/3"
        >
          <Link href="/" dir="ltr" className="flex flex-row items-end group select-none">
            {/* Beautiful Custom SVG Infinity Logo */}
            <svg width="36" height="20" viewBox="1 6 22 12" className="text-blue-600 dark:text-blue-500 transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] overflow-visible mb-1">
              <defs>
                <linearGradient id="infinityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <path 
                d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"
                fill="none"
                stroke="url(#infinityGradient)"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[32px] font-display font-bold text-txt leading-none ml-1">
              sira
            </span>
          </Link>
        </motion.div>

        {/* Minimalist links mimicking Antigravity style (non-functional for visual flair), perfectly centered */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden md:flex items-center justify-center w-1/3 gap-8 text-[13px] font-medium text-txt-muted"
        >
          <button onClick={() => setShowFeaturesModal(true)} className="relative text-txt-muted hover:text-txt transition-colors group cursor-pointer focus:outline-none">
            {t('nav.features')}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-300 rounded-full opacity-0 group-hover:opacity-100"></span>
          </button>
          <button onClick={() => setShowPricingModal(true)} className="relative text-txt-muted hover:text-txt transition-colors group cursor-pointer focus:outline-none">
            {t('nav.pricing')}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-300 rounded-full opacity-0 group-hover:opacity-100"></span>
          </button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex gap-1.5 sm:gap-4 items-center justify-end sm:w-1/3"
        >
          <ThemeToggle />
          <LanguageToggle />
          
          <Link href={isLoggedIn ? "/dashboard" : "/login"} className="hidden md:inline-flex group relative items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-txt text-bg font-semibold text-[12px] sm:text-[13px] transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md hover:shadow-txt/20 overflow-hidden">
            {/* Quick Light Sweep */}
            <div className="absolute top-0 -left-[150%] group-hover:left-[150%] w-[100%] h-full bg-gradient-to-r from-transparent via-bg/20 to-transparent -skew-x-12 transition-all duration-500 ease-in-out z-0"></div>
            <span className="relative z-10">{isLoggedIn ? (t('nav.dashboard') && t('nav.dashboard') !== 'nav.dashboard' ? t('nav.dashboard') : "Dashboard") : t('nav.login')}</span>
            <ArrowRightIcon className={`relative z-10 w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 group-hover:${dir === 'rtl' ? '-translate-x-1' : 'translate-x-1'} rtl:rotate-180`} />
          </Link>

          {/* Hamburger Menu Toggle - Mobile Only */}
          <button
            onClick={() => setShowMobileMenu(true)}
            className="md:hidden p-2 rounded-full text-txt-muted hover:text-txt hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
        </motion.div>
      </nav>

      {/* ── Mobile Menu Overlay ── */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 z-[100] bg-bg/98 backdrop-blur-xl flex flex-col p-6"
          >
            {/* Header row inside mobile menu */}
            <div className="flex items-center justify-between mb-8">
              <Link href="/" onClick={() => setShowMobileMenu(false)} className="flex flex-row items-end select-none">
                <svg width="36" height="20" viewBox="1 6 22 12" className="text-blue-600 dark:text-blue-500 overflow-visible mb-1">
                  <defs>
                    <linearGradient id="infinityGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="currentColor" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <path 
                    d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"
                    fill="none"
                    stroke="url(#infinityGradientMobile)"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[32px] font-display font-bold text-txt leading-none ml-1">
                  sira
                </span>
              </Link>
              <button 
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-full text-txt-muted hover:text-txt hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Menu Links */}
            <div className="flex flex-col items-center justify-center flex-1 gap-8">
              <button 
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowFeaturesModal(true);
                }} 
                className="text-2xl font-bold text-txt hover:text-blue-600 dark:hover:text-blue-500 transition-colors cursor-pointer focus:outline-none"
              >
                {t('nav.features')}
              </button>

              <button 
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowPricingModal(true);
                }} 
                className="text-2xl font-bold text-txt hover:text-blue-600 dark:hover:text-blue-500 transition-colors cursor-pointer focus:outline-none"
              >
                {t('nav.pricing')}
              </button>

              <Link 
                href={isLoggedIn ? "/dashboard" : "/login"} 
                onClick={() => setShowMobileMenu(false)}
                className="mt-4 group relative inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-txt text-bg font-semibold text-[15px] transition-all duration-300 hover:scale-105 active:scale-95 shadow-md"
              >
                <span>{isLoggedIn ? (t('nav.dashboard') && t('nav.dashboard') !== 'nav.dashboard' ? t('nav.dashboard') : "Dashboard") : t('nav.login')}</span>
                <ArrowRightIcon className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pb-20 w-full max-w-[1400px] mx-auto">
        
        <section
          id="hero"
          className="relative w-full flex items-center py-8 lg:py-16 overflow-visible"
        >
          <div className="w-full relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-6 text-center lg:text-start rtl:lg:text-right"
              >
                {/* Algerian Flag Tag Badge */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 text-blue-500 text-[11px] font-bold uppercase tracking-wider mb-6 mx-auto lg:mx-0"
                >
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  <span>{localT.badgeText}</span>
                </motion.div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl lg:text-[56px] xl:text-[64px] lg:leading-[1.1] font-bold text-[#002147] dark:text-white tracking-tight mb-8 font-display">
                  {localT.heroTitle}{" "}
                  <span className="relative inline-block text-[#2563EB]">
                    {localT.heroHighlight}
                    {/* Creative Animated Underline */}
                    <motion.svg
                      className="absolute -bottom-2 start-0 w-full h-3"
                      viewBox="0 0 200 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      preserveAspectRatio="none"
                    >
                      <motion.path
                        d={dir === 'rtl' 
                          ? "M198 8C170 4 140 10 100 6C60 2 30 4 2 8" 
                          : "M2 8C30 4 60 2 100 6C140 10 170 4 198 8"
                        }
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                      />
                    </motion.svg>
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-[17px] md:text-[19px] text-[#8A9AA9] dark:text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
                  {localT.heroSubtitle}
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                  <Link
                    href={isLoggedIn ? "/dashboard" : "/builder"}
                    className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-[length:200%_auto] bg-left group-hover:bg-right transition-all duration-700 z-0" />
                    <span className="relative z-10">{localT.heroCtaPrimary}</span>
                  </Link>
                  <button
                    onClick={() => setShowFeaturesModal(true)}
                    className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-[#002147] dark:text-white border border-[#002147]/20 dark:border-white/20 hover:bg-[#002147]/5 dark:hover:bg-white/5 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {localT.heroCtaSecondary}
                  </button>
                </div>

                {/* Trust Indicators */}
                <div className="hidden sm:flex flex-wrap items-center gap-8 justify-center lg:justify-start text-[14.5px] text-[#8A9AA9]">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-[#2563EB] shrink-0" />
                    <span>{localT.trust1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-[#2563EB] shrink-0" />
                    <span>{localT.trust2}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-[#2563EB] shrink-0" />
                    <span>{localT.trust3}</span>
                  </div>
                </div>
              </motion.div>

              {/* Hero Visual - Inclined Floating macOS Window */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotateX: 25, rotateY: -15 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotateX: 8,
                  rotateY: -5,
                  y: [0, -10, 0],
                }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.2 },
                  scale: { duration: 0.8, delay: 0.2, ease: "easeOut" },
                  rotateX: { duration: 0.8, delay: 0.2, ease: "easeOut" },
                  rotateY: { duration: 0.8, delay: 0.2, ease: "easeOut" },
                  y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 },
                }}
                style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
                className="lg:col-span-5 lg:col-start-8 relative"
              >
                {/* Dynamic Glow Effect */}
                <motion.div
                  className="absolute -inset-12 bg-gradient-to-br from-[#2563EB]/20 via-purple-500/10 to-blue-500/10 rounded-3xl blur-3xl"
                  animate={{
                    opacity: [0.3, 0.5, 0.3],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Main macOS Window - Now with smooth simple shadow */}
                <motion.div
                  className="relative bg-white dark:bg-[#002147] rounded-2xl border border-gray-200 dark:border-[#2563EB]/15 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
                >
                  {/* macOS Window Header */}
                  <div className="px-4 py-3 bg-gray-50 dark:bg-[#003366]/50 border-b border-gray-100 dark:border-[#2563EB]/10 flex items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                      <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                      <div className="w-3 h-3 rounded-full bg-[#28ca42]" />
                    </div>
                  </div>

                  {/* Creative Banner - #1 Badge */}
                  <motion.div
                    className="relative bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#2563EB] overflow-hidden"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                  >
                    {/* Animated Shine Effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      initial={{ x: "-100%" }}
                      animate={{ x: "200%" }}
                      transition={{
                        duration: 2,
                        delay: 1.2,
                        repeat: Infinity,
                        repeatDelay: 4,
                      }}
                    />
                    <div className="relative px-4 py-2 flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                        transition={{
                          duration: 1,
                          delay: 1.5,
                          repeat: Infinity,
                          repeatDelay: 3,
                        }}
                      >
                        <TrophyIcon className="w-5 h-5 text-white" />
                      </motion.div>
                      <span className="text-xs font-bold text-white tracking-wide">
                        {localT.illustrationBadge}
                      </span>
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                        transition={{
                          duration: 1,
                          delay: 1.7,
                          repeat: Infinity,
                          repeatDelay: 3,
                        }}
                      >
                        <CursorArrowRaysIcon className="w-5 h-5 text-white" />
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Window Content with Sidebar */}
                  <div className="flex">
                    {/* Minimal Sidebar */}
                    <motion.div
                      className="w-14 bg-gray-50 dark:bg-[#003366]/30 border-e border-gray-100 dark:border-[#2563EB]/10 py-4 flex flex-col items-center gap-3 rtl:border-e-0 rtl:border-s"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="w-8 h-8 bg-[#2563EB]/10 dark:bg-[#2563EB]/20 rounded-lg flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-[#2563EB]" />
                      </div>
                      <div className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg flex items-center justify-center transition-colors">
                        <BriefcaseIcon className="w-4 h-4 text-gray-400 dark:text-white/40" />
                      </div>
                      <div className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg flex items-center justify-center transition-colors">
                        <AcademicCapIcon className="w-4 h-4 text-gray-400 dark:text-white/40" />
                      </div>
                      <div className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg flex items-center justify-center transition-colors">
                        <SparklesIcon className="w-4 h-4 text-gray-400 dark:text-white/40" />
                      </div>
                      <div className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg flex items-center justify-center transition-colors">
                        <PaintBrushIcon className="w-4 h-4 text-gray-400 dark:text-white/40" />
                      </div>
                    </motion.div>

                    {/* Main Content Area */}
                    <div className="flex-1 p-5 bg-white dark:bg-[#002147]">
                      {/* CV Card */}
                      <motion.div
                        className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 mb-4 border border-gray-100 dark:border-white/5"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#2563EB] to-[#3B82F6] rounded-xl flex items-center justify-center shadow-sm shrink-0">
                            <UserIcon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[#002147] dark:text-white text-sm mb-1.5 leading-snug">
                              {localT.illustrationCardTitle}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-white/40 leading-relaxed truncate">
                              {localT.illustrationCardSubtitle}
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-white/30 leading-normal mt-1.5">
                              {localT.illustrationCardLocation}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs shrink-0">
                            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                              {localT.illustrationCardAts}
                            </span>
                          </div>
                        </div>
                      </motion.div>

                      {/* Progress Bar */}
                      <motion.div
                        className="mb-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-gray-500 dark:text-white/40">
                            {localT.illustrationProgressLabel}
                          </span>
                          <span className="font-semibold text-[#2563EB]">92%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "92%" }}
                            transition={{
                              duration: 1.2,
                              delay: 0.8,
                              ease: "easeOut",
                            }}
                            className="h-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] rounded-full"
                          />
                        </div>
                      </motion.div>

                      {/* Sections List */}
                      <div className="space-y-2">
                        {[
                          { label: localT.illustrationItem1, progress: 100, color: "green" },
                          { label: localT.illustrationItem2, progress: 100, color: "blue" },
                          { label: localT.illustrationItem3, progress: 80, color: "purple" },
                        ].map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 + i * 0.1 }}
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                          >
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                item.color === "green"
                                  ? "bg-green-100 dark:bg-green-500/20"
                                  : item.color === "blue"
                                    ? "bg-blue-100 dark:bg-blue-500/20"
                                    : "bg-purple-100 dark:bg-purple-500/20"
                              }`}
                            >
                              <CheckCircleIcon
                                className={`w-3.5 h-3.5 ${
                                  item.color === "green"
                                    ? "text-green-500"
                                    : item.color === "blue"
                                      ? "text-blue-500"
                                      : "text-purple-500"
                                }`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-semibold text-[#002147] dark:text-white truncate">{item.label}</div>
                              <div className="text-[9px] text-gray-400 dark:text-white/30 leading-none mt-0.5">{item.progress}% completed</div>
                            </div>
                            <span className="text-[10px] text-gray-400 dark:text-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.progress}%
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Creative Floating Elements - Statistics Dashboard Cards */}
                
                {/* Card 1 - Interviews Stat (Top Right) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: [0, -15, 0],
                    x: [0, 5, 0],
                  }}
                  transition={{
                    opacity: { delay: 1.0, duration: 0.4 },
                    scale: { delay: 1.0, duration: 0.5, type: "spring" },
                    y: { delay: 1.5, duration: 3, repeat: Infinity, ease: "easeInOut" },
                    x: { delay: 1.5, duration: 4, repeat: Infinity, ease: "easeInOut" },
                  }}
                  className="hidden lg:block absolute -top-12 -end-24 z-20"
                >
                  <div className="bg-white dark:bg-zinc-900 border border-border/50 rounded-full shadow-lg px-4 py-2 flex items-center gap-2 select-none">
                    <SparklesIcon className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span className="text-xs font-bold text-txt">
                      +45% {localT.floatInterviews}
                    </span>
                  </div>
                </motion.div>

                {/* Card 3 - Created CVs Stat (Bottom Right) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: [0, -8, 0],
                  }}
                  transition={{
                    opacity: { delay: 1.4, duration: 0.4 },
                    scale: { delay: 1.4, duration: 0.5, type: "spring" },
                    y: { delay: 1.9, duration: 2.0, repeat: Infinity, ease: "easeInOut" },
                  }}
                  className="hidden lg:block absolute -bottom-8 -end-28 z-20"
                >
                  <div className="bg-white dark:bg-zinc-900 border border-border/50 rounded-full shadow-lg px-4 py-2 flex items-center gap-2 select-none">
                    <div className="flex shrink-0">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <StarIconSolid key={i} className="w-3.5 h-3.5 text-[#2563EB] fill-[#2563EB]" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-txt">
                      {localT.floatUsers}
                    </span>
                  </div>
                </motion.div>

                {/* Card 4 - ATS Score Stat (Bottom Left) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0, y: 50 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: [0, -10, 0],
                    rotate: [-3, -1, -3],
                  }}
                  transition={{
                    opacity: { delay: 1.1, duration: 0.4 },
                    scale: { delay: 1.1, duration: 0.5, type: "spring" },
                    y: { delay: 1.6, duration: 3.5, repeat: Infinity, ease: "easeInOut" },
                    rotate: { delay: 1.6, duration: 4, repeat: Infinity, ease: "easeInOut" },
                  }}
                  className="hidden lg:block absolute -bottom-8 -start-28 z-20"
                >
                  <div className="bg-white dark:bg-zinc-900 border border-border/50 rounded-full shadow-lg px-4 py-2 flex items-center gap-2 select-none">
                    <ShieldCheckIcon className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span className="text-xs font-bold text-txt">
                      98% {localT.floatAts}
                    </span>
                  </div>
                </motion.div>

                {/* Card 5 - Avg Creation Time Stat (Top Left) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: [0, 12, 0],
                    x: [0, -5, 0],
                  }}
                  transition={{
                    opacity: { delay: 1.3, duration: 0.4 },
                    scale: { delay: 1.3, duration: 0.5, type: "spring" },
                    y: { delay: 1.8, duration: 2.8, repeat: Infinity, ease: "easeInOut" },
                    x: { delay: 1.8, duration: 3.5, repeat: Infinity, ease: "easeInOut" },
                  }}
                  className="hidden lg:block absolute -top-8 -start-36 z-20"
                >
                  <div className="bg-white dark:bg-zinc-900 border border-border/50 rounded-full shadow-lg px-4 py-2 flex items-center gap-2 select-none">
                    <BoltIcon className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span className="text-xs font-bold text-txt">
                      &lt; 10 min {localT.floatTime}
                    </span>
                  </div>
                </motion.div>
             </motion.div>
           </div>
         </div>
       </section>
      </main>

      {/* ── Features Overlay ── */}
      <AnimatePresence>
        {showFeaturesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-md p-4 overflow-y-auto sm:py-8"
            onClick={() => setShowFeaturesModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-5xl bg-surface border border-border rounded-3xl shadow-2xl shadow-black/25 overflow-hidden my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button on top right */}
              <button 
                onClick={() => setShowFeaturesModal(false)} 
                className="absolute top-5 right-5 p-2 rounded-full text-txt-muted hover:text-txt hover:bg-black/5 dark:hover:bg-white/5 transition-colors z-20"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              {/* Animated gradient accent */}
              <div className="h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]" />

              <div className="p-5 sm:p-9">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/10 to-indigo-500/10 border border-violet-500/15 flex items-center justify-center">
                    <SparklesIcon className="w-6 h-6 text-violet-500" />
                  </div>
                </div>

                {/* Title & Description */}
                <h2 className="text-[20px] sm:text-[22px] font-bold text-txt text-center mb-1.5 tracking-tight">
                  {localT.featuresTitle}
                </h2>
                <p className="text-[13px] text-txt-muted text-center mb-6 leading-relaxed max-w-md mx-auto">
                  {localT.featuresDesc}
                </p>

                {/* Grid of features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {[
                    { Icon: ShieldCheckIcon, title: localT.f1_title, desc: localT.f1_desc, tag: localT.f1_tag, color: 'text-violet-500 bg-violet-500/5 dark:bg-violet-500/10 border-violet-500/10' },
                    { Icon: SwatchIcon, title: localT.f2_title, desc: localT.f2_desc, tag: localT.f2_tag, color: 'text-blue-500 bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/10' },
                    { Icon: CloudArrowUpIcon, title: localT.f3_title, desc: localT.f3_desc, tag: localT.f3_tag, color: 'text-cyan-500 bg-cyan-500/5 dark:bg-cyan-500/10 border-cyan-500/10' },
                    { Icon: SparklesIcon, title: localT.f4_title, desc: localT.f4_desc, tag: localT.f4_tag, color: 'text-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/10' },
                    { Icon: PencilSquareIcon, title: localT.f5_title, desc: localT.f5_desc, tag: localT.f5_tag, color: 'text-amber-500 bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/10' },
                    { Icon: ArrowDownTrayIcon, title: localT.f6_title, desc: localT.f6_desc, tag: localT.f6_tag, color: 'text-rose-500 bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/10' },
                  ].map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + i * 0.03 }}
                      className={`relative flex flex-col justify-between p-5 border rounded-2xl transition-all duration-300 hover:shadow-md hover:border-txt/10 ${f.color}`}
                    >
                      <div>
                        {/* Icon Container */}
                        <div className="w-9 h-9 rounded-xl bg-txt/5 dark:bg-white/5 border border-border flex items-center justify-center mb-3">
                          <f.Icon className="w-5 h-5 shrink-0" />
                        </div>
                        
                        {/* Title (with padding to prevent overlapping with absolute tag) */}
                        <h3 className="font-bold text-[14px] sm:text-[14.5px] text-txt mb-1.5 pr-20 rtl:pl-20 rtl:pr-0 leading-tight">
                          {f.title}
                        </h3>
                        
                        {/* Description */}
                        <p className="text-[12px] text-txt-muted leading-relaxed font-light">
                          {f.desc}
                        </p>
                      </div>

                      {/* Floating Absolute Tag Badge */}
                      <span className="absolute top-5 right-5 rtl:left-5 rtl:right-auto text-[9px] font-bold border border-current px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap bg-surface shadow-sm">
                        {f.tag}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex gap-3">
                  <Link
                    href="/builder"
                    className="group relative flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 overflow-hidden cursor-pointer rounded-xl text-white font-semibold text-[13.5px]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-[length:200%_auto] bg-left group-hover:bg-right transition-all duration-700 z-0" />
                    <span className="relative z-10">{localT.getStarted}</span>
                  </Link>
                  <button
                    onClick={() => setShowFeaturesModal(false)}
                    className="flex-1 px-5 py-3 rounded-xl border border-border text-txt font-semibold text-[13.5px] bg-bg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    {localT.close}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pricing Overlay ── */}
      <AnimatePresence>
        {showPricingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-md p-4 overflow-y-auto sm:py-8"
            onClick={() => setShowPricingModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-5xl bg-surface border border-border rounded-3xl shadow-2xl shadow-black/25 overflow-hidden my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button on top right */}
              <button 
                onClick={() => setShowPricingModal(false)} 
                className="absolute top-5 right-5 p-2 rounded-full text-txt-muted hover:text-txt hover:bg-black/5 dark:hover:bg-white/5 transition-colors z-20"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              {/* Animated gradient accent */}
              <div className="h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]" />

              <div className="p-5 sm:p-9">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600/10 to-yellow-500/10 border border-amber-500/15 flex items-center justify-center">
                    <StarIcon className="w-6 h-6 text-amber-500" />
                  </div>
                </div>

                {/* Title & Description */}
                <h2 className="text-[20px] sm:text-[22px] font-bold text-txt text-center mb-1.5 tracking-tight">
                  {localT.pricingTitle}
                </h2>
                <p className="text-[13px] text-txt-muted text-center mb-6 leading-relaxed max-w-md mx-auto">
                  {localT.pricingDesc}
                </p>

                {/* Plans Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-7">
                  {(plans.length > 0 ? plans : [
                    {
                      id: 'free',
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
                        { text_en: '5 PDF downloads per month', text_fr: '5 téléchargements PDF par mois', text_ar: '5 تنزيلات PDF شهرياً', is_included: true },
                        { text_en: 'Access to standard templates', text_fr: 'Accès aux modèles standards', text_ar: 'الوصول إلى القوالب القياسية', is_included: true },
                        { text_en: '1 free trial OCR import', text_fr: "1 essai gratuit d'importation OCR par IA", text_ar: 'تجربة واحدة مجانية لاستيراد السيرة الذاتية (OCR)', is_included: true },
                        { text_en: 'Limited color palettes', text_fr: 'Palettes de couleurs limitées', text_ar: 'لوحات ألوان محدودة', is_included: false }
                      ]
                    },
                    {
                      id: 'pro',
                      code: 'pro',
                      price_da: 350,
                      is_popular: true,
                      icon_type: 'sparkles',
                      name_en: 'Pro',
                      name_fr: 'Pro',
                      name_ar: 'برو',
                      desc_en: 'Everything you need to stand out.',
                      desc_fr: 'Tout ce dont vous avez besoin pour vous démarquer.',
                      desc_ar: 'كل ما تحتاجه للتميز.',
                      billed_text_en: 'Billed 4800 DA yearly',
                      billed_text_fr: 'Facturé 4800 DA par an',
                      billed_text_ar: 'يتم فوترتها 4800 دج سنويا',
                      features: [
                        { text_en: 'Unlimited PDF downloads', text_fr: 'Téléchargements PDF illimités', text_ar: 'تنزيلات PDF غير محدودة', is_included: true },
                        { text_en: 'AI-powered OCR Resume Import', text_fr: "Importation de CV par l'IA (OCR)", text_ar: 'استيراد السيرة الذاتية بالذكاء الاصطناعي (OCR)', is_included: true },
                        { text_en: 'All premium templates unlocked', text_fr: 'Tous les modèles premium débloqués', text_ar: 'جميع القوالب المميزة مفتوحة', is_included: true },
                        { text_en: 'Advanced color palettes & customization', text_fr: 'Palettes de couleurs avancées & personnalisation', text_ar: 'لوحات ألوان متقدمة وتخصيص', is_included: true },
                        { text_en: 'Priority support', text_fr: 'Support prioritaire', text_ar: 'دعم ذو أولوية', is_included: true }
                      ]
                    }
                  ]).map((plan: any) => {
                    const isPopular = plan.is_popular;
                    const hasPrice = plan.price_da > 0;
                    return (
                      <div 
                        key={plan.code}
                        className={`relative flex flex-col justify-between p-5 sm:p-6 rounded-3xl bg-surface border transition-all duration-300 ${
                          isPopular 
                            ? 'border-2 border-blue-500 shadow-xl shadow-blue-500/5' 
                            : 'border-border hover:border-blue-500/30'
                        }`}
                      >
                        {isPopular && (
                          <div className="absolute -top-3 right-6 rtl:left-6 rtl:right-auto bg-blue-600 text-white px-3 py-0.5 rounded-full font-bold text-[9px] tracking-wider uppercase shadow-md z-10">
                            {language === 'ar' ? 'الأكثر شيوعاً' : language === 'fr' ? 'Plus Populaire' : 'Most Popular'}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5 mb-2.5">
                            {plan.icon_type === 'sparkles' ? (
                              <SparklesIcon className="w-5 h-5 text-blue-500" />
                            ) : (
                              <SwatchIcon className="w-5 h-5 text-emerald-500" />
                            )}
                            <h3 className="font-bold text-[16px] text-txt">{getLocalizedField(plan, 'name')}</h3>
                          </div>
                          
                          <p className="text-[12px] text-txt-muted mb-4 leading-relaxed">
                            {getLocalizedField(plan, 'desc')}
                          </p>

                          <div className="flex items-baseline gap-1 mb-1">
                            <span className="text-3xl font-black text-txt">
                              {hasPrice ? `${plan.price_da} DA` : (language === 'ar' ? 'مجاني' : (language === 'fr' ? 'Gratuit' : 'Free'))}
                            </span>
                            {hasPrice && (
                              <span className="text-[12px] text-txt-muted">
                                {language === 'ar' ? '/ شهرياً' : (language === 'fr' ? '/ mois' : '/ month')}
                              </span>
                            )}
                          </div>

                          {hasPrice ? (
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mb-5 font-semibold">
                              {getLocalizedField(plan, 'billed_text')}
                            </p>
                          ) : (
                            <div className="h-[22px] mb-5" />
                          )}

                          <ul className="space-y-2.5 mb-6">
                            {(plan.features || []).map((feature: any, idx: number) => (
                              <li key={idx} className={`flex items-start gap-2.5 ${!feature.is_included ? 'opacity-55' : ''}`}>
                                {feature.is_included ? (
                                  <CheckCircleIcon className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                ) : (
                                  <XMarkIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                )}
                                <span className={`text-[12px] leading-tight ${feature.is_included ? 'text-txt font-medium' : 'text-txt-muted line-through'}`}>
                                  {getLocalizedField(feature, 'text')}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Button below card */}
                        <button
                          onClick={() => handleUpgrade(plan.code)}
                          className={`w-full py-3 rounded-xl font-bold text-[13px] transition-all duration-300 active:scale-[0.98] cursor-pointer ${
                            !hasPrice
                              ? 'text-txt bg-black/5 dark:bg-white/5 border border-border hover:bg-black/10 dark:hover:bg-white/10'
                              : 'text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25'
                          }`}
                        >
                          {!hasPrice ? (
                            language === 'ar' ? 'الأساسي' : language === 'fr' ? 'Basique' : 'Basic'
                          ) : (
                            isCheckingOut ? (
                              <span className="inline-flex items-center gap-1.5 justify-center">
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {language === 'ar' ? 'جاري المعالجة...' : language === 'fr' ? 'Traitement...' : 'Processing...'}
                              </span>
                            ) : (
                              language === 'ar' ? 'اشترك الآن' : language === 'fr' ? "S'abonner" : 'Subscribe'
                            )
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Close Button below */}
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowPricingModal(false)}
                    className="px-8 py-2.5 rounded-xl border border-border text-txt font-semibold text-[13px] bg-bg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    {localT.close}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
