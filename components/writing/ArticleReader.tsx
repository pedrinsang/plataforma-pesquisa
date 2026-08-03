"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookMarked,
  ExternalLink,
  Files,
  Quote,
  TextQuote,
  X,
} from "lucide-react";
import type { OpenArticle } from "@/lib/writing/reference-sources";
import { PdfArticleView, type PdfSelection } from "@/components/writing/PdfArticleView";
import { cleanExcerpt } from "@/lib/writing/quote";

/** Limites da divisória, em px — nem o texto nem o artigo podem sumir. */
const MIN_WIDTH = 320;
const MIN_CANVAS = 380;

/** Tamanho da bolha de citação, para ela não escapar da janela. */
const BUBBLE_WIDTH = 268;
const BUBBLE_GAP = 10;

/** O que o leitor manda para o documento quando o usuário manda citar. */
export type CiteRequest = {
  /** Id da referência — é o mesmo id do artigo aberto. */
  referenceId: string;
  /** Página do PDF de onde o trecho saiu; `null` na citação indireta. */
  locator: string | null;
  /** Trecho transcrito; `null` quando é só a chamada. */
  excerpt: string | null;
};

/**
 * Leitor de artigos lado a lado: a metade direita da tela mostra o PDF (ou a
 * página) da referência enquanto o documento continua editável à esquerda.
 * É o painel "Artigos" do trilho — abrir algo pela Biblioteca traz o item para
 * cá em vez de abrir outra aba do navegador.
 *
 * O PDF anexado é desenhado por nós (`PdfArticleView`), e é isso que destrava
 * o principal: **marcar um trecho do artigo e mandá-lo para o texto já citado**,
 * com a página certa. Um link/DOI externo continua num `<iframe>` — ali o
 * conteúdo é de outra origem, não dá para ler a seleção, e o site ainda pode
 * recusar a exibição embutida (X-Frame-Options); por isso o recado fica
 * desenhado por baixo do quadro, que é transparente de propósito.
 */
export function ArticleReader({
  articles,
  activeId,
  width,
  onWidthChange,
  onSelect,
  onCloseArticle,
  onClose,
  onOpenLibrary,
  onCite,
}: {
  articles: OpenArticle[];
  activeId: string | null;
  width: number;
  onWidthChange: (px: number) => void;
  onSelect: (id: string) => void;
  onCloseArticle: (id: string) => void;
  onClose: () => void;
  onOpenLibrary: () => void;
  onCite: (request: CiteRequest) => void;
}) {
  const active = articles.find((a) => a.id === activeId) ?? articles[0] ?? null;
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const gripRef = useRef<HTMLButtonElement>(null);
  const [selection, setSelection] = useState<PdfSelection | null>(null);

  const clamp = useCallback(
    (px: number) => Math.max(MIN_WIDTH, Math.min(px, window.innerWidth - MIN_CANVAS)),
    [],
  );

  // Arraste da divisória. Os listeners ficam na janela para o ponteiro poder sair
  // da alça (7 px) sem interromper o movimento.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      e.preventDefault();
      onWidthChange(clamp(drag.startWidth + (drag.startX - e.clientX)));
    };
    const onUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      gripRef.current?.removeAttribute("data-dragging");
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      onUp();
    };
  }, [clamp, onWidthChange]);

  // A janela encolhendo não pode deixar o leitor maior que a tela.
  useEffect(() => {
    const onResize = () => onWidthChange(clamp(width));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clamp, width, onWidthChange]);

  /** Manda a citação para o documento e desfaz a marcação no artigo. */
  function cite(request: CiteRequest) {
    onCite(request);
    setSelection(null);
    document.getSelection()?.removeAllRanges();
  }

  const excerpt = selection ? cleanExcerpt(selection.text) : "";

  return (
    <aside className="fx-reader print:hidden" style={{ width }} aria-label="Artigos abertos">
      <button
        ref={gripRef}
        type="button"
        className="fx-reader-grip"
        aria-label="Arrastar para redimensionar o leitor"
        onPointerDown={(e) => {
          dragRef.current = { startX: e.clientX, startWidth: width };
          gripRef.current?.setAttribute("data-dragging", "true");
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
        }}
        // Teclado: as setas movem a divisória em passos de 24 px.
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") onWidthChange(clamp(width + 24));
          else if (e.key === "ArrowRight") onWidthChange(clamp(width - 24));
        }}
      />

      <div className="fx-panel-head">
        <div className="flex items-center justify-between">
          <span className="fx-panel-title">
            Artigos · {articles.length} {articles.length === 1 ? "aberto" : "abertos"}
          </span>
          <span className="flex items-center gap-2">
            {active && (
              <>
                <button
                  type="button"
                  className="fx-panel-btn"
                  onClick={() => cite({ referenceId: active.id, locator: null, excerpt: null })}
                  title="Inserir a chamada deste artigo no ponto do cursor"
                  aria-label="Citar este artigo"
                >
                  <Quote size={12} />
                </button>
                <a
                  href={active.externalHref}
                  target="_blank"
                  rel="noreferrer"
                  className="fx-panel-btn"
                  title="Abrir em nova aba do navegador"
                  aria-label="Abrir em nova aba do navegador"
                >
                  <ExternalLink size={12} />
                </a>
              </>
            )}
            <button
              type="button"
              className="fx-panel-btn"
              onClick={onClose}
              title="Fechar o leitor"
              aria-label="Fechar o leitor"
            >
              <X size={12} />
            </button>
          </span>
        </div>
      </div>

      {articles.length > 0 && (
        <div className="fx-reader-tabs" role="tablist" aria-label="Artigos abertos">
          {articles.map((article) => (
            <span
              key={article.id}
              className="fx-reader-tab"
              role="tab"
              aria-selected={article.id === active?.id}
            >
              <button
                type="button"
                onClick={() => onSelect(article.id)}
                title={article.title}
                className="min-w-0 flex-1 truncate text-left"
              >
                {article.title}
              </button>
              <button
                type="button"
                className="fx-reader-tab-close"
                onClick={() => onCloseArticle(article.id)}
                title={`Fechar ${article.title}`}
                aria-label={`Fechar ${article.title}`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="fx-reader-frame">
        {active ? (
          active.isFile ? (
            <PdfArticleView key={active.id} src={active.src} onSelectionChange={setSelection} />
          ) : (
            <>
              <div className="fx-reader-fallback">
                <ExternalLink size={20} />
                <p>
                  Se nada aparecer, o site do artigo não permite exibição embutida.
                  <br />
                  <a
                    href={active.externalHref}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent-teal hover:underline"
                  >
                    Abrir em nova aba
                  </a>
                </p>
              </div>
              <iframe
                key={active.id}
                src={active.src}
                title={active.title}
                // Conteúdo de terceiros: entra em caixa-forte.
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                referrerPolicy="no-referrer"
              />
            </>
          )
        ) : (
          <div className="fx-reader-fallback">
            <Files size={22} />
            <p>Nenhum artigo aberto.</p>
            <button type="button" className="fx-act fx-act-teal" onClick={onOpenLibrary}>
              <BookMarked size={13} /> Abrir a biblioteca
            </button>
          </div>
        )}
      </div>

      {/* Rodapé com o que dá para fazer neste artigo. Num link externo a
          seleção não é legível — melhor dizer isso do que deixar o usuário
          tentando marcar o texto sem entender por que nada acontece. */}
      {active && (
        <div className="fx-reader-foot">
          <TextQuote size={11} />
          {active.isFile
            ? "Marque um trecho do artigo para citá-lo direto no texto."
            : "Só o PDF anexado permite citar por seleção — links externos são de outro site."}
        </div>
      )}

      {selection && excerpt && active && (
        <CiteBubble
          rect={selection.rect}
          page={selection.page}
          excerpt={excerpt}
          onQuote={() =>
            cite({ referenceId: active.id, locator: String(selection.page), excerpt })
          }
          onCallOnly={() =>
            cite({ referenceId: active.id, locator: String(selection.page), excerpt: null })
          }
          onDismiss={() => setSelection(null)}
        />
      )}
    </aside>
  );
}

/**
 * Bolha que aparece colada ao trecho marcado. Fica em coordenadas da janela
 * (`position: fixed`) porque o retângulo da seleção também é medido assim — e
 * porque o leitor rola por dentro, o que faria uma bolha absoluta se descolar.
 */
function CiteBubble({
  rect,
  page,
  excerpt,
  onQuote,
  onCallOnly,
  onDismiss,
}: {
  rect: DOMRect;
  page: number;
  excerpt: string;
  onQuote: () => void;
  onCallOnly: () => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  const left = Math.min(
    Math.max(BUBBLE_GAP, rect.left + rect.width / 2 - BUBBLE_WIDTH / 2),
    window.innerWidth - BUBBLE_WIDTH - BUBBLE_GAP,
  );
  // Acima do trecho quando há espaço; abaixo quando a seleção começa no topo.
  const above = rect.top > 132;
  const style = above
    ? { left, bottom: window.innerHeight - rect.top + BUBBLE_GAP }
    : { left, top: rect.bottom + BUBBLE_GAP };

  return (
    <div className="fx-cite-bubble" style={style} role="dialog" aria-label="Citar o trecho">
      <div className="fx-cite-meta">
        <span>p. {page}</span>
        <span>·</span>
        <span>{excerpt.split(/\s+/).length} palavras</span>
      </div>
      <p className="fx-cite-excerpt">{excerpt}</p>
      <div className="flex items-center gap-1.5">
        <button type="button" className="fx-act fx-act-teal !h-[26px] !px-2 !text-[11px]" onClick={onQuote}>
          <TextQuote size={12} /> Citar com o trecho
        </button>
        <button type="button" className="fx-act !h-[26px] !px-2 !text-[11px]" onClick={onCallOnly}>
          <Quote size={12} /> Só a chamada
        </button>
      </div>
    </div>
  );
}
