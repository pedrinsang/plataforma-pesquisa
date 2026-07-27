"use client";

import { Minus, Plus } from "lucide-react";
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, ZOOM_DEFAULT, clampZoom } from "@/lib/writing/page-metrics";

/**
 * Barra de status inferior da Escrita: numeração de páginas, contagem de
 * palavras/caracteres e controle de zoom da folha. Fica fixa no rodapé da área.
 */
export function WritingStatusBar({
  pageCount,
  wordCount,
  charCount,
  zoom,
  onZoomChange,
}: {
  pageCount: number;
  wordCount: number;
  charCount: number;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}) {
  const pct = Math.round(zoom * 100);

  return (
    <div className="sticky bottom-0 z-20 -mx-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-border-subtle bg-surface/85 px-3 py-1.5 text-xs text-text-dim backdrop-blur-md print:hidden">
      <div className="flex items-center gap-3">
        <span>
          {pageCount} {pageCount === 1 ? "página" : "páginas"}
        </span>
        <span className="hidden h-3 w-px bg-border-subtle sm:block" aria-hidden />
        <span className="tabular-nums">
          {wordCount} {wordCount === 1 ? "palavra" : "palavras"}
        </span>
        <span className="tabular-nums text-text-dim/70">
          {charCount} {charCount === 1 ? "caractere" : "caracteres"}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Diminuir zoom"
          title="Diminuir zoom"
          disabled={zoom <= ZOOM_MIN}
          onClick={() => onZoomChange(clampZoom(zoom - ZOOM_STEP))}
          className="grid size-6 place-items-center rounded-md text-text-dim transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-accent)_10%,transparent)] hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <Minus size={13} />
        </button>
        <button
          type="button"
          title="Redefinir zoom (100%)"
          onClick={() => onZoomChange(ZOOM_DEFAULT)}
          className="min-w-[3.25rem] rounded-md px-1.5 py-0.5 text-center tabular-nums text-foreground transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-accent)_10%,transparent)]"
        >
          {pct}%
        </button>
        <button
          type="button"
          aria-label="Aumentar zoom"
          title="Aumentar zoom"
          disabled={zoom >= ZOOM_MAX}
          onClick={() => onZoomChange(clampZoom(zoom + ZOOM_STEP))}
          className="grid size-6 place-items-center rounded-md text-text-dim transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-accent)_10%,transparent)] hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}
