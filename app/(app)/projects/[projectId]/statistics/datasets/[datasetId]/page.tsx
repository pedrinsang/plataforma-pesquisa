import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DataGrid } from "@/components/statistics/DataGrid";
import { DeleteDatasetButton } from "./DeleteDatasetButton";

export default async function DatasetDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; datasetId: string }>;
}) {
  const { projectId, datasetId } = await params;
  const supabase = await createClient();

  const [{ data: dataset }, { data: columns }, { data: rows }] = await Promise.all([
    supabase.from("datasets").select("id, name, description").eq("id", datasetId).single(),
    supabase
      .from("dataset_columns")
      .select("id, name, data_type, position")
      .eq("dataset_id", datasetId)
      .order("position", { ascending: true }),
    supabase
      .from("dataset_rows")
      .select("id, data")
      .eq("dataset_id", datasetId)
      .order("position", { ascending: true }),
  ]);

  if (!dataset) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle pb-5">
        <div>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent-teal">
            Coleta de dados
          </p>
          <h2 className="mt-1.5 font-serif text-2xl font-semibold text-foreground">{dataset.name}</h2>
          {dataset.description && (
            <p className="mt-1 max-w-xl text-sm text-text-dim">{dataset.description}</p>
          )}
        </div>
        <DeleteDatasetButton datasetId={datasetId} projectId={projectId} />
      </div>

      <DataGrid
        projectId={projectId}
        datasetId={datasetId}
        initialColumns={columns ?? []}
        initialRows={rows ?? []}
      />
    </div>
  );
}
