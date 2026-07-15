import { notFound } from "next/navigation";
import { PenLine, LineChart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { AreaCard } from "@/components/layout/AreaCard";
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
        <AreaCard
          href={`/projects/${projectId}/writing`}
          icon={PenLine}
          accent="amber"
          title="Escrita"
          description="Documentos, notas e referências bibliográficas."
        />
        <AreaCard
          href={`/projects/${projectId}/statistics`}
          icon={LineChart}
          accent="teal"
          title="Estatística"
          description="Plano de pesquisa, coleta de dados e gráficos."
        />
      </div>

      <Card className="max-w-lg space-y-4">
        <h2 className="font-medium text-foreground">Detalhes do projeto</h2>
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
