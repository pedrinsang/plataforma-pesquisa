"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, PenLine, LineChart } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  const tabs = [
    { href: `/projects/${projectId}`, label: "Visão geral", exact: true, Icon: LayoutGrid },
    { href: `/projects/${projectId}/writing`, label: "Escrita", Icon: PenLine },
    { href: `/projects/${projectId}/statistics`, label: "Estatística", Icon: LineChart },
  ];

  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border-subtle bg-surface-dim/60 p-1">
      {tabs.map((tab) => {
        const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
              isActive
                ? "bg-surface text-foreground shadow-card"
                : "text-text-dim hover:text-foreground",
            )}
          >
            <tab.Icon size={16} className={isActive ? "text-accent-teal" : undefined} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
