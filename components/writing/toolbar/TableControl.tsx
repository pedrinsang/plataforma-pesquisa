"use client";

import type { Editor } from "@tiptap/react";
import {
  Table as TableIcon,
  Plus,
  Trash2,
  Rows3,
  Columns3,
} from "lucide-react";
import { Popover, MenuItem } from "./primitives";

/** Insere tabela e, quando o cursor está numa, expõe operações de linha/coluna. */
export function TableControl({ editor }: { editor: Editor }) {
  const inTable = editor.isActive("table");

  return (
    <Popover
      panelClassName="w-52"
      trigger={({ open, toggle, triggerRef }) => (
        <button
          ref={triggerRef}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggle}
          aria-label="Tabela"
          aria-pressed={inTable}
          title="Tabela"
          className={`grid size-8 place-items-center rounded-md transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-accent)_10%,transparent)] ${
            inTable || open ? "bg-accent-teal-soft text-accent-teal" : "text-text-dim hover:text-foreground"
          }`}
        >
          <TableIcon size={16} />
        </button>
      )}
    >
      {(close) => (
        <div className="space-y-1">
          <MenuItem
            onClick={() => {
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run();
              close();
            }}
          >
            <Plus size={14} className="text-accent-teal" />
            Inserir tabela 3×3
          </MenuItem>

          {inTable && (
            <>
              <div className="my-1 h-px bg-border-subtle" />
              <MenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
                <Rows3 size={14} /> Adicionar linha
              </MenuItem>
              <MenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
                <Columns3 size={14} /> Adicionar coluna
              </MenuItem>
              <MenuItem onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
                <Rows3 size={14} /> Alternar cabeçalho
              </MenuItem>
              <MenuItem onClick={() => editor.chain().focus().deleteRow().run()}>
                <Trash2 size={14} /> Excluir linha
              </MenuItem>
              <MenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>
                <Trash2 size={14} /> Excluir coluna
              </MenuItem>
              <MenuItem
                onClick={() => {
                  editor.chain().focus().deleteTable().run();
                  close();
                }}
              >
                <Trash2 size={14} className="text-red-600 dark:text-red-400" /> Excluir tabela
              </MenuItem>
            </>
          )}
        </div>
      )}
    </Popover>
  );
}
