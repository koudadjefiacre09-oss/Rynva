"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface BeforeAfterProps {
  original: string;
  retouched: string;
  width: number;
  height: number;
  /** 0-1: live mix of the retouch over the original (the "Intensité" slider). */
  intensity: number;
  /** Shows the untouched original over the whole frame. */
  showOriginal?: boolean;
}

/**
 * Before/after comparator with a vertical divider. Both previews share the
 * same pixel grid (rendered together server-side), so the split is exact.
 * Pointer (mouse, touch, pen) and keyboard (← → Home End) are supported.
 */
export function BeforeAfter({ original, retouched, width, height, intensity, showOriginal }: BeforeAfterProps) {
  const [position, setPosition] = useState(50);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const moveTo = useCallback((clientX: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setPosition(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  const ratio = width / height;

  return (
    <div
      ref={frameRef}
      className="relative mx-auto touch-none select-none overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800"
      style={{ aspectRatio: `${width} / ${height}`, width: `min(100%, calc(70vh * ${ratio}))` }}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        moveTo(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && moveTo(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={original} alt="Photo originale" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={retouched}
        alt="Photo retouchée"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 0 0 ${position}%)`, opacity: showOriginal ? 0 : intensity }}
      />

      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
        Avant
      </span>
      <span
        className={cn(
          "pointer-events-none absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur transition-opacity",
          showOriginal && "opacity-0"
        )}
      >
        Après
      </span>

      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${position}%` }}>
        <div className="absolute inset-y-0 -ml-px w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" />
        <button
          type="button"
          role="slider"
          aria-label="Position du comparateur avant / après"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 10 : 2;
            if (e.key === "ArrowLeft") setPosition((p) => Math.max(0, p - step));
            else if (e.key === "ArrowRight") setPosition((p) => Math.min(100, p + step));
            else if (e.key === "Home") setPosition(0);
            else if (e.key === "End") setPosition(100);
            else return;
            e.preventDefault();
          }}
          className="pointer-events-auto absolute top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-md outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-white"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
