import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { EditProjectForm } from "../EditProjectForm";
import { ProjectMetaForm } from "../ProjectMetaForm";
import { ParticipantsCard } from "../ParticipantsCard";
import { DeleteProjectButton } from "../DeleteProjectButton";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, title, description, project_type, protocol_code, sample_target")
    .eq("id", projectId)
    .single();

  if (!project) notFound();

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-[0.7rem] uppercase tracking-[0.14em] text-accent-teal">
            Detalhes do projeto
          </h2>
          <EditProjectForm
            projectId={project.id}
            title={project.title}
            description={project.description}
          />
        </Card>

        <Card className="space-y-4">
          <h2 className="text-[0.7rem] uppercase tracking-[0.14em] text-accent-teal">
            Metadados & painel
          </h2>
          <ProjectMetaForm
            projectId={project.id}
            projectType={project.project_type}
            protocolCode={project.protocol_code}
            sampleTarget={project.sample_target}
          />
        </Card>
      </div>

      <ParticipantsCard projectId={project.id} />

      {/* zona de risco */}
      <Card className="flex flex-wrap items-center justify-between gap-3 !border-[color-mix(in_srgb,var(--color-neg)_45%,transparent)]">
        <div>
          <h2 className="font-serif text-lg font-semibold" style={{ color: "var(--color-neg)" }}>
            Zona de risco
          </h2>
          <p className="text-sm text-text-dim">Excluir o projeto apaga todo o seu conteúdo.</p>
        </div>
        <DeleteProjectButton projectId={project.id} />
      </Card>
    </div>
  );
}
