"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";

const GAP = 4;
const EDGE = 8;

/**
 * Popover genérico do editor: botão de gatilho + painel flutuante.
 *
 * O painel é levado por portal para o `.folium-shell` (ou para o `body`, fora do
 * editor) e posicionado com `position: fixed` a partir do retângulo do gatilho.
 * Sem isso ele era **cortado** pelas faixas que têm rolagem própria (a faixa de
 * opções tem `overflow-x`, e qualquer ancestral com overflow recorta um filho
 * `absolute`). Fecha ao clicar fora, com Escape e ao escolher um item.
 */
export function Popover({
  trigger,
  children,
  align = "start",
  panelClassName,
  openSignal,
}: {
  trigger: (props: {
    open: boolean;
    toggle: () => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
  }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
  panelClassName?: string;
  /** Incrementar este número abre o popover de fora (ex.: atalho de teclado). */
  openSignal?: number;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);

  // Abertura externa via sinal: ajusta o estado durante o render quando o sinal
  // muda (padrão recomendado do React, sem efeito). 0/undefined = inicial.
  const [prevSignal, setPrevSignal] = useState(openSignal);
  if (openSignal !== prevSignal) {
    setPrevSignal(openSignal);
    if (openSignal) setOpen(true);
  }

  // Hospedeiro do portal: o shell do editor (para herdar a ilha de tinta) ou o
  // body. Resolvido só no cliente, quando o gatilho já existe.
  useEffect(() => {
    if (!open) return;
    setHost(triggerRef.current?.closest<HTMLElement>(".folium-shell") ?? document.body);
  }, [open]);

  const place = useCallback(() => {
    const t = triggerRef.current;
    if (!t) return;
    const r = t.getBoundingClientRect();
    const panel = panelRef.current;
    const w = panel?.offsetWidth ?? 0;
    const h = panel?.offsetHeight ?? 0;

    let left = align === "end" ? r.right - w : r.left;
    left = Math.min(Math.max(left, EDGE), Math.max(window.innerWidth - w - EDGE, EDGE));

    // Abre para baixo; se não couber, vira para cima do gatilho.
    let top = r.bottom + GAP;
    if (h > 0 && top + h > window.innerHeight - EDGE) {
      top = Math.max(r.top - GAP - h, EDGE);
    }
    setPos({ top, left });
  }, [align]);

  // Mede o painel já montado antes do primeiro paint, para não haver salto.
  useLayoutEffect(() => {
    if (!open || !host) return;
    place();
  }, [open, host, place]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    // Reposiciona quando a faixa rola na horizontal ou a janela muda de tamanho.
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  return (
    <div ref={rootRef} className="relative flex">
      {trigger({ open, toggle: () => setOpen((v) => !v), triggerRef })}
      {open &&
        host &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, visibility: pos ? "visible" : "hidden" }}
            className={cn(
              "fixed z-[60] min-w-[11rem] rounded-lg border border-border-subtle bg-surface p-1 shadow-lift print:hidden",
              panelClassName,
            )}
          >
            {children(() => setOpen(false))}
          </div>,
          host,
        )}
    </div>
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
export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-text-dim">
      {children}
    </p>
  );
}

export function MenuDivider() {
  return <div className="my-1 h-px bg-border-subtle" />;
}
