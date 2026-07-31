"use client";

import { type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Peças da faixa de opções ("ribbon") do editor em tela cheia. Todas as medidas
 * e cores vêm das classes `.fx-*` em `app/globals.css`, que por sua vez seguem o
 * design "Escrita — Editor em tela cheia": grupos com rótulo em mono embaixo,
 * botões de 32 px, seletores contornados e separadores verticais entre grupos.
 */

/** Grupo da faixa: uma linha de controles + rótulo em versalete embaixo. */
export function RibbonGroup({
  label,
  children,
  gap = 2,
}: {
  label: string;
  children: ReactNode;
  /** Espaço entre controles (px). 2 para ícones, 6 para combos. */
  gap?: number;
}) {
  return (
    <div className="fx-group">
      <div className="fx-group-row" style={{ gap }}>
        {children}
      </div>
      <span className="fx-group-label">{label}</span>
    </div>
  );
}

/** Separador vertical entre grupos da faixa. */
export function RibbonSep() {
  return <span className="fx-group-sep" aria-hidden />;
}

/** Separador curto dentro de um grupo. */
export function RibbonInlineSep() {
  return <span className="fx-inline-sep" aria-hidden />;
}

/** Botão de ícone (32×32) da faixa. */
export function RibbonButton({
  label,
  onClick,
  active = false,
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="fx-ico"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
    >
      {children}
    </button>
  );
}

/** Botão grande com ícone + rótulo (aba Inserir). */
export function RibbonBigButton({
  label,
  title,
  onClick,
  icon,
  active = false,
  disabled = false,
}: {
  label: string;
  title?: string;
  onClick: () => void;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="fx-big"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      title={title ?? label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/** Gatilho de combo contornado (estilo de bloco, fonte, entrelinha). */
export function RibbonSelectTrigger({
  open,
  toggle,
  triggerRef,
  label,
  title,
  width,
  style,
}: {
  open: boolean;
  toggle: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  label: ReactNode;
  title: string;
  width: number;
  style?: React.CSSProperties;
}) {
  return (
    <button
      ref={triggerRef}
      type="button"
      className={cn("fx-select", open && "is-open")}
      onMouseDown={(e) => e.preventDefault()}
      onClick={toggle}
      aria-haspopup="menu"
      aria-expanded={open}
      title={title}
      style={{ width, ...style }}
    >
      <span>{label}</span>
      <ChevronDown size={13} className="shrink-0" style={{ color: "rgba(236,234,231,.5)" }} />
    </button>
  );
}

/** Leitura estática da faixa (ex.: "3 figuras vinculadas"). */
export function RibbonReadout({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span
      className="flex items-center gap-1.5 whitespace-nowrap"
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "9.5px",
        letterSpacing: "0.08em",
        color: "var(--fx-faint)",
      }}
    >
      {icon}
      {children}
    </span>
  );
}
