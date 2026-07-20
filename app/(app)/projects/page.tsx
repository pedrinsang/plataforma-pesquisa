import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import { accentFor } from "@/lib/utils/accent";
import { NewProjectForm } from "./NewProjectForm";
import { PendingInvites } from "./PendingInvites";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, description, created_at")
    .order("created_at", { ascending: false });

  const count = projects?.length ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-text-dim">
            Seu acervo · {count} {count === 1 ? "projeto" : "projetos"}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-foreground">
            Projetos de pesquisa
          </h1>
        </div>
        <NewProjectForm />
      </div>

      <PendingInvites />

      {count > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects!.map((project) => {
            const accent = accentFor(project.id);
            return (
              <Link key={project.id} href={`/projects/${project.id}`} className="group">
                <Card interactive className="relative flex h-full flex-col overflow-hidden">
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-0 top-0 h-[3px]",
                      accent === "teal" ? "bg-accent-teal" : "bg-accent-gold",
                    )}
                  />
                  <div className="flex items-start justify-between">
                    <span
                      className={cn(
                        "flex size-11 items-center justify-center rounded-xl font-serif text-xl font-semibold",
                        accent === "teal"
                          ? "bg-accent-teal-soft text-accent-teal"
                          : "bg-accent-gold-soft text-accent-gold",
                      )}
                    >
                      {project.title.trim().charAt(0).toUpperCase() || "?"}
                    </span>
                    <ArrowUpRight
                      size={18}
                      className="text-text-dim opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                    />
                  </div>
                  <h2 className="mt-4 font-serif text-lg font-semibold leading-snug text-foreground">
                    {project.title}
                  </h2>
                  {project.description ? (
                    <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-text-dim">
                      {project.description}
                    </p>
                  ) : (
                    <p className="mt-1.5 flex-1 text-sm italic text-text-dim/70">Sem descrição</p>
                  )}
                  <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-wide text-text-dim">
                    {new Date(project.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface/50 px-6 py-16 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-accent-teal-soft font-serif text-2xl text-accent-teal">
            +
          </div>
          <h2 className="mt-4 font-serif text-xl font-semibold text-foreground">
            Comece seu primeiro projeto
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-text-dim">
            Reúna escrita, referências e dados de uma pesquisa em um só lugar. Use o botão
            “Novo projeto” acima.
          </p>
        </div>
      )}
    </div>
  );
}
