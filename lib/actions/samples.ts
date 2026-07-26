"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/types/database";

// CRUD das amostras (coleta de campo). A autorização é do banco: a RLS de
// `project_samples` só deixa owner/editor escrever — estas actions apenas
// validam a entrada e propagam o erro caso a RLS recuse.

export type SampleActionState = { error: string | null };

type SampleInput = {
  label?: string | null;
  collectedAt: string;
  caseId?: string | null;
  notes?: string | null;
  custom?: Record<string, Json>;
};

// O <input type="date"> manda "YYYY-MM-DD"; guardamos como timestamptz em UTC
// (meia-noite) para o dia bater na exibição e no gráfico semanal, sem drift de
// fuso.
function parseCollectedAt(value: string): string | null {
  const s = value.trim();
  if (!s) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// Uma amostra aparece na lista de amostras, na visão geral (card + gráfico) e no
// detalhe do caso a que pertence. Revalida a subárvore inteira do projeto.
function revalidateSamples(projectId: string) {
  revalidatePath(`/projects/${projectId}`, "layout");
}

export async function createSample(
  projectId: string,
  input: SampleInput,
): Promise<SampleActionState> {
  const collected_at = parseCollectedAt(input.collectedAt);
  if (!collected_at) return { error: "Informe uma data de coleta válida." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase.from("project_samples").insert({
    project_id: projectId,
    label: input.label?.trim() || null,
    collected_at,
    case_id: input.caseId || null,
    notes: input.notes?.trim() || null,
    custom: input.custom ?? {},
    created_by: user.id,
  });

  if (error) return { error: "Não foi possível registrar a amostra." };

  revalidateSamples(projectId);
  return { error: null };
}

export async function updateSample(
  sampleId: string,
  projectId: string,
  input: SampleInput,
): Promise<SampleActionState> {
  const collected_at = parseCollectedAt(input.collectedAt);
  if (!collected_at) return { error: "Informe uma data de coleta válida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_samples")
    .update({
      label: input.label?.trim() || null,
      collected_at,
      case_id: input.caseId || null,
      notes: input.notes?.trim() || null,
      custom: input.custom ?? {},
    })
    .eq("id", sampleId);

  if (error) return { error: "Não foi possível salvar a amostra." };

  revalidateSamples(projectId);
  return { error: null };
}

export async function deleteSample(sampleId: string, projectId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("project_samples").delete().eq("id", sampleId);
  revalidateSamples(projectId);
}
