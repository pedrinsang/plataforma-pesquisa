import type { JSONContent } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import {
  formatReferenceSpans,
  parseAuthors,
  type CitationStyle,
  type RefSpan,
} from "@/lib/references/format";
import type { ReferenceRow } from "@/lib/references/types";
import { PX_PER_CM } from "@/lib/writing/page-metrics";

// Montagem da lista de referências que vai para o fim do documento. É o par da
// citação no corpo do texto (`lib/writing/quote.ts`): lá sai a chamada, aqui sai
// a entrada completa. As duas leem a mesma linha da biblioteca e a mesma norma,
// então a lista nunca "descola" do que está escrito no texto.
//
// A lista é **gerada**, não vinculada: sai como parágrafos comuns dentro de um
// nó `bibliography`, editáveis à mão. O vínculo forte fica no botão — refazer a
// lista reescreve o nó no lugar, como o "atualizar campo" de um processador de
// texto. Fosse um nó vivo, a paginação não conseguiria repartir a lista entre
// folhas (ver `SPLITTABLE` no `WritingCanvas`).

/** De onde saem as obras da lista. */
export type BibliographyScope = "cited" | "all";

/** Título da seção, na forma que cada norma pede. */
export const BIBLIOGRAPHY_TITLE: Record<CitationStyle, string> = {
  abnt: "REFERÊNCIAS",
  apa: "Referências",
  vancouver: "Referências",
};

/** O título é seção sem numeração e centralizado na ABNT e na APA. */
export function bibliographyTitleAlign(style: CitationStyle): "center" | "left" {
  return style === "vancouver" ? "left" : "center";
}

/**
 * O título da seção vai em **negrito**: a NBR 6023:2018 pede "REFERÊNCIAS, sem
 * indicativo numérico, em negrito, fonte tamanho 12 e centralizado", e a APA 7
 * também compõe o cabeçalho em negrito. O editor evita bold em títulos por
 * decisão de design, então aqui a marca é aplicada de propósito — é regra da
 * norma, não estilo nosso.
 */
export const BIBLIOGRAPHY_TITLE_BOLD = true;

/**
 * Composição de cada entrada, por norma:
 *
 *   ABNT (NBR 6023) — alinhada à esquerda, entrelinha simples dentro da entrada
 *   e uma linha em branco entre elas;
 *   APA 7 — recuo deslocado ("hanging") de 1,27 cm, entrelinha dupla e nenhum
 *   espaço extra entre entradas;
 *   Vancouver — alinhada, entrelinha simples, entradas coladas.
 */
const LAYOUT: Record<
  CitationStyle,
  { lineHeight: string; spaceAfter: number; hangingCm: number }
> = {
  abnt: { lineHeight: "1", spaceAfter: 12, hangingCm: 0 },
  apa: { lineHeight: "2", spaceAfter: 0, hangingCm: 1.27 },
  vancouver: { lineHeight: "1", spaceAfter: 6, hangingCm: 0 },
};

/**
 * Ids das referências citadas no texto, **na ordem em que aparecem**. Dedup: a
 * mesma obra citada cinco vezes entra uma vez só na lista.
 */
export function collectCitedReferenceIds(doc: PMNode): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  doc.descendants((node) => {
    if (node.type.name !== "citation") return;
    const id = node.attrs.referenceId as string | null;
    if (!id || seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  });
  return ids;
}

function sortKey(ref: ReferenceRow): string {
  const first = parseAuthors(ref.authors)[0];
  return (first?.family || ref.title || "").trim();
}

/**
 * Ordem das entradas. ABNT e APA ordenam pelo sobrenome do primeiro autor;
 * Vancouver, pela ordem em que as obras foram citadas — e o que não foi citado
 * (quando a lista é da biblioteca inteira) vai para o fim, em ordem alfabética.
 *
 * As entradas Vancouver saem **sem número**: a chamada no texto ainda é
 * autor-data (`inTextCitation`), e numerar aqui criaria um número que não
 * corresponde a nada no corpo do documento.
 */
export function sortReferences(
  references: ReferenceRow[],
  style: CitationStyle,
  citedIds: string[] = [],
): ReferenceRow[] {
  const alphabetical = (a: ReferenceRow, b: ReferenceRow) => {
    const byAuthor = sortKey(a).localeCompare(sortKey(b), "pt-BR", { sensitivity: "base" });
    if (byAuthor !== 0) return byAuthor;
    const byYear = (a.year ?? 0) - (b.year ?? 0);
    if (byYear !== 0) return byYear;
    return a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" });
  };

  const list = [...references];
  if (style !== "vancouver") return list.sort(alphabetical);

  const order = new Map(citedIds.map((id, index) => [id, index]));
  return list.sort((a, b) => {
    const ia = order.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const ib = order.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    if (ia !== ib) return ia - ib;
    return alphabetical(a, b);
  });
}

/**
 * Os trechos da referência viram nós de texto com as marcas do editor. É aqui
 * que o destaque tipográfico da norma vira negrito/itálico de verdade no
 * documento — a 6023 exige destaque no título (do livro) ou no periódico (do
 * artigo), e a APA exige itálico. Sem isto a lista sai visualmente chapada e a
 * banca cobra.
 */
function spansToContent(spans: RefSpan[]): JSONContent[] {
  return spans.map((span) => {
    const marks: JSONContent["marks"] = [];
    if (span.bold) marks.push({ type: "bold" });
    if (span.italic) marks.push({ type: "italic" });
    return { type: "text", text: span.text, ...(marks.length ? { marks } : {}) };
  });
}

function entryParagraph(ref: ReferenceRow, style: CitationStyle): JSONContent {
  const layout = LAYOUT[style];
  const hanging = Math.round(layout.hangingCm * PX_PER_CM);
  return {
    type: "paragraph",
    attrs: {
      textAlign: "left",
      lineHeight: layout.lineHeight,
      spaceAfter: layout.spaceAfter,
      // Recuo deslocado: a entrada inteira recuada e a primeira linha de volta
      // à margem — é o desenho que a APA pede.
      indentLeft: hanging,
      firstLine: -hanging,
    },
    content: spansToContent(formatReferenceSpans(ref, style)),
  };
}

export type BuiltBibliography = {
  /** Parágrafos que entram no nó `bibliography`. Vazio quando não há obras. */
  entries: JSONContent[];
  /** As obras que entraram, já na ordem final. */
  references: ReferenceRow[];
};

/**
 * Monta a lista: escolhe as obras conforme o escopo, ordena pela norma e
 * formata cada entrada com `formatReference`.
 */
export function buildBibliography({
  references,
  citedIds,
  scope,
  style,
}: {
  references: ReferenceRow[];
  citedIds: string[];
  scope: BibliographyScope;
  style: CitationStyle;
}): BuiltBibliography {
  const byId = new Map(references.map((ref) => [ref.id, ref]));
  const selected =
    scope === "cited"
      ? citedIds.map((id) => byId.get(id)).filter((ref): ref is ReferenceRow => Boolean(ref))
      : references;

  const sorted = sortReferences(selected, style, citedIds);
  return { entries: sorted.map((ref) => entryParagraph(ref, style)), references: sorted };
}
