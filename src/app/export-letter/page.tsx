"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LetterDocument, { LetterPayload } from "@/components/LetterDocument";
import { useLanguage } from "@/app/i18n/LanguageContext";

export const dynamic = 'force-dynamic';

declare global {
  interface Window {
    /** Called by the Django/Playwright exporter to push letter data into the page. */
    injectLetterData?: (payload: LetterPayload) => void;
  }
}

function ExportLetterContent() {
  const [payload, setPayload] = useState<LetterPayload | null>(null);
  const { setLanguage } = useLanguage();
  const searchParams = useSearchParams();

  useEffect(() => {
    const langParam = searchParams.get("lang");
    if (langParam && (langParam === "fr" || langParam === "en" || langParam === "ar")) {
      localStorage.setItem("sira-language", langParam);
      setLanguage(langParam);
    }
  }, [searchParams, setLanguage]);

  useEffect(() => {
    window.injectLetterData = (data) => {
      setPayload(data);
    };
  }, []);

  const signalReady = useCallback(() => {
    const ready = async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => document.body.classList.add("print-ready")),
      );
    };
    void ready();
  }, []);

  useEffect(() => {
    if (payload) signalReady();
  }, [payload, signalReady]);

  if (!payload)
    return (
      <div className="p-8 text-center text-sm font-medium text-gray-500">
        Awaiting PDF render data from server...
      </div>
    );

  return <LetterDocument payload={payload} />;
}

/**
 * Render target for the Playwright cover-letter PDF export in the Django backend.
 * Wrapped in Suspense to satisfy Next.js CSR requirements for useSearchParams.
 */
export default function ExportLetterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-medium text-gray-500">Loading export view...</div>}>
      <ExportLetterContent />
    </Suspense>
  );
}
