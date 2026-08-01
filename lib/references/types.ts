import type { Json, ReferenceType } from "@/lib/types/database";

// Forma "plana" de uma referência — é o que os formulários editam, o que as
// actions gravam e o que os provedores de metadados (Crossref, PubMed…)
// devolvem depois de normalizar. O CSL-JSON cru fica em `csl`.
export type ReferenceDraft = {
  refType: ReferenceType;
  title: string;
  authors: string | null;
  year: number | null;
  doi: string | null;
  url: string | null;
  containerTitle: string | null;
  publisher: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  edition: string | null;
  abstract: string | null;
  isbn: string | null;
  issn: string | null;
  pmid: string | null;
  arxivId: string | null;
  accessedAt: string | null;
  notes: string | null;
  tags: string[];
  isEssential: boolean;
  filePath: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileMime: string | null;
  csl: Json;
};

export function emptyDraft(): ReferenceDraft {
  return {
    refType: "article",
    title: "",
    authors: null,
    year: null,
    doi: null,
    url: null,
    containerTitle: null,
    publisher: null,
    volume: null,
    issue: null,
    pages: null,
    edition: null,
    abstract: null,
    isbn: null,
    issn: null,
    pmid: null,
    arxivId: null,
    accessedAt: null,
    notes: null,
    tags: [],
    isEssential: false,
    filePath: null,
    fileName: null,
    fileSize: null,
    fileMime: null,
    csl: {},
  };
}

// Linha completa como sai do banco (camelCase só na borda da UI seria ruído;
// aqui mantemos os nomes das colunas para o SELECT continuar literal).
export type ReferenceRow = {
  id: string;
  ref_type: ReferenceType;
  title: string;
  authors: string | null;
  year: number | null;
  doi: string | null;
  url: string | null;
  container_title: string | null;
  publisher: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  edition: string | null;
  abstract: string | null;
  isbn: string | null;
  issn: string | null;
  pmid: string | null;
  arxiv_id: string | null;
  accessed_at: string | null;
  citation_key: string | null;
  tags: string[];
  notes: string | null;
  is_essential: boolean;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_mime: string | null;
  created_at: string;
};

export const REFERENCE_TYPE_LABEL: Record<ReferenceType, string> = {
  article: "Artigo",
  preprint: "Preprint",
  book: "Livro",
  chapter: "Capítulo de livro",
  thesis: "Tese/dissertação",
  conference: "Trabalho em congresso",
  report: "Relatório",
  website: "Site/página",
  dataset: "Conjunto de dados",
  software: "Software",
  other: "Outro",
};

export const REFERENCE_TYPE_ORDER: ReferenceType[] = [
  "article",
  "preprint",
  "book",
  "chapter",
  "thesis",
  "conference",
  "report",
  "website",
  "dataset",
  "software",
  "other",
];

// Linha "de mentira" a partir do rascunho, só para o formatador de citação
// conseguir mostrar a prévia enquanto o usuário ainda está digitando.
export function draftToPreviewRow(draft: ReferenceDraft): ReferenceRow {
  return {
    id: "preview",
    ref_type: draft.refType,
    title: draft.title,
    authors: draft.authors,
    year: draft.year,
    doi: draft.doi,
    url: draft.url,
    container_title: draft.containerTitle,
    publisher: draft.publisher,
    volume: draft.volume,
    issue: draft.issue,
    pages: draft.pages,
    edition: draft.edition,
    abstract: draft.abstract,
    isbn: draft.isbn,
    issn: draft.issn,
    pmid: draft.pmid,
    arxiv_id: draft.arxivId,
    accessed_at: draft.accessedAt,
    citation_key: null,
    tags: draft.tags,
    notes: draft.notes,
    is_essential: draft.isEssential,
    file_path: draft.filePath,
    file_name: draft.fileName,
    file_size: draft.fileSize,
    file_mime: draft.fileMime,
    created_at: new Date().toISOString(),
  };
}

export function rowToDraft(row: ReferenceRow): ReferenceDraft {
  return {
    refType: row.ref_type,
    title: row.title,
    authors: row.authors,
    year: row.year,
    doi: row.doi,
    url: row.url,
    containerTitle: row.container_title,
    publisher: row.publisher,
    volume: row.volume,
    issue: row.issue,
    pages: row.pages,
    edition: row.edition,
    abstract: row.abstract,
    isbn: row.isbn,
    issn: row.issn,
    pmid: row.pmid,
    arxivId: row.arxiv_id,
    accessedAt: row.accessed_at,
    notes: row.notes,
    tags: row.tags ?? [],
    isEssential: row.is_essential,
    filePath: row.file_path,
    fileName: row.file_name,
    fileSize: row.file_size,
    fileMime: row.file_mime,
    csl: {},
  };
}
