"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Botão de ícone da barra, com estado ativo e tooltip nativo. */
export function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "grid size-8 place-items-center rounded-md text-text-dim transition-colors",
        "hover:bg-[color:color-mix(in_srgb,var(--color-accent)_10%,transparent)] hover:text-foreground",
        "disabled:pointer-events-none disabled:opacity-40",
        active && "bg-accent-teal-soft text-accent-teal hover:text-accent-teal",
      )}
    >
      {children}
    </button>
  );
}

/** Agrupa controles com um respiro visual; usado com <Divider/>. */
export function ToolbarGroup({ children }: { children: ReactNode }) {
  return <div className="flex shrink-0 items-center gap-0.5">{children}</div>;
}

export function Divider() {
  return <span className="mx-1 h-6 w-px shrink-0 bg-border-subtle" aria-hidden />;
}

/**
 * Popover genérico: botão de gatilho + painel flutuante. Fecha ao clicar fora,
 * ao apertar Escape e ao selecionar um item (via callback close).
 */
export function Popover({
  trigger,
  children,
  align = "start",
  panelClassName,
}: {
  trigger: (props: { open: boolean; toggle: () => void; triggerRef: React.RefObject<HTMLButtonElement | null> }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {trigger({ open, toggle: () => setOpen((v) => !v), triggerRef })}
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-30 mt-1 min-w-[11rem] rounded-lg border border-border-subtle bg-surface p-1 shadow-lift",
            align === "end" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/** Gatilho retangular com rótulo + chevron (para fonte, título, espaçamento). */
export function DropdownTrigger({
  open,
  toggle,
  triggerRef,
  label,
  title,
  width,
}: {
  open: boolean;
  toggle: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  label: ReactNode;
  title: string;
  width?: string;
}) {
  return (
    <button
      ref={triggerRef}
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={toggle}
      aria-haspopup="menu"
      aria-expanded={open}
      title={title}
      className={cn(
        "flex h-8 items-center justify-between gap-1 rounded-md border border-transparent px-2 text-sm text-foreground transition-colors",
        "hover:bg-[color:color-mix(in_srgb,var(--color-accent)_10%,transparent)]",
        open && "bg-accent-teal-soft",
        width,
      )}
    >
      <span className="truncate">{label}</span>
      <ChevronDown size={14} className="shrink-0 text-text-dim" />
    </button>
  );
}

/** Item de menu dentro de um Popover. */
export function MenuItem({
  onClick,
  active = false,
  children,
  style,
}: {
  onClick: () => void;
  active?: boolean;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      style={style}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-foreground transition-colors",
        "hover:bg-[color:color-mix(in_srgb,var(--color-accent)_10%,transparent)]",
        active && "text-accent-teal",
      )}
    >
      {children}
    </button>
  );
}

/** Rótulo de seção dentro de um menu/painel. */
export function useToolbarId() {
  return useId();
}
