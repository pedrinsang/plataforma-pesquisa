import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getUser } from "@/lib/supabase/queries";
import { ProjectTabs } from "@/components/layout/ProjectTabs";
import { ProjectDescription } from "./ProjectDescription";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  // Revalida/renova a sessão do Supabase no limite do layout — sem isto o
  // layout pode consultar com token expirado, a RLS devolve vazio e cai em 404.
  // Deduplicado com a page via cache() (ver lib/supabase/queries.ts).
  await getUser();
  const project = await getProject(projectId);

  if (!project) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-2 text-[11.5px] text-text-dim">
        <Link href="/projects" className="transition-colors hover:text-accent-teal">
          Meus Projetos
        </Link>
        <span>/</span>
        <span className="text-accent-teal">Projeto</span>
      </div>
      <h1 className="mt-2 font-serif text-[29px] font-semibold tracking-tight text-foreground">
        {project.title}
      </h1>
      {project.description && (
        <div className="mt-2">
          <ProjectDescription text={project.description} />
        </div>
      )}
      <div className="mt-5">
        <ProjectTabs projectId={project.id} />
      </div>
      <div className="pt-7">{children}</div>
    </div>
  );
}
