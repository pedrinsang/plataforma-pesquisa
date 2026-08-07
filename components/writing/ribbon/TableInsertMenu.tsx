"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { MenuDivider, MenuLabel } from "../ui";

const GRID_ROWS = 6;
const GRID_COLS = 8;

/**
 * Inserção de tabela: a grade de escolher o tamanho, como em qualquer
 * processador de texto. A tabela nasce com linha de cabeçalho e com a legenda
 * já aberta (em branco) — num trabalho científico a tabela sem título é a
 * exceção, não a regra, e é mais fácil apagar a legenda do que lembrar dela.
 */
export function TableInsertMenu({
  editor,
  close,
  onInserted,
}: {
  editor: Editor;
  close: () => void;
  /** Avisa a faixa para abrir a aba contextual "Tabela". */
  onInserted?: () => void;
}) {
  const [hover, setHover] = useState<{ rows: number; cols: number } | null>(null);

  const insert = (rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    editor.chain().focus().setTableAttributes({ caption: "" }).run();
    close();
    onInserted?.();
  };

  return (
    <div className="space-y-1">
      <MenuLabel>Tamanho da tabela</MenuLabel>

      <div
        className="grid gap-[3px] px-2.5 py-1"
        style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}
        onPointerLeave={() => setHover(null)}
      >
        {Array.from({ length: GRID_ROWS * GRID_COLS }, (_, i) => {
          const rows = Math.floor(i / GRID_COLS) + 1;
          const cols = (i % GRID_COLS) + 1;
          const on = hover != null && rows <= hover.rows && cols <= hover.cols;
          return (
            <button
              key={i}
              type="button"
              aria-label={`${rows} por ${cols}`}
              onMouseDown={(e) => e.preventDefault()}
              onPointerEnter={() => setHover({ rows, cols })}
              onClick={() => insert(rows, cols)}
              className="h-[13px] rounded-[2px] border transition-colors"
              style={{
                borderColor: on
                  ? "var(--color-accent-teal)"
                  : "color-mix(in srgb, var(--color-text) 22%, transparent)",
                background: on
                  ? "color-mix(in srgb, var(--color-accent-teal) 28%, transparent)"
                  : "transparent",
              }}
            />
          );
        })}
      </div>

      <p className="px-2.5 pb-1 font-mono text-[0.62rem] tracking-[0.1em] text-text-dim tabular-nums">
        {hover ? `${hover.rows} × ${hover.cols}` : "escolha linhas × colunas"}
      </p>

      <MenuDivider />
      <p className="px-2.5 py-1 text-[0.7rem] leading-relaxed text-text-dim">
        A tabela entra no padrão científico — três réguas, sem linhas verticais.
        O desenho, a legenda e as colunas ficam na aba <strong>Tabela</strong>.
      </p>
    </div>
  );
}
