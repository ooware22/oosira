"use client";

import { useEffect, useState } from "react";
import { CVClassique } from "../templates/CVClassique";
import { CVIngenieur } from "../templates/CVIngenieur";
import { CVExecutif } from "../templates/CVExecutif";
import { CVTech } from "../templates/CVTech";
import { CVMedical } from "../templates/CVMedical";
import { styleToCSSVars } from "../templates/styleConfig";
import { useLanguage } from "@/app/i18n/LanguageContext";

const TEMPLATES: Record<number, any> = {
  1: CVClassique,
  2: CVIngenieur,
  3: CVExecutif,
  4: CVMedical,
  5: CVTech,
};

export default function ExportPage() {
  const [data, setData] = useState<{ cv: any; config: any; id: number } | null>(null);
  const { setLanguage } = useLanguage();

  useEffect(() => {
    // 1. Expose a global method so Playwright (Django) can push data into this page
    (window as any).injectCVData = (cvData: any, styleConfig: any, templateId: number, lang?: string) => {
      // Set the language BEFORE triggering a re-render so templates use the correct labels
      if (lang && (lang === 'fr' || lang === 'en' || lang === 'ar')) {
        setLanguage(lang);
      }
      setData({ cv: cvData, config: styleConfig, id: templateId });
      // Add a small delay for CSS/fonts to load
      setTimeout(() => document.body.classList.add("print-ready"), 800);
    };

    // 2. Allow local debugging by pulling from localStorage
    const stored = localStorage.getItem("previewCV");
    if (stored) {
      const parsed = JSON.parse(stored);
      setData(parsed);
      setTimeout(() => document.body.classList.add("print-ready"), 800);
    }
  }, [setLanguage]);

  if (!data) return <div className="p-8 text-center text-sm font-medium text-gray-500">Awaiting PDF render data from server...</div>;

  const TemplateComponent = TEMPLATES[data.id] || TEMPLATES[1];
  const cssVars = data.config ? styleToCSSVars(data.config) : {};

  return (
    <>
      {/* 
        Force PDF fidelity:
        - Suppress SyncTeX hover outlines 
        - Force exact color reproduction via print-color-adjust
        - Ensure backgrounds on ALL elements are preserved
        - Match the builder preview's .cv-page-wrapper behavior exactly
      */}
      <style>{`
        /* Force all backgrounds/colors to print exactly as rendered */
        *, *::before, *::after {
          print-color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        /* Suppress SyncTeX hover indicators */
        [data-cv-field] { cursor: default !important; outline: none !important; }
        [data-cv-field]:hover { background: inherit !important; outline: none !important; }
        body { margin: 0; padding: 0; background: white; }
        @media print {
          @page { margin: 0; size: A4; }
          html, body { height: auto !important; overflow: visible !important; }
        }
      `}</style>
      <div
        className="cv-page-wrapper"
        style={{
          ...cssVars as any,
          minHeight: 1123,
          height: 1123,
        }}
      >
        <TemplateComponent data={data.cv} config={data.config} />
      </div>
    </>
  );
}
