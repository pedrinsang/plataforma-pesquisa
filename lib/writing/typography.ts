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
 * Família padrão da folha. "Arial 12" é o que a maioria dos editais e manuais de
 * normalização pede, então é assim que o documento **nasce** — sem nenhuma marca
 * gravada no texto. É um padrão de CSS (`.folium-editor` no `globals.css`), não
 * um atributo em cada parágrafo, de propósito: texto sem `fontFamily`/`fontSize`
 * explícito continua acompanhando o padrão se ele mudar, e a caixa da faixa
 * mostra o que está valendo em vez de um traço.
 */
export const SHEET_FONT_FAMILY = "Arial, Helvetica, sans-serif";
/** Nome do padrão, para a faixa e a barra de status. */
export const SHEET_FONT_LABEL = "Arial";

/**
 * Corpo dos títulos, em pt — **espelho** de `.folium-editor h1…h4` no
 * `globals.css`. Está aqui porque a faixa e a barra de status mostram o corpo
 * real do trecho sob o cursor: se as duas listas divergirem, a leitura mente.
 * A escala é a de um processador de texto (o `prose` dava 32 pt no h1, que é
 * desenho de página web, não de folha A4).
 */
export const HEADING_PT: Record<1 | 2 | 3 | 4, number> = { 1: 16, 2: 14, 3: 13, 4: 12 };

/** Corpo que vale num bloco sem tamanho explícito (0 = parágrafo comum). */
export function blockBasePt(headingLevel: number): number {
  return HEADING_PT[headingLevel as 1 | 2 | 3 | 4] ?? BASE_FONT_PT;
}

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
