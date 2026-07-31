"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getLayoutBuilder } from "../templates";
import { CVStyleConfig, styleToCSSVars } from "../templates/styleConfig";
import { normalizeCandidate } from "../lib/cvData";
import { Candidate } from "../data";
import PaginatedCV from "@/components/PaginatedCV";
import { useLanguage } from "@/app/i18n/LanguageContext";

type ExportPayload = { cv: Candidate; config?: CVStyleConfig; id: number };

declare global {
  interface Window {
    /** Called by the Django/Playwright exporter to push CV data into the page. */
    injectCVData?: (
      cvData: unknown,
      styleConfig: CVStyleConfig,
      templateId: number,
    ) => void;
  }
}

/**
 * Render target for the Playwright PDF export in the Django backend.
 *
 * It runs the *same* pagination engine as the builder preview, so the page
 * count and the break positions are identical by construction rather than by
 * two independent mechanisms happening to agree.
 */
export default function ExportPage() {
  const [data, setData] = useState<ExportPayload | null>(null);
  const { t, language, setLanguage } = useLanguage();
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
    window.injectCVData = (cvData, styleConfig, templateId) => {
      // Same normalisation the builder applies on load, so a legacy record
      // prints exactly what the preview showed.
      setData({ cv: normalizeCandidate(cvData), config: styleConfig, id: templateId });
    };

    // Allow local debugging by pulling from localStorage
    const stored = localStorage.getItem("previewCV");
    if (stored) {
      const parsed = JSON.parse(stored) as ExportPayload;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- local debug path only
      setData({ ...parsed, cv: normalizeCandidate(parsed.cv) });
    }
  }, []);

  /**
   * Signal the backend that the document is laid out and safe to print.
   * Replaces a blind 1200ms sleep: we now wait for the fonts to settle *and*
   * for pagination to finish, which is both faster and race-free.
   */
  const handleReady = useCallback(() => {
    const ready = async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      // One frame so the final layout is committed before Chromium prints.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => document.body.classList.add("print-ready")),
      );
    };
    void ready();
  }, []);

  if (!data)
    return (
      <div className="p-8 text-center text-sm font-medium text-gray-500">
        Awaiting PDF render data from server...
      </div>
    );

  const cssVars = (data.config ? styleToCSSVars(data.config) : {}) as React.CSSProperties;
  const layout = getLayoutBuilder(data.id)(data.cv, data.config, t, language);

  return (
    <PaginatedCV
      layout={layout}
      cssVars={cssVars}
      dir={language === "ar" ? "rtl" : "ltr"}
      print
      chrome={false}
      onReady={handleReady}
    />
  );
}
