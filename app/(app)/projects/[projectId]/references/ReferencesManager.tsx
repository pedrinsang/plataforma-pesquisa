"use client";

import { useMemo, useState, useTransition } from "react";
import {
  BookMarked,
  Copy,
  ExternalLink,
  FileText,
  Pencil,
  Plus,
  Quote,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import type { ReferenceType } from "@/lib/types/database";
import {
  CITATION_STYLE_LABEL,
  formatReference,
  inTextCitation,
  type CitationStyle,
} from "@/lib/references/format";
import {
  REFERENCE_TYPE_LABEL,
  REFERENCE_TYPE_ORDER,
  type ReferenceRow,
} from "@/lib/references/types";
import { deleteReference, setReferenceEssential } from "@/lib/actions/references";
import { ReferenceModal } from "./ReferenceModal";

const STYLES: CitationStyle[] = ["abnt", "apa", "vancouver"];

function matches(ref: ReferenceRow, query: string): boolean {
  if (!query) return true;
  const haystack = [
    ref.title,
    ref.authors,
    ref.container_title,
    ref.publisher,
    ref.doi,
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

export function ReferencesManager({
  projectId,
  references,
  canManage,
}: {
  projectId: string;
  references: ReferenceRow[];
  canManage: boolean;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ReferenceType | "all">("all");
  const [onlyEssential, setOnlyEssential] = useState(false);
  const [style, setStyle] = useState<CitationStyle>("abnt");
  const [editing, setEditing] = useState<ReferenceRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      references.filter(
        (r) =>
          matches(r, query.trim()) &&
          (typeFilter === "all" || r.ref_type === typeFilter) &&
          (!onlyEssential || r.is_essential),
      ),
    [references, query, typeFilter, onlyEssential],
  );

  // Só oferece os tipos que existem na biblioteca — filtro vazio não ajuda.
  const usedTypes = useMemo(() => {
    const set = new Set(references.map((r) => r.ref_type));
    return REFERENCE_TYPE_ORDER.filter((t) => set.has(t));
  }, [references]);

  async function copy(text: string, token: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(token);
      setTimeout(() => setCopied((c) => (c === token ? null : c)), 1600);
    } catch {
      setCopied(null);
    }
  }

  function copyBibliography() {
    const list = [...visible]
      .sort((a, b) => formatReference(a, style).localeCompare(formatReference(b, style), "pt-BR"))
      .map((r) => formatReference(r, style))
      .join("\n\n");
    void copy(list, "biblio");
  }

  return (
    <section className="card !gap-0 !p-0">
      {/* cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-4">
        <div className="flex items-center gap-2">
          <BookMarked size={17} className="text-accent-teal" strokeWidth={1.8} />
          <h2 className="font-serif text-lg font-semibold text-foreground">Referências</h2>
          <span className="text-[11.5px] tabular-nums text-text-dim">{references.length}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="seg" role="group" aria-label="Norma de citação">
            {STYLES.map((s) => (
              <button
                key={s}
                type="button"
                className="seg-opt !text-[12px]"
                data-active={style === s}
                onClick={() => setStyle(s)}
              >
                {CITATION_STYLE_LABEL[s]}
              </button>
            ))}
          </div>
          {visible.length > 0 && (
            <button
              type="button"
              onClick={copyBibliography}
              className="btn btn-secondary !py-1.5 !text-[12.5px]"
              title="Copia todas as referências filtradas, formatadas na norma escolhida"
            >
              <Copy size={13} /> {copied === "biblio" ? "Copiado!" : "Copiar lista"}
            </button>
          )}
          {canManage && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="btn btn-primary !py-1.5 !text-[12.5px]"
            >
              <Plus size={14} /> Adicionar referência
            </button>
          )}
        </div>
      </div>

      {/* filtros */}
      {references.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle px-5 py-3">
          <label className="relative min-w-[13rem] flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim"
            />
            <input
              className="input !py-1.5 !pl-8 !text-[13px]"
              placeholder="Buscar por título, autor, ano, revista, tag…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            className="input !w-auto !py-1.5 !text-[13px]"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ReferenceType | "all")}
            aria-label="Filtrar por tipo"
          >
            <option value="all">Todos os tipos</option>
            {usedTypes.map((t) => (
              <option key={t} value={t}>
                {REFERENCE_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setOnlyEssential((v) => !v)}
            className="btn btn-secondary !py-1.5 !text-[12.5px]"
            data-active={onlyEssential}
            style={onlyEssential ? { borderColor: "var(--color-accent)", color: "var(--color-accent)" } : undefined}
          >
            <Star size={13} fill={onlyEssential ? "currentColor" : "none"} /> Essenciais
          </button>
        </div>
      )}

      {/* lista */}
      {references.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <p className="text-sm text-text-dim">
            {canManage
              ? "Nenhuma referência ainda — cole um link ou DOI em “Adicionar referência” e os dados vêm preenchidos."
              : "Nenhuma referência cadastrada neste projeto."}
          </p>
        </div>
      ) : visible.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-text-dim">
          Nenhuma referência corresponde ao filtro.
        </p>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {visible.map((ref) => (
            <li key={ref.id} className="group px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <span className="tag tag-neutral !text-[10px]">
                      {REFERENCE_TYPE_LABEL[ref.ref_type]}
                    </span>
                    {ref.is_essential && (
                      <span className="tag tag-outline !text-[10px]">
                        <Star size={10} fill="currentColor" /> Essencial
                      </span>
                    )}
                    {ref.citation_key && (
                      <span className="font-mono text-[10.5px] text-text-dim">
                        @{ref.citation_key}
                      </span>
                    )}
                    {ref.tags.map((tag) => (
                      <span key={tag} className="tag tag-accent !text-[10px]">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h3 className="text-[14.5px] font-medium leading-snug text-foreground">
                    {ref.title}
                  </h3>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-text-dim">
                    {formatReference(ref, style)}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
                    {ref.file_path && (
                      <a
                        href={`/projects/${projectId}/references/${ref.id}/file`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-accent-teal hover:underline"
                      >
                        <FileText size={12} /> {ref.file_name ?? "Arquivo"}
                      </a>
                    )}
                    {ref.doi && (
                      <a
                        href={`https://doi.org/${ref.doi}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-accent-teal hover:underline"
                      >
                        <ExternalLink size={12} /> DOI
                      </a>
                    )}
                    {ref.url && !ref.doi && (
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-accent-teal hover:underline"
                      >
                        <ExternalLink size={12} /> Abrir link
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => copy(inTextCitation(ref, style), `intext-${ref.id}`)}
                      className="inline-flex items-center gap-1 text-text-dim transition-colors hover:text-accent-teal"
                      title="Copiar a citação no corpo do texto"
                    >
                      <Quote size={12} />
                      {copied === `intext-${ref.id}` ? "Copiado!" : inTextCitation(ref, style)}
                    </button>
                    <button
                      type="button"
                      onClick={() => copy(formatReference(ref, style), `full-${ref.id}`)}
                      className="inline-flex items-center gap-1 text-text-dim transition-colors hover:text-accent-teal"
                      title="Copiar a referência completa"
                    >
                      <Copy size={12} />
                      {copied === `full-${ref.id}` ? "Copiado!" : "Copiar referência"}
                    </button>
                  </div>
                </div>

                {canManage && (
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    <EssentialButton
                      referenceId={ref.id}
                      projectId={projectId}
                      isEssential={ref.is_essential}
                    />
                    <button
                      type="button"
                      onClick={() => setEditing(ref)}
                      aria-label="Editar referência"
                      title="Editar"
                      className="ib !size-7 !border-0 text-text-dim hover:text-accent-teal"
                    >
                      <Pencil size={13} />
                    </button>
                    <DeleteReferenceButton referenceId={ref.id} projectId={projectId} />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {(creating || editing) && (
        <ReferenceModal
          projectId={projectId}
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}

function EssentialButton({
  referenceId,
  projectId,
  isEssential,
}: {
  referenceId: string;
  projectId: string;
  isEssential: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setReferenceEssential(referenceId, projectId, !isEssential);
        })
      }
      aria-label={isEssential ? "Desmarcar como essencial" : "Marcar como essencial"}
      title={isEssential ? "Desmarcar como essencial" : "Marcar como essencial"}
      className={`ib !size-7 !border-0 disabled:opacity-30 ${
        isEssential ? "text-accent-teal" : "text-text-dim hover:text-accent-teal"
      }`}
    >
      <Star size={13} fill={isEssential ? "currentColor" : "none"} />
    </button>
  );
}

function DeleteReferenceButton({
  referenceId,
  projectId,
}: {
  referenceId: string;
  projectId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await deleteReference(referenceId, projectId);
            })
          }
          className="btn btn-danger !px-2 !py-1 !text-[11.5px]"
        >
          {pending ? "Excluindo…" : "Excluir"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="btn btn-ghost !px-2 !py-1 !text-[11.5px]"
        >
          Cancelar
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label="Excluir referência"
      title="Excluir"
      className="ib !size-7 !border-0 text-text-dim hover:text-neg"
    >
      <Trash2 size={13} />
    </button>
  );
}
