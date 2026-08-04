import type { ReferenceRow } from "./types";

// Formatação de citações — determinística, sem serviço externo e sem IA. As
// três normas cobertas são as que aparecem na pesquisa brasileira: ABNT, APA 7
// e Vancouver. As regras estão levantadas em `docs/normas-abnt.md`, a partir
// dos manuais de normalização publicados pelas bibliotecas universitárias (o
// texto das NBR é vendido e não pode ser redistribuído; regra, porém, é fato).
//
// Edições seguidas: **NBR 6023:2018** (referências) e **NBR 10520:2023**
// (citações). A revisão de 2023 é a razão de a chamada no texto ter deixado de
// sair em caixa alta — mudou a norma, não o nosso gosto. A caixa alta continua
// na lista de referências, que é assunto da 6023 e não foi revisada.
//
// A referência **não é uma string**: a 6023 exige destaque tipográfico em um
// elemento específico de cada tipo de documento (o título do livro, o título do
// periódico no artigo), e a APA exige itálico em outro. Por isso o formatador
// devolve trechos marcados (`RefSpan[]`) e quem escreve no documento converte
// para as marcas do editor. `formatReference` continua existindo e devolve o
// texto puro, para prévia e para busca.

export type CitationStyle = "abnt" | "apa" | "vancouver";

export const CITATION_STYLE_LABEL: Record<CitationStyle, string> = {
  abnt: "ABNT",
  apa: "APA 7",
  vancouver: "Vancouver",
};

/** Trecho de uma referência já formatada, com o destaque que a norma pede. */
export type RefSpan = { text: string; bold?: boolean; italic?: boolean };

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

// Partículas do nome. Não são iniciais de nada: "João Ferreira de" abrevia
// para "J. F. de", não para "J. F. D.".
const NAME_PARTICLES = new Set([
  "de", "da", "do", "das", "dos", "e", "del", "della", "van", "von", "der", "di", "la", "le",
]);

function initials(given: string): string {
  return given
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((w) => (NAME_PARTICLES.has(w.toLowerCase()) ? w.toLowerCase() : `${w[0].toUpperCase()}.`))
    .join(" ");
}

/**
 * Fecha um elemento com ponto — a não ser que ele já termine em pontuação.
 * Sem isto, "et al." e "4. ed." saem com ponto duplicado, que é o erro que a
 * banca enxerga de longe.
 */
function dot(value: string): string {
  return /[.!?]$/.test(value.trim()) ? value.trim() : `${value.trim()}.`;
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

const MONTHS_ABBR = [
  "jan.", "fev.", "mar.", "abr.", "maio", "jun.",
  "jul.", "ago.", "set.", "out.", "nov.", "dez.",
];

/**
 * Abreviatura do mês em português conforme o Quadro 1 da NBR 6023:2018 — só
 * "maio" não abrevia. `month` é 1–12; fora disso devolve `null`.
 */
export function abntMonth(month: number): string | null {
  return MONTHS_ABBR[month - 1] ?? null;
}

function abntAccessDate(iso: string | null): string {
  const d = iso ? new Date(`${iso}T00:00:00`) : new Date();
  return `${d.getDate()} ${MONTHS_ABBR[d.getMonth()]} ${d.getFullYear()}`;
}

// ── montagem dos trechos ────────────────────────────────────────────────────

// Acumulador de trechos. Junta o texto plano seguido para não picar a string em
// pedaços inúteis, e mantém separado só o que leva destaque.
class SpanBuilder {
  private spans: RefSpan[] = [];

  add(text: string | null | undefined, mark?: { bold?: boolean; italic?: boolean }): this {
    if (!text) return this;
    const last = this.spans[this.spans.length - 1];
    const bold = mark?.bold ?? false;
    const italic = mark?.italic ?? false;
    if (last && Boolean(last.bold) === bold && Boolean(last.italic) === italic) {
      last.text += text;
      return this;
    }
    this.spans.push({ text, ...(bold ? { bold } : {}), ...(italic ? { italic } : {}) });
    return this;
  }

  /** Trecho precedido de espaço — a forma mais comum de emendar elementos. */
  next(text: string | null | undefined, mark?: { bold?: boolean; italic?: boolean }): this {
    if (!text) return this;
    if (this.spans.length) this.add(" ");
    return this.add(text, mark);
  }

  /**
   * Fecha o elemento anterior com ponto, fora de qualquer destaque — o ponto
   * que encerra o título não faz parte do negrito. Não duplica se o texto já
   * terminar em pontuação (título que acaba em "?" ou "!").
   */
  endSentence(): this {
    const last = this.spans[this.spans.length - 1];
    if (!last || /[.!?]\s*$/.test(last.text)) return this;
    return this.add(".");
  }

  done(): RefSpan[] {
    // Espaço duplo aparece sempre que um elemento opcional fica vazio no meio
    // da sequência; some aqui em vez de cada modelo ter de se preocupar.
    const out = this.spans
      .map((s) => ({ ...s, text: s.text.replace(/\s+/g, " ") }))
      .filter((s) => s.text.length > 0);
    if (out.length) {
      out[0].text = out[0].text.replace(/^\s+/, "");
      out[out.length - 1].text = out[out.length - 1].text.replace(/\s+$/, "");
    }
    return out.filter((s) => s.text.length > 0);
  }
}

/**
 * Separa título e subtítulo no primeiro dois-pontos. A 6023 destaca o título e
 * **não** o subtítulo, e é assim que os gerenciadores de referência resolvem —
 * assumindo que o primeiro ":" separa os dois.
 */
function splitTitle(title: string): { main: string; sub: string | null } {
  const at = title.indexOf(": ");
  if (at < 0) return { main: title.trim(), sub: null };
  return { main: title.slice(0, at).trim(), sub: title.slice(at + 1).trim() };
}

// ── ABNT (NBR 6023:2018) ────────────────────────────────────────────────────

/**
 * Ano da referência. Na 6023 o ano é **elemento essencial**: quando não há ano
 * certo, entra uma aproximação entre colchetes ("[2010?]", "[ca. 2005]",
 * "[200-]") — é para isso que existe a coluna `year_text`. `[s. d.]` não é
 * forma prevista pela norma; fica como último recurso, e a referência aparece
 * incompleta de propósito, para o autor perceber que falta o dado.
 */
function abntYear(ref: ReferenceRow): string {
  if (ref.year) return String(ref.year);
  const text = ref.year_text?.trim();
  if (!text) return "[s. d.]";
  return /^\[.*\]$/.test(text) ? text : `[${text}]`;
}

/** "Local: Editora" com as formas latinas quando um dos dois falta. */
function abntImprint(ref: ReferenceRow): string {
  const place = ref.place?.trim();
  const publisher = ref.publisher?.trim();
  if (!place && !publisher) return "[S. l.: s. n.]";
  return `${place || "[S. l.]"}: ${publisher || "[s. n.]"}`;
}

function abntAuthors(ref: ReferenceRow): string {
  const list = parseAuthors(ref.authors).map(
    (a) => `${a.family.toUpperCase()}${a.given ? `, ${initials(a.given)}` : ""}`,
  );
  // 6023, 8.1.1.2: com mais de três autores permite-se indicar apenas o
  // primeiro seguido de "et al.". A escolha tem de ser uniforme no documento —
  // por isso é decidida aqui, e não caso a caso.
  return joinAuthors(list, "; ", 3);
}

/** "Disponível em: … Acesso em: …", comum a todos os tipos consultados online. */
function abntAvailability(ref: ReferenceRow, b: SpanBuilder): void {
  const link = ref.url ?? (ref.doi ? `https://doi.org/${ref.doi}` : null);
  if (!link) return;
  b.next(`Disponível em: ${link}. Acesso em: ${abntAccessDate(ref.accessed_at)}.`);
}

/** Tipo do trabalho acadêmico deduzido do grau — não é campo próprio. */
function academicWorkType(degree: string | null): string {
  const d = (degree ?? "").toLowerCase();
  if (d.includes("doutor")) return "Tese";
  if (d.includes("mestr")) return "Dissertação";
  if (d.includes("especial") || d.includes("graduaç") || d.includes("mba")) {
    return "Trabalho de conclusão de curso";
  }
  return "Trabalho acadêmico";
}

function abntSpans(ref: ReferenceRow): RefSpan[] {
  const b = new SpanBuilder();
  const year = abntYear(ref);
  const { main, sub } = splitTitle(ref.title);

  const head = abntAuthors(ref);
  if (head) b.add(`${dot(head)} `);

  switch (ref.ref_type) {
    // ── artigo de periódico: o destaque vai no PERIÓDICO, não no artigo ──────
    case "article":
    case "preprint": {
      b.add(dot(ref.title));
      if (ref.container_title) {
        const journal = splitTitle(ref.container_title);
        b.next(journal.main, { bold: true });
        if (journal.sub) b.add(`: ${journal.sub}`);
        b.add(",");
      }
      b.next(ref.place ? `${ref.place},` : null);
      b.next(ref.volume ? `v. ${ref.volume},` : null);
      b.next(ref.issue ? `n. ${ref.issue},` : null);
      b.next(ref.pages ? `p. ${ref.pages},` : null);
      // O mês (ou o período do fascículo) antecede o ano: "jul./dez. 2006".
      b.next(ref.issued_month ? `${ref.issued_month} ${year}.` : `${year}.`);
      if (ref.doi) b.next(`DOI ${ref.doi}.`);
      abntAvailability(ref, b);
      break;
    }

    // ── trabalho acadêmico: ano de depósito, tipo (grau em curso), travessão ─
    case "thesis": {
      b.add(main, { bold: true });
      if (sub) b.add(`: ${sub}`);
      b.endSentence();
      b.next(`${year}.`);

      const type = academicWorkType(ref.degree);
      const inside = [ref.degree, ref.program].filter(Boolean).join(" em ");
      b.next(inside ? `${type} (${inside})` : type);
      // Travessão (–), não hífen: é o que a 6023 usa entre o grau e a
      // vinculação acadêmica.
      const tail = [ref.institution, ref.place, ref.year ? String(ref.year) : null]
        .filter(Boolean)
        .join(", ");
      b.add(tail ? ` – ${tail}.` : ".");
      abntAvailability(ref, b);
      break;
    }

    // ── parte de livro: "In:" + a referência do todo ─────────────────────────
    case "chapter": {
      b.add(dot(ref.title));
      if (ref.container_title) {
        const book = splitTitle(ref.container_title);
        b.next("In:");
        b.next(book.main, { bold: true });
        if (book.sub) b.add(`: ${book.sub}`);
        b.add(".");
      }
      b.next(ref.edition ? dot(ref.edition) : null);
      b.next(`${abntImprint(ref)}, ${year}.`);
      if (ref.pages) b.next(`p. ${ref.pages}.`);
      abntAvailability(ref, b);
      break;
    }

    // ── trabalho em evento: nome do evento em caixa alta, "Anais [...]" ──────
    case "conference": {
      b.add(dot(ref.title));
      if (ref.container_title) {
        b.next(`In: ${ref.container_title.toUpperCase()},`);
        if (ref.event_number) b.next(`${ref.event_number.replace(/\.?$/, ".")},`);
        b.next(`${ref.year ?? year},`);
        b.next(ref.place ? `${ref.place}.` : null);
        b.next("Anais", { bold: true });
        b.add(" [...].");
      }
      b.next(`${abntImprint(ref)}, ${year}.`);
      if (ref.pages) b.next(`p. ${ref.pages}.`);
      abntAvailability(ref, b);
      break;
    }

    // ── site: autor, título, local, ano, disponibilidade ─────────────────────
    case "website": {
      b.add(main, { bold: true });
      if (sub) b.add(`: ${sub}`);
      b.endSentence();
      if (ref.container_title && ref.container_title !== ref.title) {
        b.next(`${ref.container_title}.`);
      }
      b.next(ref.publisher || ref.place ? `${abntImprint(ref)}, ${year}.` : `${year}.`);
      abntAvailability(ref, b);
      break;
    }

    // ── livro e assemelhados (relatório, dataset, software, outros) ──────────
    default: {
      b.add(main, { bold: true });
      if (sub) b.add(`: ${sub}`);
      b.endSentence();
      b.next(ref.edition ? dot(ref.edition) : null);
      b.next(`${abntImprint(ref)}, ${year}.`);
      abntAvailability(ref, b);
      break;
    }
  }

  return b.done();
}

// ── APA 7 ───────────────────────────────────────────────────────────────────
// A APA destaca em **itálico** — o título do livro, ou o nome do periódico
// junto do volume no artigo. E, ao contrário da ABNT, não pede o local de
// publicação desde a 6ª edição.

function apaSpans(ref: ReferenceRow): RefSpan[] {
  const b = new SpanBuilder();
  const authors = parseAuthors(ref.authors).map(
    (a) => `${a.family}${a.given ? `, ${initials(a.given)}` : ""}`,
  );
  const head = joinAuthors(authors, ", & ", 20);
  const year = ref.year ? `(${ref.year})` : "(s.d.)";

  if (head) b.add(`${head} `);
  b.add(`${year}. `);

  if (ref.ref_type === "book" || ref.ref_type === "thesis" || ref.ref_type === "report") {
    b.add(ref.title, { italic: true });
    b.add(".");
    if (ref.ref_type === "thesis") {
      const inside = [ref.degree, ref.program].filter(Boolean).join(" em ");
      if (inside) b.next(`[${inside}].`);
      b.next(ref.institution ? `${ref.institution}.` : null);
    } else if (ref.publisher) {
      b.next(`${ref.publisher}.`);
    }
  } else if (ref.ref_type === "website") {
    b.add(`${ref.title}.`);
    if (ref.container_title) b.next(ref.container_title, { italic: true });
    if (ref.container_title) b.add(".");
  } else {
    b.add(`${ref.title}.`);
    if (ref.container_title) {
      b.next(ref.container_title, { italic: true });
      if (ref.volume) {
        b.add(", ");
        b.add(ref.volume, { italic: true });
        if (ref.issue) b.add(`(${ref.issue})`);
      }
      if (ref.pages) b.add(`, ${ref.pages}`);
      b.add(".");
    }
  }

  const link = ref.doi ? `https://doi.org/${ref.doi}` : ref.url;
  if (link) b.next(link);

  return b.done();
}

// ── Vancouver ───────────────────────────────────────────────────────────────
// Sem destaque tipográfico. Usa o local de publicação, no formato
// "Local: Editora; ano".

function vancouverSpans(ref: ReferenceRow): RefSpan[] {
  const b = new SpanBuilder();
  const authors = parseAuthors(ref.authors).map(
    (a) => `${a.family}${a.given ? ` ${compactInitials(a.given)}` : ""}`,
  );
  const head = authors.length > 6 ? `${authors.slice(0, 6).join(", ")}, et al` : authors.join(", ");
  const imprint = [ref.place, ref.publisher].filter(Boolean).join(": ");

  if (head) b.add(`${head}. `);
  b.add(`${ref.title}.`);

  if (ref.ref_type === "book" || ref.ref_type === "thesis" || ref.ref_type === "report") {
    b.next(imprint ? `${imprint}; ${ref.year ?? ""}.` : `${ref.year ?? ""}.`);
  } else if (ref.ref_type === "website") {
    if (ref.container_title) b.next(`${ref.container_title}.`);
    b.next(`${ref.year ?? ""}.`);
    if (ref.url) b.next(`Disponível em: ${ref.url}`);
  } else {
    if (ref.container_title) b.next(`${ref.container_title}.`);
    const vol = ref.volume ? `;${ref.volume}${ref.issue ? `(${ref.issue})` : ""}` : "";
    const pages = ref.pages ? `:${ref.pages}` : "";
    b.next(`${ref.year ?? ""}${vol}${pages}.`);
    if (ref.doi) b.next(`doi: ${ref.doi}`);
  }

  return b.done();
}

/** A referência com os destaques que a norma pede. */
export function formatReferenceSpans(ref: ReferenceRow, style: CitationStyle): RefSpan[] {
  switch (style) {
    case "apa":
      return apaSpans(ref);
    case "vancouver":
      return vancouverSpans(ref);
    default:
      return abntSpans(ref);
  }
}

/** A mesma referência em texto puro — prévia, busca, exportação simples. */
export function formatReference(ref: ReferenceRow, style: CitationStyle): string {
  return formatReferenceSpans(ref, style)
    .map((s) => s.text)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

// ── chamada no texto ────────────────────────────────────────────────────────

/**
 * Sobrenome como ele entra na chamada. A **NBR 10520:2023** acabou com a caixa
 * alta no sistema autor-data: hoje é "(Silva, 2019, p. 35)", não
 * "(SILVA, 2019, p. 35)". A caixa alta continua na lista de referências, que é
 * regida pela 6023 e não mudou — são normas diferentes.
 */
function citationName(family: string): string {
  return family
    .split(/(\s|-)/)
    .map((part) =>
      /^[\s-]$/.test(part) || part.length === 0
        ? part
        : // Sigla (IBGE, SEBRAE) permanece em caixa alta.
          part === part.toUpperCase() && part.length > 1
          ? part
          : part[0].toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join("");
}

function citationAuthors(ref: ReferenceRow, style: CitationStyle): string | null {
  const authors = parseAuthors(ref.authors);
  if (authors.length === 0) return null;

  if (style === "abnt") {
    // 10520:2023: com quatro ou mais autores, o primeiro seguido de "et al.".
    if (authors.length > 3) return `${citationName(authors[0].family)} et al.`;
    return authors.map((a) => citationName(a.family)).join("; ");
  }
  if (authors.length > 2) return `${authors[0].family} et al.`;
  return authors.map((a) => a.family).join(" & ");
}

/**
 * Citação no corpo do texto, entre parênteses. `locator` é a página de onde o
 * trecho saiu — as três normas exigem esse dado na citação **direta**
 * (transcrição literal) e o dispensam na indireta, por isso é opcional.
 */
export function inTextCitation(
  ref: ReferenceRow,
  style: CitationStyle,
  locator?: string | null,
): string {
  const year = ref.year ?? (style === "abnt" ? abntYear(ref).replace(/^\[|\]$/g, "") : "s.d.");
  const page = locator?.trim() ? `, p. ${locator.trim()}` : "";
  const names = citationAuthors(ref, style);
  if (!names) return `(${ref.title.slice(0, 30)}, ${year}${page})`;
  return `(${names}, ${year}${page})`;
}

/**
 * Chamada **narrativa** — quando o autor faz parte da frase, ele sai do
 * parêntese: "Silva (2019, p. 35) afirma que…". Só o ano e a página ficam entre
 * parênteses. A 10520:2023 pede a mesma caixa das duas formas.
 */
export function narrativeCitation(
  ref: ReferenceRow,
  style: CitationStyle,
  locator?: string | null,
): string {
  const year = ref.year ?? (style === "abnt" ? abntYear(ref).replace(/^\[|\]$/g, "") : "s.d.");
  const page = locator?.trim() ? `, p. ${locator.trim()}` : "";
  const names = citationAuthors(ref, style);
  if (!names) return `${ref.title.slice(0, 30)} (${year}${page})`;
  return `${names} (${year}${page})`;
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
