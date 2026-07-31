import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DocumentEditor } from "./DocumentEditor";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ projectId: string; documentId: string }>;
}) {
  const { projectId, documentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: document } = await supabase
    .from("documents")
    .select("id, title, content_json, word_goal")
    .eq("id", documentId)
    .single();

  if (!document) notFound();

  // Cabeçalho/rodapé em busca separada e tolerante: enquanto a migration
  // `20260728120000_document_header_footer` não roda (npx supabase db push), as
  // colunas não existem — aqui isso apenas mantém os campos vazios, sem quebrar.
  const { data: headerFooter } = await supabase
    .from("documents")
    .select("header_text, footer_text")
    .eq("id", documentId)
    .single();

  return (
    <DocumentEditor
      documentId={document.id}
      projectId={projectId}
      initialTitle={document.title}
      initialContent={document.content_json as object}
      initialWordGoal={document.word_goal}
      initialHeader={headerFooter?.header_text ?? null}
      initialFooter={headerFooter?.footer_text ?? null}
      userEmail={user?.email ?? ""}
    />
  );
}
