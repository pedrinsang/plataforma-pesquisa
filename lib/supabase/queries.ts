import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Helpers deduplicados por request via cache() do React. O layout e a page da
// tela de projeto renderizam no mesmo request, então cada um destes faz no
// máximo UM round-trip ao Supabase por navegação (antes eram 2 de auth + 2 do
// projeto). A segunda chamada, de qualquer arquivo, reaproveita a promise.

// Renova/valida a sessão no servidor de auth do Supabase. Chamado no layout
// para revalidar o token no limite do request; a page reaproveita o resultado.
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

// Superset das colunas que layout (id, title, description) e page
// (+ project_type, protocol_code, sample_target) precisam — uma busca só.
export const getProject = cache(async (projectId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, title, description, project_type, protocol_code, sample_target")
    .eq("id", projectId)
    .single();
  return data;
});
