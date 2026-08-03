import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Cópia do pdf.js feita por scripts/sync-pdfjs-assets.mjs — código de
    // terceiros, minificado, que não é nosso para arrumar.
    "public/pdfjs/**",
  ]),
]);

export default eslintConfig;
