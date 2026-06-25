"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();

  // Set language from URL query param immediately on mount
  // This runs before any template rendering, so section titles are correct
  useEffect(() => {
    const langParam = searchParams.get("lang");
    if (langParam && (langParam === "fr" || langParam === "en" || langParam === "ar")) {
      localStorage.setItem("sira-language", langParam);
      setLanguage(langParam);
    }
  }, [searchParams, setLanguage]);

  useEffect(() => {
    // Expose a global method so Playwright (Django) can push data into this page
    (window as any).injectCVData = (cvData: any, styleConfig: any, templateId: number) => {
      setData({ cv: cvData, config: styleConfig, id: templateId });
      // Delay for CSS/fonts to load, then signal print-ready
      setTimeout(() => document.body.classList.add("print-ready"), 1200);
    };

    // Allow local debugging by pulling from localStorage
    const stored = localStorage.getItem("previewCV");
    if (stored) {
      const parsed = JSON.parse(stored);
      setData(parsed);
      setTimeout(() => document.body.classList.add("print-ready"), 1200);
    }
  }, []);

  if (!data) return <div className="p-8 text-center text-sm font-medium text-gray-500">Awaiting PDF render data from server...</div>;

  const TemplateComponent = TEMPLATES[data.id] || TEMPLATES[1];
  const cssVars = data.config ? styleToCSSVars(data.config) : {};

  return (
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
  );
}
