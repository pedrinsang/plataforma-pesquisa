import Link from "next/link";
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
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Seus projetos de pesquisa
        </h1>
      </div>

      <NewProjectForm />

      {projects && projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <h2 className="font-medium text-zinc-900 dark:text-zinc-50">{project.title}</h2>
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
