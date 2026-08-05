"use client";

import { useEffect, useRef, useState } from "react";
import { FONT_SIZES_PT } from "@/lib/writing/typography";

const MIN = 6;
const MAX = 200;

/**
 * Passo de tamanho de fonte (− 12 +) do design: os botões saltam para o próximo
 * tamanho da lista do Word e o campo do meio aceita qualquer valor digitado.
 * O número é o **corpo em pontos**, a mesma unidade da caixa do Word — e é
 * sempre o corpo que está valendo no cursor (quem resolve o padrão da folha é
 * `resolveFontSizePt`), nunca um traço.
 */
export function FontSizeStepper({
  value,
  onChange,
}: {
  /** Corpo que está valendo no cursor, em pt. */
  value: number;
  onChange: (size: number) => void;
}) {
  const shown = value;
  const [draft, setDraft] = useState(String(shown));
  const inputRef = useRef<HTMLInputElement>(null);

  // Reflete o tamanho da seleção atual, exceto enquanto o campo tem foco.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setDraft(String(shown));
    }
  }, [shown]);

  function commit(raw: string) {
    const n = Math.round(Number(raw));
    if (Number.isFinite(n) && n >= MIN && n <= MAX) onChange(n);
    else setDraft(String(shown));
  }

  function step(direction: -1 | 1) {
    const next =
      direction === 1
        ? (FONT_SIZES_PT.find((s) => s > shown) ?? Math.min(shown + 1, MAX))
        : ([...FONT_SIZES_PT].reverse().find((s) => s < shown) ?? Math.max(shown - 1, MIN));
    onChange(next);
  }

  return (
    <span className="fx-stepper">
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => step(-1)} aria-label="Diminuir fonte" title="Diminuir fonte">
        −
      </button>
      <input
        ref={inputRef}
        value={draft}
        inputMode="numeric"
        placeholder="—"
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(draft);
            inputRef.current?.blur();
          }
        }}
        onBlur={() => commit(draft)}
        aria-label="Tamanho da fonte, em pontos"
        title="Tamanho da fonte, em pontos (o mesmo 12 do Word)"
      />
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => step(1)} aria-label="Aumentar fonte" title="Aumentar fonte">
        +
      </button>
    </span>
  );
}
