import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { EditProjectForm } from "./EditProjectForm";
import { DeleteProjectButton } from "./DeleteProjectButton";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, title, description")
    .eq("id", projectId)
    .single();

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href={`/projects/${projectId}/writing`}>
          <Card className="h-full transition-shadow hover:shadow-md">
            <h2 className="font-medium text-zinc-900 dark:text-zinc-50">✍️ Escrita</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Documentos, notas e referências bibliográficas.
            </p>
          </Card>
        </Link>
        <Link href={`/projects/${projectId}/statistics`}>
          <Card className="h-full transition-shadow hover:shadow-md">
            <h2 className="font-medium text-zinc-900 dark:text-zinc-50">📊 Estatística</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Plano de pesquisa, coleta de dados e gráficos.
            </p>
          </Card>
        </Link>
      </div>

      <Card className="max-w-lg space-y-4">
        <h2 className="font-medium text-zinc-900 dark:text-zinc-50">Detalhes do projeto</h2>
        <EditProjectForm
          projectId={project.id}
          title={project.title}
          description={project.description}
        />
      </Card>

      <Card className="max-w-lg space-y-3 border-red-200 dark:border-red-900">
        <h2 className="font-medium text-red-700 dark:text-red-400">Zona de risco</h2>
        <DeleteProjectButton projectId={project.id} />
      </Card>
    </div>
  );
}
