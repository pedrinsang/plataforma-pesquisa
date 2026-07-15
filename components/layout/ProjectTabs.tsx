"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  const tabs = [
    { href: `/projects/${projectId}`, label: "Visão geral", exact: true },
    { href: `/projects/${projectId}/writing`, label: "Escrita" },
    { href: `/projects/${projectId}/statistics`, label: "Estatística" },
  ];

  return (
    <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium",
              isActive
                ? "border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
