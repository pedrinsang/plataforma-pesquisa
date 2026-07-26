"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

// Modal simples no estilo Compasso: superfície de papel, régua fina, fecha no
// Escape e no clique fora. Cabeçalho fixo para formulários longos rolarem.
export function Modal({
  open,
  onClose,
  title,
  kicker,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  kicker?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: "rgba(20,19,17,.5)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl border border-border-subtle bg-surface shadow-lift"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-surface px-5 py-4">
          <div>
            {kicker && (
              <p className="text-[0.62rem] uppercase tracking-[0.14em] text-accent-teal">{kicker}</p>
            )}
            <h2 className="font-serif text-lg font-semibold text-foreground">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="ib !size-8" aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
