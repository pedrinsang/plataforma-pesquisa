import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/queries";
import type { CustomValues } from "../../CustomFields";
import type { FieldDef } from "../../CustomFieldsManager";
import { SamplesManager, type Sample, type CaseOption } from "./SamplesManager";

export default async function SamplesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const [{ data: samples }, { data: cases }, { data: defs }, user] = await Promise.all([
    supabase
      .from("project_samples")
      .select("id, label, collected_at, case_id, notes, custom")
      .eq("project_id", projectId)
      .order("collected_at", { ascending: false }),
    supabase
      .from("project_cases")
      .select("id, code")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase
      .from("project_field_defs")
      .select("id, field_key, label, field_type, options, required")
      .eq("project_id", projectId)
      .eq("entity", "sample")
      .order("position", { ascending: true }),
    getUser(),
  ]);

  // Só owner/editor podem gerenciar; viewer apenas lê. A RLS já protege a
  // escrita — isto é só para mostrar/esconder os controles.
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

  const rows: Sample[] = (samples ?? []).map((s) => ({
    id: s.id,
    label: s.label,
    collected_at: s.collected_at,
    case_id: s.case_id,
    notes: s.notes,
    custom: (s.custom && typeof s.custom === "object" ? s.custom : {}) as CustomValues,
  }));

  const caseOptions: CaseOption[] = (cases ?? []).map((c) => ({ id: c.id, code: c.code }));

  const sampleFields: FieldDef[] = (defs ?? []).map((f) => ({
    ...f,
    entity: "sample",
    options: Array.isArray(f.options) ? (f.options as string[]) : [],
  }));

  return (
    <div className="space-y-5">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent-teal">
        Estatística · coleta de amostras
      </p>
      <SamplesManager
        projectId={projectId}
        samples={rows}
        cases={caseOptions}
        sampleFields={sampleFields}
        canManage={canManage}
      />
    </div>
  );
}
