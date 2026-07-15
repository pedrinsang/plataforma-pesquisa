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
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="font-serif text-2xl font-semibold text-foreground">{project.title}</h1>
      <ProjectTabs projectId={project.id} />
      <div className="pt-4">{children}</div>
    </div>
  );
}
