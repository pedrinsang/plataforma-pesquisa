import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { NewProjectForm } from "./NewProjectForm";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, description, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Seus projetos de pesquisa
        </h1>
      </div>

      <NewProjectForm />

      {projects && projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="mb-2 inline-flex size-8 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <FolderOpen size={16} />
                </div>
                <h2 className="font-medium text-foreground">{project.title}</h2>
                {project.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {project.description}
                  </p>
                )}
                <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                  Criado em {new Date(project.created_at).toLocaleDateString("pt-BR")}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Você ainda não tem nenhum projeto de pesquisa. Crie o primeiro acima.
        </Card>
      )}
    </div>
  );
}
