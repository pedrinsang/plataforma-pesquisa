// Métricas da folha (A4) — fonte única de verdade para o JS de medição e para o
// layout inline da folha, para que nunca divirjam. Tudo em 96dpi (padrão CSS):
// 1 polegada = 96px = 2,54cm ⇒ 1cm ≈ 37,795px.
export const PX_PER_CM = 96 / 2.54;

export const PAGE_WIDTH_CM = 21; // A4 retrato
export const PAGE_HEIGHT_CM = 29.7;

export const PAGE_WIDTH_PX = Math.round(PAGE_WIDTH_CM * PX_PER_CM); // ~794
export const PAGE_HEIGHT_PX = Math.round(PAGE_HEIGHT_CM * PX_PER_CM); // ~1123

/** Vão visível entre duas folhas empilhadas (chão escuro aparecendo). */
export const PAGE_GAP_PX = 20;

// ── margens ─────────────────────────────────────────────────────────────────
// As margens deixaram de ser uma constante única porque a norma que rege um
// trabalho acadêmico brasileiro (ABNT NBR 14724:2024) pede margens
// **assimétricas**: 3 cm em cima e à esquerda, 2 cm embaixo e à direita. Com um
// valor só, nenhum documento escrito aqui saía conforme.

/** Margens da folha, em centímetros — a unidade em que um edital as escreve. */
export type PageMargins = { top: number; right: number; bottom: number; left: number };

/** Padrão do editor: folha equilibrada, para quem não segue norma nenhuma. */
export const DEFAULT_MARGINS: PageMargins = { top: 2.5, right: 2.5, bottom: 2.5, left: 2.5 };

/** ABNT NBR 14724:2024, anverso: esquerda e superior 3 cm; direita e inferior 2 cm. */
export const ABNT_MARGINS: PageMargins = { top: 3, right: 2, bottom: 2, left: 3 };

/**
 * Geometria da folha em pixels, derivada das margens. É o que a paginação e o
 * desenho consomem — nenhum dos dois deve voltar a ler uma margem constante,
 * senão a medição e o papel divergem quando o documento troca de margem.
 */
export type PageGeometry = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  contentWidth: number;
  contentHeight: number;
};

export function pageGeometry(margins: PageMargins = DEFAULT_MARGINS): PageGeometry {
  const top = Math.round(margins.top * PX_PER_CM);
  const right = Math.round(margins.right * PX_PER_CM);
  const bottom = Math.round(margins.bottom * PX_PER_CM);
  const left = Math.round(margins.left * PX_PER_CM);
  return {
    top,
    right,
    bottom,
    left,
    contentWidth: PAGE_WIDTH_PX - left - right,
    contentHeight: PAGE_HEIGHT_PX - top - bottom,
  };
}

/** Geometria do padrão do editor — usada onde não há documento por perto. */
export const DEFAULT_GEOMETRY = pageGeometry(DEFAULT_MARGINS);

/**
 * Configuração de página de um documento: margens e entrelinha do corpo.
 * `lineHeight: null` é a entrelinha padrão do editor — documento escrito antes
 * de isto existir abre exatamente como estava, e só quem escolhe um valor tem
 * um valor gravado.
 */
export type PageSetup = { margins: PageMargins; lineHeight: number | null };

/** Folha conforme a ABNT NBR 14724:2024: margens do anverso e entrelinha 1,5. */
export const ABNT_PAGE_SETUP: PageSetup = { margins: ABNT_MARGINS, lineHeight: 1.5 };

/** Largura útil de texto na folha padrão. */
export const CONTENT_WIDTH_PX = DEFAULT_GEOMETRY.contentWidth;

/**
 * Distância do topo de uma folha ao topo da seguinte. O fluxo de texto é
 * contínuo, então "pular de página" = avançar uma passada destas.
 */
export const PAGE_STRIDE_PX = PAGE_HEIGHT_PX + PAGE_GAP_PX;

/** Altura da faixa da régua horizontal (acima da folha, fora do zoom). */
export const RULER_HEIGHT_PX = 24;

// Zoom da folha (estilo Word/Docs).
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 2;
export const ZOOM_STEP = 0.1;
export const ZOOM_DEFAULT = 1;

export function clampZoom(z: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100));
}

/** Posição (px) do topo da folha `page` (base 0) na pilha de folhas. */
export function sheetTop(page: number): number {
  return page * PAGE_STRIDE_PX;
}

/** Altura total da pilha de `count` folhas, já contando os vãos. */
export function stackHeight(count: number): number {
  return Math.max(1, count) * PAGE_STRIDE_PX - PAGE_GAP_PX;
}

/**
 * Em que folha (base 0) cai uma posição `y` do fluxo de texto, medida a partir
 * do topo da área de texto da primeira folha.
 */
export function pageOfFlowY(y: number): number {
  return Math.max(0, Math.floor(y / PAGE_STRIDE_PX));
}

/**
 * Último `y` de fluxo que ainda cabe na folha `page`. `contentHeight` vem da
 * geometria do documento — com margens assimétricas não existe mais uma altura
 * útil única.
 */
export function pageContentBottom(page: number, contentHeight: number): number {
  return page * PAGE_STRIDE_PX + contentHeight;
}
