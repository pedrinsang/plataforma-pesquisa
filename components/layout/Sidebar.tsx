"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, LogOut, Plus } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { AppMark } from "./AppMark";

type Project = { id: string; title: string };

export function Sidebar({ projects, email }: { projects: Project[]; email: string }) {
  const pathname = usePathname();
  const activeProjectId = pathname.match(/^\/projects\/([^/]+)/)?.[1];
  const onProjects = pathname === "/projects";
  const initials = (email.trim()[0] ?? "?").toUpperCase();

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border-subtle bg-surface md:flex">
      {/* marca */}
      <Link href="/projects" className="flex items-center gap-2.5 px-5 pb-5 pt-5">
        <AppMark />
        <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
          Folium
        </span>
      </Link>

      {/* navegação principal */}
      <nav className="flex flex-col gap-1 px-3">
        <Link href="/projects" className="navlink" aria-current={onProjects ? "page" : undefined}>
          <FolderOpen size={17} strokeWidth={1.6} />
          Meus Projetos
        </Link>
      </nav>

      {/* projetos do usuário */}
      <div className="mb-1 mt-6 flex items-center justify-between px-6">
        <span className="text-[0.65rem] uppercase tracking-[0.16em] text-text-dim">Projetos</span>
        <span className="text-[0.7rem] tabular-nums text-text-dim">{projects.length}</span>
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {projects.length === 0 ? (
          <Link
            href="/projects"
            className="flex items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-accent-teal/50 px-3 py-2.5 text-sm text-accent-teal transition-colors hover:bg-accent-teal-soft"
          >
            <Plus size={15} />
            Criar primeiro projeto
          </Link>
        ) : (
          projects.map((project) => {
            const isActive = project.id === activeProjectId;
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="navlink !py-2 !text-[13.5px]"
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-[3px] font-serif text-[0.72rem] font-semibold"
                  style={{
                    background: "var(--color-accent-200)",
                    color: "var(--color-accent-800)",
                  }}
                >
                  {project.title.trim().charAt(0).toUpperCase() || "?"}
                </span>
                <span className="truncate">{project.title}</span>
              </Link>
            );
          })
        )}
      </div>

      {/* usuário */}
      <div className="mt-auto flex items-center gap-2.5 border-t border-border-subtle px-5 py-3.5">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full font-serif text-sm font-semibold"
          style={{ background: "var(--color-accent-200)", color: "var(--color-accent-800)" }}
        >
          {initials}
        </span>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[13px] font-semibold text-foreground">{email}</div>
          <div className="text-[11px] text-text-dim">Pesquisador(a)</div>
        </div>
        <form action={signOut} className="ml-auto">
          <button
            type="submit"
            title="Sair"
            aria-label="Sair"
            className="ib !size-8 !border-0 text-text-dim hover:text-accent-teal"
          >
            <LogOut size={16} />
          </button>
        </form>
      </div>
    </aside>
  );
}
