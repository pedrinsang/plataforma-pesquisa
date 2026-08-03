import { createClient } from "@/lib/supabase/client";
import type { ReferenceRow } from "@/lib/references/types";

/**
 * Biblioteca do projeto vista de dentro do editor de Escrita. A aba
 * `references` carrega isso no servidor; aqui a leitura é do cliente (o painel
 * abre e fecha sem recarregar a página) e a RLS continua sendo a autorização —
 * quem não é membro do projeto simplesmente não recebe linha nenhuma.
 */
export async function listProjectReferences(projectId: string): Promise<ReferenceRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("project_references")
    .select("*")
    .eq("project_id", projectId)
    .order("is_essential", { ascending: false })
    .order("year", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    ...(row as ReferenceRow),
    tags: (row as ReferenceRow).tags ?? [],
  }));
}

// ── registro das referências vistas pelos nós de citação ────────────────────
// Um documento pode ter dezenas de citações apontando para a mesma biblioteca.
// Em vez de cada nó buscar a sua linha, o projeto inteiro é carregado uma vez e
// fica indexado por id. É o mesmo desenho do cache de `stat-sources`.

const registry = new Map<string, Promise<Map<string, ReferenceRow>>>();
const resolved = new Map<string, Map<string, ReferenceRow>>();

const REFRESH_EVENT = "folium:references-refresh";

function loadRegistry(projectId: string): Promise<Map<string, ReferenceRow>> {
  let pending = registry.get(projectId);
  if (!pending) {
    pending = listProjectReferences(projectId).then((rows) => {
      const map = new Map(rows.map((row) => [row.id, row]));
      resolved.set(projectId, map);
      return map;
    });
    registry.set(projectId, pending);
  }
  return pending;
}

/** A referência citada, ou `null` se ela foi removida da biblioteca. */
export async function getReference(
  projectId: string,
  referenceId: string,
): Promise<ReferenceRow | null> {
  const map = await loadRegistry(projectId);
  return map.get(referenceId) ?? null;
}

/** Leitura síncrona — só devolve algo se o projeto já tiver sido carregado. */
export function peekReference(projectId: string, referenceId: string): ReferenceRow | null {
  return resolved.get(projectId)?.get(referenceId) ?? null;
}

/**
 * Descarta o cache e manda os nós de citação buscarem de novo — usado quando a
 * biblioteca muda com o editor aberto (o painel Referências recarrega).
 */
export function refreshReferenceRegistry() {
  registry.clear();
  resolved.clear();
  if (typeof window !== "undefined") window.dispatchEvent(new Event(REFRESH_EVENT));
}

export function onReferencesRefresh(handler: () => void): () => void {
  window.addEventListener(REFRESH_EVENT, handler);
  return () => window.removeEventListener(REFRESH_EVENT, handler);
}

/** Artigo aberto no leitor lado a lado. */
export type OpenArticle = {
  id: string;
  title: string;
  /** Fonte a exibir no quadro (PDF anexado, DOI ou link). */
  src: string;
  /** Mesma fonte para "abrir em nova aba" — o PDF sai do route handler. */
  externalHref: string;
  /** PDF do bucket do projeto: sempre exibe embutido, sem risco de recusa. */
  isFile: boolean;
};

/**
 * Onde o artigo de uma referência pode ser lido, em ordem de preferência:
 * o PDF anexado (nosso, sempre embutível), depois o DOI, depois o link solto.
 * Devolve `null` quando a referência não tem nada para abrir.
 */
export function articleFromReference(
  reference: ReferenceRow,
  projectId: string,
): OpenArticle | null {
  if (reference.file_path) {
    const href = `/projects/${projectId}/references/${reference.id}/file`;
    return { id: reference.id, title: reference.title, src: href, externalHref: href, isFile: true };
  }
  const href = reference.doi
    ? `https://doi.org/${reference.doi}`
    : reference.url
      ? reference.url
      : null;
  if (!href) return null;
  return { id: reference.id, title: reference.title, src: href, externalHref: href, isFile: false };
}
