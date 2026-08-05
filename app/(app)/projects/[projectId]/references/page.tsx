import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/queries";
import type { ReferenceRow } from "@/lib/references/types";
import { ReferencesManager } from "./ReferencesManager";

// Precisa ser um literal só: o supabase-js infere o tipo do retorno a partir
// da string do select — concatenar com "+" derruba a inferência.
// prettier-ignore
const REFERENCE_COLUMNS = "id, ref_type, title, authors, year, doi, url, container_title, publisher, volume, issue, pages, edition, place, institution, degree, program, issued_month, year_text, event_number, abstract, isbn, issn, pmid, arxiv_id, accessed_at, citation_key, tags, notes, is_essential, file_path, file_name, file_size, file_mime, created_at";

export default async function ReferencesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const [{ data: references }, user] = await Promise.all([
    supabase
      .from("project_references")
      .select(REFERENCE_COLUMNS)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    getUser(),
  ]);

  // Igual às outras telas: a RLS já barra a escrita; isto só mostra/esconde os
  // controles para quem é viewer.
  let canManage = false;
  if (user) {
    const { data: me } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();
    canManage = me?.role === "owner" || me?.role === "editor";
  }

  const rows: ReferenceRow[] = (references ?? []).map((r) => ({
    ...r,
    tags: Array.isArray(r.tags) ? r.tags : [],
  }));

  return (
    <div className="space-y-5">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent-teal">
        Projeto · biblioteca de referências
      </p>
      <ReferencesManager projectId={projectId} references={rows} canManage={canManage} />
    </div>
  );
}
