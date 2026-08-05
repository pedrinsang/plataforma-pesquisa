"use client";

import { useEffect, useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";
import { BookMarked, Library, RefreshCw } from "lucide-react";
import { CITATION_STYLE_LABEL, type CitationStyle } from "@/lib/references/format";
import type { ReferenceRow } from "@/lib/references/types";
import { collectCitedReferenceIds, type BibliographyScope } from "@/lib/writing/bibliography";
import { findBibliography } from "@/lib/writing/extensions/bibliography";
import { listProjectReferences } from "@/lib/writing/reference-sources";
import { MenuDivider, MenuItem, MenuLabel } from "../ui";

/**
 * Painel do botão "Bibliografia" (faixa Referências): escolhe **quais** obras
 * entram na lista e manda escrevê-la. A ordem, o recuo e o espaçamento saem da
 * norma do documento — ver `lib/writing/bibliography.ts`.
 */
export function BibliographyPanel({
  editor,
  projectId,
  style,
  onGenerate,
  close,
}: {
  editor: Editor;
  projectId: string;
  /** Norma do documento (a mesma do painel Referências). */
  style: CitationStyle;
  onGenerate: (scope: BibliographyScope) => void;
  close: () => void;
}) {
  const [references, setReferences] = useState<ReferenceRow[] | null>(null);

  // Lidos no clique de abrir: o documento não muda enquanto o painel está no ar.
  const { citedCount, exists } = useMemo(() => {
    const cited = collectCitedReferenceIds(editor.state.doc);
    return { citedCount: cited.length, exists: findBibliography(editor.state.doc) !== null };
  }, [editor]);

  useEffect(() => {
    let cancelled = false;
    void listProjectReferences(projectId).then((rows) => {
      if (!cancelled) setReferences(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const total = references?.length ?? null;

  function run(scope: BibliographyScope) {
    onGenerate(scope);
    close();
  }

  return (
    <>
      <MenuLabel>{exists ? "Refazer a lista" : "Gerar a lista"}</MenuLabel>

      <MenuItem onClick={() => run("cited")}>
        <BookMarked size={14} className="shrink-0" />
        <span className="flex-1">
          Obras citadas no texto
          <span className="ml-1 text-text-dim tabular-nums">({citedCount})</span>
        </span>
      </MenuItem>

      <MenuItem onClick={() => run("all")}>
        {total === null ? (
          <RefreshCw size={14} className="shrink-0 animate-spin" />
        ) : (
          <Library size={14} className="shrink-0" />
        )}
        <span className="flex-1">
          Toda a biblioteca do projeto
          {total !== null && <span className="ml-1 text-text-dim tabular-nums">({total})</span>}
        </span>
      </MenuItem>

      <MenuDivider />
      <p className="px-2.5 pb-1 pt-0.5 text-[0.7rem] leading-relaxed text-text-dim">
        {citedCount === 0 && (
          <>
            Nenhuma citação no texto ainda — use <em>Citar</em> para vincular as obras.
            <br />
          </>
        )}
        Sai no fim do documento, em {CITATION_STYLE_LABEL[style]}.{" "}
        {exists
          ? "A lista que já está no documento é reescrita no lugar."
          : "Depois é só clicar aqui de novo para atualizar."}
      </p>
    </>
  );
}
