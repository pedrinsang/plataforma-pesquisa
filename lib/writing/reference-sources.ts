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
