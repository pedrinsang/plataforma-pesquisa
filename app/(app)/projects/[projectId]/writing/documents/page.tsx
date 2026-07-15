import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { NewDocumentForm } from "./NewDocumentForm";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, updated_at")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-4">
      <NewDocumentForm projectId={projectId} />

      {documents && documents.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {documents.map((doc) => (
            <Link key={doc.id} href={`/projects/${projectId}/writing/documents/${doc.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <h3 className="font-medium text-zinc-900 dark:text-zinc-50">{doc.title}</h3>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  Atualizado em {new Date(doc.updated_at).toLocaleDateString("pt-BR")}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Nenhum documento ainda. Crie o primeiro acima.
        </Card>
      )}
    </div>
  );
}
