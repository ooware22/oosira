"use client";
import { useRef, useState, useCallback, useEffect } from "react";

interface PinchZoomPreviewProps {
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
}

/**
 * Premium pinch-to-zoom & pan container for mobile CV preview.
 * Supports: two-finger pinch zoom, drag-to-pan, double-tap to reset,
 * and smooth momentum-based animations.
 */
export default function PinchZoomPreview({
  children,
  minScale = 0.4,
  maxScale = 3,
  initialScale = 0.5,
}: PinchZoomPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(initialScale);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);

  // Refs for gesture tracking (no re-renders during gestures)
  const gestureRef = useRef({
    isPinching: false,
    startDist: 0,
    startScale: 1,
    startMid: { x: 0, y: 0 },
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    translateStart: { x: 0, y: 0 },
    lastTap: 0,
  });

  // Calculate distance between two touch points
  const getDistance = (t1: any, t2: any) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Get midpoint of two touches
  const getMidpoint = (t1: any, t2: any) => ({
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  });

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const g = gestureRef.current;

      if (e.touches.length === 2) {
        // Pinch start
        e.preventDefault();
        g.isPinching = true;
        g.isDragging = false;
        g.startDist = getDistance(e.touches[0], e.touches[1]);
        g.startScale = scale;
        g.startMid = getMidpoint(e.touches[0], e.touches[1]);
        setIsZooming(true);
      } else if (e.touches.length === 1) {
        // Check for double-tap
        const now = Date.now();
        if (now - g.lastTap < 300) {
          // Double-tap: reset zoom
          e.preventDefault();
          setScale(initialScale);
          setTranslate({ x: 0, y: 0 });
          setIsZooming(false);
          g.lastTap = 0;
          return;
        }
        g.lastTap = now;

        // Start drag (only if zoomed in)
        if (scale > initialScale + 0.05) {
          g.isDragging = true;
          g.dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          g.translateStart = { ...translate };
        }
      }
    },
    [scale, translate, initialScale],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const g = gestureRef.current;

      if (g.isPinching && e.touches.length === 2) {
        e.preventDefault();
        const newDist = getDistance(e.touches[0], e.touches[1]);
        const ratio = newDist / g.startDist;
        let newScale = g.startScale * ratio;
        newScale = Math.min(maxScale, Math.max(minScale, newScale));

        // Pinch-centered zoom: adjust translate so zoom centers on pinch midpoint
        const mid = getMidpoint(e.touches[0], e.touches[1]);
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const cx = mid.x - rect.left - rect.width / 2;
          const cy = mid.y - rect.top - rect.height / 2;
          const scaleChange = newScale / scale;
          setTranslate((prev) => ({
            x: cx - (cx - prev.x) * scaleChange,
            y: cy - (cy - prev.y) * scaleChange,
          }));
        }

        setScale(newScale);
      } else if (g.isDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - g.dragStart.x;
        const dy = e.touches[0].clientY - g.dragStart.y;
        setTranslate({
          x: g.translateStart.x + dx,
          y: g.translateStart.y + dy,
        });
      }
    },
    [scale, minScale, maxScale],
  );

  const handleTouchEnd = useCallback(() => {
    const g = gestureRef.current;
    g.isPinching = false;
    g.isDragging = false;
    setIsZooming(false);
  }, []);

  // Scale indicator text
  const pct = Math.round(scale * 100);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Zoom content */}
      <div
        ref={contentRef}
        className="w-full h-full flex flex-col items-center gap-4 py-4"
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale / initialScale})`,
          transformOrigin: "center top",
          transition: isZooming ? "none" : "transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          willChange: "transform",
        }}
      >
        {children}
      </div>

      {/* Zoom indicator badge */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-xl border transition-all duration-300 ${
          isZooming
            ? "opacity-100 scale-100 bg-blue-500/20 text-blue-400 border-blue-500/30"
            : "opacity-0 scale-90 bg-surface/80 text-txt-muted border-border"
        }`}
      >
        {pct}%
      </div>

      {/* Reset zoom button (only when zoomed) */}
      {scale > initialScale + 0.1 && !isZooming && (
        <button
          onClick={() => {
            setScale(initialScale);
            setTranslate({ x: 0, y: 0 });
          }}
          className="absolute top-3 left-3 px-2.5 py-1.5 rounded-full bg-surface/80 backdrop-blur-xl border border-border text-[10px] font-bold text-txt-muted hover:text-txt transition-all"
        >
          Reset {pct}% → {Math.round(initialScale * 100)}%
        </button>
      )}
    </div>
  );
}
