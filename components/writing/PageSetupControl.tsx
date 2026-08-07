"use client";

import { Scan } from "lucide-react";
import { Popover } from "./ui";
import { cn } from "@/lib/utils/cn";
import {
  ABNT_MARGINS,
  DEFAULT_MARGINS,
  type PageMargins,
  type PageSetup,
} from "@/lib/writing/page-metrics";

/**
 * Configurar página: margens da folha e entrelinha do corpo.
 *
 * Existe por causa da ABNT NBR 14724:2024, que pede margens **assimétricas** —
 * 3 cm em cima e à esquerda, 2 cm embaixo e à direita — e entrelinha 1,5. A
 * folha do editor era 2,5 cm nos quatro lados, fixo, então nenhum trabalho
 * saía conforme. Mas o motivo não é só a norma: cada revista publica o seu
 * gabarito, e um editor de pesquisa que não deixa mudar a margem obriga a
 * terminar o trabalho no Word.
 *
 * Mudar a margem muda a área de texto e, com ela, a paginação inteira — a
 * mesma geometria alimenta a medição e o desenho, então a contagem de páginas
 * na barra de status já responde ao que se escolhe aqui.
 */

/** Entrelinhas oferecidas, na escala do Word. `null` = o padrão do editor. */
const LINE_HEIGHTS: Array<{ value: number | null; label: string; hint?: string }> = [
  { value: null, label: "Padrão" },
  { value: 1, label: "Simples" },
  { value: 1.15, label: "1,15" },
  { value: 1.5, label: "1,5", hint: "ABNT" },
  { value: 2, label: "Duplo" },
];

const PRESETS: Array<{ label: string; hint: string; margins: PageMargins }> = [
  { label: "ABNT", hint: "3 · 2 · 2 · 3 cm", margins: ABNT_MARGINS },
  { label: "Padrão", hint: "2,5 cm", margins: DEFAULT_MARGINS },
];

function sameMargins(a: PageMargins, b: PageMargins): boolean {
  return a.top === b.top && a.right === b.right && a.bottom === b.bottom && a.left === b.left;
}

/** Campo de uma margem, em cm. Aceita vírgula — é como se digita em português. */
function MarginField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="w-16 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-text-dim">
        {label}
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={String(value).replace(".", ",")}
        onChange={(e) => {
          const parsed = Number(e.target.value.replace(",", "."));
          if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 10) onChange(parsed);
        }}
        className="w-14 rounded-md border border-border-subtle bg-background px-2 py-1 text-right text-sm tabular-nums text-foreground focus:border-accent-teal focus:outline-none"
      />
      <span className="text-[0.7rem] text-text-dim">cm</span>
    </label>
  );
}

export function PageSetupControl({
  setup,
  onChange,
  icon,
  className,
}: {
  setup: PageSetup;
  onChange: (next: PageSetup) => void;
  icon?: React.ReactNode;
  className?: string;
}) {
  const isAbnt = sameMargins(setup.margins, ABNT_MARGINS) && setup.lineHeight === 1.5;

  function setMargin(side: keyof PageMargins, value: number) {
    onChange({ ...setup, margins: { ...setup.margins, [side]: value } });
  }

  return (
    <Popover
      align="end"
      panelClassName="w-64 p-3"
      trigger={({ open, toggle, triggerRef }) => (
        <button
          ref={triggerRef}
          type="button"
          onClick={toggle}
          aria-label="Configurar página"
          aria-expanded={open}
          title="Margens e entrelinha da folha"
          className={cn(className ?? "rounded-lg p-1.5 text-text-dim transition-colors")}
        >
          {icon ?? <Scan size={16} />}
        </button>
      )}
    >
      {() => (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <span className="block font-mono text-[0.62rem] uppercase tracking-[0.14em] text-text-dim">
              Predefinição
            </span>
            <div className="flex gap-1.5">
              {PRESETS.map((preset) => {
                const active =
                  sameMargins(setup.margins, preset.margins) &&
                  (preset.label !== "ABNT" || setup.lineHeight === 1.5);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      onChange({
                        margins: preset.margins,
                        // A ABNT não é só margem: pede entrelinha 1,5 no corpo.
                        // Escolher "ABNT" e continuar fora de norma no
                        // espacejamento seria meia conformidade.
                        lineHeight: preset.label === "ABNT" ? 1.5 : setup.lineHeight,
                        // Pelo mesmo motivo a predefinição liga o controle de
                        // viúvas e órfãs: linha solta no pé da folha é o tipo de
                        // coisa que uma banca aponta.
                        widowControl:
                          preset.label === "ABNT" ? true : setup.widowControl,
                      })
                    }
                    className={cn(
                      "flex-1 rounded-md border px-2 py-1.5 text-left transition-colors",
                      active
                        ? "border-accent-teal bg-accent-teal-soft text-accent-teal"
                        : "border-border-subtle text-foreground hover:border-accent-teal",
                    )}
                  >
                    <span className="block text-xs">{preset.label}</span>
                    <span className="block text-[0.65rem] tabular-nums text-text-dim">
                      {preset.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5 border-t border-border-subtle pt-2.5">
            <span className="block font-mono text-[0.62rem] uppercase tracking-[0.14em] text-text-dim">
              Margens
            </span>
            <MarginField label="Superior" value={setup.margins.top} onChange={(v) => setMargin("top", v)} />
            <MarginField label="Inferior" value={setup.margins.bottom} onChange={(v) => setMargin("bottom", v)} />
            <MarginField label="Esquerda" value={setup.margins.left} onChange={(v) => setMargin("left", v)} />
            <MarginField label="Direita" value={setup.margins.right} onChange={(v) => setMargin("right", v)} />
          </div>

          <div className="space-y-1.5 border-t border-border-subtle pt-2.5">
            <span className="block font-mono text-[0.62rem] uppercase tracking-[0.14em] text-text-dim">
              Entrelinha do corpo
            </span>
            <div className="flex flex-wrap gap-1">
              {LINE_HEIGHTS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => onChange({ ...setup, lineHeight: option.value })}
                  className={cn(
                    "rounded-md border px-2 py-1 text-[0.7rem] transition-colors",
                    setup.lineHeight === option.value
                      ? "border-accent-teal bg-accent-teal-soft text-accent-teal"
                      : "border-border-subtle text-foreground hover:border-accent-teal",
                  )}
                >
                  {option.label}
                  {option.hint && (
                    <span className="ml-1 font-mono text-[0.6rem] text-text-dim">{option.hint}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 border-t border-border-subtle pt-2.5">
            <span className="block font-mono text-[0.62rem] uppercase tracking-[0.14em] text-text-dim">
              Quebra de página
            </span>
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={setup.widowControl}
                onChange={(e) => onChange({ ...setup, widowControl: e.target.checked })}
                className="mt-0.5 accent-[var(--color-accent)]"
              />
              <span className="text-[0.72rem] leading-snug text-foreground">
                Controle de linhas viúvas e órfãs
                <span className="mt-0.5 block text-[0.68rem] leading-relaxed text-text-dim">
                  {setup.widowControl
                    ? "Nenhum parágrafo deixa uma linha sozinha no pé ou no topo da folha. Em troca, um parágrafo de até três linhas desce inteiro para a página seguinte."
                    : "A quebra anda linha a linha. Um parágrafo pode deixar uma linha sozinha no pé ou no topo da folha."}
                </span>
              </span>
            </label>
          </div>

          <p className="text-[0.7rem] leading-relaxed text-text-dim">
            {isAbnt
              ? "Conforme a ABNT NBR 14724:2024 (anverso da folha)."
              : "A ABNT NBR 14724:2024 pede 3 cm em cima e à esquerda, 2 cm embaixo e à direita, entrelinha 1,5."}
          </p>
        </div>
      )}
    </Popover>
  );
}
