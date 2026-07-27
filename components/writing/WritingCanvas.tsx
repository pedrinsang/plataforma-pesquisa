"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, type Editor } from "@tiptap/react";
import {
  PAGE_WIDTH_PX,
  PAGE_HEIGHT_PX,
  PAGE_MARGIN_PX,
  pageCountFor,
} from "@/lib/writing/page-metrics";

/**
 * Superfície de escrita "folha de papel": uma coluna A4 branca (sempre clara,
 * mesmo no tema escuro — é a exceção intencional do design), com margens reais,
 * sombra de página e guias/numeração de página calculadas por medição de altura.
 *
 * Modo "folha contínua": o conteúdo flui numa única folha alta; a cada altura de
 * página desenhamos uma linha-guia + rótulo. Preparado para evoluir para
 * paginação real (folhas físicas separadas) numa fase futura.
 */
export function WritingCanvas({
  editor,
  zoom,
  onPageCountChange,
}: {
  editor: Editor | null;
  zoom: number;
  onPageCountChange?: (count: number) => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  // Recalcula o número de folhas sempre que a altura do conteúdo muda.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => {
      const next = pageCountFor(el.offsetHeight);
      setPageCount((prev) => (prev === next ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [editor]);

  useEffect(() => {
    onPageCountChange?.(pageCount);
  }, [pageCount, onPageCountChange]);

  const sheetHeight = pageCount * PAGE_HEIGHT_PX;

  // Clicar no espaço vazio abaixo do texto foca o fim do documento (estilo Word).
  function focusEnd(e: React.MouseEvent) {
    if (!editor || e.target !== e.currentTarget) return;
    editor.chain().focus("end").run();
  }

  return (
    <div className="folium-canvas">
      {/* Reserva o espaço já escalado, para os scrollbars ficarem corretos. */}
      <div
        className="folium-zoom-sizer"
        style={{ width: PAGE_WIDTH_PX * zoom, height: sheetHeight * zoom }}
      >
        <div
          className="folium-zoom"
          style={{
            width: PAGE_WIDTH_PX,
            height: sheetHeight,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
        >
          <div
            className="folium-page paper-light"
            onMouseDown={focusEnd}
            style={{ width: PAGE_WIDTH_PX, minHeight: sheetHeight, padding: PAGE_MARGIN_PX }}
          >
            <div ref={contentRef}>
              <EditorContent editor={editor} />
            </div>
          </div>
          <PageGuides pageCount={pageCount} />
        </div>
      </div>
    </div>
  );
}

/** Linhas-guia entre páginas + rótulo "Página k de N" no rodapé de cada folha. */
function PageGuides({ pageCount }: { pageCount: number }) {
  return (
    <div className="folium-page-guides" aria-hidden>
      {Array.from({ length: pageCount }, (_, i) => {
        const boundary = (i + 1) * PAGE_HEIGHT_PX;
        return (
          <div key={i}>
            {i < pageCount - 1 && (
              <div className="folium-page-guide" style={{ top: boundary }} />
            )}
            <div className="folium-page-num" style={{ top: boundary - PAGE_MARGIN_PX / 2 }}>
              Página {i + 1} de {pageCount}
            </div>
          </div>
        );
      })}
    </div>
  );
}
