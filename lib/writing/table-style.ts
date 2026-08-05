/**
 * Vocabulário de estilo das tabelas da Escrita.
 *
 * Uma tabela de revista não é um card: não tem fundo chapado no cabeçalho, nem
 * moldura em volta, nem grade fechada. O padrão científico (o "booktabs" do
 * LaTeX, que Nature, Elsevier e a maioria dos periódicos pedem) é o oposto —
 * **três réguas horizontais** (topo, sob o cabeçalho, base), **nenhuma
 * vertical**, corpo menor que o do texto, números alinhados, legenda numerada
 * em cima e a linha de fonte embaixo.
 *
 * Estas constantes são o que a faixa de opções oferece e o que os atributos do
 * nó `table` guardam; o desenho de cada preset está em `app/globals.css`
 * (bloco "tabelas"), selecionado por `data-preset` na figura.
 */

/** Como as réguas são distribuídas. É o que separa "revista" de "planilha". */
export type TablePreset = "academic" | "lines" | "grid" | "open";

/** Respiro dentro da célula. Revista aperta; apresentação arejaria. */
export type TableDensity = "compact" | "normal" | "loose";

/** Largura: a coluna de texto inteira ou só o que o conteúdo pede. */
export type TableWidth = "text" | "auto";

/** Onde a tabela se apoia quando não ocupa a coluna inteira. */
export type TableAlign = "left" | "center";

/** ABNT põe o título em cima; algumas revistas o querem embaixo. */
export type CaptionPlacement = "top" | "bottom";

export type FoliumTableAttrs = {
  preset: TablePreset;
  zebra: boolean;
  density: TableDensity;
  /** Corpo da tabela em pontos. `null` = 10 pt, o padrão de periódico. */
  size: number | null;
  width: TableWidth;
  align: TableAlign;
  /**
   * Título da tabela. `null` = a tabela não tem legenda (o elemento nem existe);
   * `""` = tem legenda, ainda em branco — é a diferença entre "não quero" e
   * "vou escrever agora", e é o que evita reservar uma linha em toda tabela.
   */
  caption: string | null;
  /** Linha de fonte/nota, embaixo. Mesma regra do `caption` para `null`. */
  source: string | null;
  /** Rótulo que antecede o número na legenda. `""` = sem rótulo nem número. */
  label: string;
  captionPlacement: CaptionPlacement;
};

export const DEFAULT_TABLE_ATTRS: FoliumTableAttrs = {
  preset: "academic",
  zebra: false,
  density: "normal",
  size: null,
  width: "text",
  align: "left",
  caption: null,
  source: null,
  label: "Tabela",
  captionPlacement: "top",
};

export const TABLE_PRESETS: Array<{
  value: TablePreset;
  label: string;
  hint: string;
}> = [
  {
    value: "academic",
    label: "Científica",
    hint: "Três réguas, nenhuma linha vertical — o padrão dos periódicos.",
  },
  {
    value: "lines",
    label: "Linhas horizontais",
    hint: "Uma régua fina sob cada linha. Ajuda em tabelas longas.",
  },
  {
    value: "grid",
    label: "Quadro fechado",
    hint: "Todas as bordas, como o quadro da ABNT.",
  },
  {
    value: "open",
    label: "Aberta",
    hint: "Sem réguas: só o espaçamento organiza.",
  },
];

export const TABLE_DENSITIES: Array<{ value: TableDensity; label: string }> = [
  { value: "compact", label: "Compacta" },
  { value: "normal", label: "Normal" },
  { value: "loose", label: "Arejada" },
];

/** Corpo da tabela em pontos — periódico costuma pedir 8–10. */
export const TABLE_SIZES = [8, 9, 10, 11, 12] as const;

export const TABLE_LABELS: Array<{ value: string; label: string }> = [
  { value: "Tabela", label: "Tabela" },
  { value: "Quadro", label: "Quadro" },
  { value: "Table", label: "Table (inglês)" },
  { value: "", label: "Sem rótulo nem número" },
];

export const TABLE_ALIGNS: Array<{ value: TableAlign; label: string }> = [
  { value: "left", label: "À esquerda" },
  { value: "center", label: "Centralizada" },
];

export const TABLE_WIDTHS: Array<{ value: TableWidth; label: string }> = [
  { value: "text", label: "Coluna do texto" },
  { value: "auto", label: "Ajustada ao conteúdo" },
];

export function presetLabel(value: TablePreset): string {
  return TABLE_PRESETS.find((p) => p.value === value)?.label ?? "Científica";
}
