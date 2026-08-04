// Conferência do formatador de referências contra os **exemplos literais** dos
// manuais de normalização (ver `docs/normas-abnt.md`). Cada caso aqui é uma
// referência copiada de um guia de biblioteca universitária: se a saída diverge
// de um caractere, é regressão.
//
// Roda no test runner embutido do Node (`node --test`), sem framework: o
// projeto não tem suíte de testes, e a alternativa era não conferir nada.
// O import do `.ts` funciona pelo type stripping nativo do Node ≥ 22.18.
//
//   npm test
//
// Fonte dos exemplos:
//   UFC, Guia de normalização para elaboração de referências (2020) — NBR 6023:2018
//   UFV, Normalização de trabalhos acadêmicos (2025) — NBR 10520:2023

import test from "node:test";
import assert from "node:assert/strict";
import {
  formatReference,
  formatReferenceSpans,
  inTextCitation,
  narrativeCitation,
} from "../lib/references/format.ts";

/** Referência vazia — cada caso preenche só o que o modelo dele usa. */
function ref(fields) {
  return {
    id: "test",
    ref_type: "article",
    title: "",
    authors: null,
    year: null,
    doi: null,
    url: null,
    container_title: null,
    publisher: null,
    volume: null,
    issue: null,
    pages: null,
    edition: null,
    place: null,
    institution: null,
    degree: null,
    program: null,
    issued_month: null,
    year_text: null,
    event_number: null,
    abstract: null,
    isbn: null,
    issn: null,
    pmid: null,
    arxiv_id: null,
    accessed_at: null,
    citation_key: null,
    tags: [],
    notes: null,
    is_essential: false,
    file_path: null,
    file_name: null,
    file_size: null,
    file_mime: null,
    created_at: "2026-01-01",
    ...fields,
  };
}

// ── NBR 6023:2018 — modelos de referência ───────────────────────────────────

test("livro com três autores (UFC, p. 14)", () => {
  const r = ref({
    ref_type: "book",
    authors: "Libâneo, José Carlos; Oliveira, João Ferreira de; Toschi, Mirza Seabra",
    title: "Educação escolar: políticas, estrutura e organização",
    place: "São Paulo",
    publisher: "Cortez",
    year: 2012,
  });
  assert.equal(
    formatReference(r, "abnt"),
    "LIBÂNEO, J. C.; OLIVEIRA, J. F. de; TOSCHI, M. S. Educação escolar: políticas, estrutura e organização. São Paulo: Cortez, 2012.",
  );
  // O destaque é do título, e o subtítulo fica fora dele.
  const spans = formatReferenceSpans(r, "abnt");
  assert.equal(spans.find((s) => s.bold)?.text, "Educação escolar");
});

test("mais de três autores viram et al., sem ponto duplicado (UFC, p. 14)", () => {
  assert.equal(
    formatReference(
      ref({
        ref_type: "book",
        authors: "Farias, I. M. S.; Sales, J. C. B.; Braga, M. M. S. C.; França, M. S. L. M.",
        title: "Didática e docência",
        edition: "4. ed.",
        place: "Brasília, DF",
        publisher: "Liber Livro",
        year: 2014,
      }),
      "abnt",
    ),
    "FARIAS, I. M. S. et al. Didática e docência. 4. ed. Brasília, DF: Liber Livro, 2014.",
  );
});

test("artigo de periódico destaca o periódico, não o artigo (UFC, p. 33)", () => {
  const r = ref({
    ref_type: "article",
    authors: "Hoffmann, C.",
    title: "A autoridade e a questão do pai",
    container_title: "Ágora: estudos em teoria psicanalítica",
    place: "Rio de Janeiro",
    volume: "9",
    issue: "2",
    pages: "169-176",
    issued_month: "jul./dez.",
    year: 2006,
  });
  assert.equal(
    formatReference(r, "abnt"),
    "HOFFMANN, C. A autoridade e a questão do pai. Ágora: estudos em teoria psicanalítica, Rio de Janeiro, v. 9, n. 2, p. 169-176, jul./dez. 2006.",
  );
  assert.equal(formatReferenceSpans(r, "abnt").find((s) => s.bold)?.text, "Ágora");
});

test("trabalho acadêmico: grau, curso e vinculação (UFC, p. 20)", () => {
  assert.equal(
    formatReference(
      ref({
        ref_type: "thesis",
        authors: "Benegas, M.",
        title: "Três ensaios em análise econômica",
        year: 2006,
        degree: "Doutorado",
        program: "Economia",
        institution:
          "Faculdade de Economia, Administração, Atuária e Contabilidade, Universidade Federal do Ceará",
        place: "Fortaleza",
      }),
      "abnt",
    ),
    "BENEGAS, M. Três ensaios em análise econômica. 2006. Tese (Doutorado em Economia) – Faculdade de Economia, Administração, Atuária e Contabilidade, Universidade Federal do Ceará, Fortaleza, 2006.",
  );
});

test("mestrado vira Dissertação, não Tese", () => {
  const saida = formatReference(
    ref({
      ref_type: "thesis",
      authors: "Mayorga, Rodrigo de Oliveira",
      title: "Análise de transmissão de preços do mercado de melão do Brasil",
      year: 2006,
      degree: "Mestrado",
      program: "Economia Rural",
      institution: "Universidade Federal do Ceará",
      place: "Fortaleza",
    }),
    "abnt",
  );
  assert.match(saida, /Dissertação \(Mestrado em Economia Rural\)/);
});

test("capítulo de livro entra por In: (UFC, p. 18)", () => {
  assert.equal(
    formatReference(
      ref({
        ref_type: "chapter",
        authors: "Muller, Geraldo",
        title:
          "O macroeixo São Paulo-Buenos Aires e a gestão territorializada de governos subnacionais",
        container_title: "Redescobrindo o Brasil: 500 anos depois",
        place: "Rio de Janeiro",
        publisher: "Bertrand Brasil: FAPERJ",
        year: 1999,
        pages: "41-55",
      }),
      "abnt",
    ),
    "MULLER, G. O macroeixo São Paulo-Buenos Aires e a gestão territorializada de governos subnacionais. In: Redescobrindo o Brasil: 500 anos depois. Rio de Janeiro: Bertrand Brasil: FAPERJ, 1999. p. 41-55.",
  );
});

test("sem local e sem editora usa as formas latinas (UFC, p. 96)", () => {
  assert.equal(
    formatReference(
      ref({
        ref_type: "book",
        authors: "Righetto, Antonio Marozzi",
        title: "Implantação de bacias experimentais no semi-árido",
        year: 2004,
      }),
      "abnt",
    ),
    "RIGHETTO, A. M. Implantação de bacias experimentais no semi-árido. [S. l.: s. n.], 2004.",
  );
});

test("ano desconhecido sai entre colchetes, nunca [s.d.] (UFC, p. 97)", () => {
  assert.equal(
    formatReference(
      ref({
        ref_type: "book",
        title: "Noções de direito para jornalistas: guia prático",
        place: "São Paulo",
        publisher: "Justiça Federal",
        year_text: "200-",
      }),
      "abnt",
    ),
    "Noções de direito para jornalistas: guia prático. São Paulo: Justiça Federal, [200-].",
  );
});

test("evento entra pelo nome em caixa alta e Anais em destaque (UFC, p. 37)", () => {
  const saida = formatReference(
    ref({
      ref_type: "conference",
      title: "Um trabalho qualquer",
      container_title: "Congresso de Ecologia do Brasil",
      event_number: "6",
      year: 2003,
      place: "Fortaleza",
      publisher: "UFC",
    }),
    "abnt",
  );
  assert.match(saida, /In: CONGRESSO DE ECOLOGIA DO BRASIL, 6\., 2003, Fortaleza\. Anais \[\.\.\.\]\./);
});

// ── NBR 10520:2023 — chamada no texto ───────────────────────────────────────

test("a chamada não vai mais em caixa alta (10520:2023)", () => {
  const r = ref({ authors: "Silva, João", title: "Qualquer", year: 2019 });
  assert.equal(inTextCitation(r, "abnt", "35"), "(Silva, 2019, p. 35)");
});

test("dois e três autores saem separados por ponto e vírgula", () => {
  assert.equal(
    inTextCitation(ref({ authors: "Larreta, E.; Giucci, G.", title: "x", year: 2007 }), "abnt", "17"),
    "(Larreta; Giucci, 2007, p. 17)",
  );
  assert.equal(
    inTextCitation(
      ref({ authors: "Clarac, A.; Bonnin, B.; Réthoré, C.", title: "x", year: 1985 }),
      "abnt",
      "72",
    ),
    "(Clarac; Bonnin; Réthoré, 1985, p. 72)",
  );
});

test("quatro ou mais autores viram et al. (UFV, p. 116)", () => {
  assert.equal(
    inTextCitation(
      ref({ authors: "Maciel, A.; Brum, B.; Del Bianco, C.; Costa, D.", title: "x", year: 2019 }),
      "abnt",
      "163",
    ),
    "(Maciel et al., 2019, p. 163)",
  );
});

test("sigla de pessoa jurídica permanece em caixa alta", () => {
  assert.equal(
    inTextCitation(ref({ authors: "IBGE", title: "x", year: 2011 }), "abnt", "3"),
    "(IBGE, 2011, p. 3)",
  );
});

test("chamada narrativa tira o autor do parêntese (UFV, p. 123)", () => {
  assert.equal(
    narrativeCitation(ref({ authors: "Barbour, R.", title: "x", year: 1971 }), "abnt", "35"),
    "Barbour (1971, p. 35)",
  );
});

test("citação indireta dispensa a página", () => {
  assert.equal(
    inTextCitation(ref({ authors: "Silva, João", title: "x", year: 2019 }), "abnt"),
    "(Silva, 2019)",
  );
});
