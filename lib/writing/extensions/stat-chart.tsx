import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { useCallback, useEffect, useState } from "react";
import { BarChart3, RefreshCw, Table2, Trash2, TriangleAlert } from "lucide-react";
import {
  getStatSource,
  type StatSourceData,
  type StatSourceKind,
} from "@/lib/writing/stat-sources";

export type StatChartSize = "small" | "medium" | "full";

export type StatChartAttrs = {
  statId: string | null;
  statType: StatSourceKind;
  displaySize: StatChartSize;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    statChart: {
      /** Insere um bloco de estatística vinculado a uma fonte da aba Estatística. */
      insertStatChart: (attrs: {
        statId: string;
        statType?: StatSourceKind;
        displaySize?: StatChartSize;
      }) => ReturnType;
    };
  }
}

const SIZE_CLASS: Record<StatChartSize, string> = {
  small: "max-w-sm",
  medium: "max-w-xl",
  full: "max-w-none",
};

const SIZE_LABEL: Record<StatChartSize, string> = {
  small: "P",
  medium: "M",
  full: "G",
};

// ── Cache leve: deduplica buscas da mesma fonte e permite revalidar ──────────
const sourceCache = new Map<string, Promise<StatSourceData | null>>();

function loadSource(statId: string, force = false): Promise<StatSourceData | null> {
  if (!force && sourceCache.has(statId)) return sourceCache.get(statId)!;
  const promise = getStatSource(statId);
  sourceCache.set(statId, promise);
  return promise;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return String(value);
}

function StatChartView({ node, updateAttributes, deleteNode, editor, selected }: NodeViewProps) {
  const { statId, statType, displaySize } = node.attrs as StatChartAttrs;
  const [source, setSource] = useState<StatSourceData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");

  // Recarrega manualmente (botão) — pode atualizar estado de forma síncrona.
  const refetch = useCallback(() => {
    if (!statId) return;
    setStatus("loading");
    void loadSource(statId, true).then((data) => {
      setSource(data);
      setStatus(data ? "ready" : "missing");
    });
  }, [statId]);

  // Busca inicial / ao trocar de fonte: estado só muda após o await.
  useEffect(() => {
    if (!statId) return;
    let cancelled = false;
    void loadSource(statId).then((data) => {
      if (cancelled) return;
      setSource(data);
      setStatus(data ? "ready" : "missing");
    });
    return () => {
      cancelled = true;
    };
  }, [statId]);

  const editable = editor.isEditable;
  const size = (displaySize ?? "medium") as StatChartSize;
  const isMissing = status === "missing" || !statId;

  return (
    <NodeViewWrapper
      className={`folium-stat-chart my-6 ${SIZE_CLASS[size]} ${selected ? "is-selected" : ""}`}
      data-drag-handle
    >
      <figure className="group relative rounded-xl border border-border-subtle bg-surface shadow-card">
        {/* Controles — só no modo edição */}
        {editable && (
          <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-lg border border-border-subtle bg-surface/95 p-1 opacity-0 shadow-card backdrop-blur transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            {(["small", "medium", "full"] as StatChartSize[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => updateAttributes({ displaySize: s })}
                aria-pressed={size === s}
                title={`Tamanho ${s === "small" ? "pequeno" : s === "medium" ? "médio" : "grande"}`}
                className={`grid size-6 place-items-center rounded font-mono text-[0.65rem] transition-colors ${
                  size === s
                    ? "bg-accent-teal-soft text-accent-teal"
                    : "text-text-dim hover:text-foreground"
                }`}
              >
                {SIZE_LABEL[s]}
              </button>
            ))}
            <span className="mx-0.5 h-4 w-px bg-border-subtle" aria-hidden />
            <button
              type="button"
              onClick={refetch}
              title="Atualizar dados"
              className="grid size-6 place-items-center rounded text-text-dim transition-colors hover:text-accent-teal"
            >
              <RefreshCw size={13} />
            </button>
            <button
              type="button"
              onClick={() => deleteNode()}
              title="Remover do documento"
              className="grid size-6 place-items-center rounded text-text-dim transition-colors hover:text-red-600 dark:hover:text-red-400"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}

        <div className="p-4">
          {status === "loading" && !isMissing && (
            <div className="flex items-center gap-2 py-8 text-sm text-text-dim">
              <RefreshCw size={14} className="animate-spin" />
              Carregando estatística…
            </div>
          )}

          {isMissing && (
            <div className="flex items-start gap-3 rounded-lg border border-dashed border-border-strong bg-surface-dim/60 px-4 py-6 text-sm text-text-dim">
              <TriangleAlert size={16} className="mt-0.5 shrink-0 text-accent-gold" />
              <span>
                Conteúdo removido. A estatística vinculada não existe mais na aba
                Estatística.
              </span>
            </div>
          )}

          {status === "ready" && source && statType === "chart" && (
            <div className="flex items-start gap-3 rounded-lg border border-dashed border-border-strong bg-surface-dim/60 px-4 py-6 text-sm text-text-dim">
              <BarChart3 size={16} className="mt-0.5 shrink-0 text-accent-teal" />
              <span>Gráficos chegam em breve. Este bloco exibirá “{source.name}”.</span>
            </div>
          )}

          {status === "ready" && source && statType !== "chart" && (
            <StatTable source={source} />
          )}
        </div>

        {status === "ready" && source && (
          <figcaption className="flex items-center gap-2 border-t border-border-subtle px-4 py-2 font-mono text-[0.68rem] uppercase tracking-wide text-text-dim">
            <Table2 size={12} className="text-accent-teal" />
            {source.name}
            <span className="text-text-dim/70">· {source.rows.length} linhas</span>
          </figcaption>
        )}
      </figure>
    </NodeViewWrapper>
  );
}

function StatTable({ source }: { source: StatSourceData }) {
  if (source.columns.length === 0) {
    return (
      <p className="py-4 text-sm text-text-dim">Esta planilha ainda não tem colunas.</p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="folium-stat-table w-full border-collapse text-sm">
        <thead>
          <tr>
            {source.columns.map((col) => (
              <th
                key={col.id}
                className="border-b border-border-strong px-3 py-2 text-left font-serif font-semibold text-foreground"
              >
                {col.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {source.rows.length === 0 ? (
            <tr>
              <td
                colSpan={source.columns.length}
                className="px-3 py-4 text-center text-text-dim"
              >
                Sem linhas ainda.
              </td>
            </tr>
          ) : (
            source.rows.map((row) => (
              <tr key={row.id} className="border-b border-border-subtle last:border-0">
                {source.columns.map((col) => (
                  <td key={col.id} className="px-3 py-1.5 text-foreground tabular-nums">
                    {formatCell(row.data[col.id])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Node atômico que embute — ao vivo — uma estatística da aba Estatística.
 * Guardamos apenas a referência (`statId` + tipo + tamanho) no JSON do TipTap;
 * os dados são buscados a cada render a partir do `statId`, então o bloco
 * reflete alterações feitas depois na planilha (não é um snapshot congelado).
 */
export const StatChart = Node.create({
  name: "statChart",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      statId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-stat-id") || null,
        renderHTML: (attrs) => (attrs.statId ? { "data-stat-id": attrs.statId } : {}),
      },
      statType: {
        default: "table",
        parseHTML: (el) => el.getAttribute("data-stat-type") || "table",
        renderHTML: (attrs) => ({ "data-stat-type": attrs.statType ?? "table" }),
      },
      displaySize: {
        default: "medium",
        parseHTML: (el) => el.getAttribute("data-display-size") || "medium",
        renderHTML: (attrs) => ({ "data-display-size": attrs.displaySize ?? "medium" }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="stat-chart"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "stat-chart" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(StatChartView);
  },

  addCommands() {
    return {
      insertStatChart:
        (attrs) =>
        ({ chain }) =>
          chain()
            .insertContent({
              type: this.name,
              attrs: {
                statId: attrs.statId,
                statType: attrs.statType ?? "table",
                displaySize: attrs.displaySize ?? "medium",
              },
            })
            .run(),
    };
  },
});

export default StatChart;
