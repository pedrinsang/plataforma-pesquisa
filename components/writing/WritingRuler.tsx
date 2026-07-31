"use client";

import { useEffect, useRef } from "react";
import { type Editor, useEditorState } from "@tiptap/react";
import {
  PAGE_WIDTH_PX,
  PAGE_MARGIN_PX,
  PX_PER_CM,
  RULER_HEIGHT_PX,
} from "@/lib/writing/page-metrics";

const CONTENT_LEFT = PAGE_MARGIN_PX;
const CONTENT_RIGHT = PAGE_WIDTH_PX - PAGE_MARGIN_PX;
const CONTENT_WIDTH = CONTENT_RIGHT - CONTENT_LEFT;

type Marker = "left" | "right" | "firstLine";

/**
 * Faixa fina que hospeda a régua acima da folha (fora do container de rolagem,
 * como no design). Reproduz aqui a centralização e o zoom da folha e desconta a
 * rolagem horizontal e a barra de rolagem, para a régua ficar sobre o papel.
 */
export function RulerBand({
  editor,
  zoom,
  scrollLeft,
  gutter,
}: {
  editor: Editor;
  zoom: number;
  scrollLeft: number;
  gutter: number;
}) {
  return (
    <div className="fx-rulerband" style={{ height: RULER_HEIGHT_PX * zoom, paddingRight: gutter }}>
      <div
        style={{
          width: PAGE_WIDTH_PX * zoom,
          margin: "0 auto",
          transform: `translateX(${-scrollLeft}px)`,
        }}
      >
        <div
          style={{
            width: PAGE_WIDTH_PX,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
        >
          <WritingRuler editor={editor} />
        </div>
      </div>
    </div>
  );
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

function currentIndents(editor: Editor) {
  const node = editor.state.selection.$from.parent;
  return {
    indentLeft: Number(node.attrs.indentLeft) || 0,
    indentRight: Number(node.attrs.indentRight) || 0,
    firstLine: Number(node.attrs.firstLine) || 0,
  };
}

/**
 * Régua horizontal estilo processador de texto: mostra os centímetros, sombreia
 * as margens e traz marcadores arrastáveis de recuo (esquerda, direita e
 * primeira linha) que editam o parágrafo selecionado via `setParagraphIndent`.
 * Renderizada dentro do `folium-zoom`, então compartilha a escala do zoom.
 */
export function WritingRuler({ editor }: { editor: Editor }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<Marker | null>(null);

  const { indentLeft, indentRight, firstLine } = useEditorState({
    editor,
    selector: ({ editor }) => currentIndents(editor),
  });

  // Arraste global: enquanto um marcador está ativo, move/solta são captados na
  // janela (funciona mesmo com o ponteiro fora da régua). Os recuos são lidos ao
  // vivo do editor a cada movimento, para os clamps ficarem sempre corretos.
  useEffect(() => {
    function pointerToPageX(clientX: number): number {
      const el = rootRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const scale = rect.width / PAGE_WIDTH_PX || 1;
      return (clientX - rect.left) / scale;
    }

    function onMove(e: PointerEvent) {
      if (!dragging.current) return;
      const x = pointerToPageX(e.clientX);
      const cur = currentIndents(editor);
      if (dragging.current === "left") {
        const next = clamp(x - CONTENT_LEFT, 0, CONTENT_WIDTH - cur.indentRight);
        editor.commands.setParagraphIndent({ indentLeft: next });
      } else if (dragging.current === "right") {
        const next = clamp(CONTENT_RIGHT - x, 0, CONTENT_WIDTH - cur.indentLeft);
        editor.commands.setParagraphIndent({ indentRight: next });
      } else {
        // Primeira linha: relativa ao recuo esquerdo (pode ser negativa).
        const next = clamp(
          x - CONTENT_LEFT - cur.indentLeft,
          -cur.indentLeft,
          CONTENT_WIDTH - cur.indentLeft - cur.indentRight,
        );
        editor.commands.setParagraphIndent({ firstLine: next });
      }
    }

    function onUp() {
      dragging.current = null;
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [editor]);

  function onPointerDown(marker: Marker, e: React.PointerEvent) {
    e.preventDefault();
    dragging.current = marker;
  }

  // Marcas de centímetro (relativas à margem esquerda, como no Word).
  const ticks: Array<{ x: number; major: boolean; label: number | null }> = [];
  for (let x = CONTENT_LEFT; x <= PAGE_WIDTH_PX + 0.5; x += PX_PER_CM / 2) {
    const cm = Math.round((x - CONTENT_LEFT) / PX_PER_CM);
    const major = Math.abs(x - (CONTENT_LEFT + cm * PX_PER_CM)) < 0.5;
    ticks.push({ x, major, label: major && cm > 0 ? cm : null });
  }
  for (let x = CONTENT_LEFT - PX_PER_CM / 2; x >= -0.5; x -= PX_PER_CM / 2) {
    const cm = Math.round((CONTENT_LEFT - x) / PX_PER_CM);
    const major = Math.abs(x - (CONTENT_LEFT - cm * PX_PER_CM)) < 0.5;
    ticks.push({ x, major, label: major && cm > 0 ? cm : null });
  }

  const leftX = CONTENT_LEFT + indentLeft;
  const rightX = CONTENT_RIGHT - indentRight;
  const firstX = CONTENT_LEFT + indentLeft + firstLine;

  return (
    <div
      ref={rootRef}
      className="folium-ruler"
      style={{ width: PAGE_WIDTH_PX, height: RULER_HEIGHT_PX }}
    >
      {/* Área de conteúdo (entre margens) destacada */}
      <div
        className="folium-ruler-content"
        style={{ left: CONTENT_LEFT, width: CONTENT_WIDTH }}
      />

      {/* Marcas de cm */}
      {ticks.map((t, i) => (
        <span
          key={i}
          className={t.major ? "folium-ruler-tick folium-ruler-tick-major" : "folium-ruler-tick"}
          style={{ left: t.x }}
        >
          {t.label !== null && <span className="folium-ruler-num">{t.label}</span>}
        </span>
      ))}

      {/* Marcador de primeira linha (topo, aponta para baixo) */}
      <button
        type="button"
        aria-label="Recuo da primeira linha"
        title="Recuo da primeira linha"
        className="folium-ruler-marker folium-ruler-firstline"
        style={{ left: firstX }}
        onPointerDown={(e) => onPointerDown("firstLine", e)}
      />

      {/* Marcador de recuo à esquerda (base, aponta para cima) */}
      <button
        type="button"
        aria-label="Recuo à esquerda"
        title="Recuo à esquerda"
        className="folium-ruler-marker folium-ruler-left"
        style={{ left: leftX }}
        onPointerDown={(e) => onPointerDown("left", e)}
      />

      {/* Marcador de recuo à direita (base, aponta para cima) */}
      <button
        type="button"
        aria-label="Recuo à direita"
        title="Recuo à direita"
        className="folium-ruler-marker folium-ruler-right"
        style={{ left: rightX }}
        onPointerDown={(e) => onPointerDown("right", e)}
      />
    </div>
  );
}
