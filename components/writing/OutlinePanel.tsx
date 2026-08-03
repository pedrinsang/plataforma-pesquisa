"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { X } from "lucide-react";

type Heading = { level: number; text: string; pos: number };

function collectHeadings(editor: Editor): Heading[] {
  const items: Heading[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "heading") {
      items.push({
        level: Number(node.attrs.level) || 1,
        text: node.textContent.trim() || "Sem título",
        pos,
      });
    }
  });
  return items;
}

/**
 * Sumário do documento: lista os títulos (T1–T4) na ordem em que aparecem e
 * rola/posiciona o cursor na seção ao clicar — como o painel de navegação do
 * Word. Encaixa no trilho da esquerda (navegação do texto), empurrando a folha.
 */
export function OutlinePanel({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [headings, setHeadings] = useState<Heading[]>(() => collectHeadings(editor));

  // Recolhe os títulos a cada edição (o conteúdo pode mudar de estrutura).
  useEffect(() => {
    const update = () => setHeadings(collectHeadings(editor));
    update();
    editor.on("update", update);
    return () => {
      editor.off("update", update);
    };
  }, [editor]);

  function goTo(pos: number) {
    editor.chain().focus().setTextSelection(pos + 1).scrollIntoView().run();
  }

  return (
    <aside className="fx-panel fx-panel-side-left print:hidden" aria-label="Sumário">
      <div className="fx-panel-head">
        <div className="flex items-center justify-between">
          <span className="fx-panel-title">
            Sumário · {headings.length} {headings.length === 1 ? "título" : "títulos"}
          </span>
          <button type="button" className="fx-panel-btn" onClick={onClose} aria-label="Fechar sumário">
            <X size={12} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {headings.length === 0 ? (
          <p className="px-2 py-3 text-xs leading-relaxed text-text-dim">
            Nenhum título ainda. Use os estilos Título 1–4 para montar o sumário.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {headings.map((h, i) => (
              <li key={`${h.pos}-${i}`}>
                <button
                  type="button"
                  onClick={() => goTo(h.pos)}
                  title={h.text}
                  className="block w-full truncate rounded-md px-2 py-1.5 text-left text-[13px] text-foreground transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-accent)_12%,transparent)] hover:text-accent-teal"
                  style={{ paddingInlineStart: `${0.5 + (h.level - 1) * 0.75}rem` }}
                >
                  {h.text}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
