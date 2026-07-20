"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { accentFor } from "@/lib/utils/accent";

type Project = { id: string; title: string };

export function Sidebar({ projects }: { projects: Project[] }) {
  const pathname = usePathname();
  const activeProjectId = pathname.match(/^\/projects\/([^/]+)/)?.[1];

  return (
    <nav className="hidden w-64 shrink-0 flex-col border-r border-border-subtle bg-surface-dim/60 md:flex">
      <Link
        href="/projects"
        className="mx-3 mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-text-dim transition-colors hover:bg-surface hover:text-foreground"
      >
        <ArrowLeft size={15} />
        Todos os projetos
      </Link>

      <div className="mx-3 mb-2 mt-5 flex items-center justify-between px-3">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-text-dim">
          Projetos
        </span>
        <span className="font-mono text-[0.65rem] text-text-dim">{projects.length}</span>
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {projects.length === 0 ? (
          <Link
            href="/projects"
            className="flex items-center gap-2 rounded-lg border border-dashed border-border-strong px-3 py-2.5 text-sm text-text-dim transition-colors hover:border-accent-teal hover:text-foreground"
          >
            <Plus size={15} />
            Criar primeiro projeto
          </Link>
        ) : (
          projects.map((project) => {
            const isActive = project.id === activeProjectId;
            const accent = accentFor(project.id);
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={cn(
                  "group relative flex items-center gap-2.5 truncate rounded-lg py-2 pl-3 pr-2 text-sm transition-all",
                  isActive
                    ? "bg-surface font-medium text-foreground shadow-card"
                    : "text-text-dim hover:bg-surface/60 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full transition-all",
                    isActive
                      ? accent === "teal"
                        ? "bg-accent-teal"
                        : "bg-accent-gold"
                      : "bg-transparent",
                  )}
                />
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-md font-mono text-[0.7rem] font-semibold uppercase",
                    accent === "teal"
                      ? "bg-accent-teal-soft text-accent-teal"
                      : "bg-accent-gold-soft text-accent-gold",
                  )}
                >
                  {project.title.trim().charAt(0) || "?"}
                </span>
                <span className="truncate">{project.title}</span>
              </Link>
            );
          })
        )}
      </div>
    </nav>
  );
}
