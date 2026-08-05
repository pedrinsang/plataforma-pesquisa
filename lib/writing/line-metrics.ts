import { CONTENT_WIDTH_PX } from "@/lib/writing/page-metrics";

/**
 * Quantas linhas um trecho ocupa na coluna de texto da folha.
 *
 * Existe por causa de uma regra só: a ABNT decide entre citação curta e longa
 * pelo **número de linhas** (mais de três vira bloco recuado), enquanto a APA
 * decide por palavras. Palavra a gente conta; linha depende do corpo da fonte,
 * da família e da largura da coluna — e antes disto era um chute
 * ("3 × 90 caracteres"), que errava em qualquer texto com palavras longas ou
 * com o corpo trocado.
 *
 * A medição é feita no `canvas` com a fonte **real da folha**, lida do
 * `.folium-editor` que está na tela. Não é o layout do navegador, é uma quebra
 * gulosa por palavra com as larguras de glifo verdadeiras — o suficiente para
 * uma decisão de "3 linhas ou mais", e sem custo de layout (não força reflow).
 */

/** Caracteres por linha usados quando não há DOM (SSR) nem canvas. */
const FALLBACK_CHARS_PER_LINE = 90;

type Metrics = { font: string; width: number };

let canvasContext: CanvasRenderingContext2D | null | undefined;

function context(): CanvasRenderingContext2D | null {
  if (canvasContext !== undefined) return canvasContext;
  canvasContext =
    typeof document === "undefined" ? null : (document.createElement("canvas").getContext("2d") ?? null);
  return canvasContext;
}

/**
 * Fonte e largura da coluna, lidas da folha viva. Sem folha na tela (o painel
 * pode abrir antes do editor montar) devolve `null` e a contagem cai no
 * heurístico.
 */
function sheetMetrics(): Metrics | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector<HTMLElement>(".folium-editor");
  if (!el) return null;

  const cs = getComputedStyle(el);
  // O shorthand `font` é o que o canvas aceita direto; alguns navegadores o
  // devolvem vazio, daí a remontagem a partir das partes.
  const font =
    cs.font || `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} / ${cs.lineHeight} ${cs.fontFamily}`;

  // clientWidth é medida de layout: o zoom da pilha é `transform`, que não a
  // afeta — a largura natural da coluna sai certa em qualquer zoom.
  const padding = parseFloat(cs.paddingLeft || "0") + parseFloat(cs.paddingRight || "0");
  const width = el.clientWidth - padding;

  if (!font.trim() || !(width > 0)) return null;
  return { font, width };
}

/** Quebra gulosa por palavra, como o navegador faz num parágrafo comum. */
function wrapCount(text: string, ctx: CanvasRenderingContext2D, width: number): number {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;

  let lines = 1;
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= width) {
      current = candidate;
      continue;
    }
    // Palavra que não cabe sozinha ocupa mais de uma linha por si.
    lines += 1;
    current = word;
    let overflow = ctx.measureText(current).width;
    while (overflow > width && current.length > 1) {
      lines += 1;
      overflow -= width;
    }
  }
  return lines;
}

/**
 * Número de linhas que `text` ocuparia na coluna da folha. `columnWidth`
 * permite medir numa largura diferente da folha inteira (um bloco recuado, por
 * exemplo); por padrão usa a coluna de texto da folha na tela e, sem folha, a
 * largura útil do A4.
 */
export function measureTextLines(text: string, columnWidth?: number): number {
  const clean = text.trim();
  if (!clean) return 0;

  const ctx = context();
  const metrics = sheetMetrics();
  const width = columnWidth ?? metrics?.width ?? CONTENT_WIDTH_PX;

  if (ctx && metrics) {
    ctx.font = metrics.font;
    return wrapCount(clean, ctx, width);
  }

  // Sem DOM: volta ao heurístico por caracteres, que é o que havia antes.
  return Math.max(1, Math.ceil(clean.length / FALLBACK_CHARS_PER_LINE));
}
