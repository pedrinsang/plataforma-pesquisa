import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NewProjectForm } from "./NewProjectForm";
import { PendingInvites } from "./PendingInvites";
import { JoinWithCodeForm } from "./JoinWithCodeForm";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, description, created_at")
    .order("created_at", { ascending: false });

  const count = projects?.length ?? 0;
  const firstName = (user?.email ?? "").split("@")[0].split(/[.\-_]/)[0];
  const name = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : "pesquisador(a)";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* cabeçalho da página */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2.5">
            <h1 className="font-serif text-[30px] font-semibold tracking-tight text-foreground">
              Meus Projetos
            </h1>
            <span className="text-[13px] text-text-dim">
              {count} {count === 1 ? "projeto" : "projetos"}
            </span>
          </div>
          <p className="mt-1.5 text-[13px] text-text-dim">
            {greeting()}, {name} — sua pesquisa, do texto aos dados.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <JoinWithCodeForm />
          <NewProjectForm />
        </div>
      </div>

      <PendingInvites />

      {/* grade de projetos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NewProjectForm variant="tile" />

        {projects?.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="card mcard elev-sm group !gap-2.5 !p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] uppercase tracking-[0.06em] tabular-nums text-text-dim">
                {new Date(project.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <ArrowUpRight
                size={17}
                className="text-text-dim opacity-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
              />
            </div>

            <h2 className="font-serif text-[18px] font-semibold leading-snug text-foreground">
              {project.title}
            </h2>

            {project.description ? (
              <p className="line-clamp-3 flex-1 text-[13px] leading-relaxed text-text-dim">
                {project.description}
              </p>
            ) : (
              <p className="flex-1 text-[13px] italic text-text-dim/70">Sem descrição</p>
            )}

            <div className="mt-1 flex items-center gap-2 border-t border-border-subtle pt-2.5">
              <span className="tag tag-outline">Projeto</span>
              <span className="ml-auto inline-flex items-center gap-1 text-[12px] text-accent-teal opacity-0 transition-opacity group-hover:opacity-100">
                Abrir
              </span>
            </div>
          </Link>
        ))}
      </div>

      {count === 0 && (
        <p className="max-w-md text-[13px] leading-relaxed text-text-dim">
          Você ainda não tem projetos. Comece pelo cartão <em>Criar projeto</em> acima para reunir
          escrita, referências e dados de uma pesquisa em um só lugar.
        </p>
      )}
    </div>
  );
}
