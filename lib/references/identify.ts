// Descobre O QUE o usuário colou. Tudo aqui é determinístico (regex sobre a
// string) — nenhuma IA envolvida: um DOI, um PMID, um arXiv ID e um ISBN têm
// formatos fixos e reconhecíveis, e é isso que abre a porta para as APIs
// bibliográficas gratuitas fazerem o resto.

export type Identifier =
  | { kind: "doi"; value: string }
  | { kind: "pmid"; value: string }
  | { kind: "arxiv"; value: string }
  | { kind: "isbn"; value: string }
  | { kind: "url"; value: string }
  | { kind: "text"; value: string };

// Um DOI é "10.<registrante>/<sufixo>". O sufixo aceita quase tudo, então
// cortamos pontuação final que costuma vir colada da frase/URL.
const DOI_RE = /\b(10\.\d{4,9}\/[-._;()/:a-z0-9<>[\]+]+)/i;

export function extractDoi(input: string): string | null {
  const m = input.match(DOI_RE);
  if (!m) return null;
  return normalizeDoi(m[1]);
}

export function normalizeDoi(raw: string): string {
  return raw
    .trim()
    .replace(/^doi:\s*/i, "")
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/[.,;)\]]+$/, "")
    .toLowerCase();
}

const ARXIV_RE = /arxiv[:/ ]\s*(\d{4}\.\d{4,5}(v\d+)?|[a-z-]+(\.[A-Z]{2})?\/\d{7}(v\d+)?)/i;
const PMID_RE = /\bpmid:?\s*(\d{6,9})\b/i;

function digitsOnly(s: string): string {
  return s.replace(/[^0-9xX]/g, "");
}

function isValidIsbn(s: string): boolean {
  const v = digitsOnly(s);
  return v.length === 10 || v.length === 13;
}

/**
 * Classifica a entrada do usuário. A ordem importa: um link do doi.org ou de
 * uma revista costuma conter o DOI, que é a melhor chave possível.
 */
export function identify(rawInput: string): Identifier {
  const input = rawInput.trim();
  if (!input) return { kind: "text", value: "" };

  const doi = extractDoi(input);
  if (doi) return { kind: "doi", value: doi };

  const arxiv = input.match(ARXIV_RE);
  if (arxiv) return { kind: "arxiv", value: arxiv[1] };

  const pmidTagged = input.match(PMID_RE);
  if (pmidTagged) return { kind: "pmid", value: pmidTagged[1] };

  if (/^https?:\/\//i.test(input)) {
    // URLs do PubMed e do arXiv carregam o identificador no caminho.
    const pubmed = input.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d{6,9})/i);
    if (pubmed) return { kind: "pmid", value: pubmed[1] };
    const arxivUrl = input.match(/arxiv\.org\/(?:abs|pdf)\/([^\s?#]+?)(?:\.pdf)?$/i);
    if (arxivUrl) return { kind: "arxiv", value: arxivUrl[1] };
    return { kind: "url", value: input };
  }

  // "isbn 978-…" ou uma sequência solta de 10/13 dígitos
  const isbnTagged = input.match(/\bisbn[:\s-]*([\d\s-]{10,20}[\dxX])/i);
  if (isbnTagged && isValidIsbn(isbnTagged[1])) {
    return { kind: "isbn", value: digitsOnly(isbnTagged[1]) };
  }
  if (/^[\d\s-]{10,20}[\dxX]?$/.test(input) && isValidIsbn(input)) {
    return { kind: "isbn", value: digitsOnly(input) };
  }

  if (/^\d{6,9}$/.test(input)) return { kind: "pmid", value: input };

  return { kind: "text", value: input };
}
