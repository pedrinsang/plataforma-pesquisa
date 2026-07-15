import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
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
        <div className="grid gap-3 sm:grid-cols-2">
          {datasets.map((ds) => (
            <Link key={ds.id} href={`/projects/${projectId}/statistics/datasets/${ds.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <h3 className="font-medium text-zinc-900 dark:text-zinc-50">{ds.name}</h3>
                {ds.description && (
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{ds.description}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Nenhuma planilha de dados ainda. Crie a primeira acima.
        </Card>
      )}
    </div>
  );
}
