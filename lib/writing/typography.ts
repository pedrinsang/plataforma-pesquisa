/**
 * Tipografia da folha em **unidades de papel**, não de tela.
 *
 * A folha é A4 medida a 96 dpi (ver `page-metrics`), exatamente como o Word
 * desenha a página; nessa escala 1 pt = 96/72 px. Por isso o tamanho de fonte
 * do editor é gravado em `pt`: escrever "12" na faixa dá o mesmo corpo que
 * "12" no Word, e o parágrafo ocupa a mesma altura na página — que é o que um
 * edital cobra quando pede "Arial 12" ou "Times New Roman 12".
 *
 * Enquanto isso era px, "12" saía a 12 px (9 pt): um quarto menor que o pedido,
 * e a contagem de páginas do documento não batia com a do Word.
 */
export const PX_PER_PT = 96 / 72;

/** Corpo padrão da folha — o "12" que a maioria dos editais exige. */
export const BASE_FONT_PT = 12;

/**
 * Tamanhos da caixa de tamanho, os mesmos da lista do Word. O campo continua
 * aceitando qualquer valor digitado.
 */
export const FONT_SIZES_PT = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

/** Valor CSS gravado no documento. */
export function ptToCss(pt: number): string {
  return `${pt}pt`;
}

/**
 * Tamanho gravado no documento, lido em pt. Documentos escritos antes desta
 * mudança guardaram px; eles são convertidos na leitura, então o número que
 * aparece na faixa é sempre o corpo real do texto — na unidade do Word.
 */
export function fontSizeToPt(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^([\d.]+)\s*(pt|px)?$/i);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  const pt = (match[2] ?? "px").toLowerCase() === "px" ? n / PX_PER_PT : n;
  return Math.round(pt * 10) / 10;
}
