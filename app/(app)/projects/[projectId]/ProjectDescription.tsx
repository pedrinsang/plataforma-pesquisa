"use client";

import { useLayoutEffect, useRef, useState } from "react";

// Resumo do projeto: colapsado em 3 linhas por padrão; se o texto ultrapassar
// isso, mostra "Mostrar resumo" para expandir no lugar (sem modal). `break-words`
// garante que textos longos sem espaços não estourem o layout.
export function ProjectDescription({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [text, expanded]);

  return (
    <div className="max-w-3xl">
      <p
        ref={ref}
        className={`whitespace-pre-wrap break-words text-[14px] leading-relaxed text-text-dim ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 text-[12.5px] text-accent-teal transition-colors hover:text-accent"
        >
          {expanded ? "Mostrar menos" : "Mostrar resumo"}
        </button>
      )}
    </div>
  );
}
