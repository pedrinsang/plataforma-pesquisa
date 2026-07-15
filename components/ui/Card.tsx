import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border-subtle bg-surface p-5 shadow-[0_1px_2px_rgba(28,26,23,0.04)] transition-colors",
        className,
      )}
      {...props}
    />
  );
}
