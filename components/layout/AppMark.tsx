import { cn } from "@/lib/utils/cn";

/**
 * Mark da marca: três linhas de texto que ascendem até um nó dourado —
 * o próprio conceito "do texto aos dados" reduzido a um glifo.
 */
export function AppMark({ className, size = 26 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <rect
        x="1"
        y="1"
        width="24"
        height="24"
        rx="7"
        className="fill-accent-teal-soft stroke-accent-teal"
        strokeWidth="1.2"
      />
      <path
        d="M6 17.5 L11 14 L15.5 15.5 L20 8"
        className="stroke-accent-teal"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="6" y1="20.5" x2="16" y2="20.5" className="stroke-accent-teal" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
      <circle cx="20" cy="8" r="2.4" className="fill-accent-gold" />
    </svg>
  );
}
