"use client";

import {
  BarChart3,
  BookMarked,
  Files,
  History,
  ListTree,
  MessageSquare,
} from "lucide-react";

export type RailPanel = "stats" | "outline";

/**
 * Trilho de painéis à direita (44 px). O primeiro bloco são os instrumentos
 * (dados, referências, artigos); o segundo, a navegação do próprio texto. Os
 * itens ainda não implementados ficam apagados e desabilitados, como no design.
 */
export function SideRail({
  open,
  onToggle,
}: {
  open: RailPanel | null;
  onToggle: (panel: RailPanel) => void;
}) {
  return (
    <div className="fx-rail print:hidden">
      <RailItem
        label="Estatísticas"
        icon={<BarChart3 size={16} />}
        active={open === "stats"}
        onClick={() => onToggle("stats")}
      />
      <RailItem label="Referências" icon={<BookMarked size={16} />} soon />
      <RailItem label="Artigos" icon={<Files size={16} />} soon />

      <span className="fx-rail-sep" aria-hidden />

      <RailItem
        label="Sumário"
        icon={<ListTree size={16} />}
        active={open === "outline"}
        onClick={() => onToggle("outline")}
      />
      <RailItem label="Notas" icon={<MessageSquare size={16} />} soon />
      <RailItem label="Versões" icon={<History size={16} />} soon />
    </div>
  );
}

function RailItem({
  label,
  icon,
  active = false,
  soon = false,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  soon?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="fx-rail-item"
      onClick={onClick}
      disabled={soon}
      aria-pressed={active}
      title={soon ? `${label} — em breve` : label}
    >
      {icon}
      <span className="fx-rail-label">{label}</span>
    </button>
  );
}
