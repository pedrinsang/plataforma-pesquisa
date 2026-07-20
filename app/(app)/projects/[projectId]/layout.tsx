import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectTabs } from "@/components/layout/ProjectTabs";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, title")
    .eq("id", projectId)
    .single();

  if (!project) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-text-dim">
        <span className="size-1.5 rounded-full bg-accent-teal" />
        Workspace do projeto
      </div>
      <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-foreground">
        {project.title}
      </h1>
      <div className="mt-5">
        <ProjectTabs projectId={project.id} />
      </div>
      <div className="pt-7">{children}</div>
    </div>
  );
}
