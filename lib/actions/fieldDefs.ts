"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FieldEntity, FieldType } from "@/lib/types/database";

// CRUD das definições de campos personalizados (project_field_defs). Cada projeto
// define seus próprios campos para Casos e Amostras; os valores ficam no jsonb
// `custom` de cada registro. A RLS só deixa owner/editor escrever.

export type FieldDefActionState = { error: string | null };

const TYPES: FieldType[] = ["text", "textarea", "number", "date", "select", "boolean"];

// Campos de exemplo genéricos, oferecidos quando o projeto ainda não tem nenhum.
// Servem para o usuário entender o recurso e já sair com algo útil — pode editar
// ou apagar à vontade. Cobrem os vários tipos de campo de propósito.
const EXAMPLE_FIELDS: Record<FieldEntity, { label: string; fieldType: FieldType; options?: string[] }[]> = {
  case: [
    { label: "Origem", fieldType: "select", options: ["Cirurgia", "Biópsia", "Campo", "Arquivo", "Outra"] },
    { label: "Data de coleta", fieldType: "date" },
    { label: "Responsável", fieldType: "text" },
    { label: "Observações", fieldType: "textarea" },
  ],
  sample: [
    { label: "Tipo de material", fieldType: "select", options: ["Tecido", "Sangue", "Swab", "Outro"] },
    { label: "Quantidade", fieldType: "number" },
    { label: "Condição", fieldType: "select", options: ["Adequada", "Parcial", "Inadequada"] },
    { label: "Observações", fieldType: "textarea" },
  ],
};

// As definições aparecem nas telas de Casos, Amostras e no detalhe do caso;
// revalida a subárvore inteira do projeto.
function revalidateFieldDefs(projectId: string) {
  revalidatePath(`/projects/${projectId}`, "layout");
}

// Chave estável derivada do rótulo (sem acento/espaço) — é o nome usado dentro
// do jsonb `custom`. Não muda em edições para não órfãos os valores já salvos.
function slugify(label: string): string {
  const base = label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return base || "campo";
}

// `select` guarda os rótulos das opções; os demais tipos ignoram opções.
function cleanOptions(type: FieldType, options: string[] | undefined): string[] {
  if (type !== "select" || !options) return [];
  return Array.from(new Set(options.map((o) => o.trim()).filter(Boolean)));
}

export async function createFieldDef(
  projectId: string,
  input: {
    entity: FieldEntity;
    label: string;
    fieldType: FieldType;
    options?: string[];
    required?: boolean;
  },
): Promise<FieldDefActionState> {
  const label = input.label.trim();
  if (!label) return { error: "Informe um nome para o campo." };
  if (!TYPES.includes(input.fieldType)) return { error: "Tipo de campo inválido." };
  const options = cleanOptions(input.fieldType, input.options);
  if (input.fieldType === "select" && options.length === 0) {
    return { error: "Adicione pelo menos uma opção para o campo de seleção." };
  }

  const supabase = await createClient();

  // novo campo vai para o fim da lista da sua entidade
  const { data: last } = await supabase
    .from("project_field_defs")
    .select("position")
    .eq("project_id", projectId)
    .eq("entity", input.entity)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.position ?? -1) + 1;

  const { error } = await supabase.from("project_field_defs").insert({
    project_id: projectId,
    entity: input.entity,
    field_key: slugify(label),
    label,
    field_type: input.fieldType,
    options,
    required: input.required ?? false,
    position,
  });

  if (error) {
    if (error.code === "23505") return { error: "Já existe um campo com esse nome nesta seção." };
    return { error: "Não foi possível criar o campo." };
  }

  revalidateFieldDefs(projectId);
  return { error: null };
}

export async function updateFieldDef(
  fieldId: string,
  projectId: string,
  input: { label: string; fieldType: FieldType; options?: string[]; required?: boolean },
): Promise<FieldDefActionState> {
  const label = input.label.trim();
  if (!label) return { error: "O nome do campo não pode ficar vazio." };
  if (!TYPES.includes(input.fieldType)) return { error: "Tipo de campo inválido." };
  const options = cleanOptions(input.fieldType, input.options);
  if (input.fieldType === "select" && options.length === 0) {
    return { error: "Adicione pelo menos uma opção para o campo de seleção." };
  }

  const supabase = await createClient();
  // field_key não muda de propósito: preserva os valores já gravados no `custom`.
  const { error } = await supabase
    .from("project_field_defs")
    .update({ label, field_type: input.fieldType, options, required: input.required ?? false })
    .eq("id", fieldId);

  if (error) return { error: "Não foi possível salvar o campo." };

  revalidateFieldDefs(projectId);
  return { error: null };
}

export async function deleteFieldDef(fieldId: string, projectId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("project_field_defs").delete().eq("id", fieldId);
  revalidateFieldDefs(projectId);
}

// Sobe/desce um campo trocando a `position` com o vizinho da mesma entidade.
export async function moveFieldDef(
  projectId: string,
  fieldId: string,
  entity: FieldEntity,
  direction: "up" | "down",
): Promise<void> {
  const supabase = await createClient();
  const { data: list } = await supabase
    .from("project_field_defs")
    .select("id, position")
    .eq("project_id", projectId)
    .eq("entity", entity)
    .order("position", { ascending: true });
  if (!list) return;

  const idx = list.findIndex((f) => f.id === fieldId);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= list.length) return;

  const current = list[idx];
  const neighbor = list[swapIdx];
  await supabase.from("project_field_defs").update({ position: neighbor.position }).eq("id", current.id);
  await supabase.from("project_field_defs").update({ position: current.position }).eq("id", neighbor.id);

  revalidateFieldDefs(projectId);
}

// Insere o conjunto de campos de exemplo de uma entidade, pulando os que já
// existem (por field_key). Usado no estado inicial das telas de Casos/Amostras.
export async function addExampleFields(
  projectId: string,
  entity: FieldEntity,
): Promise<FieldDefActionState> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("project_field_defs")
    .select("field_key, position")
    .eq("project_id", projectId)
    .eq("entity", entity);
  const existingKeys = new Set((existing ?? []).map((e) => e.field_key));
  let position = Math.max(-1, ...(existing ?? []).map((e) => e.position)) + 1;

  const rows = EXAMPLE_FIELDS[entity]
    .map((d) => ({ ...d, field_key: slugify(d.label) }))
    .filter((d) => !existingKeys.has(d.field_key))
    .map((d) => ({
      project_id: projectId,
      entity,
      field_key: d.field_key,
      label: d.label,
      field_type: d.fieldType,
      options: cleanOptions(d.fieldType, d.options),
      required: false,
      position: position++,
    }));

  if (rows.length === 0) return { error: null };

  const { error } = await supabase.from("project_field_defs").insert(rows);
  if (error) return { error: "Não foi possível adicionar os campos de exemplo." };

  revalidateFieldDefs(projectId);
  return { error: null };
}
