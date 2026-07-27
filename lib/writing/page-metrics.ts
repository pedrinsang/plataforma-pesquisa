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

// Zoom da folha (estilo Word/Docs).
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 2;
export const ZOOM_STEP = 0.1;
export const ZOOM_DEFAULT = 1;

export function clampZoom(z: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100));
}

/**
 * Quantas folhas A4 o conteúdo ocupa. `contentHeightPx` é a altura só do
 * conteúdo (sem as margens da folha); somamos a margem de topo e de rodapé antes
 * de dividir pela altura da página.
 */
export function pageCountFor(contentHeightPx: number): number {
  const used = contentHeightPx + PAGE_MARGIN_PX * 2;
  return Math.max(1, Math.ceil(used / PAGE_HEIGHT_PX));
}
