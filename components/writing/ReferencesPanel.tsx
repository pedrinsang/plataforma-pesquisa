"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  FileText,
  Inbox,
  Quote,
  RefreshCw,
  Search,
  Star,
  X,
} from "lucide-react";
import { inTextCitation, type CitationStyle } from "@/lib/references/format";
import { REFERENCE_TYPE_LABEL, type ReferenceRow } from "@/lib/references/types";
import {
  articleFromReference,
  listProjectReferences,
  type OpenArticle,
} from "@/lib/writing/reference-sources";
import { cn } from "@/lib/utils/cn";

const STYLES: CitationStyle[] = ["abnt", "apa", "vancouver"];
const STYLE_SHORT: Record<CitationStyle, string> = {
  abnt: "ABNT",
  apa: "APA",
  vancouver: "VANC",
};

function matches(ref: ReferenceRow, query: string): boolean {
  if (!query) return true;
  const haystack = [
    ref.title,
    ref.authors,
    ref.container_title,
    ref.citation_key,
    ref.year ? String(ref.year) : null,
    ref.tags.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((term) => haystack.includes(term));
}

function byline(ref: ReferenceRow): string {
  return [ref.authors, ref.year ? String(ref.year) : null, ref.container_title]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Biblioteca do projeto encaixada no trilho da direita. Abrir um artigo daqui
 * **não** joga o usuário para outra aba do navegador: manda o item para o
 * painel "Artigos" (logo abaixo no trilho), que divide a página em duas.
 */
export function ReferencesPanel({
  projectId,
  onClose,
  onOpenArticle,
  onCite,
  openArticleIds,
}: {
  projectId: string;
  onClose: () => void;
  onOpenArticle: (article: OpenArticle) => void;
  onCite: (text: string) => void;
  /** Ids já abertos no leitor — marcam o item como "aberto". */
  openArticleIds: string[];
}) {
  const [references, setReferences] = useState<ReferenceRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState<CitationStyle>("abnt");

  const load = useCallback(
    (signal?: { cancelled: boolean }) => {
      void listProjectReferences(projectId).then((data) => {
        if (signal?.cancelled) return;
        setReferences(data);
      });
    },
    [projectId],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    load(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    if (!references) return null;
    return references.filter((r) => matches(r, query.trim()));
  }, [references, query]);

  return (
    <aside className="fx-panel print:hidden" aria-label="Referências do projeto">
      <div className="fx-panel-head">
        <div className="mb-3 flex items-center justify-between">
          <span className="fx-panel-title">
            Referências · {references?.length ?? 0}
          </span>
          <span className="flex items-center gap-2">
            <button
              type="button"
              className="fx-panel-btn"
              onClick={() => {
                setReferences(null);
                load();
              }}
              title="Recarregar"
              aria-label="Recarregar"
            >
              <RefreshCw size={12} />
            </button>
            <button
              type="button"
              className="fx-panel-btn"
              onClick={onClose}
              title="Fechar"
              aria-label="Fechar"
            >
              <X size={12} />
            </button>
          </span>
        </div>

        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
            style={{ color: "rgba(236,234,231,.45)" }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="buscar autor, título, ano, tag…"
            className="fx-panel-search"
          />
        </div>

        <div className="mt-2 flex items-center gap-1">
          {STYLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStyle(s)}
              aria-pressed={style === s}
              className={cn(
                "rounded-[4px] border px-2 py-0.5 transition-colors",
                style === s
                  ? "border-accent-teal text-accent-teal"
                  : "border-transparent text-text-dim hover:text-foreground",
              )}
              style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", letterSpacing: "0.14em" }}
              title={`Citar na norma ${STYLE_SHORT[s]}`}
            >
              {STYLE_SHORT[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {filtered === null ? (
          <div className="flex items-center gap-2 py-8 text-sm text-text-dim">
            <RefreshCw size={14} className="animate-spin" /> Carregando…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong px-4 py-12 text-center">
            <Inbox size={22} className="text-text-dim" />
            <p className="text-sm text-text-dim">
              {query.trim()
                ? "Nada encontrado para essa busca."
                : "Nenhuma referência na biblioteca do projeto ainda. Cadastre pela aba Referências."}
            </p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {filtered.map((ref) => {
              const article = articleFromReference(ref, projectId);
              const isOpen = openArticleIds.includes(ref.id);
              return (
                <li
                  key={ref.id}
                  className={cn(
                    "rounded-[5px] border px-2.5 py-2 transition-colors",
                    isOpen ? "border-accent-teal/50" : "border-border-subtle hover:border-accent-teal/40",
                  )}
                  style={{ background: "#0d1213" }}
                >
                  <div className="mb-1 flex items-center gap-1.5">
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "8.5px",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "rgba(236,234,231,.42)",
                      }}
                    >
                      {REFERENCE_TYPE_LABEL[ref.ref_type]}
                    </span>
                    {ref.is_essential && <Star size={9} className="text-accent-teal" fill="currentColor" />}
                    {ref.file_path && <FileText size={9} className="text-accent-teal" />}
                  </div>

                  <p className="text-[12.5px] font-medium leading-snug text-foreground">{ref.title}</p>
                  {byline(ref) && (
                    <p className="mt-0.5 truncate text-[11px] text-text-dim" title={byline(ref)}>
                      {byline(ref)}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {article ? (
                      <button
                        type="button"
                        onClick={() => onOpenArticle(article)}
                        className="fx-act !h-[24px] !px-2 !text-[11px] fx-act-teal"
                        title={
                          article.isFile
                            ? "Abrir o PDF ao lado do texto"
                            : "Abrir o artigo ao lado do texto"
                        }
                      >
                        {article.isFile ? <FileText size={11} /> : <ExternalLink size={11} />}
                        {isOpen ? "Ir para o artigo" : "Abrir ao lado"}
                      </button>
                    ) : (
                      <span className="text-[10.5px] text-text-dim">
                        sem arquivo ou link para abrir
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onCite(inTextCitation(ref, style))}
                      className="fx-act !h-[24px] !px-2 !text-[11px]"
                      title={`Inserir ${inTextCitation(ref, style)} no texto`}
                    >
                      <Quote size={11} /> Citar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-none items-center gap-1.5 border-t border-border-subtle px-3 py-2 text-[10.5px] text-text-dim">
        <BookOpen size={11} />
        Abrir um artigo divide a tela — ele vai para o painel “Artigos”.
      </div>
    </aside>
  );
}
