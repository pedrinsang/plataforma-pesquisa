"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, type Editor } from "@tiptap/react";
import {
  CONTENT_HEIGHT_PX,
  CONTENT_WIDTH_PX,
  PAGE_GAP_PX,
  PAGE_HEIGHT_PX,
  PAGE_MARGIN_PX,
  PAGE_STRIDE_PX,
  PAGE_WIDTH_PX,
  pageContentBottom,
  pageOfFlowY,
  sheetTop,
  stackHeight,
} from "@/lib/writing/page-metrics";
import type { PageSpacer } from "@/lib/writing/extensions/pagination";

/** Tolerância de medição (subpixel) antes de considerar que um bloco transbordou. */
const EPS = 0.5;

type Entry = { pos: number; isBreak: boolean; naturalTop: number; height: number };

/**
 * Lê a geometria real do documento e devolve os blocos de primeiro nível com a
 * posição no doc, a altura e o topo "natural" (descontando os espaçadores já
 * aplicados). O pareamento é por índice: cada nó de primeiro nível corresponde a
 * um filho do DOM do ProseMirror, na mesma ordem.
 */
function readEntries(editor: Editor): Entry[] | null {
  const root = editor.view.dom as HTMLElement;
  const positions: number[] = [];
  const isBreak: boolean[] = [];
  let pos = 0;
  editor.state.doc.forEach((node) => {
    positions.push(pos);
    isBreak.push(node.type.name === "pageBreak");
    pos += node.nodeSize;
  });

  const entries: Entry[] = [];
  let spacerAcc = 0;
  let index = 0;
  for (const child of Array.from(root.children) as HTMLElement[]) {
    if (child.classList.contains("folium-page-spacer")) {
      spacerAcc += child.offsetHeight;
      continue;
    }
    // O gapcursor é um enfeite do ProseMirror, não um nó do documento — pular,
    // senão o pareamento por índice sai do lugar enquanto ele está visível.
    if (child.classList.contains("ProseMirror-gapcursor")) continue;
    if (index >= positions.length) return null; // DOM e doc dessincronizados
    entries.push({
      pos: positions[index],
      isBreak: isBreak[index],
      naturalTop: child.offsetTop - spacerAcc,
      height: child.offsetHeight,
    });
    index += 1;
  }
  return index === positions.length ? entries : null;
}

/**
 * Simula o fluxo do texto sobre a pilha de folhas: percorre os blocos na ordem e,
 * quando um deles atravessaria o fim da área de texto da folha, reserva o vão que
 * falta para ele começar no topo da folha seguinte. Uma quebra de página explícita
 * força esse salto no bloco seguinte.
 *
 * Blocos mais altos que uma folha (tabela/imagem grande) não são empurrados — não
 * há para onde —, então seguem atravessando, como num processador de texto.
 */
function planPages(entries: Entry[]): { spacers: PageSpacer[]; pageCount: number } {
  const spacers: PageSpacer[] = [];
  let y = 0;
  let bottom = 0;
  let forceNextPage = false;

  entries.forEach((entry, i) => {
    const advance =
      i + 1 < entries.length ? entries[i + 1].naturalTop - entry.naturalTop : entry.height;
    const page = pageOfFlowY(y);
    const fitsInOnePage = entry.height <= CONTENT_HEIGHT_PX + EPS;
    const overflows = y + entry.height > pageContentBottom(page) + EPS;

    if (forceNextPage || (fitsInOnePage && overflows)) {
      const push = sheetTop(page + 1) - y;
      if (push > EPS) {
        spacers.push({ pos: entry.pos, height: push });
        y += push;
      }
      forceNextPage = false;
    }

    bottom = Math.max(bottom, y + entry.height);
    if (entry.isBreak) forceNextPage = true;
    y += Math.max(advance, 0);
  });

  const lastPage = pageOfFlowY(Math.max(bottom - EPS, 0));
  return { spacers, pageCount: Math.max(1, lastPage + 1) + (forceNextPage ? 1 : 0) };
}

function sameSpacers(a: PageSpacer[], b: PageSpacer[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((s, i) => s.pos === b[i].pos && Math.abs(s.height - b[i].height) < EPS);
}

/** Enfeites de edição que não existem no papel (cursor, alças, realces). */
const EDITING_ONLY = ".ProseMirror-gapcursor, .column-resize-handle, .ProseMirror-separator";
const EDITING_CLASSES = [
  "ProseMirror-selectednode",
  "ProseMirror-focused",
  "folium-search-match",
  "folium-search-current",
  "selectedCell",
];

/**
 * Copia a pilha de folhas para a impressão: mesma geometria, sem nada de editor.
 * O clone é só leitura — sai `contenteditable`, saem cursor/alças/realces —, mas
 * as alturas (inclusive os espaçadores de paginação) ficam intactas: é isso que
 * garante que o papel saia igual à tela.
 */
function printableStack(stack: HTMLElement): HTMLElement {
  const clone = stack.cloneNode(true) as HTMLElement;
  clone.setAttribute("aria-hidden", "true");
  clone.querySelectorAll(EDITING_ONLY).forEach((el) => el.remove());
  clone.querySelectorAll<HTMLElement>("[contenteditable]").forEach((el) => {
    el.removeAttribute("contenteditable");
    el.removeAttribute("tabindex");
  });
  clone.querySelectorAll<HTMLElement>(`.${EDITING_CLASSES.join(", .")}`).forEach((el) => {
    el.classList.remove(...EDITING_CLASSES);
  });
  return clone;
}

/**
 * Superfície de escrita: uma pilha de folhas A4 brancas (sempre claras, mesmo
 * dentro do chrome escuro — exceção intencional do design) com margens reais,
 * sombra por folha e vão visível entre elas. O texto é um fluxo contínuo por
 * cima da pilha; a extensão `foliumPagination` recebe daqui os espaçadores que
 * impedem um parágrafo de ser cortado na virada da página.
 *
 * Este elemento é o container de rolagem do editor em tela cheia.
 */
export function WritingCanvas({
  editor,
  zoom,
  header = "",
  footer = "",
  onPageCountChange,
  onCurrentPageChange,
  onViewport,
}: {
  editor: Editor | null;
  zoom: number;
  header?: string;
  footer?: string;
  onPageCountChange?: (count: number) => void;
  onCurrentPageChange?: (page: number) => void;
  /** Rolagem horizontal e largura da barra de rolagem, para alinhar a régua. */
  onViewport?: (v: { scrollLeft: number; gutter: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sizerRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const appliedRef = useRef<PageSpacer[]>([]);
  const timerRef = useRef<number | null>(null);
  const [pageCount, setPageCount] = useState(1);

  // ── paginação: mede, planeja e aplica os espaçadores ─────────────────────
  const paginate = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    const entries = readEntries(editor);
    if (!entries) return;
    const { spacers, pageCount: next } = planPages(entries);
    setPageCount((prev) => (prev === next ? prev : next));
    if (!sameSpacers(appliedRef.current, spacers)) {
      appliedRef.current = spacers;
      editor.commands.setPageSpacers(spacers);
    }
  }, [editor]);

  // Agenda com timer (e não `requestAnimationFrame`): rAF não roda em aba de
  // segundo plano, e a paginação precisa ficar correta mesmo quando o documento
  // carrega com a aba oculta.
  const schedulePaginate = useCallback(() => {
    if (timerRef.current !== null) return;
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      paginate();
    }, 0);
  }, [paginate]);

  useEffect(() => {
    if (!editor) return;
    const flow = flowRef.current;
    schedulePaginate();
    editor.on("update", schedulePaginate);
    // Fontes carregando, imagens chegando e a própria mudança de altura do fluxo
    // mexem na paginação; o ResizeObserver cobre todos esses casos.
    const ro = new ResizeObserver(schedulePaginate);
    if (flow) ro.observe(flow);
    const onFonts = () => schedulePaginate();
    document.fonts?.addEventListener?.("loadingdone", onFonts);
    return () => {
      editor.off("update", schedulePaginate);
      ro.disconnect();
      document.fonts?.removeEventListener?.("loadingdone", onFonts);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [editor, schedulePaginate]);

  useEffect(() => {
    onPageCountChange?.(pageCount);
  }, [pageCount, onPageCountChange]);

  // Página "atual" = a que está no topo da área visível; também reporta a
  // rolagem horizontal e a barra de rolagem, para a régua (que fica fora deste
  // container) ficar exatamente sobre a folha.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handle = () => {
      onViewport?.({ scrollLeft: el.scrollLeft, gutter: el.offsetWidth - el.clientWidth });
      const page = Math.floor(el.scrollTop / (PAGE_STRIDE_PX * zoom)) + 1;
      onCurrentPageChange?.(Math.min(Math.max(page, 1), pageCount));
    };
    handle();
    el.addEventListener("scroll", handle, { passive: true });
    // Observa também a pilha: é a altura dela que faz a barra de rolagem
    // aparecer/sumir, e é essa largura que a régua precisa descontar.
    const ro = new ResizeObserver(handle);
    ro.observe(el);
    if (sizerRef.current) ro.observe(sizerRef.current);
    return () => {
      el.removeEventListener("scroll", handle);
      ro.disconnect();
    };
  }, [zoom, pageCount, onCurrentPageChange, onViewport]);

  // ── via de impressão ─────────────────────────────────────────────────────
  // Imprimir/Baixar PDF não sai "print da tela" nem depende da paginação do
  // motor de impressão: no `beforeprint` montamos uma folha A4 por página, e
  // cada folha é uma **janela recortada** sobre um clone da pilha, deslocado
  // pelo topo daquela folha. O papel recebe, por construção, a mesma geometria
  // que está na tela — mesmas quebras, mesmo cabeçalho, rodapé e numeração.
  useEffect(() => {
    const build = () => {
      const root = printRef.current;
      const stack = stackRef.current;
      if (!root || !stack) return;
      const fragment = document.createDocumentFragment();
      const stackH = stackHeight(pageCount);
      for (let i = 0; i < pageCount; i += 1) {
        const page = document.createElement("div");
        page.className = "folium-print-page";
        const win = document.createElement("div");
        win.className = "folium-print-window";
        win.style.top = `${-sheetTop(i)}px`;
        win.style.width = `${PAGE_WIDTH_PX}px`;
        win.style.height = `${stackH}px`;
        win.appendChild(printableStack(stack));
        page.appendChild(win);
        fragment.appendChild(page);
      }
      root.replaceChildren(fragment);
    };
    // Os clones só existem durante a impressão — depois o DOM volta ao normal.
    const clear = () => printRef.current?.replaceChildren();

    window.addEventListener("beforeprint", build);
    window.addEventListener("afterprint", clear);
    return () => {
      window.removeEventListener("beforeprint", build);
      window.removeEventListener("afterprint", clear);
      clear();
    };
  }, [pageCount]);

  const stackH = stackHeight(pageCount);

  // Clicar no papel fora do texto foca o fim do documento (estilo Word).
  function focusEnd(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (!editor || flowRef.current?.contains(target)) return;
    editor.chain().focus("end").run();
  }

  return (
    <div className="folium-canvas" ref={containerRef}>
      {/* Reserva o espaço já escalado, para os scrollbars ficarem corretos. */}
      <div
        ref={sizerRef}
        className="folium-zoom-sizer"
        style={{ width: PAGE_WIDTH_PX * zoom, height: stackH * zoom }}
      >
        <div
          className="folium-zoom"
          style={{
            width: PAGE_WIDTH_PX,
            height: stackH,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
        >
          <div
            ref={stackRef}
            className="folium-stack paper-light"
            onMouseDown={focusEnd}
            style={{ width: PAGE_WIDTH_PX, height: stackH }}
          >
            {/* As folhas — uma caixa branca por página, com sombra própria */}
            {Array.from({ length: pageCount }, (_, i) => (
              <div
                key={`sheet-${i}`}
                className="folium-sheet"
                style={{ top: sheetTop(i), height: PAGE_HEIGHT_PX }}
                aria-hidden
              />
            ))}

            {/* O texto: fluxo contínuo sobre a pilha, dentro das margens */}
            <div
              ref={flowRef}
              className="folium-flow"
              style={{
                top: PAGE_MARGIN_PX,
                left: PAGE_MARGIN_PX,
                width: CONTENT_WIDTH_PX,
                minHeight: CONTENT_HEIGHT_PX,
              }}
            >
              <EditorContent editor={editor} />
            </div>

            {/* Vãos entre folhas: cobrem qualquer bloco alto que atravesse */}
            {Array.from({ length: Math.max(pageCount - 1, 0) }, (_, i) => (
              <div
                key={`seam-${i}`}
                className="folium-seam"
                style={{ top: sheetTop(i) + PAGE_HEIGHT_PX, height: PAGE_GAP_PX }}
                aria-hidden
              />
            ))}

            <PageOverlay pageCount={pageCount} header={header} footer={footer} />
          </div>
        </div>
      </div>

      {/* Folhas de impressão — vazio na tela, preenchido no `beforeprint`. */}
      <div className="folium-print" ref={printRef} aria-hidden />
    </div>
  );
}

/** Resolve os tokens {n} (página atual) e {total} (total de páginas). */
function resolveTokens(text: string, page: number, total: number): string {
  return text.replace(/\{n\}/g, String(page)).replace(/\{total\}/g, String(total));
}

/**
 * Cabeçalho, rodapé e numeração — desenhados nas margens de cada folha, por cima
 * do texto. Agora que a paginação é real, cada um cai na margem certa da sua
 * folha, sem sobrepor parágrafo nenhum.
 */
function PageOverlay({
  pageCount,
  header,
  footer,
}: {
  pageCount: number;
  header: string;
  footer: string;
}) {
  const hasHeader = header.trim() !== "";
  const hasFooter = footer.trim() !== "";
  return (
    <div className="folium-page-overlay" aria-hidden>
      {Array.from({ length: pageCount }, (_, i) => {
        const top = sheetTop(i);
        const bottom = top + PAGE_HEIGHT_PX;
        return (
          <div key={i}>
            {hasHeader && (
              <div
                className="folium-hf folium-hf-header"
                style={{
                  top: top + PAGE_MARGIN_PX * 0.42,
                  left: PAGE_MARGIN_PX,
                  right: PAGE_MARGIN_PX,
                }}
              >
                {resolveTokens(header, i + 1, pageCount)}
              </div>
            )}
            {hasFooter ? (
              <div
                className="folium-hf folium-hf-footer"
                style={{
                  top: bottom - PAGE_MARGIN_PX * 0.62,
                  left: PAGE_MARGIN_PX,
                  right: PAGE_MARGIN_PX,
                }}
              >
                {resolveTokens(footer, i + 1, pageCount)}
              </div>
            ) : (
              <div className="folium-page-num" style={{ top: bottom - PAGE_MARGIN_PX / 2 }}>
                {i + 1} / {pageCount}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
