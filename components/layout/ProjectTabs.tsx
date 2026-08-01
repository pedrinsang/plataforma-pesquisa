"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, PenLine, LineChart, BookMarked, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  const tabs = [
    { href: `/projects/${projectId}`, label: "Visão geral", exact: true, Icon: LayoutGrid },
    { href: `/projects/${projectId}/writing`, label: "Escrita", Icon: PenLine },
    { href: `/projects/${projectId}/statistics`, label: "Estatística", Icon: LineChart },
    { href: `/projects/${projectId}/references`, label: "Referências", Icon: BookMarked },
    { href: `/projects/${projectId}/settings`, label: "Configurações", Icon: Settings2 },
  ];

  return (
    <div className="flex flex-wrap gap-1 border-b border-border-subtle">
      {tabs.map((tab) => {
        const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm transition-colors",
              isActive
                ? "border-accent-teal text-accent-teal"
                : "border-transparent text-text-dim hover:text-foreground",
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
