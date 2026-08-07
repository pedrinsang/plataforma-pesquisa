/**
 * Documentos-fixture do banco de ensaio da paginação (`/dev/pagination`).
 *
 * Existem porque os defeitos de paginação são todos de **medição**: só aparecem
 * quando um bloco cai em cima da virada da folha, e reproduzi-los num documento
 * de verdade depende de acertar o texto por tentativa. Aqui o conteúdo é fixo,
 * então a mesma virada acontece toda vez — e uma correção que muda o desenho
 * fica evidente na hora.
 *
 * Cada fixture mira um caso que já quebrou:
 *
 * - `corpo`      parágrafos longos e contínuos — o caso comum de repartir um
 *                parágrafo entre duas folhas, e o do cursor gigante.
 * - `viuva`      parágrafos de 4 linhas em sequência, que é o que faz a regra
 *                de viúva/órfã escolher entre repartir 2/2 e derrubar o
 *                parágrafo inteiro.
 * - `lista`      itens de lista atravessando a virada — o caso em que o vão
 *                errado deixa o marcador numa folha e o texto na outra.
 * - `titulo`     título perto do pé da folha, para o "manter com o próximo".
 */

type Json = Record<string, unknown>;

const p = (text: string, attrs?: Json): Json => ({
  type: "paragraph",
  ...(attrs ? { attrs } : {}),
  content: [{ type: "text", text }],
});

const h = (level: number, text: string): Json => ({
  type: "heading",
  attrs: { level },
  content: [{ type: "text", text }],
});

const LONG =
  "A leptospirose é uma zoonose de distribuição mundial causada por espiroquetas " +
  "patogênicas do gênero Leptospira, cuja manutenção depende de hospedeiros " +
  "reservatórios que eliminam o agente pela urina por períodos prolongados. Em " +
  "cães, a apresentação clínica varia da infecção subclínica à falência renal e " +
  "hepática aguda, o que torna o diagnóstico laboratorial indispensável para a " +
  "conduta terapêutica e para a notificação epidemiológica adequada.";

const MEDIUM =
  "Os achados anatomopatológicos descritos na literatura incluem nefrite " +
  "intersticial, necrose tubular aguda e hepatite com dissociação dos cordões " +
  "hepáticos, com intensidade variável conforme o sorovar envolvido.";

/** Entrada de referência com quatro linhas na coluna padrão — a medida do teste. */
const REFERENCE_LIKE = [
  "SYKES, J. E. et al. Updated ACVIM consensus statement on leptospirosis in dogs. " +
    "Journal of Veterinary Internal Medicine, v. 37, n. 6, p. 1966-1982, 2023. " +
    "DOI 10.1111/jvim.16903. Disponível em: https://doi.org/10.1111/jvim.16903. Acesso em: 4 ago. 2026",
  "TOCHETTO, C. et al. Aspectos anatomopatológicos da leptospirose em cães: 53 casos " +
    "(1965-2011). Pesquisa Veterinária Brasileira, v. 32, n. 5, p. 430-443, 2012. " +
    "DOI 10.1590/s0100-736x2012000500012. Disponível em: " +
    "https://doi.org/10.1590/s0100-736x2012000500012. Acesso em: 4 ago. 2026.",
  "ADLER, B.; MOCTEZUMA, A. P. Leptospira and leptospirosis. Veterinary Microbiology, " +
    "v. 140, n. 3-4, p. 287-296, 2010. DOI 10.1016/j.vetmic.2009.03.012. Disponível em: " +
    "https://doi.org/10.1016/j.vetmic.2009.03.012. Acesso em: 4 ago. 2026.",
];

function repeat(times: number, make: (i: number) => Json): Json[] {
  return Array.from({ length: times }, (_, i) => make(i));
}

function doc(content: Json[]): object {
  return { type: "doc", content };
}

export type FixtureId = "corpo" | "viuva" | "lista" | "titulo";

export const FIXTURES: Array<{ id: FixtureId; label: string; hint: string; content: object }> = [
  {
    id: "corpo",
    label: "Corpo contínuo",
    hint: "Parágrafos longos: reparte parágrafo na virada. Ponha o cursor na virada para ver o caret.",
    content: doc([
      h(1, "Leptospirose canina — ensaio de paginação"),
      ...repeat(9, (i) => p(`${i + 1}. ${LONG}`)),
    ]),
  },
  {
    id: "viuva",
    label: "Viúva e órfã",
    hint: "Entradas de 4 linhas: a quebra deve andar de linha em linha, nunca derrubar a entrada inteira.",
    content: doc([
      h(1, "Referências — ensaio de viúva e órfã"),
      ...repeat(4, () => p(LONG)),
      ...repeat(6, (i) => p(REFERENCE_LIKE[i % REFERENCE_LIKE.length])),
    ]),
  },
  {
    id: "lista",
    label: "Lista na virada",
    hint: "O marcador do item não pode ficar numa folha com o texto na outra.",
    content: doc([
      h(1, "Lista atravessando a virada"),
      ...repeat(5, () => p(LONG)),
      {
        type: "bulletList",
        content: repeat(8, (i) => ({
          type: "listItem",
          content: [p(`Item ${i + 1}. ${MEDIUM}`)],
        })),
      },
      ...repeat(2, () => p(LONG)),
    ]),
  },
  {
    id: "titulo",
    label: "Título no pé da folha",
    hint: "O título não pode terminar a folha sozinho — desce junto com o bloco que abre.",
    content: doc([
      ...repeat(6, () => p(LONG)),
      h(2, "Seção que não pode ficar órfã no pé da página"),
      ...repeat(4, () => p(LONG)),
    ]),
  },
];

export function fixtureById(id: FixtureId) {
  return FIXTURES.find((f) => f.id === id) ?? FIXTURES[0];
}
