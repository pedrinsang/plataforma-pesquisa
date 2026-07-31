"use client";

import { useEffect, useRef, useState } from "react";
import { type Editor, useEditorState } from "@tiptap/react";
import {
  X,
  ChevronUp,
  ChevronDown,
  Replace,
  ReplaceAll,
  CaseSensitive,
} from "lucide-react";
import type { SearchReplaceStorage } from "@/lib/writing/extensions/search-replace";

/**
 * Barra flutuante "Localizar e substituir" (estilo processador de texto).
 * Abre com Ctrl+F (só localizar) ou Ctrl+H (com o campo de substituir visível);
 * pinta as ocorrências na folha e navega/substitui via comandos da extensão.
 */
export function SearchReplacePanel({
  editor,
  open,
  showReplace,
  onClose,
}: {
  editor: Editor;
  open: boolean;
  showReplace: boolean;
  onClose: () => void;
}) {
  const [term, setTerm] = useState("");
  const [replace, setReplace] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const findRef = useRef<HTMLInputElement>(null);

  // Contagem/posição ao vivo, lidas do storage da extensão.
  const { total, currentIndex } = useEditorState({
    editor,
    selector: ({ editor }) => {
      const s = editor.storage.foliumSearchReplace as SearchReplaceStorage | undefined;
      return { total: s?.results.length ?? 0, currentIndex: s?.currentIndex ?? -1 };
    },
  });

  // Ao abrir, foca o campo e (re)aplica o termo atual à seleção do editor.
  useEffect(() => {
    if (!open) return;
    findRef.current?.focus();
    findRef.current?.select();
  }, [open, showReplace]);

  // Mantém a busca sincronizada com o termo digitado.
  useEffect(() => {
    if (!open) return;
    editor.commands.setSearchTerm(term);
  }, [term, open, editor]);

  useEffect(() => {
    editor.commands.setSearchCaseSensitive(caseSensitive);
  }, [caseSensitive, editor]);

  // Limpa os destaques ao fechar.
  useEffect(() => {
    if (open) return;
    editor.commands.clearSearch();
  }, [open, editor]);

  if (!open) return null;

  const hasTerm = term.length > 0;
  const label = !hasTerm ? "" : total === 0 ? "0 resultados" : `${currentIndex + 1} de ${total}`;

  function next() {
    editor.commands.nextSearchResult();
  }
  function prev() {
    editor.commands.previousSearchResult();
  }

  return (
    <div className="absolute right-16 top-3 z-40 w-[min(22rem,calc(100vw-6rem))] rounded-xl border border-border-subtle bg-surface p-2.5 shadow-lift print:hidden">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1 rounded-lg border border-border-subtle bg-background px-2 py-1">
          <input
            ref={findRef}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (e.shiftKey) prev();
                else next();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              }
            }}
            placeholder="Localizar"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-text-dim/60 focus:outline-none"
          />
          <span className="shrink-0 whitespace-nowrap font-mono text-[0.7rem] tabular-nums text-text-dim">
            {label}
          </span>
          <button
            type="button"
            onClick={() => setCaseSensitive((v) => !v)}
            title="Diferenciar maiúsculas de minúsculas"
            aria-pressed={caseSensitive}
            className={`grid size-6 shrink-0 place-items-center rounded-md transition-colors ${
              caseSensitive
                ? "bg-accent-teal-soft text-accent-teal"
                : "text-text-dim hover:text-foreground"
            }`}
          >
            <CaseSensitive size={15} />
          </button>
        </div>
        <div className="flex items-center gap-0.5">
          <IconButton label="Anterior (Shift+Enter)" onClick={prev} disabled={total === 0}>
            <ChevronUp size={16} />
          </IconButton>
          <IconButton label="Próximo (Enter)" onClick={next} disabled={total === 0}>
            <ChevronDown size={16} />
          </IconButton>
          <IconButton label="Fechar (Esc)" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>
      </div>

      {showReplace && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center rounded-lg border border-border-subtle bg-background px-2 py-1">
            <input
              value={replace}
              onChange={(e) => {
                setReplace(e.target.value);
                editor.commands.setReplaceTerm(e.target.value);
              }}
              placeholder="Substituir por"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-text-dim/60 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-0.5">
            <IconButton
              label="Substituir"
              onClick={() => editor.commands.replaceCurrent()}
              disabled={total === 0}
            >
              <Replace size={16} />
            </IconButton>
            <IconButton
              label="Substituir tudo"
              onClick={() => editor.commands.replaceAll()}
              disabled={total === 0}
            >
              <ReplaceAll size={16} />
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid size-8 place-items-center rounded-md text-text-dim transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-accent)_10%,transparent)] hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}
