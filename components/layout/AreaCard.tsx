import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

const ACCENT_CLASSES = {
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  teal: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
  indigo: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
} as const;

type Accent = keyof typeof ACCENT_CLASSES;

export function AreaCard({
  href,
  icon: Icon,
  title,
  description,
  accent,
  comingSoon,
}: {
  href?: string;
  icon: LucideIcon;
  title: string;
  description: string;
  accent: Accent;
  comingSoon?: boolean;
}) {
  const content = (
    <Card
      className={cn(
        "h-full",
        href && !comingSoon && "transition-all hover:-translate-y-0.5 hover:shadow-md",
        comingSoon && "opacity-70",
      )}
    >
      <div className={cn("mb-3 inline-flex size-9 items-center justify-center rounded-lg", ACCENT_CLASSES[accent])}>
        <Icon size={18} />
      </div>
      <h3 className="font-medium text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      {comingSoon && (
        <span className="mt-2 inline-block text-xs font-medium text-zinc-400 dark:text-zinc-500">
          Em breve
        </span>
      )}
    </Card>
  );

  if (!href || comingSoon) return content;

  return <Link href={href}>{content}</Link>;
}
