"use client";

import { useEffect, useState } from "react";
import { CVClassique } from "../templates/CVClassique";
import { CVIngenieur } from "../templates/CVIngenieur";
import { CVExecutif } from "../templates/CVExecutif";
import { CVTech } from "../templates/CVTech";
import { CVMedical } from "../templates/CVMedical";
import { styleToCSSVars } from "../templates/styleConfig";

const TEMPLATES: Record<number, any> = {
  1: CVClassique,
  2: CVIngenieur,
  3: CVExecutif,
  4: CVMedical,
  5: CVTech,
};

export default function ExportPage() {
  const [data, setData] = useState<{ cv: any; config: any; id: number } | null>(null);

  useEffect(() => {
    // 1. Expose a global method so Playwright (Django) can push data into this page
    (window as any).injectCVData = (cvData: any, styleConfig: any, templateId: number) => {
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
  }, []);

  if (!data) return <div className="p-8 text-center text-sm font-medium text-gray-500">Awaiting PDF render data from server...</div>;

  const TemplateComponent = TEMPLATES[data.id] || TEMPLATES[1];
  const cssVars = data.config ? styleToCSSVars(data.config) : {};

  return (
    <>
      {/* Suppress SyncTeX hover outlines & ensure exact A4 pixel match with preview */}
      <style>{`
        [data-cv-field] { cursor: default !important; outline: none !important; }
        [data-cv-field]:hover { background: transparent !important; outline: none !important; }
        body { margin: 0; padding: 0; background: white; }
      `}</style>
      <div
        style={{
          width: 794,
          minHeight: 1123,
          margin: 0,
          padding: 0,
          background: '#fff',
          ...cssVars as any,
        }}
      >
        <TemplateComponent data={data.cv} config={data.config} />
      </div>
    </>
  );
}
