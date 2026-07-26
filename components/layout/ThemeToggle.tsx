"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const apply = () => {
      const next = !root.classList.contains("dark");
      root.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // View Transitions dão um crossfade suave da página entre os temas; sem
    // suporte (ou com movimento reduzido) troca direto, sem animação.
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished?: Promise<void> };
    };
    if (!reduce && typeof doc.startViewTransition === "function") {
      // Cliques em sequência abortam a transição anterior; a promise rejeita
      // com InvalidStateError — comportamento esperado, então silenciamos.
      void doc.startViewTransition(apply).finished?.catch(() => {});
    } else {
      apply();
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Alternar tema claro/escuro"
      title="Alternar tema claro/escuro"
      className="ib !size-9 text-text-dim"
    >
      <Sun size={17} className="dark:hidden" />
      <Moon size={17} className="hidden dark:block" />
    </button>
  );
}
