"use client";

import { useCallback, useEffect, useRef } from "react";
import { BookMarked, ExternalLink, Files, X } from "lucide-react";
import type { OpenArticle } from "@/lib/writing/reference-sources";

/** Limites da divisória, em px — nem o texto nem o artigo podem sumir. */
const MIN_WIDTH = 320;
const MIN_CANVAS = 380;

/**
 * Leitor de artigos lado a lado: a metade direita da tela mostra o PDF (ou a
 * página) da referência enquanto o documento continua editável à esquerda.
 * É o painel "Artigos" do trilho — abrir algo pela Biblioteca traz o item para
 * cá em vez de abrir outra aba do navegador.
 *
 * O PDF anexado sai do nosso route handler (URL assinada), então sempre exibe.
 * Um link externo pode recusar exibição embutida (X-Frame-Options); nesse caso
 * o quadro fica em branco e aparece o recado que fica desenhado por baixo dele.
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
}: {
  articles: OpenArticle[];
  activeId: string | null;
  width: number;
  onWidthChange: (px: number) => void;
  onSelect: (id: string) => void;
  onCloseArticle: (id: string) => void;
  onClose: () => void;
  onOpenLibrary: () => void;
}) {
  const active = articles.find((a) => a.id === activeId) ?? articles[0] ?? null;
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const gripRef = useRef<HTMLButtonElement>(null);

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
                title="Fechar este artigo"
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
              // O PDF é nosso (URL assinada); um link externo entra em caixa-forte.
              sandbox={
                active.isFile ? undefined : "allow-scripts allow-same-origin allow-popups allow-forms"
              }
              referrerPolicy="no-referrer"
            />
          </>
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
    </aside>
  );
}
