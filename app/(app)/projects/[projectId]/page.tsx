import Link from "next/link";
import { notFound } from "next/navigation";
import { PenLine, LineChart, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { EditProjectForm } from "./EditProjectForm";
import { DeleteProjectButton } from "./DeleteProjectButton";
import { ParticipantsCard } from "./ParticipantsCard";

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
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Escrita — superfície de manuscrito */}
        <Link href={`/projects/${projectId}/writing`} className="group">
          <div className="ruled-paper relative flex h-full flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-gold hover:shadow-lift">
            <div className="flex items-center justify-between">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent-gold-soft text-accent-gold">
                <PenLine size={20} />
              </span>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-accent-gold">
                Manuscrito
              </span>
            </div>
            <h2 className="mt-5 font-serif text-2xl font-semibold italic text-foreground">Escrita</h2>
            <p className="mt-1 flex-1 text-sm text-text-dim">
              Documentos, notas e referências bibliográficas em um só fluxo.
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent-gold">
              Abrir área
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>

        {/* Estatística — superfície de instrumento */}
        <Link href={`/projects/${projectId}/statistics`} className="group">
          <div className="panel-ink relative flex h-full flex-col overflow-hidden rounded-2xl border border-transparent p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
            <div className="grid-teal pointer-events-none absolute inset-0 opacity-60" aria-hidden />
            <div className="relative flex items-center justify-between">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent-teal/15 text-accent-teal">
                <LineChart size={20} />
              </span>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-accent-teal">
                Instrumento
              </span>
            </div>
            <h2 className="relative mt-5 font-serif text-2xl font-semibold text-white">Estatística</h2>
            <p className="relative mt-1 flex-1 text-sm text-[#8592a8]">
              Plano de pesquisa, coleta de dados e gráficos — sem sair do navegador.
            </p>
            <span className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent-teal">
              Abrir área
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-text-dim">
            Detalhes do projeto
          </h2>
          <EditProjectForm
            projectId={project.id}
            title={project.title}
            description={project.description}
          />
        </Card>

        <ParticipantsCard projectId={project.id} />
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-3 border-red-200 dark:border-red-900/60">
        <div>
          <h2 className="font-medium text-red-700 dark:text-red-400">Zona de risco</h2>
          <p className="text-sm text-text-dim">Excluir o projeto apaga todo o seu conteúdo.</p>
        </div>
        <DeleteProjectButton projectId={project.id} />
      </Card>
    </div>
  );
}
