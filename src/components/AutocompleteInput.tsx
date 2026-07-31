"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { normalize } from "@/lib/normalize";

/**
 * A suggestion can be a bare string, or an object carrying extra searchable
 * text and a payload. `haystack` is what the query matches against — e.g. an
 * institution adds its acronym there so "ENP" finds "Ecole Nationale
 * Polytechnique d'Alger" — while `display` is what is shown and inserted.
 */
export interface RichSuggestion {
  display: string;
  /** Extra searchable text (acronym, short name…). Matched in addition to `display`. */
  haystack?: string;
  /** Secondary text shown on the right of the row, e.g. the wilaya. */
  hint?: string;
  /** Arbitrary payload handed back through `onSelect`. */
  meta?: Record<string, string | undefined>;
}

export type Suggestion = string | RichSuggestion;

const toRich = (s: Suggestion): RichSuggestion =>
  typeof s === 'string' ? { display: s } : s;

/** Lower is better. Exact acronym > acronym prefix > name prefix > anywhere. */
function rank(item: RichSuggestion, q: string): number {
  const display = normalize(item.display);
  const hay = normalize(item.haystack ?? '');
  if (hay.split(/\s+/).includes(q)) return 0;
  if (hay.startsWith(q)) return 1;
  if (display.startsWith(q)) return 2;
  return 3;
}

interface AutocompleteInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suggestions: readonly Suggestion[];
  /** Fired only when a suggestion is picked (not on free typing). */
  onSelect?: (item: RichSuggestion) => void;
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
  onSelect,
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

  const items = useMemo(() => suggestions.map(toRich), [suggestions]);

  // Fuzzy filter: match if all words of the query appear in the searchable text.
  const filtered = useMemo(() => {
    const q = normalize(value.trim());
    // When showAllOnFocus is enabled and input is empty, show all suggestions
    if (!q) {
      return showAllOnFocus ? items.slice(0, maxResults) : [];
    }
    if (q.length < 2 && !showAllOnFocus) return [];
    const words = q.split(/\s+/);

    const matches = items.filter((item) => {
      const hay = normalize(`${item.display} ${item.haystack ?? ""}`);
      return words.every((w) => hay.includes(w));
    });

    // An exact acronym hit must outrank a substring buried in a long name,
    // otherwise "ENP" gets crowded out by ENPO / ENPC / EPAU.
    matches.sort((a, b) => rank(a, q) - rank(b, q));

    return matches.slice(0, maxResults);
  }, [value, items, maxResults, showAllOnFocus]);

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
        const picked = filtered[activeIdx];
        onChange(picked.display);
        onSelect?.(picked);
        setOpen(false);
        setActiveIdx(-1);
      } else if (e.key === "Escape") {
        setOpen(false);
        setActiveIdx(-1);
      }
    },
    [open, filtered, activeIdx, onChange, onSelect],
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
              key={`${item.display}-${i}`}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(item.display);
                onSelect?.(item);
                setOpen(false);
                setActiveIdx(-1);
              }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`px-4 py-2.5 lg:py-3 text-sm lg:text-base cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                i === activeIdx
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "text-txt hover:bg-surface2"
              }`}
            >
              <span className="min-w-0">{highlight(item.display)}</span>
              {item.hint && (
                <span className="shrink-0 text-[11px] font-semibold text-txt-dim">
                  {item.hint}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
