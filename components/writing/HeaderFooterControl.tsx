"use client";

import { PanelTop } from "lucide-react";
import { Popover } from "./ui";
import { cn } from "@/lib/utils/cn";

/**
 * Editor do cabeçalho e do rodapé do documento (texto repetido em cada página).
 * Aceita os tokens {n} (número da página) e {total} (total de páginas). O texto
 * é aplicado ao vivo na folha e salvo pelo pai (debounced).
 */
export function HeaderFooterControl({
  header,
  footer,
  onChange,
  icon,
  className,
}: {
  header: string;
  footer: string;
  onChange: (next: { header: string; footer: string }) => void;
  /** Glifo do gatilho; por padrão o ícone de painel superior. */
  icon?: React.ReactNode;
  /** Classe do gatilho, para encaixar no chrome que o hospeda (ex.: `.fx-sq`). */
  className?: string;
}) {
  const active = header.trim() !== "" || footer.trim() !== "";

  return (
    <Popover
      align="end"
      panelClassName="w-72 p-3"
      trigger={({ open, toggle, triggerRef }) => (
        <button
          ref={triggerRef}
          type="button"
          onClick={toggle}
          aria-label="Cabeçalho e rodapé"
          aria-expanded={open}
          aria-pressed={active || open}
          title="Cabeçalho e rodapé"
          className={cn(
            className ??
              cn(
                "rounded-lg p-1.5 transition-colors",
                active || open
                  ? "bg-accent-teal-soft text-accent-teal"
                  : "text-text-dim hover:bg-[color:color-mix(in_srgb,var(--color-accent)_10%,transparent)] hover:text-foreground",
              ),
          )}
        >
          {icon ?? <PanelTop size={16} />}
        </button>
      )}
    >
      {() => (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block font-mono text-[0.62rem] uppercase tracking-[0.14em] text-text-dim">
              Cabeçalho
            </label>
            <input
              value={header}
              onChange={(e) => onChange({ header: e.target.value, footer })}
              placeholder="Ex.: Título do trabalho"
              className="w-full rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-text-dim/60 focus:border-accent-teal focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="block font-mono text-[0.62rem] uppercase tracking-[0.14em] text-text-dim">
              Rodapé
            </label>
            <input
              value={footer}
              onChange={(e) => onChange({ header, footer: e.target.value })}
              placeholder="Ex.: Página {n} de {total}"
              className="w-full rounded-md border border-border-subtle bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-text-dim/60 focus:border-accent-teal focus:outline-none"
            />
          </div>
          <p className="text-[0.7rem] leading-relaxed text-text-dim">
            Tokens:{" "}
            <button
              type="button"
              onClick={() => onChange({ header, footer: `${footer}{n}` })}
              className="rounded bg-surface-dim px-1 font-mono text-accent-teal"
            >
              {"{n}"}
            </button>{" "}
            número da página ·{" "}
            <button
              type="button"
              onClick={() => onChange({ header, footer: `${footer}{total}` })}
              className="rounded bg-surface-dim px-1 font-mono text-accent-teal"
            >
              {"{total}"}
            </button>{" "}
            total de páginas.
          </p>
        </div>
      )}
    </Popover>
  );
}
