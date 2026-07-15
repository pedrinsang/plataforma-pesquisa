"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Project = { id: string; title: string };

export function Sidebar({ projects }: { projects: Project[] }) {
  const pathname = usePathname();
  const activeProjectId = pathname.match(/^\/projects\/([^/]+)/)?.[1];

  return (
    <nav className="flex w-64 shrink-0 flex-col gap-0.5 border-r border-border-subtle bg-surface p-3">
      <Link
        href="/projects"
        className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-900/5 dark:text-zinc-400 dark:hover:bg-white/10"
      >
        <ArrowLeft size={16} />
        Todos os projetos
      </Link>
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className={cn(
            "flex items-center gap-2.5 truncate rounded-lg px-3 py-2 text-sm transition-colors",
            project.id === activeProjectId
              ? "bg-indigo-500/10 font-medium text-indigo-700 dark:text-indigo-300"
              : "text-zinc-700 hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-white/10",
          )}
        >
          <FolderOpen size={16} className="shrink-0 opacity-70" />
          <span className="truncate">{project.title}</span>
        </Link>
      ))}
    </nav>
  );
}
