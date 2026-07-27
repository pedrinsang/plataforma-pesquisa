"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, X, Table2, Clock3, RefreshCw, Inbox } from "lucide-react";
import {
  listStatSources,
  type StatSourceSummary,
  type StatSourceKind,
} from "@/lib/writing/stat-sources";
import { cn } from "@/lib/utils/cn";

function recentKey(projectId: string) {
  return `folium:recent-stats:${projectId}`;
}

function readRecent(projectId: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(recentKey(projectId)) ?? "[]");
  } catch {
    return [];
  }
}

function pushRecent(projectId: string, statId: string) {
  const next = [statId, ...readRecent(projectId).filter((id) => id !== statId)].slice(0, 6);
  try {
    localStorage.setItem(recentKey(projectId), JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/**
 * Painel lateral de inserção de estatística (estilo Canva): busca no topo,
 * "Usados recentemente" e grade de miniaturas. Não perde a posição do cursor
 * no texto — o Editor devolve o foco/seleção ao inserir.
 */
export function StatPanel({
  open,
  projectId,
  onClose,
  onInsert,
}: {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onInsert: (statId: string, kind: StatSourceKind) => void;
}) {
  const [sources, setSources] = useState<StatSourceSummary[] | null>(null);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);

  // Recarga manual (botão) — pode zerar o estado de forma síncrona.
  const reload = useCallback(() => {
    setSources(null);
    void listStatSources(projectId).then((data) => {
      setSources(data);
      setRecent(readRecent(projectId));
    });
  }, [projectId]);

  // Busca ao abrir: estado só muda após o await.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void listStatSources(projectId).then((data) => {
      if (cancelled) return;
      setSources(data);
      setRecent(readRecent(projectId));
    });
    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    if (!sources) return null;
    const q = query.trim().toLowerCase();
    if (!q) return sources;
    return sources.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.columnPreview.some((c) => c.toLowerCase().includes(q)),
    );
  }, [sources, query]);

  const recentSources = useMemo(() => {
    if (!sources || query.trim()) return [];
    const byId = new Map(sources.map((s) => [s.id, s]));
    return recent.map((id) => byId.get(id)).filter((s): s is StatSourceSummary => Boolean(s));
  }, [sources, recent, query]);

  function handleInsert(source: StatSourceSummary) {
    pushRecent(projectId, source.id);
    onInsert(source.id, source.kind);
  }

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-40 flex w-[min(22rem,100vw)] flex-col border-l border-border-subtle bg-surface shadow-lift transition-transform duration-200",
        open ? "translate-x-0" : "pointer-events-none translate-x-full",
      )}
      role="dialog"
      aria-label="Inserir gráfico ou estatística"
      aria-hidden={!open}
    >
      {/* Cabeçalho + busca */}
      <div className="border-b border-border-subtle p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[0.62rem] uppercase tracking-[0.14em] text-accent-teal">
            Inserir estatística
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={reload}
              className="ib !size-7"
              aria-label="Recarregar"
              title="Recarregar"
            >
              <RefreshCw size={14} />
            </button>
            <button type="button" onClick={onClose} className="ib !size-7" aria-label="Fechar">
              <X size={15} />
            </button>
          </div>
        </div>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar gráfico ou estatística…"
            className="input h-9 w-full pl-9 text-sm"
          />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-4">
        {filtered === null ? (
          <div className="flex items-center gap-2 py-8 text-sm text-text-dim">
            <RefreshCw size={14} className="animate-spin" /> Carregando…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasQuery={Boolean(query.trim())} />
        ) : (
          <div className="space-y-6">
            {recentSources.length > 0 && (
              <Section icon={<Clock3 size={12} />} title="Usados recentemente">
                <Grid sources={recentSources} onInsert={handleInsert} />
              </Section>
            )}
            <Section icon={<Table2 size={12} />} title="Tabelas">
              <Grid sources={filtered} onInsert={handleInsert} />
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-text-dim">
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
}

function Grid({
  sources,
  onInsert,
}: {
  sources: StatSourceSummary[];
  onInsert: (s: StatSourceSummary) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {sources.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onInsert(s)}
          className="group flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface-dim/40 p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-accent-teal hover:shadow-card"
          title={`Inserir “${s.name}”`}
        >
          {/* Miniatura esquemática da tabela */}
          <div className="grid h-16 place-items-center overflow-hidden rounded-md border border-border-subtle bg-surface">
            <div className="w-full space-y-1 px-2">
              <div className="flex gap-1">
                {Array.from({ length: Math.min(s.columnCount || 2, 3) }).map((_, i) => (
                  <span key={i} className="h-1.5 flex-1 rounded-sm bg-accent-teal/40" />
                ))}
              </div>
              {Array.from({ length: 3 }).map((_, r) => (
                <div key={r} className="flex gap-1">
                  {Array.from({ length: Math.min(s.columnCount || 2, 3) }).map((_, i) => (
                    <span key={i} className="h-1 flex-1 rounded-sm bg-border-strong/40" />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-foreground group-hover:text-accent-teal">
              {s.name}
            </p>
            <p className="font-mono text-[0.6rem] text-text-dim">
              {s.columnCount} col · {s.rowCount} lin
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong px-4 py-12 text-center">
      <Inbox size={22} className="text-text-dim" />
      <p className="text-sm text-text-dim">
        {hasQuery
          ? "Nada encontrado para essa busca."
          : "Nenhuma planilha na aba Estatística ainda. Crie uma para inseri-la aqui."}
      </p>
    </div>
  );
}
