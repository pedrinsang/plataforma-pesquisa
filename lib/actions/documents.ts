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

export async function updateDocumentHeaderFooter(
  documentId: string,
  header: string | null,
  footer: string | null,
) {
  const supabase = await createClient();
  await supabase
    .from("documents")
    .update({
      header_text: header && header.trim() !== "" ? header : null,
      footer_text: footer && footer.trim() !== "" ? footer : null,
    })
    .eq("id", documentId);
}

/**
 * Configuração de página do documento — margens (cm) e entrelinha do corpo.
 * Os limites repetem os CHECKs da tabela: a paginação mede a área de texto a
 * partir daqui, e uma margem maior que a folha deixaria a altura útil negativa.
 */
export async function updateDocumentPageSetup(
  documentId: string,
  setup: {
    marginTop: number;
    marginRight: number;
    marginBottom: number;
    marginLeft: number;
    /** `null` = a entrelinha padrão do editor, que é o que o documento já tinha. */
    lineHeight: number | null;
  },
) {
  const cm = (v: number, max: number) =>
    Math.min(Math.max(Number.isFinite(v) ? v : 0, 0), max);

  const supabase = await createClient();
  await supabase
    .from("documents")
    .update({
      margin_top: cm(setup.marginTop, 10),
      margin_right: cm(setup.marginRight, 10),
      margin_bottom: cm(setup.marginBottom, 10),
      margin_left: cm(setup.marginLeft, 10),
      line_height:
        setup.lineHeight === null || !Number.isFinite(setup.lineHeight)
          ? null
          : Math.min(Math.max(setup.lineHeight, 0.5), 3),
    })
    .eq("id", documentId);
}

export async function deleteDocument(documentId: string, projectId: string) {
  const supabase = await createClient();
  await supabase.from("documents").delete().eq("id", documentId);
  revalidatePath(`/projects/${projectId}/writing/documents`);
  redirect(`/projects/${projectId}/writing/documents`);
}
