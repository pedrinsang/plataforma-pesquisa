import Link from "next/link";
import { Database } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NewDatasetForm } from "./NewDatasetForm";

export default async function DatasetsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: datasets } = await supabase
    .from("datasets")
    .select("id, name, description, updated_at")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-4">
      <NewDatasetForm projectId={projectId} />

      {datasets && datasets.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {datasets.map((ds) => (
            <Link key={ds.id} href={`/projects/${projectId}/statistics/datasets/${ds.id}`} className="group">
              <div className="panel-ink relative flex h-full flex-col overflow-hidden rounded-xl border border-[color:var(--ink-border)] p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
                <div className="grid-teal pointer-events-none absolute inset-0 opacity-50" aria-hidden />
                <Database size={18} className="relative text-accent-teal" />
                <h3 className="relative mt-3 font-serif text-base font-semibold text-[color:var(--ink-text)]">{ds.name}</h3>
                {ds.description && (
                  <p className="relative mt-1 line-clamp-2 text-sm text-[color:var(--ink-dim)]">{ds.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface/50 px-6 py-14 text-center text-sm text-text-dim">
          Nenhuma planilha de dados ainda. Crie a primeira acima.
        </div>
      )}
    </div>
  );
}
