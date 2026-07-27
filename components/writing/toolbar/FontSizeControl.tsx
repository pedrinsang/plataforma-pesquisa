"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, MenuItem } from "./primitives";
import { FONT_SIZES } from "@/lib/writing/editor-extensions";
import { cn } from "@/lib/utils/cn";

/** Campo de tamanho de fonte editável (digita um valor ou escolhe da lista). */
export function FontSizeControl({
  value,
  onChange,
}: {
  /** Tamanho atual em px (número) ou null quando indefinido/misto. */
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
    if (Number.isFinite(n) && n >= 6 && n <= 200) onChange(n);
    else setDraft(value ? String(value) : "");
  }

  return (
    <div className="flex h-8 items-center rounded-md border border-transparent transition-colors focus-within:border-border-strong hover:bg-[color:color-mix(in_srgb,var(--color-accent)_10%,transparent)]">
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
        className="w-9 bg-transparent px-1.5 text-center text-sm text-foreground focus:outline-none"
      />
      <Popover
        align="end"
        panelClassName="max-h-64 w-16 overflow-y-auto"
        trigger={({ open, toggle, triggerRef }) => (
          <button
            ref={triggerRef}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggle}
            aria-label="Tamanhos"
            aria-expanded={open}
            className={cn(
              "grid h-8 w-5 place-items-center rounded-r-md text-text-dim",
              open && "text-accent-teal",
            )}
          >
            <ChevronDown size={13} />
          </button>
        )}
      >
        {(close) => (
          <>
            {FONT_SIZES.map((s) => (
              <MenuItem
                key={s}
                active={value === s}
                onClick={() => {
                  onChange(s);
                  close();
                }}
              >
                {s}
              </MenuItem>
            ))}
          </>
        )}
      </Popover>
    </div>
  );
}
