// Copia para `public/pdfjs/` o que o pdf.js precisa buscar em tempo de execução:
// o worker, as tabelas CMap (PDFs com codificação CJK), as fontes-padrão do PDF
// (Helvetica, Times… — sem elas os textos saem com fonte substituta), os perfis
// ICC e os módulos wasm dos decodificadores de imagem.
//
// Não vai para o git (`public/pdfjs` está no .gitignore): roda no `predev` e no
// `prebuild`, então os arquivos acompanham sempre a versão instalada do pacote
// em vez de virarem cópias congeladas que envelhecem sem ninguém perceber.

import { cp, mkdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const pkgRoot = path.dirname(require.resolve("pdfjs-dist/package.json"));
const outRoot = path.resolve("public", "pdfjs");

const DIRS = ["cmaps", "standard_fonts", "iccs", "wasm"];
const FILES = ["build/pdf.worker.min.mjs"];

await rm(outRoot, { recursive: true, force: true });
await mkdir(outRoot, { recursive: true });

for (const dir of DIRS) {
  await cp(path.join(pkgRoot, dir), path.join(outRoot, dir), { recursive: true });
}
for (const file of FILES) {
  await cp(path.join(pkgRoot, file), path.join(outRoot, path.basename(file)));
}

console.log(`pdf.js: assets copiados para public/pdfjs (${require("pdfjs-dist/package.json").version})`);
