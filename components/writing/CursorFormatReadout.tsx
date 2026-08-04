"use client";

import { type Editor, useEditorState } from "@tiptap/react";
import { readCursorFormat } from "@/lib/writing/cursor-format";

/**
 * Leitura da formatação sob o cursor, na barra de status: fonte, corpo, estilo
 * do bloco, alinhamento e entrelinha do que está sob o cursor **agora**.
 *
 * A faixa já mostra fonte e corpo, mas só na aba Início — e alinhamento,
 * entrelinha e espaçamento ficam espalhados entre Início e Layout. Aqui a
 * resposta é uma linha só, visível em qualquer aba, como o rodapé de um
 * processador de texto. O texto do `title` traz o resto (espaçamento antes e
 * depois), que não caberia na barra.
 */
export function CursorFormatReadout({ editor }: { editor: Editor }) {
  const f = useEditorState({ editor, selector: ({ editor }) => readCursorFormat(editor) });

  const parts = [
    `${f.fontFamilyLabel} ${f.fontSizePt} pt`,
    f.blockLabel,
    f.alignLabel,
    `entrelinha ${f.lineHeightLabel}`,
  ];
  if (f.marks.length > 0) parts.push(f.marks.join(", "));

  const spacing = `espaço antes ${f.spaceBefore ?? "auto"} · depois ${f.spaceAfter ?? "auto"}`;

  return (
    <span
      className="fx-status-format"
      title={`Formatação no cursor — ${parts.join(" · ")} · ${spacing}${
        f.isDefaultFont ? " (fonte padrão da folha)" : ""
      }`}
    >
      <span style={{ color: "var(--color-text)" }}>
        {f.fontFamilyLabel} {f.fontSizePt} pt
      </span>
      {parts.slice(1).map((part) => (
        <span key={part}> · {part}</span>
      ))}
    </span>
  );
}
