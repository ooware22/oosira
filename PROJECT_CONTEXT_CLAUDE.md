# Oosira CV - Project Context & Handoff Document

This document contains a comprehensive summary of the Oosira CV project architecture, recent bug fixes, and the current state of the codebase. It is designed to provide immediate context for any AI assistant (like Claude) picking up the development.

## 1. Project Overview & Architecture

**Oosira** is a premium, localized (Algeria-focused) professional CV builder that allows users to create, customize, and export high-quality resumes.

- **Frontend (`c:\DEV\oosira`)**: Next.js 14+ (App Router), React, TailwindCSS, TypeScript, Redux (for state management, though some local state is used in the builder).
- **Backend (`c:\DEV\oosira-backend`)**: Django REST Framework (DRF), Python. 
- **PDF Export Engine**: The backend uses **Playwright** (`sync_playwright`) to spin up a headless Chromium browser, navigate to a dedicated frontend route (`/export`), inject the user's CV data into the DOM, and natively print it to a pixel-perfect A4 vector PDF.

## 2. Core Modules & Key Files

### Frontend
- `src/app/builder/page.tsx`: The main CV builder interface. Contains the split-pane layout (Form on the left, Preview on the right). Handles the `handlePrint` logic which sends data to the Django backend to generate the PDF.
- `src/app/export/page.tsx`: A dedicated, minimal route used **exclusively by Playwright** to render the CV for PDF conversion. It waits for the backend to inject data via `window.injectCVData`.
- `src/app/templates/*`: Contains the distinct CV templates (e.g., `CVClassique`, `CVMedical`, `CVTech`, `CVIngenieur`, `CVExecutif`). These are rendered both in the builder preview and the `/export` page.
- `src/app/globals.css` & `src/app/cv-templates.css`: Contain critical print styles (`@media print`) and base `.cv-page` styling mapping.
- `src/app/templates/styleConfig.ts`: The dynamic theming engine that converts user style preferences (colors, fonts, spacing) into CSS Custom Properties (`--cv-*`).

### Backend
- `cvs/views.py`: Contains the `CVPdfExportView` (`POST /api/cvs/pdf/` and `/api/cvs/<id>/pdf/`). This view receives the JSON payload, launches Playwright, navigates to `http://localhost:3000/export?lang=...`, injects the data via `page.evaluate()`, and returns the PDF bytes.

## 3. Recent Major Fixes & Work Accomplished (Latest Session)

In the most recent development session, we focused on achieving **pixel-perfect parity between the Builder Preview and the downloaded PDF**, as well as enhancing the UX.

### A. SyncTeX (Double-Click to Edit)
- **Feature**: Added "Overleaf-style" SyncTeX navigation. When a user double-clicks any element in the live CV preview, the builder automatically scrolls to and focuses the exact corresponding input field in the left-hand form.
- **Implementation**: We added `data-cv-field="fieldname"` attributes to elements in the templates. The builder listens for double-clicks, extracts the `data-cv-field`, uses `document.querySelector` to find the input in the DOM, and triggers `.scrollIntoView()` and `.focus()`.

### B. PDF Generation Fixes (Empty PDF Bug)
- **Problem**: Playwright was downloading empty CVs (only the structure, no text).
- **Root Cause**: In `views.py`, Playwright's `page.evaluate()` was passing an array `[cv_data, style_config, template_id]` as a single argument to the JS function.
- **Fix**: We destructured the array inside the JS arrow function: `([data, style, tid]) => window.injectCVData(data, style, tid)`.

### C. PDF Translation / Language Parity
- **Problem**: The preview showed section titles in French ("COMPÉTENCES"), but the PDF downloaded with English titles ("SKILLS").
- **Root Cause**: Playwright's headless browser starts with an empty `localStorage`, so the frontend `LanguageProvider` defaulted to its base state.
- **Fix**: 
  1. The frontend now includes the active `language` in the POST payload to `/api/cvs/pdf/`.
  2. The Django backend appends `?lang={language}` to the `/export` URL.
  3. The `export/page.tsx` reads the URL parameter on mount, sets `localStorage.setItem("sira-language")`, and calls `setLanguage()` before rendering.

### D. PDF Design Parity (Missing Background Colors)
- **Problem**: The skill pills and badges (e.g., pink backgrounds in CVMedical/CVTech) were appearing transparent in the downloaded PDF, unlike the preview.
- **Root Cause 1**: The `@media print` rule in `globals.css` had `[data-cv-field] { background: transparent !important; }` to hide SyncTeX hover states, but this forcefully stripped the actual background colors of the skill pills.
- **Root Cause 2**: Browsers default to stripping background colors in print mode to save ink.
- **Fix**: 
  1. Removed `background: transparent !important` from the print media query.
  2. Enforced `print-color-adjust: exact !important;` and `-webkit-print-color-adjust: exact !important;` globally in the export page to force Chromium to render all background colors perfectly.

## 4. Current State & Known Next Steps

- **PDF Export is Fully Functional**: The Playwright pipeline is active, destructuring works, fonts load properly (thanks to `networkidle` and a `1200ms` setTimeout delay in `export/page.tsx`), and colors/languages are matched exactly.
- **Local Environment Considerations**:
  - The frontend runs on port `3000`.
  - The backend runs on port `8000`.
  - To test PDF export locally, both must be running, and the frontend URL in the backend (`FRONTEND_URL`) must correctly point to `http://localhost:3000`.
- **Potential Next Tasks**:
  - Investigating hydration mismatches (previously noted but not started).
  - Transitioning Next.js 16 deprecated `middleware` features to `proxy` if applicable in future updates.
  - Ensuring the OCR feature (which currently returns 429/401 due to quota/auth issues) is stabilized.

---
*Generated by Antigravity / DeepMind Assistant to ensure seamless context transfer.*
