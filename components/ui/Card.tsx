import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

// Card Folium: superfície com borda fina (hairline), sem preenchimento de
// acento. Elevação é um sussurro (--elev-*). `interactive` adiciona o lift.
export function Card({
  className,
  interactive,
  ...props
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-border-subtle bg-surface p-[var(--space-4)] transition-all duration-200",
        interactive && "mcard hover:border-accent-teal/40",
        className,
      )}
      {...props}
    />
  );
}
