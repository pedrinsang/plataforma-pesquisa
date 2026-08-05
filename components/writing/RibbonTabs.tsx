"use client";

import { ChevronUp } from "lucide-react";

export const RIBBON_TABS = [
  "Início",
  "Inserir",
  "Layout",
  "Revisão",
  "Referências",
] as const;

/**
 * Abas que só aparecem quando o cursor está dentro do objeto que elas comandam
 * (a "Ferramentas de Tabela" do Word). Ficam depois de um separador e em
 * dourado — ver `.fx-tab-ctx` em `app/globals.css`.
 */
export const CONTEXTUAL_TABS = ["Tabela"] as const;

export type RibbonTab = (typeof RIBBON_TABS)[number] | (typeof CONTEXTUAL_TABS)[number];

/** Segunda linha do chrome: as abas da faixa + o gatilho de recolher a faixa. */
export function RibbonTabs({
  active,
  onSelect,
  collapsed,
  onToggleCollapsed,
  contextual = [],
}: {
  active: RibbonTab;
  onSelect: (tab: RibbonTab) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Abas contextuais visíveis agora (ex.: "Tabela", com o cursor numa). */
  contextual?: readonly RibbonTab[];
}) {
  return (
    <div className="fx-row fx-tabbar print:hidden" role="tablist" aria-label="Faixa de opções">
      <div className="flex items-stretch gap-0.5">
        {RIBBON_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={tab === active}
            className="fx-tab"
            onClick={() => onSelect(tab)}
          >
            {tab}
          </button>
        ))}

        {contextual.length > 0 && <span className="fx-tab-ctx-sep" aria-hidden />}
        {contextual.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={tab === active}
            className="fx-tab fx-tab-ctx"
            onClick={() => onSelect(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onToggleCollapsed}
        className="fx-mono ml-auto flex items-center gap-1.5"
        style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(236,234,231,.45)" }}
        title={collapsed ? "Expandir faixa" : "Recolher faixa"}
      >
        <ChevronUp
          size={13}
          style={{ transform: collapsed ? "rotate(180deg)" : undefined, transition: "transform .16s ease" }}
        />
        {collapsed ? "Expandir faixa" : "Recolher faixa"}
      </button>
    </div>
  );
}
