// Conferência da regra de viúva e órfã da paginação (`lib/writing/pagination-rules.ts`).
//
// Existe porque o defeito que ela corrige era invisível fora do olho: a regra só
// roda no meio de uma medição de folha, e o sintoma ("de vez em quando o
// parágrafo inteiro salta de página") depende de o texto cair no lugar exato.
// Como decisão, porém, é aritmética — e aritmética se testa.
//
// Roda no test runner embutido do Node (`npm test`), sem framework, como os
// outros testes do projeto. O import do `.ts` funciona pelo type stripping
// nativo do Node ≥ 22.18.

import test from "node:test";
import assert from "node:assert/strict";
import { breakAtLine, MIN_LINES } from "../lib/writing/pagination-rules.ts";

/** Parágrafo isolado de `n` linhas, com a linha `overflow` transbordando. */
const para = (n, overflow) => breakAtLine({ paraStart: 0, paraEnd: n, overflow });

test("reparte quando sobram linhas suficientes dos dois lados", () => {
  // 5 linhas, transborda na 3ª: corta ali mesmo — 3 em cima, 2 embaixo.
  assert.equal(para(5, 3), 3);
});

test("sobe a quebra em vez de derrubar o parágrafo inteiro", () => {
  // O caso do defeito: 4 linhas com espaço para 3. Cortar na linha 3 deixaria
  // 1 linha órfã embaixo, então a quebra sobe para a linha 2 — 2 em cima e 2
  // embaixo. Antes disto a função devolvia 0 e as quatro linhas saltavam.
  assert.equal(para(4, 3), 2);
  // Mesma coisa mais abaixo no bloco: 6 linhas com espaço para 5.
  assert.equal(para(6, 5), 4);
});

test("derruba o parágrafo quando não sobram linhas em cima", () => {
  // 4 linhas com espaço para 1: cortar na linha 1 deixaria uma órfã em cima.
  assert.equal(para(4, 1), 0);
});

test("parágrafo curto demais para repartir desce inteiro", () => {
  // Com MIN_LINES = 2 é preciso ter 4 linhas para haver corte legítimo.
  assert.equal(para(3, 2), 0);
  assert.equal(para(2, 1), 0);
  assert.equal(para(1, 0), 0);
});

test("conta as linhas do parágrafo, não as do bloco", () => {
  // Numa lista, o bloco tem várias linhas mas cada item conta por si: o
  // parágrafo vai da linha 2 à 6 e a virada cai na 5.
  assert.equal(breakAtLine({ paraStart: 2, paraEnd: 6, overflow: 5 }), 4);
  // E, se não couber, desce só até o começo **do item**, não do bloco.
  assert.equal(breakAtLine({ paraStart: 2, paraEnd: 6, overflow: 3 }), 2);
});

// ── controle de viúvas e órfãs desligado (`minLines: 1`) ────────────────────
// É o padrão do editor: o rigor de duas linhas de cada lado tem o efeito
// colateral de fazer um parágrafo curto descer inteiro, e três linhas saltando
// de uma vez incomoda mais, ao escrever, do que uma linha solta no pé da folha.

const solto = (n, overflow) =>
  breakAtLine({ paraStart: 0, paraEnd: n, overflow, minLines: 1 });

test("desligado, a quebra cai exatamente na linha que transbordou", () => {
  assert.equal(solto(5, 3), 3);
  assert.equal(solto(5, 4), 4);
  // O caso que com o controle ligado derrubava o parágrafo inteiro:
  assert.equal(solto(4, 1), 1);
  assert.equal(solto(3, 2), 2);
});

test("desligado, um parágrafo de 3 linhas se reparte em vez de saltar", () => {
  // É este o "às vezes manda 3 linhas": ligado, `para(3, …)` só sabe devolver 0.
  assert.equal(para(3, 1), 0);
  assert.equal(solto(3, 1), 1);
});

test("desligado, ainda não há quebra antes da primeira linha", () => {
  // Cortar na primeira linha não é repartir: é o parágrafo inteiro descendo.
  assert.equal(solto(5, 0), 0);
  assert.equal(solto(1, 0), 0);
});

test("nunca devolve uma linha fora do parágrafo", () => {
  for (let n = 1; n <= 12; n += 1) {
    for (let overflow = 0; overflow < n; overflow += 1) {
      const at = para(n, overflow);
      assert.ok(at >= 0 && at <= overflow, `at=${at} fora de [0, ${overflow}] em n=${n}`);
      // Ou é o começo do parágrafo (desce inteiro), ou respeita as duas bordas.
      const ok = at === 0 || (at >= MIN_LINES && n - at >= MIN_LINES);
      assert.ok(ok, `corte inválido at=${at} para parágrafo de ${n} linhas`);
    }
  }
});
