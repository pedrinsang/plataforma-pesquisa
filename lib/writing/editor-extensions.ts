import StarterKit from "@tiptap/starter-kit";
import {
  TextStyle,
  FontFamily,
  FontSize,
  Color,
} from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { LineHeight } from "@/lib/writing/extensions/line-height";
import { ParagraphSpacing } from "@/lib/writing/extensions/paragraph-spacing";
import { Indent } from "@/lib/writing/extensions/indent";
import { ParagraphIndent } from "@/lib/writing/extensions/paragraph-indent";
import { PageBreak } from "@/lib/writing/extensions/page-break";
import { Pagination } from "@/lib/writing/extensions/pagination";
import { SearchReplace } from "@/lib/writing/extensions/search-replace";
import { StatChart } from "@/lib/writing/extensions/stat-chart";

// Famílias de fonte curadas para a Escrita. As duas primeiras são as fontes da
// identidade Folium (corpo/títulos); as demais são clássicas de processador de
// texto, para quem precisa entregar em formato específico.
export const FONT_FAMILIES: Array<{ label: string; value: string }> = [
  { label: "Lora (padrão)", value: "var(--font-lora), Georgia, serif" },
  { label: "Cormorant", value: "var(--font-cormorant), Georgia, serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Times New Roman", value: '"Times New Roman", Times, serif' },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Garamond", value: 'Garamond, "EB Garamond", serif' },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Courier New", value: '"Courier New", Courier, monospace' },
];

// Tamanhos comuns (o campo também aceita digitar um valor arbitrário).
export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72];

export const LINE_HEIGHTS: Array<{ label: string; value: string }> = [
  { label: "Simples", value: "1" },
  { label: "1,15", value: "1.15" },
  { label: "1,5", value: "1.5" },
  { label: "Duplo", value: "2" },
];

// Presets de espaçamento antes/depois de parágrafo, em pontos (pt).
export const PARAGRAPH_SPACINGS: Array<{ label: string; value: number }> = [
  { label: "Nenhum", value: 0 },
  { label: "4 pt", value: 4 },
  { label: "6 pt", value: 6 },
  { label: "8 pt", value: 8 },
  { label: "12 pt", value: 12 },
  { label: "18 pt", value: 18 },
  { label: "24 pt", value: 24 },
];

/**
 * Conjunto de extensões do editor de Escrita. Centralizado aqui para o editor e
 * os testes usarem exatamente a mesma configuração.
 */
export function buildEditorExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      },
    }),
    TextStyle,
    FontFamily,
    FontSize,
    Color,
    Highlight.configure({ multicolor: true }),
    Subscript,
    Superscript,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Image.configure({ inline: false, allowBase64: false }),
    TableKit.configure({ table: { resizable: true } }),
    LineHeight,
    ParagraphSpacing,
    Indent,
    ParagraphIndent,
    PageBreak,
    Pagination,
    SearchReplace,
    StatChart,
  ];
}
