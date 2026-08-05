import { randomBytes } from "node:crypto";

// Alfabeto sem caracteres ambíguos (I/1/L, O/0) — o código é feito para ser
// lido em voz alta, copiado de um bilhete ou digitado à mão.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 12; // 12 × log2(31) ≈ 59 bits de entropia

/**
 * Código de convite aleatório no formato `XXXX-XXXX-XXXX`.
 * Usa o CSPRNG do Node (não `Math.random`): o código é a credencial que dá
 * acesso ao projeto. A rejeição de bytes fora do múltiplo mantém a distribuição
 * uniforme sobre o alfabeto.
 *
 * Só servidor — os helpers puros (formatar/normalizar/link) vivem em
 * `./format`, que o cliente também importa.
 */
export function generateInviteCode(): string {
  const limit = Math.floor(256 / ALPHABET.length) * ALPHABET.length;
  let out = "";

  while (out.length < CODE_LENGTH) {
    for (const byte of randomBytes(CODE_LENGTH)) {
      if (byte >= limit) continue;
      out += ALPHABET[byte % ALPHABET.length];
      if (out.length === CODE_LENGTH) break;
    }
  }

  return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}`;
}
