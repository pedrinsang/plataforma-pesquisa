"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  PDFDocumentProxy,
  RenderTask,
  TextLayer as TextLayerClass,
} from "pdfjs-dist";
import { Minus, Plus, RefreshCw, TriangleAlert } from "lucide-react";
import { PDF_ASSET_PARAMS, loadPdfJs, rawFileUrl } from "@/lib/writing/pdf";

/** Trecho marcado dentro do artigo, já com a página de onde ele saiu. */
export type PdfSelection = {
  text: string;
  /** Página do PDF (base 1) onde a seleção começa — vira o "p. N" da citação. */
  page: number;
  /** Retângulo da seleção em coordenadas da viewport, para posicionar a bolha. */
  rect: DOMRect;
};

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.15;

/** Margem, em telas, para começar a desenhar uma página antes de ela aparecer. */
const PRERENDER_MARGIN = "600px";

/** Escala 1 do pdf.js é 72dpi; a tela é 96dpi. Sem isto o PDF sai miúdo. */
const CSS_SCALE = 96 / 72;

/**
 * Visualizador de PDF do leitor de artigos — desenhado por nós, de propósito.
 *
 * O `<iframe>` com o visualizador do navegador não serve aqui: o conteúdo dele
 * vive fora do nosso documento, então não há como saber o que o usuário
 * selecionou. Renderizando com o pdf.js (canvas + camada de texto), a seleção
 * é DOM comum — dá para ler o trecho e, pelo `data-page` do bloco onde ela
 * começa, saber a página. É isso que sustenta o "selecionar e citar".
 */
export function PdfArticleView({
  src,
  onSelectionChange,
}: {
  src: string;
  onSelectionChange: (selection: PdfSelection | null) => void;
}) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [sizes, setSizes] = useState<Array<{ width: number; height: number }>>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scale = zoom * CSS_SCALE;

  // Abre o documento e mede todas as páginas de uma vez: com as alturas certas
  // desde o início, a barra de rolagem não "pula" conforme as páginas entram.
  // Trocar de artigo remonta o componente (o leitor usa `key`), então não é
  // preciso zerar nada aqui — o estado inicial já é o estado de carregando.
  useEffect(() => {
    let cancelled = false;
    let task: { destroy: () => Promise<void> } | null = null;

    void (async () => {
      try {
        const pdfjs = await loadPdfJs();
        if (cancelled) return;
        const loading = pdfjs.getDocument({ url: rawFileUrl(src), ...PDF_ASSET_PARAMS });
        task = loading;
        const opened = await loading.promise;
        if (cancelled) return;
        const measured = await Promise.all(
          Array.from({ length: opened.numPages }, (_, i) =>
            opened.getPage(i + 1).then((p) => {
              const { width, height } = p.getViewport({ scale: 1 });
              return { width, height };
            }),
          ),
        );
        if (cancelled) return;
        setSizes(measured);
        setDoc(opened);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      void task?.destroy();
    };
  }, [src]);

  // Página corrente: a última que já começou acima do topo da área visível.
  // A comparação é por retângulo, não por `offsetTop` — o `offsetParent` das
  // folhas é a moldura do leitor, que fica acima da área que rola.
  const handleScroll = useCallback(() => {
    const host = scrollRef.current;
    if (!host) return;
    const limit = host.getBoundingClientRect().top + 8;
    let current = 1;
    for (const sheet of Array.from(host.querySelectorAll<HTMLElement>("[data-page]"))) {
      if (sheet.getBoundingClientRect().top > limit) break;
      current = Number(sheet.dataset.page);
    }
    setPage(current);
  }, []);

  // Leitura da seleção. `selectionchange` cobre mouse, teclado e toque; o
  // atraso deixa o navegador terminar de estender a marcação antes de medirmos.
  useEffect(() => {
    const host = scrollRef.current;
    if (!host) return;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const read = () => {
      const selection = document.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        onSelectionChange(null);
        return;
      }
      const range = selection.getRangeAt(0);
      if (!host.contains(range.commonAncestorContainer)) return;
      const text = selection.toString();
      if (!text.trim()) {
        onSelectionChange(null);
        return;
      }
      const anchor =
        range.startContainer instanceof Element
          ? range.startContainer
          : range.startContainer.parentElement;
      const pageEl = anchor?.closest<HTMLElement>("[data-page]");
      onSelectionChange({
        text,
        page: Number(pageEl?.dataset.page ?? 1),
        rect: range.getBoundingClientRect(),
      });
    };

    const onChange = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(read, 120);
    };

    document.addEventListener("selectionchange", onChange);
    return () => {
      document.removeEventListener("selectionchange", onChange);
      if (timer) clearTimeout(timer);
    };
  }, [onSelectionChange]);

  /** Mudar o zoom redesenha tudo: a bolha da seleção deixa de estar no lugar. */
  const changeZoom = useCallback(
    (delta: number) => {
      setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + delta) * 100) / 100)));
      onSelectionChange(null);
    },
    [onSelectionChange],
  );

  const pages = useMemo(
    () => sizes.map((size, index) => ({ number: index + 1, ...size })),
    [sizes],
  );

  return (
    <div className="fx-pdf">
      <div className="fx-pdf-bar">
        <span className="fx-pdf-count">
          {status === "ready" ? `${page} / ${pages.length}` : "—"}
        </span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            className="fx-panel-btn !h-[22px] !w-[22px]"
            onClick={() => changeZoom(-ZOOM_STEP)}
            title="Reduzir"
            aria-label="Reduzir"
          >
            <Minus size={11} />
          </button>
          <span className="fx-pdf-zoom">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className="fx-panel-btn !h-[22px] !w-[22px]"
            onClick={() => changeZoom(ZOOM_STEP)}
            title="Ampliar"
            aria-label="Ampliar"
          >
            <Plus size={11} />
          </button>
        </span>
      </div>

      <div ref={scrollRef} className="fx-pdf-scroll" onScroll={handleScroll}>
        {status === "loading" && (
          <div className="fx-reader-fallback fx-pdf-state">
            <RefreshCw size={20} className="animate-spin" />
            <p>Abrindo o artigo…</p>
          </div>
        )}
        {status === "error" && (
          <div className="fx-reader-fallback fx-pdf-state">
            <TriangleAlert size={20} />
            <p>
              Não foi possível abrir este PDF.
              <br />
              O arquivo pode estar corrompido ou protegido por senha.
            </p>
          </div>
        )}
        {status === "ready" &&
          doc &&
          pages.map((p) => (
            <PdfPage
              key={p.number}
              doc={doc}
              pageNumber={p.number}
              width={p.width * scale}
              height={p.height * scale}
              scale={scale}
            />
          ))}
      </div>
    </div>
  );
}

/**
 * Uma folha do PDF. O quadro já nasce com o tamanho final (medido no load), e
 * o desenho — canvas e camada de texto — só acontece quando a página chega
 * perto da área visível; um PDF de 40 páginas não pode renderizar tudo de uma
 * vez só para o usuário ler o primeiro parágrafo.
 */
function PdfPage({
  doc,
  pageNumber,
  width,
  height,
  scale,
}: {
  doc: PDFDocumentProxy;
  pageNumber: number;
  width: number;
  height: number;
  scale: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true);
      },
      { root: host.parentElement, rootMargin: PRERENDER_MARGIN },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    let render: RenderTask | null = null;
    let textLayer: TextLayerClass | null = null;

    void (async () => {
      const pdfjs = await loadPdfJs();
      const page = await doc.getPage(pageNumber);
      if (cancelled) return;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const textHost = textRef.current;
      if (!canvas || !textHost) return;

      // O canvas é desenhado na densidade da tela e reduzido por CSS — sem isso
      // o texto do artigo sai borrado em telas de alta densidade.
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      render = page.render({
        canvas,
        viewport,
        transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
      });
      await render.promise;
      if (cancelled) return;

      // Camada de texto: spans transparentes por cima do canvas, alinhados com
      // o desenho. É ela que o usuário seleciona.
      const content = await page.getTextContent();
      if (cancelled) return;
      textHost.replaceChildren();
      textHost.style.width = `${viewport.width}px`;
      textHost.style.height = `${viewport.height}px`;
      textHost.style.setProperty("--total-scale-factor", String(scale));
      textLayer = new pdfjs.TextLayer({
        textContentSource: content,
        container: textHost,
        viewport,
      });
      await textLayer.render();
    })().catch(() => {
      /* cancelamento de render/textLayer cai aqui — não é erro de verdade */
    });

    return () => {
      cancelled = true;
      render?.cancel();
      textLayer?.cancel();
    };
  }, [near, doc, pageNumber, scale]);

  return (
    <div
      ref={hostRef}
      className="fx-pdf-page"
      data-page={pageNumber}
      style={{ width, height }}
    >
      <canvas ref={canvasRef} />
      <div ref={textRef} className="textLayer" />
    </div>
  );
}
