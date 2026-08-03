import type * as PdfJs from "pdfjs-dist";

/**
 * Carregador do pdf.js para o leitor de artigos do editor.
 *
 * Por que renderizar o PDF em vez de deixar o `<iframe>` fazer o trabalho: o
 * visualizador embutido do navegador roda fora do nosso documento, então
 * `getSelection()` não enxerga nada do que o usuário marca ali. Desenhando o
 * PDF nós mesmos (canvas + camada de texto do pdf.js), a seleção vira DOM
 * comum — é isso que permite "selecionar o trecho e citar", e é também de onde
 * sai o número da página que a citação direta precisa.
 *
 * Os arquivos auxiliares (worker, CMaps, fontes-padrão, wasm) são servidos de
 * `/pdfjs`, copiados por `scripts/sync-pdfjs-assets.mjs` no predev/prebuild.
 */

const ASSET_ROOT = "/pdfjs/";

/** Parâmetros de `getDocument` que apontam para os assets copiados. */
export const PDF_ASSET_PARAMS = {
  cMapUrl: `${ASSET_ROOT}cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `${ASSET_ROOT}standard_fonts/`,
  iccUrl: `${ASSET_ROOT}iccs/`,
  wasmUrl: `${ASSET_ROOT}wasm/`,
} as const;

let modulePromise: Promise<typeof PdfJs> | null = null;

/**
 * Importa o pdf.js sob demanda (é ~1 MB — não pode entrar no bundle de quem
 * nunca abre um artigo) e aponta o worker antes de devolver o módulo.
 */
export function loadPdfJs(): Promise<typeof PdfJs> {
  modulePromise ??= import("pdfjs-dist").then((mod) => {
    mod.GlobalWorkerOptions.workerSrc = `${ASSET_ROOT}pdf.worker.min.mjs`;
    return mod;
  });
  return modulePromise;
}

/** URL que devolve os bytes do PDF pela nossa origem (ver o route handler). */
export function rawFileUrl(src: string): string {
  return `${src}${src.includes("?") ? "&" : "?"}raw=1`;
}
