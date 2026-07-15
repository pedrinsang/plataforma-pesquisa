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
  const { data: document } = await supabase
    .from("documents")
    .select("id, title, content_json, word_goal")
    .eq("id", documentId)
    .single();

  if (!document) notFound();

  return (
    <DocumentEditor
      documentId={document.id}
      projectId={projectId}
      initialTitle={document.title}
      initialContent={document.content_json as object}
      initialWordGoal={document.word_goal}
    />
  );
}
