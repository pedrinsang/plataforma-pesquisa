import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ClipboardEvent,
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { BarChart3, Palette, RefreshCw, Trash2, TriangleAlert } from "lucide-react";
import { MenuDivider, MenuItem, MenuLabel, Popover } from "@/components/writing/ui";
import {
  getStatSource,
  type StatSourceColumn,
  type StatSourceData,
  type StatSourceKind,
} from "@/lib/writing/stat-sources";
import {
  TABLE_DENSITIES,
  TABLE_LABELS,
  TABLE_PRESETS,
  TABLE_SIZES,
  type TableDensity,
  type TablePreset,
} from "@/lib/writing/table-style";

export type StatChartSize = "small" | "medium" | "full";

export type StatChartAttrs = {
  statId: string | null;
  statType: StatSourceKind;
  displaySize: StatChartSize;
  /** Mesmo vocabulário de estilo da tabela do editor (ver `table-style.ts`). */
  preset: TablePreset;
  density: TableDensity;
  zebra: boolean;
  size: number | null;
  label: string;
  /** `null` = usa o nome da planilha; texto = legenda escrita pelo autor. */
  caption: string | null;
  /** `null` = sem linha de fonte. */
  source: string | null;
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

const REFRESH_EVENT = "folium:stat-refresh";

/**
 * "Atualizar vínculos" da faixa: descarta o cache e manda todos os blocos de
 * estatística do documento buscarem os dados de novo.
 */
export function refreshAllStatSources() {
  sourceCache.clear();
  window.dispatchEvent(new Event(REFRESH_EVENT));
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return String(value);
}

/** Coluna de número alinha à direita — é o que faz as casas baterem na leitura. */
function isNumeric(column: StatSourceColumn): boolean {
  return column.dataType === "number" || column.dataType === "integer";
}

/**
 * Linha de texto da figura (legenda e fonte) editável direto na folha.
 *
 * Mesma ideia da tabela escrita à mão: o texto vive num **atributo** do nó, não
 * no corpo do documento. Aqui, dentro de um nó atômico do TipTap, o React não
 * pode governar o conteúdo — reescrever a cada tecla jogaria o cursor para o
 * começo —, então o elemento é solto e só se sincroniza quando não está em foco.
 */
function useFigureLine(value: string) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    if (el.textContent !== value) el.textContent = value;
    el.classList.toggle("is-empty", value.length === 0);
  }, [value]);

  return ref;
}

/** Manipuladores do campo — sem estado, para o elemento ficar solto do React. */
function figureLineHandlers(onCommit: (text: string) => void) {
  return {
    contentEditable: true,
    suppressContentEditableWarning: true,
    spellCheck: true,
    // O bloco inteiro é alça de arraste (`data-drag-handle`): sem isto, apertar
    // o botão sobre a legenda começaria a arrastar a figura em vez de pôr o
    // cursor no texto.
    draggable: false,
    onMouseDown: (e: MouseEvent<HTMLElement>) => e.stopPropagation(),
    onInput: (e: FormEvent<HTMLElement>) => {
      const el = e.currentTarget;
      el.classList.toggle("is-empty", (el.textContent ?? "").length === 0);
    },
    onBlur: (e: FocusEvent<HTMLElement>) =>
      onCommit((e.currentTarget.textContent ?? "").replace(/\s+/g, " ").trim()),
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        e.currentTarget.blur();
      }
    },
    onPaste: (e: ClipboardEvent<HTMLElement>) => {
      // O que se cola aqui é texto: a legenda é uma string num atributo.
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain").replace(/\s+/g, " ");
      document.execCommand("insertText", false, text);
    },
  };
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

  // Recarrega quando a faixa dispara "Atualizar vínculos".
  useEffect(() => {
    window.addEventListener(REFRESH_EVENT, refetch);
    return () => window.removeEventListener(REFRESH_EVENT, refetch);
  }, [refetch]);

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
  const attrs = node.attrs as StatChartAttrs;

  // A legenda em branco herda o nome da planilha: é o que este bloco já
  // mostrava, agora em forma de legenda numerada. Escrever por cima substitui.
  const captionText = attrs.caption ?? source?.name ?? "";
  const captionRef = useFigureLine(captionText);
  const sourceRef = useFigureLine(attrs.source ?? "");

  return (
    <NodeViewWrapper
      className={`folium-stat-chart ${SIZE_CLASS[size]} ${selected ? "is-selected" : ""}`}
      data-drag-handle
    >
      <div
        className="folium-table-figure group relative"
        data-preset={attrs.preset}
        data-density={attrs.density}
        data-zebra={attrs.zebra ? "1" : "0"}
        data-width="text"
        data-align="left"
        data-caption-placement="top"
        style={attrs.size ? ({ "--tbl-size": `${attrs.size}pt` } as CSSProperties) : undefined}
      >
        {/* Chrome do vínculo — instrumento, não papel: flutua sobre a folha, só
            aparece no hover e não ocupa espaço (logo, não mexe na paginação). */}
        {editable && (
          <div className="absolute -top-2 right-0 z-10 flex items-center gap-1 rounded-lg border border-border-subtle bg-surface/95 p-1 opacity-0 shadow-card backdrop-blur transition-opacity group-hover:opacity-100 focus-within:opacity-100 print:hidden">
            {source && (
              <span className="px-1 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-text-dim">
                vinculada · {source.rows.length} linhas
              </span>
            )}
            {(["small", "medium", "full"] as StatChartSize[]).map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => updateAttributes({ displaySize: s })}
                aria-pressed={size === s}
                title={`Largura ${s === "small" ? "pequena" : s === "medium" ? "média" : "total"}`}
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
            <Popover
              align="end"
              panelClassName="w-64"
              trigger={({ open, toggle, triggerRef }) => (
                <button
                  ref={triggerRef}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={toggle}
                  title="Estilo da tabela"
                  className={`grid size-6 place-items-center rounded transition-colors ${
                    open ? "text-accent-teal" : "text-text-dim hover:text-accent-teal"
                  }`}
                >
                  <Palette size={13} />
                </button>
              )}
            >
              {(close) => (
                <StatStylePanel attrs={attrs} update={updateAttributes} close={close} />
              )}
            </Popover>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={refetch}
              title="Atualizar dados"
              className="grid size-6 place-items-center rounded text-text-dim transition-colors hover:text-accent-teal"
            >
              <RefreshCw size={13} />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => deleteNode()}
              title="Remover do documento"
              className="grid size-6 place-items-center rounded text-text-dim transition-colors hover:text-red-600 dark:hover:text-red-400"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}

        {status === "loading" && !isMissing && (
          <p className="flex items-center gap-2 py-6 text-sm text-text-dim">
            <RefreshCw size={14} className="animate-spin" />
            Carregando estatística…
          </p>
        )}

        {isMissing && (
          <p className="flex items-start gap-3 rounded-lg border border-dashed border-border-strong px-4 py-5 text-sm text-text-dim">
            <TriangleAlert size={16} className="mt-0.5 shrink-0 text-accent-gold" />
            <span>
              Conteúdo removido. A estatística vinculada não existe mais na aba
              Estatística.
            </span>
          </p>
        )}

        {status === "ready" && source && statType === "chart" && (
          <p className="flex items-start gap-3 rounded-lg border border-dashed border-border-strong px-4 py-5 text-sm text-text-dim">
            <BarChart3 size={16} className="mt-0.5 shrink-0 text-accent-teal" />
            <span>Gráficos chegam em breve. Este bloco exibirá “{source.name}”.</span>
          </p>
        )}

        {status === "ready" && source && statType !== "chart" && (
          <table className="folium-table">
            <caption
              ref={captionRef as RefObject<HTMLTableCaptionElement>}
              className="folium-table-caption"
              data-label={attrs.label}
              data-placeholder="Título da tabela"
              {...figureLineHandlers((text) =>
                updateAttributes({ caption: text === (source?.name ?? "") ? null : text }),
              )}
            />
            <tbody>
              <tr>
                {source.columns.map((col) => (
                  <th key={col.id} style={isNumeric(col) ? { textAlign: "right" } : undefined}>
                    {col.name}
                  </th>
                ))}
              </tr>
              {source.rows.length === 0 ? (
                <tr>
                  <td colSpan={Math.max(source.columns.length, 1)} className="text-text-dim">
                    Sem linhas ainda.
                  </td>
                </tr>
              ) : (
                source.rows.map((row) => (
                  <tr key={row.id}>
                    {source.columns.map((col) => (
                      <td key={col.id} style={isNumeric(col) ? { textAlign: "right" } : undefined}>
                        {formatCell(row.data[col.id])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {attrs.source != null && status === "ready" && (
          <div
            ref={sourceRef as RefObject<HTMLDivElement>}
            className="folium-table-source"
            data-placeholder="Fonte: …"
            {...figureLineHandlers((text) => updateAttributes({ source: text }))}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
}

/** Painel de estilo do bloco vinculado — o mesmo vocabulário da aba "Tabela". */
function StatStylePanel({
  attrs,
  update,
  close,
}: {
  attrs: StatChartAttrs;
  update: (attrs: Partial<StatChartAttrs>) => void;
  close: () => void;
}) {
  return (
    <>
      <MenuLabel>Estilo da tabela</MenuLabel>
      {TABLE_PRESETS.map((p) => (
        <MenuItem
          key={p.value}
          active={p.value === attrs.preset}
          onClick={() => {
            update({ preset: p.value });
            close();
          }}
        >
          <span className="flex flex-col gap-0.5">
            <span>{p.label}</span>
            <span className="text-[0.68rem] leading-snug text-text-dim">{p.hint}</span>
          </span>
        </MenuItem>
      ))}

      <MenuDivider />
      <MenuLabel>Densidade e corpo</MenuLabel>
      <div className="flex flex-wrap gap-1 px-2.5 py-1">
        {TABLE_DENSITIES.map((d) => (
          <Chip key={d.value} active={attrs.density === d.value} onClick={() => update({ density: d.value })}>
            {d.label}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 px-2.5 py-1">
        {TABLE_SIZES.map((pt) => (
          <Chip
            key={pt}
            active={(attrs.size ?? 10) === pt}
            onClick={() => update({ size: pt === 10 ? null : pt })}
          >
            {pt} pt
          </Chip>
        ))}
      </div>

      <MenuDivider />
      <MenuItem active={attrs.zebra} onClick={() => update({ zebra: !attrs.zebra })}>
        Faixa alternada nas linhas
      </MenuItem>
      <MenuItem
        active={attrs.source != null}
        onClick={() => update({ source: attrs.source == null ? "" : null })}
      >
        Linha de fonte embaixo
      </MenuItem>

      <MenuDivider />
      <MenuLabel>Rótulo da legenda</MenuLabel>
      {TABLE_LABELS.map((l) => (
        <MenuItem
          key={l.value}
          active={l.value === attrs.label}
          onClick={() => {
            update({ label: l.value });
            close();
          }}
        >
          {l.label}
        </MenuItem>
      ))}
    </>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded-md border px-2 py-0.5 font-mono text-[0.65rem] transition-colors ${
        active
          ? "border-accent-teal text-accent-teal"
          : "border-border-subtle text-text-dim hover:text-foreground"
      }`}
    >
      {children}
    </button>
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
      // Estilo: o mesmo vocabulário da tabela escrita à mão, para que uma
      // planilha vinculada e uma tabela digitada saiam iguais no papel.
      preset: {
        default: "academic",
        parseHTML: (el) => el.getAttribute("data-preset") || "academic",
        renderHTML: (attrs) => ({ "data-preset": attrs.preset ?? "academic" }),
      },
      density: {
        default: "normal",
        parseHTML: (el) => el.getAttribute("data-density") || "normal",
        renderHTML: (attrs) => ({ "data-density": attrs.density ?? "normal" }),
      },
      zebra: {
        default: false,
        parseHTML: (el) => el.getAttribute("data-zebra") === "1",
        renderHTML: (attrs) => ({ "data-zebra": attrs.zebra ? "1" : "0" }),
      },
      size: {
        default: null,
        parseHTML: (el) => {
          const raw = Number(el.getAttribute("data-size"));
          return Number.isFinite(raw) && raw > 0 ? raw : null;
        },
        renderHTML: (attrs) => (attrs.size == null ? {} : { "data-size": String(attrs.size) }),
      },
      label: {
        default: "Tabela",
        parseHTML: (el) => el.getAttribute("data-label") ?? "Tabela",
        renderHTML: (attrs) => ({ "data-label": String(attrs.label ?? "") }),
      },
      caption: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-caption"),
        renderHTML: (attrs) =>
          attrs.caption == null ? {} : { "data-caption": String(attrs.caption) },
      },
      source: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-source"),
        renderHTML: (attrs) =>
          attrs.source == null ? {} : { "data-source": String(attrs.source) },
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
