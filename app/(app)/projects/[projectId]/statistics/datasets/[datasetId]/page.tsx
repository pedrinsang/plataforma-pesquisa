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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-medium text-foreground">{dataset.name}</h2>
          {dataset.description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{dataset.description}</p>
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
