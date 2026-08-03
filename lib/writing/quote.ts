import type { JSONContent } from "@tiptap/core";
import { inTextCitation, type CitationStyle } from "@/lib/references/format";
import type { ReferenceRow } from "@/lib/references/types";
import { PX_PER_CM } from "@/lib/writing/page-metrics";

// Montagem da citação que entra no documento quando o usuário marca um trecho
// do artigo no leitor ao lado. As normas separam dois casos, e a diferença é
// visual, não decorativa — por isso ela é aplicada aqui e não deixada a cargo
// de quem escreve:
//
//   citação curta  → entre aspas, no meio do parágrafo, no corpo normal;
//   citação longa  → parágrafo próprio, recuado, em corpo menor e sem aspas.
//
// O corte entre uma e outra muda conforme a norma (ABNT conta linhas; APA conta
// palavras), então cada uma tem seu teste.

/** Recuo do bloco de citação longa, por norma. */
const BLOCK_INDENT_CM: Record<CitationStyle, number> = {
  abnt: 4, // NBR 10520: recuo de 4 cm da margem esquerda
  apa: 1.27, // APA 7: meia polegada
  vancouver: 1.27,
};

/** Corpo do bloco de citação longa (a ABNT pede um ponto abaixo do texto). */
const BLOCK_FONT_SIZE: Record<CitationStyle, string | null> = {
  abnt: "10pt",
  apa: null,
  vancouver: null,
};

/**
 * ABNT mede a citação em **linhas** (mais de 3 vira bloco). Como o número de
 * linhas depende do corpo e da largura da coluna, aproximamos pelo tamanho do
 * trecho: a área de texto da folha comporta cerca de 90 caracteres por linha.
 */
const ABNT_BLOCK_CHARS = 3 * 90;

/** APA 7 e Vancouver medem em palavras: a partir de 40, vira bloco. */
const WORD_BLOCK_COUNT = 40;

/**
 * Texto vindo do PDF chega quebrado em linhas, hifenizado na quebra e cheio de
 * espaços duplos — colar isso cru no documento produz um parágrafo sujo.
 */
export function cleanExcerpt(raw: string): string {
  return raw
    // hífen no fim da linha: junta a palavra que o PDF partiu
    .replace(/(\p{L})[-‐‑]\s*\n\s*(\p{L})/gu, "$1$2")
    // demais quebras de linha viram espaço
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s+/g, " ")
    // aspas que já vieram no trecho seriam duplicadas pelas nossas
    .replace(/^["“”'']+|["“”'']+$/g, "")
    .trim();
}

function isBlockQuote(text: string, style: CitationStyle): boolean {
  if (style === "abnt") return text.length > ABNT_BLOCK_CHARS;
  return text.split(/\s+/).length >= WORD_BLOCK_COUNT;
}

function citationNode(
  reference: ReferenceRow,
  style: CitationStyle,
  locator: string | null,
  marks?: JSONContent["marks"],
): JSONContent {
  return {
    type: "citation",
    attrs: {
      referenceId: reference.id,
      citationKey: reference.citation_key,
      locator,
      style,
      label: inTextCitation(reference, style, locator),
    },
    ...(marks ? { marks } : {}),
  };
}

export type CitationInsert = {
  content: JSONContent[];
  /** `true` quando a inserção é um bloco próprio (parágrafo recuado). */
  block: boolean;
};

/**
 * Conteúdo TipTap da citação a inserir. Sem `excerpt` sai só a chamada
 * — `(SILVA, 2020)` —, que é a citação indireta; com `excerpt`, sai a
 * transcrição literal na forma que a norma pede para aquele tamanho.
 */
export function buildCitationInsert({
  reference,
  style,
  locator = null,
  excerpt = null,
}: {
  reference: ReferenceRow;
  style: CitationStyle;
  locator?: string | null;
  excerpt?: string | null;
}): CitationInsert {
  const text = excerpt ? cleanExcerpt(excerpt) : "";

  if (!text) {
    return { content: [citationNode(reference, style, locator)], block: false };
  }

  if (!isBlockQuote(text, style)) {
    return {
      content: [
        { type: "text", text: `“${text}” ` },
        citationNode(reference, style, locator),
      ],
      block: false,
    };
  }

  const size = BLOCK_FONT_SIZE[style];
  const marks: JSONContent["marks"] | undefined = size
    ? [{ type: "textStyle", attrs: { fontSize: size } }]
    : undefined;

  return {
    content: [
      {
        type: "paragraph",
        attrs: {
          indentLeft: Math.round(BLOCK_INDENT_CM[style] * PX_PER_CM),
          // Citação longa é composta em entrelinha simples nas três normas.
          lineHeight: "1",
        },
        content: [
          { type: "text", text: `${text} `, ...(marks ? { marks } : {}) },
          citationNode(reference, style, locator, marks),
        ],
      },
      // Devolve o cursor ao corpo normal: sem isto, o que for digitado a
      // seguir continua recuado e em corpo menor.
      { type: "paragraph" },
    ],
    block: true,
  };
}
