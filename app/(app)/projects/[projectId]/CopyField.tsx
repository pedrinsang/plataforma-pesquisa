"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

/** Campo somente-leitura com botão de copiar (link ou código do convite). */
export function CopyField({
  value,
  label,
  mono,
}: {
  value: string;
  label?: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // clipboard bloqueado (http sem localhost, permissão negada):
      // o texto segue selecionável no campo
    }
  }

  return (
    <div className="min-w-0 flex-1">
      {label && <p className="mb-1 text-[11px] text-text-dim">{label}</p>}
      <div className="flex items-center gap-1.5">
        <input
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className={
            "input !min-h-0 flex-1 !py-1.5 text-[12.5px] " +
            (mono ? "font-mono tracking-[0.14em]" : "")
          }
        />
        <button
          type="button"
          onClick={copy}
          className="ib !size-8 shrink-0"
          aria-label={copied ? "Copiado" : "Copiar"}
          title={copied ? "Copiado" : "Copiar"}
        >
          {copied ? (
            <Check size={15} style={{ color: "var(--color-pos)" }} />
          ) : (
            <Copy size={15} />
          )}
        </button>
      </div>
    </div>
  );
}
