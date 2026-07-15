"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DatasetColumnType } from "@/lib/types/database";

export async function createDataset(projectId: string, name: string, description: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("datasets")
    .insert({
      project_id: projectId,
      name: name.trim() || "Planilha sem título",
      description: description.trim() || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Não foi possível criar a planilha.");
  }

  revalidatePath(`/projects/${projectId}/statistics/datasets`);
  redirect(`/projects/${projectId}/statistics/datasets/${data.id}`);
}

export async function addColumn(
  datasetId: string,
  projectId: string,
  name: string,
  dataType: DatasetColumnType,
  position: number,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dataset_columns")
    .insert({
      dataset_id: datasetId,
      project_id: projectId,
      name: name.trim() || "Coluna",
      data_type: dataType,
      position,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Não foi possível adicionar a coluna.");
  }

  revalidatePath(`/projects/${projectId}/statistics/datasets/${datasetId}`);
  return data.id;
}

export async function deleteColumn(columnId: string, projectId: string, datasetId: string) {
  const supabase = await createClient();
  await supabase.from("dataset_columns").delete().eq("id", columnId);
  revalidatePath(`/projects/${projectId}/statistics/datasets/${datasetId}`);
}

export async function addRow(datasetId: string, projectId: string, position: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dataset_rows")
    .insert({ dataset_id: datasetId, project_id: projectId, position, data: {} })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Não foi possível adicionar a linha.");
  }

  revalidatePath(`/projects/${projectId}/statistics/datasets/${datasetId}`);
  return data.id;
}

export async function updateRowData(rowId: string, data: Record<string, unknown>) {
  const supabase = await createClient();
  await supabase.from("dataset_rows").update({ data }).eq("id", rowId);
}

export async function deleteRow(rowId: string, projectId: string, datasetId: string) {
  const supabase = await createClient();
  await supabase.from("dataset_rows").delete().eq("id", rowId);
  revalidatePath(`/projects/${projectId}/statistics/datasets/${datasetId}`);
}

export async function deleteDataset(datasetId: string, projectId: string) {
  const supabase = await createClient();
  await supabase.from("datasets").delete().eq("id", datasetId);
  revalidatePath(`/projects/${projectId}/statistics/datasets`);
  redirect(`/projects/${projectId}/statistics/datasets`);
}
