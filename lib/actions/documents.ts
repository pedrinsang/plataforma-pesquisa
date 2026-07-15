"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DocumentTemplateId } from "@/lib/writing/templates";
import { DOCUMENT_TEMPLATES } from "@/lib/writing/templates";

export async function createDocument(
  projectId: string,
  title: string,
  templateId: DocumentTemplateId,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("documents")
    .insert({
      project_id: projectId,
      title: title.trim() || "Documento sem título",
      content_json: DOCUMENT_TEMPLATES[templateId].content(),
      template_type: templateId === "em_branco" ? null : templateId,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Não foi possível criar o documento.");
  }

  revalidatePath(`/projects/${projectId}/writing/documents`);
  redirect(`/projects/${projectId}/writing/documents/${data.id}`);
}

export async function updateDocumentContent(documentId: string, contentJson: unknown) {
  const supabase = await createClient();
  await supabase.from("documents").update({ content_json: contentJson }).eq("id", documentId);
}

export async function updateDocumentTitle(
  documentId: string,
  projectId: string,
  title: string,
) {
  const supabase = await createClient();
  await supabase
    .from("documents")
    .update({ title: title.trim() || "Documento sem título" })
    .eq("id", documentId);
  revalidatePath(`/projects/${projectId}/writing/documents`);
}

export async function updateWordGoal(documentId: string, wordGoal: number | null) {
  const supabase = await createClient();
  await supabase.from("documents").update({ word_goal: wordGoal }).eq("id", documentId);
}

export async function deleteDocument(documentId: string, projectId: string) {
  const supabase = await createClient();
  await supabase.from("documents").delete().eq("id", documentId);
  revalidatePath(`/projects/${projectId}/writing/documents`);
  redirect(`/projects/${projectId}/writing/documents`);
}
