import { cn } from "@/lib/utils/cn";

/**
 * Marca Folium: a agulha de uma bússola inscrita num círculo — o "V" que
 * aponta o rumo. Traço fino em petróleo, no espírito editorial do sistema.
 * (O glifo em si — agulha de bússola — é herança do nome anterior; revisar
 * se quiser um símbolo alinhado a "Folium".)
 */
export function AppMark({ className, size = 26 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      aria-hidden
      className={cn("shrink-0 text-accent-teal", className)}
    >
      <circle cx="13" cy="13" r="12" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M7 8l6 11 6-11"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
