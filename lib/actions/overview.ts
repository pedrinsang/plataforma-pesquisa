"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Metadados exibidos no dashboard: tipo do estudo, código do protocolo e a meta
// de amostras (denominador de "coletadas X/Y"). RLS restringe a owner/editor.
export async function updateProjectMeta(
  projectId: string,
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const projectType = String(formData.get("project_type") ?? "").trim();
  const protocolCode = String(formData.get("protocol_code") ?? "").trim();
  const targetRaw = String(formData.get("sample_target") ?? "").trim();
  const sampleTarget = targetRaw === "" ? null : Number.parseInt(targetRaw, 10);

  if (sampleTarget !== null && (!Number.isFinite(sampleTarget) || sampleTarget < 0)) {
    return { error: "A meta de amostras deve ser um número positivo." };
  }

  const { error } = await supabase
    .from("projects")
    .update({
      project_type: projectType || null,
      protocol_code: protocolCode || null,
      sample_target: sampleTarget,
    })
    .eq("id", projectId);

  if (error) return { error: "Não foi possível salvar os metadados." };

  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}
