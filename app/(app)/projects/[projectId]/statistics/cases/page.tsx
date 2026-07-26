import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/queries";
import type { CustomValues } from "../../CustomFields";
import type { FieldDef } from "../../CustomFieldsManager";
import { CasesManager, type CaseRow } from "./CasesManager";

export default async function CasesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const [{ data: cases }, { data: sampleRows }, { data: defs }, user] = await Promise.all([
    supabase
      .from("project_cases")
      .select("id, code, description, status, custom, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase.from("project_samples").select("case_id").eq("project_id", projectId),
    supabase
      .from("project_field_defs")
      .select("id, field_key, label, field_type, options, required")
      .eq("project_id", projectId)
      .eq("entity", "case")
      .order("position", { ascending: true }),
    getUser(),
  ]);

  // owner/editor gerencia; viewer só lê (a RLS protege a escrita de verdade).
  let canManage = false;
  if (user) {
    const { data: me } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();
    canManage = me?.role === "owner" || me?.role === "editor";
  }

  // contagem de amostras por caso
  const counts = new Map<string, number>();
  for (const s of sampleRows ?? []) {
    if (s.case_id) counts.set(s.case_id, (counts.get(s.case_id) ?? 0) + 1);
  }

  const rows: CaseRow[] = (cases ?? []).map((c) => ({
    id: c.id,
    code: c.code,
    description: c.description,
    status: c.status,
    custom: (c.custom && typeof c.custom === "object" ? c.custom : {}) as CustomValues,
    sampleCount: counts.get(c.id) ?? 0,
  }));

  const caseFields: FieldDef[] = (defs ?? []).map((f) => ({
    ...f,
    entity: "case",
    options: Array.isArray(f.options) ? (f.options as string[]) : [],
  }));

  return (
    <div className="space-y-5">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent-teal">
        Rastreabilidade · casos e amostras
      </p>
      <CasesManager
        projectId={projectId}
        cases={rows}
        caseFields={caseFields}
        canManage={canManage}
      />
    </div>
  );
}
