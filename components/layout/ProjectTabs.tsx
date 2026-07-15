"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, PenLine, LineChart } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  const tabs = [
    { href: `/projects/${projectId}`, label: "Visão geral", exact: true, Icon: LayoutGrid, activeClass: "border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300" },
    { href: `/projects/${projectId}/writing`, label: "Escrita", Icon: PenLine, activeClass: "border-amber-600 text-amber-700 dark:border-amber-400 dark:text-amber-300" },
    { href: `/projects/${projectId}/statistics`, label: "Estatística", Icon: LineChart, activeClass: "border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300" },
  ];

  return (
    <div className="flex gap-1 border-b border-border-subtle">
      {tabs.map((tab) => {
        const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? tab.activeClass
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
            )}
          >
            <tab.Icon size={16} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
