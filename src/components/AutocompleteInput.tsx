"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";

interface AutocompleteInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suggestions: readonly string[];
  placeholder?: string;
  type?: string;
  maxResults?: number;
  /** When true, show all suggestions on focus even when input is empty */
  showAllOnFocus?: boolean;
  /** When true, shows amber warning indicating this field contains template data */
  isTemplateData?: boolean;
  /** DOM id for SyncTeX focus targeting */
  id?: string;
}

/**
 * Fuzzy-matching autocomplete input with styled dropdown.
 * Supports keyboard nav (↑↓ Enter Escape) and highlighted matches.
 */
export default function AutocompleteInput({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  type = "text",
  maxResults = 8,
  showAllOnFocus = false,
  isTemplateData,
  id,
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Normalize: lowercase + strip accents (é→e, à→a, etc.)
  const normalize = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Fuzzy filter: match if all words of query appear in suggestion
  const filtered = useMemo(() => {
    const q = normalize(value.trim());
    // When showAllOnFocus is enabled and input is empty, show all suggestions
    if (!q) {
      return showAllOnFocus ? suggestions.slice(0, maxResults) : [];
    }
    if (q.length < 2 && !showAllOnFocus) return [];
    const words = q.split(/\s+/);
    return suggestions
      .filter((s) => {
        const lower = normalize(s);
        return words.every((w) => lower.includes(w));
      })
      .slice(0, maxResults);
  }, [value, suggestions, maxResults, showAllOnFocus]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const el = listRef.current.children[activeIdx] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open || filtered.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => (i < filtered.length - 1 ? i + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => (i > 0 ? i - 1 : filtered.length - 1));
      } else if (e.key === "Enter" && activeIdx >= 0) {
        e.preventDefault();
        onChange(filtered[activeIdx]);
        setOpen(false);
        setActiveIdx(-1);
      } else if (e.key === "Escape") {
        setOpen(false);
        setActiveIdx(-1);
      }
    },
    [open, filtered, activeIdx, onChange],
  );

  // Highlight matching portions
  const highlight = (text: string) => {
    const q = normalize(value.trim());
    const idx = normalize(text).indexOf(q);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="text-blue-500 font-bold">
          {text.slice(idx, idx + q.length)}
        </span>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div className="space-y-1.5 relative" ref={wrapperRef}>
      <div className="flex items-center gap-2">
        <label className="block text-[11px] lg:text-[15px] font-bold text-txt-muted uppercase tracking-wider">
          {label}
        </label>
        {isTemplateData && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wide animate-pulse">
            ⚠ Template
          </span>
        )}
      </div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIdx(-1);
        }}
        onFocus={() => {
          if (showAllOnFocus && suggestions.length > 0) {
            setOpen(true);
          } else if (value.trim().length >= 2) {
            setOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full bg-surface border rounded-xl px-4 py-3 lg:py-3.5 text-sm lg:text-lg text-txt outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-txt-dim ${
          isTemplateData ? 'border-amber-400/50 ring-1 ring-amber-400/30 bg-amber-500/5' : 'border-border'
        }`}
      />
      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 top-full mt-1 w-full bg-surface border border-border rounded-xl shadow-xl shadow-black/10 overflow-hidden max-h-60 overflow-y-auto backdrop-blur-xl"
        >
          {filtered.map((item, i) => (
            <li
              key={item}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(item);
                setOpen(false);
                setActiveIdx(-1);
              }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`px-4 py-2.5 lg:py-3 text-sm lg:text-base cursor-pointer transition-colors ${
                i === activeIdx
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "text-txt hover:bg-surface2"
              }`}
            >
              {highlight(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
