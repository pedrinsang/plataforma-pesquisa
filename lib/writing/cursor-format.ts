import type { Editor } from "@tiptap/react";
import { FONT_FAMILIES, LINE_HEIGHTS } from "@/lib/writing/editor-extensions";
import { SHEET_FONT_LABEL, blockBasePt, fontSizeToPt } from "@/lib/writing/typography";

/**
 * O que está valendo no ponto do cursor — a leitura que a faixa e a barra de
 * status mostram.
 *
 * O ponto todo é **resolver o padrão**, não devolver o atributo cru: texto
 * comum não guarda `fontFamily` nem `fontSize` (ver `SHEET_FONT_FAMILY`), então
 * ler só os atributos faria a caixa da faixa mostrar um traço — ou, pior,
 * mostrar "12" dentro de um título de 16 pt. Aqui o valor explícito vem
 * primeiro e, na falta dele, entra o padrão da folha para aquele bloco.
 */

export type CursorFormat = {
  /** Família gravada no trecho, ou `null` quando vale o padrão da folha. */
  fontFamily: string | null;
  /** Nome da fonte que está valendo (a explícita ou a padrão). */
  fontFamilyLabel: string;
  /** Corpo gravado no trecho, em pt, ou `null` quando vale o padrão. */
  fontSize: number | null;
  /** Corpo que está valendo, em pt. */
  fontSizePt: number;
  /** `true` quando família e corpo vêm do padrão — nada gravado no texto. */
  isDefaultFont: boolean;
  /** 0 = parágrafo comum; 1…4 = nível do título. */
  headingLevel: number;
  blockLabel: string;
  alignLabel: string;
  /** Entrelinha do parágrafo, ou `null` quando segue a da configuração de página. */
  lineHeightLabel: string;
  spaceBefore: number | null;
  spaceAfter: number | null;
  /** Formatações ligadas no trecho ("Negrito", "Itálico"…), na ordem da faixa. */
  marks: string[];
};

const BLOCK_LABELS: Record<number, string> = {
  0: "Texto normal",
  1: "Título 1",
  2: "Título 2",
  3: "Título 3",
  4: "Título 4",
};

const ALIGN_LABELS: Record<string, string> = {
  left: "Esquerda",
  center: "Centralizado",
  right: "Direita",
  justify: "Justificado",
};

/**
 * Nome de exibição de uma família. Vem da lista curada quando o valor é um dos
 * nossos; conteúdo colado de fora traz qualquer pilha CSS, e aí o nome sai do
 * primeiro item dela (sem aspas, e sem o `var(--font-…)` das fontes do app).
 */
export function fontFamilyLabel(value: string | null): string {
  if (!value) return SHEET_FONT_LABEL;

  const known = FONT_FAMILIES.find((f) => f.value === value);
  if (known) return known.label.replace(" (padrão)", "");

  const first = value.split(",")[0]?.trim() ?? "";
  const variable = first.match(/^var\(\s*--font-([\w-]+)/i)?.[1];
  const name = (variable ?? first).replace(/^["']|["']$/g, "").replace(/-/g, " ").trim();
  if (!name) return SHEET_FONT_LABEL;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Nível do título no bloco do cursor (0 para parágrafo comum). */
function headingLevelAt(editor: Editor): number {
  const parent = editor.state.selection.$from.parent;
  return parent.type.name === "heading" ? Number(parent.attrs.level ?? 0) || 0 : 0;
}

/** Corpo em pt que vale no cursor: o explícito ou o padrão daquele bloco. */
export function resolveFontSizePt(explicitPt: number | null, headingLevel: number): number {
  return explicitPt ?? blockBasePt(headingLevel);
}

/** Leitura completa do ponto do cursor. */
export function readCursorFormat(editor: Editor): CursorFormat {
  const textStyle = editor.getAttributes("textStyle");
  const fontFamily = typeof textStyle.fontFamily === "string" ? textStyle.fontFamily : null;
  const fontSize = fontSizeToPt(textStyle.fontSize);
  const headingLevel = headingLevelAt(editor);

  const block = editor.state.selection.$from.parent.attrs as {
    textAlign?: string | null;
    lineHeight?: string | null;
    spaceBefore?: number | null;
    spaceAfter?: number | null;
  };

  const marks: string[] = [];
  if (editor.isActive("bold")) marks.push("Negrito");
  if (editor.isActive("italic")) marks.push("Itálico");
  if (editor.isActive("underline")) marks.push("Sublinhado");
  if (editor.isActive("strike")) marks.push("Tachado");
  if (editor.isActive("superscript")) marks.push("Sobrescrito");
  if (editor.isActive("subscript")) marks.push("Subscrito");
  if (editor.isActive("highlight")) marks.push("Destaque");
  if (editor.isActive("link")) marks.push("Link");
  if (editor.isActive("blockquote")) marks.push("Citação");

  const lineHeight = block.lineHeight ?? null;

  return {
    fontFamily,
    fontFamilyLabel: fontFamilyLabel(fontFamily),
    fontSize,
    fontSizePt: resolveFontSizePt(fontSize, headingLevel),
    isDefaultFont: fontFamily === null && fontSize === null,
    headingLevel,
    blockLabel: BLOCK_LABELS[headingLevel] ?? BLOCK_LABELS[0],
    alignLabel: ALIGN_LABELS[block.textAlign ?? "left"] ?? ALIGN_LABELS.left,
    lineHeightLabel:
      LINE_HEIGHTS.find((lh) => lh.value === lineHeight)?.label ?? (lineHeight ?? "padrão"),
    spaceBefore: block.spaceBefore ?? null,
    spaceAfter: block.spaceAfter ?? null,
    marks,
  };
}
