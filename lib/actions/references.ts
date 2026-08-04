"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildCitationKey } from "@/lib/references/format";
import { lookupReference, searchCrossref, type LookupResult } from "@/lib/references/lookup";
import { REFERENCE_BUCKET } from "@/lib/references/storage";
import type { ReferenceDraft } from "@/lib/references/types";
import type { Json, ReferenceType } from "@/lib/types/database";

// Biblioteca de referências do projeto. A autorização é do banco (RLS de
// `project_references`: membro lê, owner/editor escreve) — estas actions
// validam a entrada, cuidam da chave de citação e propagam o erro.

export type ReferenceActionState = { error: string | null };

const REF_TYPES = new Set<ReferenceType>([
  "article", "preprint", "book", "chapter", "thesis", "conference",
  "report", "website", "dataset", "software", "other",
]);

function text(value: string | null | undefined, max = 2000): string | null {
  const s = value?.trim();
  if (!s) return null;
  return s.slice(0, max);
}

function normalizeUrl(value: string | null | undefined): string | null {
  const s = text(value, 2000);
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) return `https://${s}`;
  return s;
}

// Traduz o rascunho do formulário para as colunas da tabela, já saneado.
function toRow(draft: ReferenceDraft) {
  const year = draft.year;
  return {
    ref_type: REF_TYPES.has(draft.refType) ? draft.refType : "other",
    title: text(draft.title, 600) ?? "",
    authors: text(draft.authors, 2000),
    year: typeof year === "number" && year > 1000 && year < 2200 ? year : null,
    doi: text(draft.doi, 300)?.toLowerCase() ?? null,
    url: normalizeUrl(draft.url),
    container_title: text(draft.containerTitle, 400),
    publisher: text(draft.publisher, 300),
    volume: text(draft.volume, 60),
    issue: text(draft.issue, 60),
    pages: text(draft.pages, 60),
    edition: text(draft.edition, 100),
    place: text(draft.place, 200),
    institution: text(draft.institution, 400),
    degree: text(draft.degree, 100),
    program: text(draft.program, 200),
    issued_month: text(draft.issuedMonth, 40),
    year_text: text(draft.yearText, 40),
    event_number: text(draft.eventNumber, 20),
    abstract: text(draft.abstract, 8000),
    isbn: text(draft.isbn, 40),
    issn: text(draft.issn, 40),
    pmid: text(draft.pmid, 20),
    arxiv_id: text(draft.arxivId, 60),
    accessed_at: text(draft.accessedAt, 10),
    notes: text(draft.notes, 4000),
    tags: (draft.tags ?? []).map((t) => t.trim()).filter(Boolean).slice(0, 20),
    is_essential: Boolean(draft.isEssential),
    file_path: text(draft.filePath, 400),
    file_name: text(draft.fileName, 300),
    file_size: typeof draft.fileSize === "number" ? draft.fileSize : null,
    file_mime: text(draft.fileMime, 120),
  };
}

// A referência aparece na própria biblioteca e no card da Visão geral, e vai
// aparecer nas citações da Escrita — revalida a subárvore do projeto.
function revalidateReferences(projectId: string) {
  revalidatePath(`/projects/${projectId}`, "layout");
}

async function nextCitationKey(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  draft: ReferenceDraft,
): Promise<string> {
  const { data } = await supabase
    .from("project_references")
    .select("citation_key")
    .eq("project_id", projectId);
  const taken = (data ?? [])
    .map((r) => r.citation_key)
    .filter((k): k is string => Boolean(k));
  return buildCitationKey(draft.authors, draft.year, draft.title, taken);
}

function friendlyError(message: string): string {
  if (/duplicate key|already exists/i.test(message)) {
    return "Essa referência já está na biblioteca (mesmo DOI).";
  }
  if (/row-level security|permission/i.test(message)) {
    return "Você não tem permissão para editar as referências deste projeto.";
  }
  return "Não foi possível salvar a referência.";
}

export async function createReference(
  projectId: string,
  draft: ReferenceDraft,
): Promise<ReferenceActionState & { id?: string }> {
  const row = toRow(draft);
  if (!row.title) return { error: "Informe o título da referência." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data, error } = await supabase
    .from("project_references")
    .insert({
      ...row,
      project_id: projectId,
      citation_key: await nextCitationKey(supabase, projectId, draft),
      csl: (draft.csl ?? {}) as Json,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: friendlyError(error.message) };

  revalidateReferences(projectId);
  return { error: null, id: data?.id };
}

export async function updateReference(
  referenceId: string,
  projectId: string,
  draft: ReferenceDraft,
): Promise<ReferenceActionState> {
  const row = toRow(draft);
  if (!row.title) return { error: "Informe o título da referência." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_references")
    .update(row)
    .eq("id", referenceId)
    .eq("project_id", projectId);

  if (error) return { error: friendlyError(error.message) };

  revalidateReferences(projectId);
  return { error: null };
}

export async function deleteReference(
  referenceId: string,
  projectId: string,
): Promise<ReferenceActionState> {
  const supabase = await createClient();

  // Busca o arquivo antes de apagar a linha — depois do delete não há como
  // saber o path, e o objeto ficaria órfão no Storage.
  const { data: existing } = await supabase
    .from("project_references")
    .select("file_path")
    .eq("id", referenceId)
    .eq("project_id", projectId)
    .maybeSingle();

  const { error } = await supabase
    .from("project_references")
    .delete()
    .eq("id", referenceId)
    .eq("project_id", projectId);

  if (error) return { error: friendlyError(error.message) };

  if (existing?.file_path) {
    await supabase.storage.from(REFERENCE_BUCKET).remove([existing.file_path]);
  }

  revalidateReferences(projectId);
  return { error: null };
}

export async function setReferenceEssential(
  referenceId: string,
  projectId: string,
  isEssential: boolean,
): Promise<ReferenceActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_references")
    .update({ is_essential: isEssential })
    .eq("id", referenceId)
    .eq("project_id", projectId);

  if (error) return { error: friendlyError(error.message) };

  revalidateReferences(projectId);
  return { error: null };
}

// ── importação de metadados ─────────────────────────────────────────────────

/**
 * Resolve um link/DOI/PMID/ISBN/título em uma referência preenchida, usando
 * apenas APIs bibliográficas públicas (Crossref, PubMed, arXiv, OpenLibrary) e
 * as meta tags da página. Roda no servidor porque o navegador esbarraria em
 * CORS e porque a URL precisa passar pela checagem anti-SSRF.
 */
export async function importReferenceMetadata(input: string): Promise<LookupResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  return lookupReference(input.slice(0, 1000));
}

/** Busca bibliográfica por título/autor no Crossref (quando não há link nem DOI). */
export async function searchReferenceMetadata(query: string): Promise<ReferenceDraft[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  return searchCrossref(query.slice(0, 300));
}
