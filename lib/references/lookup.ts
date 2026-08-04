import type { Json, ReferenceType } from "@/lib/types/database";
import { emptyDraft, type ReferenceDraft } from "./types";
import { identify, normalizeDoi, type Identifier } from "./identify";
import { abntMonth } from "./format";
import { safeGet, UnsafeUrlError } from "./safe-fetch";

// Importação de metadados SEM IA. Todo dado vem de APIs bibliográficas
// públicas e gratuitas (sem chave, sem cota paga):
//   • Crossref   — DOI e busca por título (a base de quase todo artigo)
//   • PubMed     — PMID (E-utilities do NCBI)
//   • arXiv      — preprints
//   • OpenLibrary— ISBN (livros)
//   • meta tags  — qualquer página: Highwire (citation_*), Dublin Core, OG
// O que essas APIs devolvem é metadado estruturado; não há nada a "adivinhar",
// então um modelo de linguagem não acrescentaria nada aqui.

// O Crossref pede um contato no "polite pool" — em troca dá limites melhores.
const CONTACT = process.env.CROSSREF_CONTACT_EMAIL ?? "contato@folium.app";

// ── util ────────────────────────────────────────────────────────────────────

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
};

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

function clean(value: string | null | undefined): string | null {
  if (!value) return null;
  const s = decodeEntities(String(value))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s || null;
}

// O resumo do Crossref vem em JATS: <jats:title>Abstract</jats:title><jats:p>…
// Depois de tirar as tags sobra o rótulo "Abstract"/"Resumo" na frente.
function stripJats(value: string | null | undefined): string | null {
  const plain = clean(value);
  if (!plain) return null;
  return clean(plain.replace(/^(abstract|resumo|summary)\b[:.\s]*/i, ""));
}

function firstYear(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = String(value).match(/\b(1[5-9]\d{2}|20\d{2}|21\d{2})\b/);
  return m ? Number(m[1]) : null;
}

// ── Crossref ────────────────────────────────────────────────────────────────

type CrossrefAuthor = { given?: string; family?: string; name?: string };
type CrossrefWork = {
  DOI?: string;
  URL?: string;
  type?: string;
  title?: string[];
  "container-title"?: string[];
  "short-container-title"?: string[];
  author?: CrossrefAuthor[];
  editor?: CrossrefAuthor[];
  issued?: { "date-parts"?: number[][] };
  published?: { "date-parts"?: number[][] };
  publisher?: string;
  volume?: string;
  issue?: string;
  page?: string;
  edition?: string;
  abstract?: string;
  ISSN?: string[];
  ISBN?: string[];
  subtype?: string;
  "publisher-location"?: string;
  institution?: { name?: string }[];
  event?: { name?: string; location?: string; number?: string };
};

const CROSSREF_TYPE: Record<string, ReferenceType> = {
  "journal-article": "article",
  "posted-content": "preprint",
  "proceedings-article": "conference",
  "book-chapter": "chapter",
  "book-section": "chapter",
  "book-part": "chapter",
  book: "book",
  monograph: "book",
  "edited-book": "book",
  "reference-book": "book",
  dissertation: "thesis",
  report: "report",
  "report-component": "report",
  dataset: "dataset",
  component: "other",
  "peer-review": "other",
};

export function formatAuthors(list: CrossrefAuthor[] | undefined): string | null {
  if (!list?.length) return null;
  const names = list
    .map((a) => {
      if (a.family) return a.given ? `${a.family}, ${a.given}` : a.family;
      return a.name ?? null;
    })
    .filter((n): n is string => Boolean(n));
  return names.length ? names.join("; ") : null;
}

function dateParts(work: CrossrefWork): number[] | undefined {
  return work.issued?.["date-parts"]?.[0] ?? work.published?.["date-parts"]?.[0];
}

function yearFromParts(work: CrossrefWork): number | null {
  const y = dateParts(work)?.[0];
  return typeof y === "number" && y > 1000 ? y : null;
}

/**
 * Mês do fascículo já na abreviatura da 6023 ("jul.", "maio"). O Crossref
 * devolve o mês como número em `date-parts`; a ABNT quer a abreviatura em
 * português, e é ela que fecha a referência de artigo de periódico.
 */
function monthFromParts(work: CrossrefWork): string | null {
  const m = dateParts(work)?.[1];
  return typeof m === "number" ? abntMonth(m) : null;
}

function crossrefToDraft(work: CrossrefWork): ReferenceDraft {
  const doi = work.DOI ? normalizeDoi(work.DOI) : null;
  return {
    ...emptyDraft(),
    refType: CROSSREF_TYPE[work.type ?? ""] ?? "article",
    title: clean(work.title?.[0]) ?? "",
    authors: formatAuthors(work.author) ?? formatAuthors(work.editor),
    year: yearFromParts(work),
    doi,
    url: work.URL ?? (doi ? `https://doi.org/${doi}` : null),
    containerTitle: clean(work["container-title"]?.[0]) ?? clean(work["short-container-title"]?.[0]),
    publisher: clean(work.publisher),
    volume: clean(work.volume),
    issue: clean(work.issue),
    pages: clean(work.page),
    edition: clean(work.edition),
    // Elementos essenciais da ABNT que o Crossref traz mas ninguém usava:
    // local de publicação (ou o do evento) e o mês do fascículo.
    place: clean(work["publisher-location"]) ?? clean(work.event?.location),
    issuedMonth: monthFromParts(work),
    institution: clean(work.institution?.[0]?.name),
    eventNumber: clean(work.event?.number),
    abstract: stripJats(work.abstract),
    issn: work.ISSN?.[0] ?? null,
    isbn: work.ISBN?.[0] ?? null,
    csl: work as unknown as Json,
  };
}

async function fromCrossref(doi: string): Promise<ReferenceDraft | null> {
  const res = await safeGet(
    `https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=${encodeURIComponent(CONTACT)}`,
    { accept: "application/json" },
  );
  if (!res) return null;
  try {
    const json = JSON.parse(res.body) as { message?: CrossrefWork };
    if (!json.message?.title?.length && !json.message?.DOI) return null;
    return crossrefToDraft(json.message);
  } catch {
    return null;
  }
}

/** Busca bibliográfica no Crossref (título, autor, revista) — o plano B quando
 *  o usuário não tem DOI nem link, só o nome do artigo. */
export async function searchCrossref(query: string, rows = 8): Promise<ReferenceDraft[]> {
  const q = query.trim();
  if (q.length < 4) return [];
  const url =
    `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(q)}` +
    `&rows=${rows}&select=DOI,title,author,issued,container-title,type,volume,issue,page,publisher,publisher-location,event,URL,ISSN,abstract` +
    `&mailto=${encodeURIComponent(CONTACT)}`;
  const res = await safeGet(url, { accept: "application/json" });
  if (!res) return [];
  try {
    const json = JSON.parse(res.body) as { message?: { items?: CrossrefWork[] } };
    return (json.message?.items ?? [])
      .map(crossrefToDraft)
      .filter((d) => d.title.length > 0);
  } catch {
    return [];
  }
}

// ── PubMed (NCBI E-utilities) ───────────────────────────────────────────────

type PubmedSummary = {
  title?: string;
  authors?: { name?: string }[];
  source?: string;
  fulljournalname?: string;
  pubdate?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  articleids?: { idtype?: string; value?: string }[];
};

async function fromPubmed(pmid: string): Promise<ReferenceDraft | null> {
  const res = await safeGet(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${encodeURIComponent(pmid)}`,
    { accept: "application/json" },
  );
  if (!res) return null;

  let summary: PubmedSummary | undefined;
  try {
    const json = JSON.parse(res.body) as { result?: Record<string, PubmedSummary> };
    summary = json.result?.[pmid];
  } catch {
    return null;
  }
  if (!summary?.title) return null;

  const doi = summary.articleids?.find((i) => i.idtype === "doi")?.value ?? null;
  // Com DOI em mãos o Crossref dá um registro mais completo (abstract, ISSN…).
  if (doi) {
    const viaCrossref = await fromCrossref(normalizeDoi(doi));
    if (viaCrossref) return { ...viaCrossref, pmid };
  }

  return {
    ...emptyDraft(),
    refType: "article",
    title: clean(summary.title) ?? "",
    // O PubMed devolve "Silva JA" (sobrenome + iniciais coladas).
    authors: summary.authors?.map((a) => a.name).filter(Boolean).join("; ") || null,
    year: firstYear(summary.pubdate),
    doi: doi ? normalizeDoi(doi) : null,
    containerTitle: clean(summary.fulljournalname) ?? clean(summary.source),
    volume: clean(summary.volume),
    issue: clean(summary.issue),
    pages: clean(summary.pages),
    pmid,
    url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    csl: summary as unknown as Json,
  };
}

// ── arXiv ───────────────────────────────────────────────────────────────────

async function fromArxiv(id: string): Promise<ReferenceDraft | null> {
  const res = await safeGet(
    `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(id)}&max_results=1`,
    { accept: "application/atom+xml" },
  );
  if (!res) return null;

  // Atom pequeno e de formato estável: regex basta e evita mais uma dependência.
  const entry = res.body.match(/<entry>([\s\S]*?)<\/entry>/)?.[1];
  if (!entry) return null;

  const title = clean(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
  if (!title) return null;
  const authors = [...entry.matchAll(/<name>([\s\S]*?)<\/name>/g)]
    .map((m) => clean(m[1]))
    .filter((n): n is string => Boolean(n));
  const doi = clean(entry.match(/<arxiv:doi[^>]*>([\s\S]*?)<\/arxiv:doi>/)?.[1]);

  return {
    ...emptyDraft(),
    refType: "preprint",
    title,
    authors: authors.length ? authors.join("; ") : null,
    year: firstYear(entry.match(/<published>([\s\S]*?)<\/published>/)?.[1]),
    abstract: clean(entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]),
    doi: doi ? normalizeDoi(doi) : null,
    arxivId: id,
    containerTitle: "arXiv",
    url: `https://arxiv.org/abs/${id}`,
  };
}

// ── OpenLibrary (ISBN) ──────────────────────────────────────────────────────

type OpenLibraryBook = {
  title?: string;
  subtitle?: string;
  authors?: { name?: string }[];
  publishers?: { name?: string }[];
  publish_places?: { name?: string }[];
  publish_date?: string;
  number_of_pages?: number;
  url?: string;
};

async function fromIsbn(isbn: string): Promise<ReferenceDraft | null> {
  const key = `ISBN:${isbn}`;
  const res = await safeGet(
    `https://openlibrary.org/api/books?bibkeys=${encodeURIComponent(key)}&format=json&jscmd=data`,
    { accept: "application/json" },
  );
  if (!res) return null;

  let book: OpenLibraryBook | undefined;
  try {
    book = (JSON.parse(res.body) as Record<string, OpenLibraryBook>)[key];
  } catch {
    return null;
  }
  if (!book?.title) return null;

  const title = book.subtitle ? `${book.title}: ${book.subtitle}` : book.title;
  return {
    ...emptyDraft(),
    refType: "book",
    title: clean(title) ?? "",
    authors: book.authors?.map((a) => a.name).filter(Boolean).join("; ") || null,
    year: firstYear(book.publish_date),
    publisher: clean(book.publishers?.[0]?.name),
    // Local de publicação: elemento essencial da 6023 para livro.
    place: clean(book.publish_places?.[0]?.name),
    pages: book.number_of_pages ? String(book.number_of_pages) : null,
    isbn,
    url: book.url ?? null,
    csl: book as unknown as Json,
  };
}

// ── Página web (meta tags) ──────────────────────────────────────────────────

function metaContent(html: string, ...names: string[]): string | null {
  for (const name of names) {
    const attr = name.startsWith("og:") || name.startsWith("article:") ? "property" : "name";
    const re = new RegExp(
      `<meta[^>]+(?:${attr}|name|property)\\s*=\\s*["']${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`,
      "i",
    );
    const tag = html.match(re)?.[0];
    const content = tag?.match(/content\s*=\s*["']([\s\S]*?)["']/i)?.[1];
    const value = clean(content);
    if (value) return value;
  }
  return null;
}

function metaAll(html: string, name: string): string[] {
  const re = new RegExp(`<meta[^>]+(?:name|property)\\s*=\\s*["']${name}["'][^>]*>`, "gi");
  return [...html.matchAll(re)]
    .map((m) => clean(m[0].match(/content\s*=\s*["']([\s\S]*?)["']/i)?.[1]))
    .filter((v): v is string => Boolean(v));
}

async function fromWebPage(url: string): Promise<ReferenceDraft | null> {
  const res = await safeGet(url, { maxBytes: 600_000 });
  if (!res) return null;

  // PDF direto no link: não dá para ler meta tags de HTML, mas o DOI costuma
  // estar na própria URL.
  if (/application\/pdf/i.test(res.contentType)) {
    const doiInUrl = identify(url);
    if (doiInUrl.kind === "doi") return fromCrossref(doiInUrl.value);
    return {
      ...emptyDraft(),
      refType: "other",
      title: decodeURIComponent(new URL(res.finalUrl).pathname.split("/").pop() ?? "") || res.finalUrl,
      url: res.finalUrl,
      accessedAt: new Date().toISOString().slice(0, 10),
    };
  }

  const html = res.body;

  // Praticamente toda revista científica publica as meta tags Highwire; se
  // houver DOI ali, o Crossref é a fonte melhor.
  const doiMeta =
    metaContent(html, "citation_doi", "DC.Identifier.DOI", "dc.identifier") ??
    metaContent(html, "prism.doi");
  if (doiMeta) {
    const doi = normalizeDoi(doiMeta);
    const viaCrossref = await fromCrossref(doi);
    if (viaCrossref) return { ...viaCrossref, url: viaCrossref.url ?? res.finalUrl };
  }

  const title =
    metaContent(html, "citation_title", "DC.Title", "og:title", "twitter:title") ??
    clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
  if (!title) return null;

  const citationAuthors = [...metaAll(html, "citation_author"), ...metaAll(html, "DC.Creator")];
  const authors =
    (citationAuthors.length ? citationAuthors.join("; ") : null) ??
    metaContent(html, "author", "article:author", "og:article:author");

  const journal = metaContent(html, "citation_journal_title", "citation_conference_title");
  const siteName = metaContent(html, "og:site_name", "application-name");
  const date = metaContent(
    html,
    "citation_publication_date",
    "citation_date",
    "article:published_time",
    "DC.Date",
  );

  return {
    ...emptyDraft(),
    refType: journal ? "article" : "website",
    title,
    authors,
    year: firstYear(date),
    containerTitle: journal ?? siteName ?? new URL(res.finalUrl).hostname.replace(/^www\./, ""),
    publisher: metaContent(html, "citation_publisher", "DC.Publisher"),
    volume: metaContent(html, "citation_volume"),
    issue: metaContent(html, "citation_issue"),
    pages: (() => {
      const first = metaContent(html, "citation_firstpage");
      const last = metaContent(html, "citation_lastpage");
      return first ? (last ? `${first}-${last}` : first) : null;
    })(),
    abstract: metaContent(html, "citation_abstract", "description", "og:description"),
    issn: metaContent(html, "citation_issn"),
    isbn: metaContent(html, "citation_isbn"),
    pmid: metaContent(html, "citation_pmid"),
    url: res.finalUrl,
    accessedAt: new Date().toISOString().slice(0, 10),
  };
}

// ── entrada única ───────────────────────────────────────────────────────────

export type LookupResult =
  | { ok: true; draft: ReferenceDraft; source: Identifier["kind"] }
  | { ok: false; error: string; suggestions?: ReferenceDraft[] };

/**
 * Resolve o que o usuário colou (DOI, PMID, arXiv, ISBN, link ou título solto)
 * em uma referência preenchida.
 */
export async function lookupReference(input: string): Promise<LookupResult> {
  const id = identify(input);
  if (!id.value) return { ok: false, error: "Cole um link, DOI ou o título do trabalho." };

  try {
    switch (id.kind) {
      case "doi": {
        const draft = await fromCrossref(id.value);
        return draft
          ? { ok: true, draft, source: "doi" }
          : { ok: false, error: "DOI não encontrado no Crossref. Confira o código ou preencha à mão." };
      }
      case "pmid": {
        const draft = await fromPubmed(id.value);
        return draft
          ? { ok: true, draft, source: "pmid" }
          : { ok: false, error: "PMID não encontrado no PubMed." };
      }
      case "arxiv": {
        const draft = await fromArxiv(id.value);
        return draft
          ? { ok: true, draft, source: "arxiv" }
          : { ok: false, error: "Preprint não encontrado no arXiv." };
      }
      case "isbn": {
        const draft = await fromIsbn(id.value);
        return draft
          ? { ok: true, draft, source: "isbn" }
          : { ok: false, error: "ISBN não encontrado na OpenLibrary." };
      }
      case "url": {
        const draft = await fromWebPage(id.value);
        return draft
          ? { ok: true, draft, source: "url" }
          : {
              ok: false,
              error:
                "Não consegui ler os dados dessa página. Preencha os campos à mão — o link já fica salvo.",
            };
      }
      default: {
        // Texto solto: trata como busca por título.
        const suggestions = await searchCrossref(id.value);
        return suggestions.length
          ? { ok: false, error: "Escolha o trabalho correto na lista.", suggestions }
          : { ok: false, error: "Nada encontrado com esse texto. Preencha os campos à mão." };
      }
    }
  } catch (err) {
    if (err instanceof UnsafeUrlError) return { ok: false, error: err.message };
    return { ok: false, error: "Falha ao buscar os dados. Tente de novo ou preencha à mão." };
  }
}

export { fromCrossref };
