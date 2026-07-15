"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type Project = { id: string; title: string };

export function Sidebar({ projects }: { projects: Project[] }) {
  const pathname = usePathname();
  const activeProjectId = pathname.match(/^\/projects\/([^/]+)/)?.[1];

  return (
    <nav className="flex w-60 shrink-0 flex-col gap-1 border-r border-zinc-200 p-3 dark:border-zinc-800">
      <Link
        href="/projects"
        className="mb-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        ← Todos os projetos
      </Link>
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className={cn(
            "truncate rounded-md px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800",
            project.id === activeProjectId
              ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : "text-zinc-700 dark:text-zinc-300",
          )}
        >
          {project.title}
        </Link>
      ))}
    </nav>
  );
}
