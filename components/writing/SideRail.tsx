"use client";

import {
  BarChart3,
  BookMarked,
  Files,
  History,
  ListTree,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Painéis do trilho da direita — os instrumentos que vêm de fora do texto. */
export type RightPanel = "stats" | "references" | "articles";
/** Painéis do trilho da esquerda — a navegação do próprio texto. */
export type LeftPanel = "outline" | "notes" | "versions";

export type RailPanel = RightPanel | LeftPanel;

/**
 * Trilhos de painéis (44 px cada). Os seis instrumentos ficavam numa coluna só,
 * à direita, e os rótulos verticais não cabiam na altura de um notebook — a
 * lista era cortada. Agora são dois trilhos: à direita os instrumentos externos
 * (Estatísticas · Referências · Artigos), à esquerda a navegação do texto
 * (Sumário · Notas · Versões). Os itens ainda não implementados ficam apagados.
 */
export function SideRail({
  side,
  open,
  onToggle,
  articleCount = 0,
}: {
  side: "left" | "right";
  open: RailPanel | null;
  onToggle: (panel: RailPanel) => void;
  /** Quantos artigos estão abertos no leitor (selo do item "Artigos"). */
  articleCount?: number;
}) {
  return (
    <div className={cn("fx-rail print:hidden", side === "left" && "fx-rail-side-left")}>
      {side === "right" ? (
        <>
          <RailItem
            label="Estatísticas"
            icon={<BarChart3 size={16} />}
            active={open === "stats"}
            onClick={() => onToggle("stats")}
          />
          <RailItem
            label="Referências"
            icon={<BookMarked size={16} />}
            active={open === "references"}
            onClick={() => onToggle("references")}
          />
          <RailItem
            label="Artigos"
            icon={<Files size={16} />}
            active={open === "articles"}
            badge={articleCount || undefined}
            onClick={() => onToggle("articles")}
          />
        </>
      ) : (
        <>
          <RailItem
            label="Sumário"
            icon={<ListTree size={16} />}
            active={open === "outline"}
            onClick={() => onToggle("outline")}
          />
          <RailItem label="Notas" icon={<MessageSquare size={16} />} soon />
          <RailItem label="Versões" icon={<History size={16} />} soon />
        </>
      )}
    </div>
  );
}

function RailItem({
  label,
  icon,
  active = false,
  soon = false,
  badge,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  soon?: boolean;
  badge?: number;
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
      {badge != null && <span className="fx-rail-badge">{badge}</span>}
      <span className="fx-rail-label">{label}</span>
    </button>
  );
}
