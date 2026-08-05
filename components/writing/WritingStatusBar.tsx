"use client";

import type { Editor } from "@tiptap/react";
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP, ZOOM_DEFAULT, clampZoom } from "@/lib/writing/page-metrics";
import { CursorFormatReadout } from "@/components/writing/CursorFormatReadout";

const nf = (n: number) => n.toLocaleString("pt-BR");

/**
 * Barra de status inferior (28 px) do editor em tela cheia: página atual,
 * formatação sob o cursor, contagens, progresso da meta e o controle de zoom da
 * folha — na tipografia mono do design.
 */
export function WritingStatusBar({
  editor,
  currentPage,
  pageCount,
  wordCount,
  charCount,
  goal,
  zoom,
  onZoomChange,
}: {
  /** Ausente enquanto o editor monta — a barra aparece sem a leitura de fonte. */
  editor: Editor | null;
  currentPage: number;
  pageCount: number;
  wordCount: number;
  charCount: number;
  goal: number | null;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}) {
  const pct = Math.round(zoom * 100);
  const goalPct = goal ? Math.min(100, Math.round((wordCount / goal) * 100)) : 0;

  return (
    <div className="fx-status print:hidden">
      <span>
        Página {currentPage} de {pageCount}
      </span>
      {editor && (
        <>
          <span className="fx-status-sep" aria-hidden />
          <CursorFormatReadout editor={editor} />
        </>
      )}
      <span className="fx-status-sep" aria-hidden />
      <span className="tabular-nums">{nf(wordCount)} palavras</span>
      <span className="tabular-nums" style={{ color: "rgba(236,234,231,.38)" }}>
        {nf(charCount)} caracteres
      </span>

      {goal !== null && (
        <>
          <span className="fx-status-sep" aria-hidden />
          <span className="flex items-center gap-2">
            <span style={{ letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(236,234,231,.4)" }}>
              meta
            </span>
            <span className="fx-meter" role="progressbar" aria-valuenow={goalPct} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ right: `${100 - goalPct}%` }} />
            </span>
            <span className="tabular-nums" style={{ color: "rgba(236,234,231,.6)" }}>
              {goalPct} % de {nf(goal)}
            </span>
          </span>
        </>
      )}

      <span className="ml-auto flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onZoomChange(clampZoom(zoom - ZOOM_STEP))}
          disabled={zoom <= ZOOM_MIN}
          aria-label="Diminuir zoom"
          title="Diminuir zoom"
        >
          −
        </button>
        <input
          type="range"
          min={ZOOM_MIN * 100}
          max={ZOOM_MAX * 100}
          step={ZOOM_STEP * 100}
          value={pct}
          onChange={(e) => onZoomChange(clampZoom(Number(e.target.value) / 100))}
          onDoubleClick={() => onZoomChange(ZOOM_DEFAULT)}
          aria-label="Zoom da folha"
          title="Zoom da folha (duplo clique volta a 100 %)"
          className="fx-zoom"
        />
        <button
          type="button"
          onClick={() => onZoomChange(clampZoom(zoom + ZOOM_STEP))}
          disabled={zoom >= ZOOM_MAX}
          aria-label="Aumentar zoom"
          title="Aumentar zoom"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => onZoomChange(ZOOM_DEFAULT)}
          title="Redefinir zoom (100 %)"
          className="tabular-nums"
          style={{ minWidth: 40, textAlign: "right", color: "var(--color-text)" }}
        >
          {pct} %
        </button>
      </span>
    </div>
  );
}
