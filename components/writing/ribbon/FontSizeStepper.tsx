"use client";

import { useEffect, useRef, useState } from "react";
import { FONT_SIZES } from "@/lib/writing/editor-extensions";

const MIN = 6;
const MAX = 200;

/**
 * Passo de tamanho de fonte (− 12 +) do design: os botões saltam para o próximo
 * tamanho da lista curada e o campo do meio aceita qualquer valor digitado.
 */
export function FontSizeStepper({
  value,
  onChange,
}: {
  /** Tamanho atual em px, ou null quando indefinido/misto. */
  value: number | null;
  onChange: (size: number) => void;
}) {
  const [draft, setDraft] = useState(value ? String(value) : "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reflete o tamanho da seleção atual, exceto enquanto o campo tem foco.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setDraft(value ? String(value) : "");
    }
  }, [value]);

  function commit(raw: string) {
    const n = Math.round(Number(raw));
    if (Number.isFinite(n) && n >= MIN && n <= MAX) onChange(n);
    else setDraft(value ? String(value) : "");
  }

  function step(direction: -1 | 1) {
    const current = value ?? 12;
    const next =
      direction === 1
        ? (FONT_SIZES.find((s) => s > current) ?? Math.min(current + 1, MAX))
        : ([...FONT_SIZES].reverse().find((s) => s < current) ?? Math.max(current - 1, MIN));
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
        aria-label="Tamanho da fonte"
        title="Tamanho da fonte"
      />
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => step(1)} aria-label="Aumentar fonte" title="Aumentar fonte">
        +
      </button>
    </span>
  );
}
