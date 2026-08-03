import type { ReferenceRow } from "./types";

// Formatação de citações — determinística, sem serviço externo e sem IA. As
// três normas cobertas são as que aparecem na pesquisa brasileira: ABNT
// (NBR 6023), APA 7 e Vancouver. É uma implementação enxuta: acerta os casos
// correntes (artigo, livro, capítulo, site) e serve de base se um dia entrar
// um motor CSL completo (o registro cru do Crossref já fica guardado em `csl`).

export type CitationStyle = "abnt" | "apa" | "vancouver";

export const CITATION_STYLE_LABEL: Record<CitationStyle, string> = {
  abnt: "ABNT",
  apa: "APA 7",
  vancouver: "Vancouver",
};

export type ParsedAuthor = { family: string; given: string };

const INITIALS_ONLY = /^[A-ZÀ-Ý]{1,4}$/;

/**
 * Aceita os dois formatos que entram no campo `authors`:
 *   "Silva, João A.; Souza, Maria"  (Crossref, entrada manual)
 *   "Silva JA; Souza M"             (PubMed)
 */
export function parseAuthors(authors: string | null): ParsedAuthor[] {
  if (!authors?.trim()) return [];
  return authors
    .split(/;|\se\s|\sand\s/i)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.includes(",")) {
        const [family, ...rest] = part.split(",");
        return { family: family.trim(), given: rest.join(",").trim() };
      }
      const tokens = part.split(/\s+/);
      if (tokens.length === 1) return { family: tokens[0], given: "" };
      const last = tokens[tokens.length - 1];
      // "Silva JA" → sobrenome primeiro, iniciais no fim (estilo PubMed)
      if (INITIALS_ONLY.test(last)) {
        return { family: tokens.slice(0, -1).join(" "), given: last.split("").join(". ") + "." };
      }
      return { family: last, given: tokens.slice(0, -1).join(" ") };
    });
}

function initials(given: string): string {
  return given
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((w) => `${w[0].toUpperCase()}.`)
    .join(" ");
}

function compactInitials(given: string): string {
  return given
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function joinAuthors(list: string[], connector: string, etAlAfter: number): string {
  if (list.length === 0) return "";
  if (list.length > etAlAfter) return `${list[0]} et al.`;
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join("; ")}${connector}${list[list.length - 1]}`;
}

function part(value: string | null | undefined, suffix = ""): string {
  return value ? value + suffix : "";
}

function doiUrl(ref: ReferenceRow): string | null {
  if (ref.doi) return `https://doi.org/${ref.doi}`;
  return ref.url ?? null;
}

const MONTHS_ABBR = [
  "jan.", "fev.", "mar.", "abr.", "maio", "jun.",
  "jul.", "ago.", "set.", "out.", "nov.", "dez.",
];

function abntAccessDate(iso: string | null): string {
  const d = iso ? new Date(`${iso}T00:00:00`) : new Date();
  return `${d.getDate()} ${MONTHS_ABBR[d.getMonth()]} ${d.getFullYear()}`;
}

// ── ABNT (NBR 6023) ─────────────────────────────────────────────────────────

function abnt(ref: ReferenceRow): string {
  const authors = parseAuthors(ref.authors).map(
    (a) => `${a.family.toUpperCase()}${a.given ? `, ${initials(a.given)}` : ""}`,
  );
  const head = joinAuthors(authors, "; ", 3);
  const year = ref.year ? String(ref.year) : "[s.d.]";

  const bits: string[] = [];
  if (head) bits.push(`${head}.`);
  bits.push(`${ref.title}.`);

  if (ref.ref_type === "book" || ref.ref_type === "thesis" || ref.ref_type === "report") {
    if (ref.edition) bits.push(`${ref.edition}.`);
    bits.push(`${part(ref.publisher, ", ")}${year}.`);
  } else if (ref.ref_type === "website") {
    if (ref.container_title) bits.push(`${ref.container_title},`);
    bits.push(`${year}.`);
    if (ref.url) bits.push(`Disponível em: ${ref.url}. Acesso em: ${abntAccessDate(ref.accessed_at)}.`);
  } else {
    if (ref.container_title) bits.push(`${ref.container_title},`);
    if (ref.volume) bits.push(`v. ${ref.volume},`);
    if (ref.issue) bits.push(`n. ${ref.issue},`);
    if (ref.pages) bits.push(`p. ${ref.pages},`);
    bits.push(`${year}.`);
    if (ref.doi) bits.push(`DOI: ${ref.doi}.`);
  }

  return bits.join(" ").replace(/\s+/g, " ").trim();
}

// ── APA 7 ───────────────────────────────────────────────────────────────────

function apa(ref: ReferenceRow): string {
  const authors = parseAuthors(ref.authors).map(
    (a) => `${a.family}${a.given ? `, ${initials(a.given)}` : ""}`,
  );
  const head = joinAuthors(authors, ", & ", 20);
  const year = ref.year ? `(${ref.year})` : "(s.d.)";

  const bits: string[] = [];
  if (head) bits.push(`${head}`);
  bits.push(`${year}.`);
  bits.push(`${ref.title}.`);

  if (ref.ref_type === "book" || ref.ref_type === "thesis" || ref.ref_type === "report") {
    if (ref.publisher) bits.push(`${ref.publisher}.`);
  } else if (ref.ref_type === "website") {
    if (ref.container_title) bits.push(`${ref.container_title}.`);
  } else if (ref.container_title) {
    const vol = ref.volume ? `, ${ref.volume}${ref.issue ? `(${ref.issue})` : ""}` : "";
    const pages = ref.pages ? `, ${ref.pages}` : "";
    bits.push(`${ref.container_title}${vol}${pages}.`);
  }

  const link = doiUrl(ref);
  if (link) bits.push(link);

  return bits.join(" ").replace(/\s+/g, " ").trim();
}

// ── Vancouver ───────────────────────────────────────────────────────────────

function vancouver(ref: ReferenceRow): string {
  const authors = parseAuthors(ref.authors).map(
    (a) => `${a.family}${a.given ? ` ${compactInitials(a.given)}` : ""}`,
  );
  const head = authors.length > 6 ? `${authors.slice(0, 6).join(", ")}, et al` : authors.join(", ");

  const bits: string[] = [];
  if (head) bits.push(`${head}.`);
  bits.push(`${ref.title}.`);

  if (ref.ref_type === "book" || ref.ref_type === "thesis" || ref.ref_type === "report") {
    bits.push(`${part(ref.publisher, "; ")}${ref.year ?? ""}.`);
  } else if (ref.ref_type === "website") {
    if (ref.container_title) bits.push(`${ref.container_title}.`);
    bits.push(`${ref.year ?? ""}.`);
    if (ref.url) bits.push(`Disponível em: ${ref.url}`);
  } else {
    if (ref.container_title) bits.push(`${ref.container_title}.`);
    const vol = ref.volume ? `;${ref.volume}${ref.issue ? `(${ref.issue})` : ""}` : "";
    const pages = ref.pages ? `:${ref.pages}` : "";
    bits.push(`${ref.year ?? ""}${vol}${pages}.`);
    if (ref.doi) bits.push(`doi: ${ref.doi}`);
  }

  return bits.join(" ").replace(/\s+/g, " ").trim();
}

export function formatReference(ref: ReferenceRow, style: CitationStyle): string {
  switch (style) {
    case "apa":
      return apa(ref);
    case "vancouver":
      return vancouver(ref);
    default:
      return abnt(ref);
  }
}

/**
 * Citação no corpo do texto. `locator` é a página de onde o trecho saiu — as
 * três normas exigem esse dado na citação **direta** (transcrição literal) e o
 * dispensam na indireta, por isso ele é opcional aqui.
 */
export function inTextCitation(
  ref: ReferenceRow,
  style: CitationStyle,
  locator?: string | null,
): string {
  const authors = parseAuthors(ref.authors);
  const year = ref.year ?? "s.d.";
  const page = locator?.trim() ? `, p. ${locator.trim()}` : "";
  if (authors.length === 0) return `(${ref.title.slice(0, 30)}, ${year}${page})`;

  if (style === "abnt") {
    const names =
      authors.length > 3
        ? `${authors[0].family.toUpperCase()} et al.`
        : authors.map((a) => a.family.toUpperCase()).join("; ");
    return `(${names}, ${year}${page})`;
  }
  const names =
    authors.length > 2
      ? `${authors[0].family} et al.`
      : authors.map((a) => a.family).join(" & ");
  return `(${names}, ${year}${page})`;
}

// ── chave de citação ────────────────────────────────────────────────────────

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Chave estável para citar a referência em qualquer lugar do projeto:
 * "silva2024". `taken` são as chaves já usadas no projeto — se houver colisão,
 * entra um sufixo (silva2024b, silva2024c…).
 */
export function buildCitationKey(
  authors: string | null,
  year: number | null,
  title: string,
  taken: Iterable<string> = [],
): string {
  const first = parseAuthors(authors)[0];
  const base =
    slugify(first?.family ?? "").slice(0, 18) ||
    slugify(title.split(/\s+/)[0] ?? "").slice(0, 18) ||
    "ref";
  const stem = `${base}${year ?? ""}`;
  const used = new Set(taken);
  if (!used.has(stem)) return stem;
  for (let i = 1; i < 26; i++) {
    const candidate = `${stem}${String.fromCharCode(97 + i)}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${stem}-${Math.random().toString(36).slice(2, 6)}`;
}
