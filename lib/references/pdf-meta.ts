import { extractDoi } from "./identify";

// Leitura dos metadados de um PDF no próprio navegador, sem dependência e sem
// IA. Editoras científicas (Elsevier, Springer, Wiley, SciELO, PubMed Central…)
// gravam um pacote XMP em texto puro dentro do arquivo, com DOI, título e
// autores. É esse pacote que lemos aqui — se ele existir, o DOI vira a chave e
// o Crossref devolve o registro completo e correto.
//
// Não é OCR nem extração de texto da página: se o PDF não trouxer metadados
// nem um DOI legível, o formulário simplesmente continua vazio para o usuário
// completar (ou buscar pelo título).

export type PdfMetadata = {
  doi: string | null;
  title: string | null;
  authors: string | null;
  year: number | null;
  containerTitle: string | null;
};

const HEAD_BYTES = 2_000_000;
const TAIL_BYTES = 1_000_000;

async function readEdges(file: File): Promise<string> {
  const decoder = new TextDecoder("latin1");
  if (file.size <= HEAD_BYTES + TAIL_BYTES) {
    return decoder.decode(await file.arrayBuffer());
  }
  const [head, tail] = await Promise.all([
    file.slice(0, HEAD_BYTES).arrayBuffer(),
    file.slice(file.size - TAIL_BYTES).arrayBuffer(),
  ]);
  return `${decoder.decode(head)}\n${decoder.decode(tail)}`;
}

function tag(xmp: string, name: string): string | null {
  const direct = xmp.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"))?.[1];
  if (!direct) {
    // Algumas ferramentas gravam como atributo: prism:doi="10.xxxx/yyy"
    const attr = xmp.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i"))?.[1];
    return attr?.trim() || null;
  }
  // Campos "de idioma alternativo" vêm embrulhados em <rdf:Alt><rdf:li>…
  const items = [...direct.matchAll(/<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/gi)].map((m) => m[1]);
  const value = (items.length ? items.join("; ") : direct).replace(/<[^>]*>/g, " ");
  return value.replace(/\s+/g, " ").trim() || null;
}

function fromInfoDictionary(raw: string, key: string): string | null {
  // /Title (Texto do título) — os escapes do PDF são poucos e simples.
  const m = raw.match(new RegExp(`/${key}\\s*\\(((?:\\\\.|[^\\\\)])*)\\)`));
  if (!m) return null;
  // Strings UTF-16BE começam com o BOM FE FF e, lidas como latin1, viram lixo
  // com bytes nulos intercalados — melhor descartar do que exibir sujeira.
  if (/^\u00fe\u00ff/.test(m[1]) || /\u0000/.test(m[1])) return null;
  const value = m[1].replace(/\\([()\\])/g, "$1").replace(/\s+/g, " ").trim();
  return value || null;
}

export async function scanPdfMetadata(file: File): Promise<PdfMetadata> {
  const empty: PdfMetadata = {
    doi: null,
    title: null,
    authors: null,
    year: null,
    containerTitle: null,
  };
  if (!/pdf/i.test(file.type) && !/\.pdf$/i.test(file.name)) return empty;

  let raw: string;
  try {
    raw = await readEdges(file);
  } catch {
    return empty;
  }

  const xmp = raw.match(/<x:xmpmeta[\s\S]*?<\/x:xmpmeta>/i)?.[0] ?? "";

  const doi =
    (xmp && extractDoi(tag(xmp, "prism:doi") ?? "")) ||
    (xmp && extractDoi(tag(xmp, "dc:identifier") ?? "")) ||
    extractDoi(raw) ||
    null;

  const title = xmp ? tag(xmp, "dc:title") : null;
  const authors = xmp ? tag(xmp, "dc:creator") : null;
  const date = xmp ? tag(xmp, "prism:coverDate") ?? tag(xmp, "xmp:CreateDate") : null;
  const containerTitle = xmp ? tag(xmp, "prism:publicationName") : null;
  const yearMatch = date?.match(/\b(1[5-9]\d{2}|20\d{2}|21\d{2})\b/);

  return {
    doi,
    title: title ?? fromInfoDictionary(raw, "Title"),
    authors: authors ?? fromInfoDictionary(raw, "Author"),
    year: yearMatch ? Number(yearMatch[1]) : null,
    containerTitle,
  };
}
