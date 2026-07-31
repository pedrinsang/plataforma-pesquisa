// Métricas da folha (A4) — fonte única de verdade para o JS de medição e para o
// layout inline da folha, para que nunca divirjam. Tudo em 96dpi (padrão CSS):
// 1 polegada = 96px = 2,54cm ⇒ 1cm ≈ 37,795px.
export const PX_PER_CM = 96 / 2.54;

export const PAGE_WIDTH_CM = 21; // A4 retrato
export const PAGE_HEIGHT_CM = 29.7;
export const PAGE_MARGIN_CM = 2.5; // margem interna (onde o texto pode ocupar)

export const PAGE_WIDTH_PX = Math.round(PAGE_WIDTH_CM * PX_PER_CM); // ~794
export const PAGE_HEIGHT_PX = Math.round(PAGE_HEIGHT_CM * PX_PER_CM); // ~1123
export const PAGE_MARGIN_PX = Math.round(PAGE_MARGIN_CM * PX_PER_CM); // ~94

/** Vão visível entre duas folhas empilhadas (chão escuro aparecendo). */
export const PAGE_GAP_PX = 20;

/** Altura útil de texto dentro de uma folha (entre as margens). */
export const CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - PAGE_MARGIN_PX * 2;

/** Largura útil de texto dentro de uma folha. */
export const CONTENT_WIDTH_PX = PAGE_WIDTH_PX - PAGE_MARGIN_PX * 2;

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

/** Último `y` de fluxo que ainda cabe na folha `page`. */
export function pageContentBottom(page: number): number {
  return page * PAGE_STRIDE_PX + CONTENT_HEIGHT_PX;
}
