// Geometria da folha. O risco destes testes é específico: as margens deixaram
// de ser uma constante única (`PAGE_MARGIN_PX`, 2,5 cm nos quatro lados) e
// passaram a vir do documento, para caber a ABNT NBR 14724:2024, que pede
// margens assimétricas. A paginação inteira é medida a partir daí — se a
// geometria padrão mudar um pixel, **todo documento já escrito repagina**.
//
// Por isso o primeiro caso fixa os números antigos à unha.
//
//   npm test

import test from "node:test";
import assert from "node:assert/strict";
import {
  ABNT_MARGINS,
  DEFAULT_MARGINS,
  PAGE_HEIGHT_PX,
  PAGE_STRIDE_PX,
  PAGE_WIDTH_PX,
  pageContentBottom,
  pageGeometry,
} from "../lib/writing/page-metrics.ts";

test("a folha continua sendo A4 a 96 dpi", () => {
  assert.equal(PAGE_WIDTH_PX, 794);
  assert.equal(PAGE_HEIGHT_PX, 1123);
});

test("a geometria padrão reproduz os 2,5 cm de antes, ao pixel", () => {
  const geo = pageGeometry(DEFAULT_MARGINS);
  // 2,5 cm a 96 dpi = 94 px — o valor que estava no código como constante.
  assert.equal(geo.top, 94);
  assert.equal(geo.right, 94);
  assert.equal(geo.bottom, 94);
  assert.equal(geo.left, 94);
  assert.equal(geo.contentWidth, PAGE_WIDTH_PX - 94 * 2);
  assert.equal(geo.contentHeight, PAGE_HEIGHT_PX - 94 * 2);
});

test("sem argumento, a geometria é a padrão", () => {
  assert.deepEqual(pageGeometry(), pageGeometry(DEFAULT_MARGINS));
});

test("as margens da ABNT são assimétricas e sobra menos folha", () => {
  const abnt = pageGeometry(ABNT_MARGINS);
  const padrao = pageGeometry(DEFAULT_MARGINS);

  // 3 cm em cima e à esquerda; 2 cm embaixo e à direita (NBR 14724:2024).
  assert.equal(abnt.top, 113);
  assert.equal(abnt.left, 113);
  assert.equal(abnt.bottom, 76);
  assert.equal(abnt.right, 76);

  // Assimetria de verdade: espelhar a esquerda daria a direita errada.
  assert.notEqual(abnt.left, abnt.right);

  // A coluna fica mais estreita que no padrão — é isso que faz o mesmo texto
  // ocupar mais páginas em ABNT.
  assert.ok(abnt.contentWidth < padrao.contentWidth);

  // Na altura, 3+2 cm e 2,5+2,5 cm somam o mesmo, mas cada margem é arredondada
  // por conta própria (113+76 = 189; 94+94 = 188), então sobra 1 px de
  // diferença. É irrelevante para a paginação e, sobretudo, é **o mesmo** valor
  // usado na medição e no desenho — o que não pode acontecer é os dois lados
  // arredondarem diferente.
  assert.equal(padrao.contentHeight - abnt.contentHeight, 1);
});

test("o fim da área de texto acompanha a altura útil da geometria", () => {
  const { contentHeight } = pageGeometry(DEFAULT_MARGINS);
  assert.equal(pageContentBottom(0, contentHeight), contentHeight);
  assert.equal(pageContentBottom(1, contentHeight), PAGE_STRIDE_PX + contentHeight);
  assert.equal(pageContentBottom(3, contentHeight), PAGE_STRIDE_PX * 3 + contentHeight);
});

test("margem maior encurta a área de texto na mesma medida", () => {
  const folgada = pageGeometry({ top: 4, right: 4, bottom: 4, left: 4 });
  const apertada = pageGeometry({ top: 1, right: 1, bottom: 1, left: 1 });
  assert.ok(folgada.contentHeight < apertada.contentHeight);
  assert.ok(folgada.contentWidth < apertada.contentWidth);
  assert.ok(folgada.contentHeight > 0);
});
