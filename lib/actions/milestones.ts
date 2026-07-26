"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MilestoneStatus } from "@/lib/types/database";

// CRUD e reordenação dos marcos (linha do tempo). A autorização é do banco: a
// RLS de `project_milestones` só deixa owner/editor escrever — estas actions
// não precisam checar papel, apenas propagar o erro caso a RLS recuse.

export type MilestoneActionState = { error: string | null };

export async function createMilestone(
  projectId: string,
  input: { title: string; detail?: string | null },
): Promise<MilestoneActionState> {
  const title = input.title.trim();
  if (!title) return { error: "Informe um título para o marco." };
  const detail = input.detail?.trim() || null;

  const supabase = await createClient();

  // novo marco vai para o fim da lista (maior position + 1)
  const { data: last } = await supabase
    .from("project_milestones")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.position ?? -1) + 1;

  const { error } = await supabase
    .from("project_milestones")
    .insert({ project_id: projectId, title, detail, position });

  if (error) return { error: "Não foi possível adicionar o marco." };

  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function updateMilestone(
  milestoneId: string,
  projectId: string,
  input: { title: string; detail: string | null },
): Promise<MilestoneActionState> {
  const title = input.title.trim();
  if (!title) return { error: "O título não pode ficar vazio." };
  const detail = input.detail?.trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_milestones")
    .update({ title, detail })
    .eq("id", milestoneId);

  if (error) return { error: "Não foi possível salvar o marco." };

  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function setMilestoneStatus(
  milestoneId: string,
  projectId: string,
  status: MilestoneStatus,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("project_milestones").update({ status }).eq("id", milestoneId);
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteMilestone(milestoneId: string, projectId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("project_milestones").delete().eq("id", milestoneId);
  revalidatePath(`/projects/${projectId}`);
}

// Sobe/desce um marco trocando a `position` com o vizinho. Relê a ordem do banco
// (não confia na posição vinda do cliente) e faz o swap dos dois valores.
export async function moveMilestone(
  projectId: string,
  milestoneId: string,
  direction: "up" | "down",
): Promise<void> {
  const supabase = await createClient();
  const { data: list } = await supabase
    .from("project_milestones")
    .select("id, position")
    .eq("project_id", projectId)
    .order("position", { ascending: true });
  if (!list) return;

  const idx = list.findIndex((m) => m.id === milestoneId);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= list.length) return;

  const current = list[idx];
  const neighbor = list[swapIdx];
  await supabase
    .from("project_milestones")
    .update({ position: neighbor.position })
    .eq("id", current.id);
  await supabase
    .from("project_milestones")
    .update({ position: current.position })
    .eq("id", neighbor.id);

  revalidatePath(`/projects/${projectId}`);
}
