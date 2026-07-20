import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const ACCENT_CLASSES = {
  amber: "bg-accent-gold-soft text-accent-gold",
  teal: "bg-accent-teal-soft text-accent-teal",
} as const;

const ACCENT_BAR = {
  amber: "bg-accent-gold",
  teal: "bg-accent-teal",
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
  const clickable = Boolean(href) && !comingSoon;

  const content = (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface p-5 shadow-card transition-all duration-200",
        clickable && "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lift",
        comingSoon && "opacity-60",
      )}
    >
      {clickable && (
        <span
          aria-hidden
          className={cn("absolute inset-y-0 left-0 w-[3px] opacity-0 transition-opacity group-hover:opacity-100", ACCENT_BAR[accent])}
        />
      )}
      <div className="flex items-center justify-between">
        <div className={cn("inline-flex size-10 items-center justify-center rounded-lg", ACCENT_CLASSES[accent])}>
          <Icon size={18} />
        </div>
        {comingSoon ? (
          <span className="rounded-full bg-surface-dim px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wide text-text-dim">
            Em breve
          </span>
        ) : clickable ? (
          <ArrowRight
            size={16}
            className="text-text-dim opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
          />
        ) : null}
      </div>
      <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-text-dim">{description}</p>
    </div>
  );

  if (!clickable) return content;

  return <Link href={href!}>{content}</Link>;
}
