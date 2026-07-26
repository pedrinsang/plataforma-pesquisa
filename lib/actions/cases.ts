"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CaseStatus, Json } from "@/lib/types/database";

// CRUD dos casos (agrupam amostras). Campos do núcleo (code/description/status)
// + o jsonb `custom` com os campos definidos pelo projeto. A RLS de
// `project_cases` só deixa owner/editor escrever.

export type CaseActionState = { error: string | null };

const STATUSES: CaseStatus[] = ["active", "completed", "archived"];

// Um caso aparece na lista, no detalhe e influencia a lista de amostras (código
// do caso). Revalida a subárvore inteira do projeto.
function revalidateCases(projectId: string) {
  revalidatePath(`/projects/${projectId}`, "layout");
}

export async function createCase(
  projectId: string,
  input: { code: string; description?: string | null; status?: CaseStatus; custom?: Record<string, Json> },
): Promise<CaseActionState> {
  const code = input.code.trim();
  if (!code) return { error: "Informe um código para o caso." };
  const status = input.status && STATUSES.includes(input.status) ? input.status : "active";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase.from("project_cases").insert({
    project_id: projectId,
    code,
    description: input.description?.trim() || null,
    status,
    custom: input.custom ?? {},
    created_by: user.id,
  });

  if (error) return { error: "Não foi possível criar o caso." };

  revalidateCases(projectId);
  return { error: null };
}

export async function updateCase(
  caseId: string,
  projectId: string,
  input: { code: string; description?: string | null; status?: CaseStatus; custom?: Record<string, Json> },
): Promise<CaseActionState> {
  const code = input.code.trim();
  if (!code) return { error: "O código do caso não pode ficar vazio." };
  const status = input.status && STATUSES.includes(input.status) ? input.status : "active";

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_cases")
    .update({
      code,
      description: input.description?.trim() || null,
      status,
      custom: input.custom ?? {},
    })
    .eq("id", caseId);

  if (error) return { error: "Não foi possível salvar o caso." };

  revalidateCases(projectId);
  return { error: null };
}

export async function deleteCase(caseId: string, projectId: string): Promise<void> {
  const supabase = await createClient();
  // As amostras do caso não são apagadas: o FK usa on delete set null, então
  // elas voltam a ficar sem caso em vez de sumir.
  await supabase.from("project_cases").delete().eq("id", caseId);
  revalidateCases(projectId);
}
