"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock3, Inbox, RefreshCw, Search, Table2, X } from "lucide-react";
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
 * Painel de estatísticas encaixado no trilho da direita: busca no topo sobre a
 * grade técnica, "Usados recentemente" e grade de miniaturas. Não perde a
 * posição do cursor no texto — o editor devolve o foco/seleção ao inserir.
 */
export function StatPanel({
  projectId,
  onClose,
  onInsert,
}: {
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

  // Busca ao montar: estado só muda após o await.
  useEffect(() => {
    let cancelled = false;
    void listStatSources(projectId).then((data) => {
      if (cancelled) return;
      setSources(data);
      setRecent(readRecent(projectId));
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

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
    <aside className="fx-panel print:hidden" aria-label="Inserir estatística">
      <div className="fx-panel-head">
        <div className="mb-3 flex items-center justify-between">
          <span className="fx-panel-title">
            Estatísticas · {sources?.length ?? 0} {(sources?.length ?? 0) === 1 ? "saída" : "saídas"}
          </span>
          <span className="flex items-center gap-2">
            <button type="button" className="fx-panel-btn" onClick={reload} title="Recarregar" aria-label="Recarregar">
              <RefreshCw size={12} />
            </button>
            <button type="button" className="fx-panel-btn" onClick={onClose} title="Fechar" aria-label="Fechar">
              <X size={12} />
            </button>
          </span>
        </div>

        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
            style={{ color: "rgba(236,234,231,.45)" }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="buscar gráfico, tabela, variável…"
            className="fx-panel-search"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {filtered === null ? (
          <div className="flex items-center gap-2 py-8 text-sm text-text-dim">
            <RefreshCw size={14} className="animate-spin" /> Carregando…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasQuery={Boolean(query.trim())} />
        ) : (
          <div className="space-y-5">
            {recentSources.length > 0 && (
              <Section icon={<Clock3 size={11} />} title="Usados recentemente">
                <Grid sources={recentSources} onInsert={handleInsert} highlight />
              </Section>
            )}
            <Section icon={<Table2 size={11} />} title="Todas as planilhas">
              <Grid sources={filtered} onInsert={handleInsert} />
            </Section>
          </div>
        )}
      </div>
    </aside>
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
      <p
        className="mb-2 flex items-center gap-1.5"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9.5px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "rgba(236,234,231,.4)",
        }}
      >
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
  highlight = false,
}: {
  sources: StatSourceSummary[];
  onInsert: (s: StatSourceSummary) => void;
  highlight?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {sources.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onInsert(s)}
          title={`Inserir “${s.name}”`}
          className={cn(
            "group overflow-hidden rounded-[5px] border text-left transition-colors",
            highlight ? "border-accent-teal/40" : "border-border-subtle",
            "hover:border-accent-teal",
          )}
          style={{ background: "#0d1213" }}
        >
          {/* Miniatura esquemática da planilha, sobre papel */}
          <div className="h-[70px] overflow-hidden px-1.5 py-1.5" style={{ background: "#f7f6f2" }}>
            <div className="space-y-1">
              <div className="flex gap-1">
                {Array.from({ length: Math.min(s.columnCount || 2, 4) }).map((_, i) => (
                  <span key={i} className="h-[5px] flex-1 rounded-[1px]" style={{ background: "#146b74", opacity: 0.75 }} />
                ))}
              </div>
              {Array.from({ length: 4 }).map((_, r) => (
                <div key={r} className="flex gap-1">
                  {Array.from({ length: Math.min(s.columnCount || 2, 4) }).map((_, i) => (
                    <span key={i} className="h-[4px] flex-1 rounded-[1px]" style={{ background: "#c9c6bd" }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div
            className="px-2 pb-2 pt-1.5"
            style={{ borderTop: `1px solid ${highlight ? "rgba(91,184,194,.22)" : "rgba(236,234,231,.1)"}` }}
          >
            <p
              className={cn(
                "truncate text-[11.5px] font-medium group-hover:text-accent-teal",
                highlight ? "text-accent-teal" : "text-foreground",
              )}
            >
              {s.name}
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "rgba(236,234,231,.42)" }}>
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
