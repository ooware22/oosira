'use client';

import { useEffect, useRef } from 'react';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { MAX_ZOOM, MIN_ZOOM, PhotoCrop, PhotoSource, clampCrop, defaultCrop } from '@/app/lib/cvPhoto';
import {
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';

const ZOOM_STEP = 0.25;

/**
 * Square framing for the CV photo: drag (mouse, touch or arrow keys) to
 * position it, zoom with the slider, the buttons or the mouse wheel. What is
 * inside the frame is exactly what goes on the CV.
 */
export default function PhotoCropper({ source, crop, onChange, size = 220 }: {
  source: PhotoSource;
  crop: PhotoCrop;
  onChange: (crop: PhotoCrop) => void;
  size?: number;
}) {
  const { t } = useLanguage();
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; crop: PhotoCrop } | null>(null);
  // Latest values for the native wheel listener, which is bound only once.
  const latest = useRef({ crop, source, onChange });
  useEffect(() => { latest.current = { crop, source, onChange }; });

  // Screen pixels per source pixel at the current zoom.
  const scale = size / (Math.min(source.width, source.height) / crop.zoom);
  const imgW = source.width * scale;
  const imgH = source.height * scale;
  const left = size / 2 - crop.x * imgW;
  const top = size / 2 - crop.y * imgH;

  const update = (next: PhotoCrop) => onChange(clampCrop(next, source));
  const setZoom = (zoom: number) => update({ ...crop, zoom });

  // React's onWheel is passive, so it can't stop the page from scrolling.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { crop: c, source: s, onChange: change } = latest.current;
      change(clampCrop({ ...c, zoom: c.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08) }, s));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, crop };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    // Dragging the photo right moves the frame's centre left over it.
    update({
      ...d.crop,
      x: d.crop.x - (e.clientX - d.px) / imgW,
      y: d.crop.y - (e.clientY - d.py) / imgH,
    });
  };
  const endDrag = () => { drag.current = null; };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = 8;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step],
    };
    if (e.key === '+' || e.key === '=') { e.preventDefault(); setZoom(crop.zoom + ZOOM_STEP); return; }
    if (e.key === '-') { e.preventDefault(); setZoom(crop.zoom - ZOOM_STEP); return; }
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    update({ ...crop, x: crop.x - move[0] / imgW, y: crop.y - move[1] / imgH });
  };

  return (
    <div className="flex flex-col items-center gap-3" dir="ltr">
      <div
        ref={frameRef}
        role="img"
        aria-label={t('photoPrompt.frameHint') || 'Faites glisser la photo pour la cadrer'}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        className="relative overflow-hidden bg-surface2 shadow-md cursor-grab active:cursor-grabbing touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
        <img
          src={source.url}
          alt=""
          draggable={false}
          className="absolute max-w-none pointer-events-none"
          style={{ width: imgW, height: imgH, left, top }}
        />
        {/* Rule-of-thirds guides help line up the eyes. */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-white/15" />
          ))}
        </div>
      </div>

      <p className="text-[11px] text-txt-muted text-center">
        {t('photoPrompt.frameHint') || 'Faites glisser la photo pour la cadrer'}
      </p>

      <div className="flex items-center gap-2 w-full max-w-[300px]">
        <button
          type="button"
          onClick={() => setZoom(crop.zoom - ZOOM_STEP)}
          disabled={crop.zoom <= MIN_ZOOM}
          title={t('photoPrompt.zoomOut') || 'Dézoomer'}
          className="p-1.5 rounded-lg text-txt-muted hover:text-txt hover:bg-surface2 disabled:opacity-40"
        >
          <MagnifyingGlassMinusIcon className="w-5 h-5" />
        </button>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={crop.zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label={t('photoPrompt.zoom') || 'Zoom'}
          className="flex-1 accent-blue-600"
        />
        <button
          type="button"
          onClick={() => setZoom(crop.zoom + ZOOM_STEP)}
          disabled={crop.zoom >= MAX_ZOOM}
          title={t('photoPrompt.zoomIn') || 'Zoomer'}
          className="p-1.5 rounded-lg text-txt-muted hover:text-txt hover:bg-surface2 disabled:opacity-40"
        >
          <MagnifyingGlassPlusIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => onChange(defaultCrop(source))}
          title={t('photoPrompt.resetFrame') || 'Réinitialiser le cadrage'}
          className="p-1.5 rounded-lg text-txt-muted hover:text-txt hover:bg-surface2"
        >
          <ArrowUturnLeftIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
