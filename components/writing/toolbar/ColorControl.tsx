"use client";

import { useState, type ReactNode } from "react";
import { Ban } from "lucide-react";
import { Popover, DropdownTrigger } from "./primitives";
import { cn } from "@/lib/utils/cn";

// Paleta enxuta, alinhada à identidade Folium (petróleo, dourado, neutros
// quentes, sinais) + alguns tons úteis para revisão de texto.
const SWATCHES = [
  "#201f1d",
  "#605d59",
  "#9b9792",
  "#146b74",
  "#2b858f",
  "#9a7636",
  "#a85b3f",
  "#3f7d5a",
  "#b23b3b",
  "#2f5fae",
  "#7a4fb0",
  "#c9a227",
];

export function ColorControl({
  title,
  icon,
  value,
  onSelect,
  onClear,
}: {
  title: string;
  icon: (color: string | null) => ReactNode;
  value: string | null;
  onSelect: (color: string) => void;
  onClear: () => void;
}) {
  const [custom, setCustom] = useState(value ?? "#146b74");

  return (
    <Popover
      panelClassName="w-56 p-3"
      trigger={({ open, toggle, triggerRef }) => (
        <DropdownTrigger
          open={open}
          toggle={toggle}
          triggerRef={triggerRef}
          title={title}
          label={<span className="grid place-items-center">{icon(value)}</span>}
          width="!px-1.5"
        />
      )}
    >
      {(close) => (
        <div className="space-y-3">
          <div className="grid grid-cols-6 gap-1.5">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(c);
                  close();
                }}
                title={c}
                aria-label={c}
                className={cn(
                  "size-6 rounded-md border border-border-subtle transition-transform hover:scale-110",
                  value?.toLowerCase() === c.toLowerCase() && "ring-2 ring-accent-teal ring-offset-1 ring-offset-surface",
                )}
                style={{ background: c }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="color"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              aria-label="Cor personalizada"
              className="size-8 shrink-0 cursor-pointer rounded-md border border-border-subtle bg-transparent p-0.5"
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(custom);
                close();
              }}
              className="btn btn-secondary h-8 flex-1 !text-xs"
            >
              Aplicar
            </button>
          </div>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onClear();
              close();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-dim transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-accent)_10%,transparent)] hover:text-foreground"
          >
            <Ban size={14} />
            Remover cor
          </button>
        </div>
      )}
    </Popover>
  );
}
