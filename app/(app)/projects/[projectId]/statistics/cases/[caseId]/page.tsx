import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/queries";
import type { CustomValues } from "../../../CustomFields";
import type { FieldDef } from "../../../CustomFieldsManager";
import type { CaseRow } from "../CaseModal";
import type { Sample } from "../../samples/SampleModal";
import { CaseDetail } from "./CaseDetail";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; caseId: string }>;
}) {
  const { projectId, caseId } = await params;
  const supabase = await createClient();

  const [{ data: caseRow }, { data: samples }, { data: sampleDefs }, { data: caseDefs }, user] =
    await Promise.all([
      supabase
        .from("project_cases")
        .select("id, code, description, status, custom")
        .eq("id", caseId)
        .eq("project_id", projectId)
        .maybeSingle(),
      supabase
        .from("project_samples")
        .select("id, label, collected_at, case_id, notes, custom")
        .eq("case_id", caseId)
        .order("collected_at", { ascending: false }),
      supabase
        .from("project_field_defs")
        .select("id, field_key, label, field_type, options, required")
        .eq("project_id", projectId)
        .eq("entity", "sample")
        .order("position", { ascending: true }),
      supabase
        .from("project_field_defs")
        .select("id, field_key, label, field_type, options, required")
        .eq("project_id", projectId)
        .eq("entity", "case")
        .order("position", { ascending: true }),
      getUser(),
    ]);

  if (!caseRow) notFound();

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

  const caseData: CaseRow = {
    id: caseRow.id,
    code: caseRow.code,
    description: caseRow.description,
    status: caseRow.status,
    custom: (caseRow.custom && typeof caseRow.custom === "object" ? caseRow.custom : {}) as CustomValues,
    sampleCount: rows.length,
  };

  const caseFields: FieldDef[] = (caseDefs ?? []).map((f) => ({
    ...f,
    entity: "case",
    options: Array.isArray(f.options) ? (f.options as string[]) : [],
  }));
  const sampleFields: FieldDef[] = (sampleDefs ?? []).map((f) => ({
    ...f,
    entity: "sample",
    options: Array.isArray(f.options) ? (f.options as string[]) : [],
  }));

  return (
    <CaseDetail
      projectId={projectId}
      caseData={caseData}
      caseFields={caseFields}
      samples={rows}
      sampleFields={sampleFields}
      canManage={canManage}
    />
  );
}
