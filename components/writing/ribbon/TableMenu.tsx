"use client";

import type { Editor } from "@tiptap/react";
import { Columns3, Plus, Rows3, Trash2 } from "lucide-react";
import { MenuDivider, MenuItem } from "../ui";

/** Corpo do menu de tabela: inserir e, dentro de uma, operar linhas/colunas. */
export function TableMenu({ editor, close }: { editor: Editor; close: () => void }) {
  const inTable = editor.isActive("table");

  return (
    <div className="space-y-1">
      <MenuItem
        onClick={() => {
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
          close();
        }}
      >
        <Plus size={14} className="text-accent-teal" />
        Inserir tabela 3×3
      </MenuItem>

      {inTable && (
        <>
          <MenuDivider />
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
            <Trash2 size={14} className="text-red-400" /> Excluir tabela
          </MenuItem>
        </>
      )}
    </div>
  );
}
