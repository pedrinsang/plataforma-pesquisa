import { Table, TableCell, TableHeader, TableView } from "@tiptap/extension-table";
import { isInTable, selectedRect, setCellAttr } from "@tiptap/pm/tables";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView, ViewMutationRecord } from "@tiptap/pm/view";
import {
  DEFAULT_TABLE_ATTRS,
  type CaptionPlacement,
  type FoliumTableAttrs,
  type TableAlign,
  type TableDensity,
  type TablePreset,
  type TableWidth,
} from "@/lib/writing/table-style";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    foliumTable: {
      /** Muda o desenho da tabela onde o cursor está (preset, legenda, corpo…). */
      setTableAttributes: (attrs: Partial<FoliumTableAttrs>) => ReturnType;
      /** Alinha o texto de **toda a coluna** do cursor (números à direita). */
      setTableColumnAlign: (align: "left" | "center" | "right" | null) => ReturnType;
      /** Alinhamento vertical das células selecionadas. */
      setTableCellVerticalAlign: (valign: "top" | "middle" | "bottom" | null) => ReturnType;
      /** Devolve as colunas à largura automática, desfazendo arrastes. */
      distributeTableColumns: () => ReturnType;
    };
  }
}

/** Atributo booleano gravado como "1"/"0" no HTML (data-*). */
function boolAttr(key: string, domName: string, fallback: boolean) {
  return {
    default: fallback,
    parseHTML: (el: HTMLElement) => el.getAttribute(domName) === "1",
    renderHTML: (attrs: Record<string, unknown>) => ({ [domName]: attrs[key] ? "1" : "0" }),
  };
}

/** Atributo de texto livre (legenda, fonte) — `null` significa "não existe". */
function textAttr(key: string, domName: string) {
  return {
    default: null as string | null,
    parseHTML: (el: HTMLElement) => el.getAttribute(domName),
    renderHTML: (attrs: Record<string, unknown>) => {
      const value = attrs[key];
      return value == null ? {} : { [domName]: String(value) };
    },
  };
}

/** Atributo de valor fechado (preset, densidade, largura…). */
function enumAttr<T extends string>(
  key: string,
  domName: string,
  fallback: T,
  allowed: readonly T[],
) {
  return {
    default: fallback,
    parseHTML: (el: HTMLElement) => {
      const raw = el.getAttribute(domName) as T | null;
      return raw && allowed.includes(raw) ? raw : fallback;
    },
    renderHTML: (attrs: Record<string, unknown>) => ({ [domName]: String(attrs[key] ?? fallback) }),
  };
}

/**
 * Tabela da Escrita — a do TipTap, com o que uma tabela de revista precisa
 * carregar: preset de réguas, densidade, corpo, largura e a legenda numerada.
 *
 * Tudo isso é **atributo do nó** (e não classe solta no HTML) por dois motivos:
 * o documento é gravado como JSON, então os atributos sobrevivem à releitura; e
 * a legenda passa a ser propriedade da tabela — ela anda junto quando o bloco
 * muda de lugar, e o número sai de um contador de CSS, não da mão do autor.
 */
export const FoliumTable = Table.extend({
  addAttributes() {
    return {
      ...(this.parent?.() ?? {}),
      preset: enumAttr<TablePreset>("preset", "data-preset", DEFAULT_TABLE_ATTRS.preset, [
        "academic",
        "lines",
        "grid",
        "open",
      ]),
      density: enumAttr<TableDensity>("density", "data-density", DEFAULT_TABLE_ATTRS.density, [
        "compact",
        "normal",
        "loose",
      ]),
      width: enumAttr<TableWidth>("width", "data-width", DEFAULT_TABLE_ATTRS.width, [
        "text",
        "auto",
      ]),
      align: enumAttr<TableAlign>("align", "data-align", DEFAULT_TABLE_ATTRS.align, [
        "left",
        "center",
      ]),
      captionPlacement: enumAttr<CaptionPlacement>(
        "captionPlacement",
        "data-caption-placement",
        DEFAULT_TABLE_ATTRS.captionPlacement,
        ["top", "bottom"],
      ),
      zebra: boolAttr("zebra", "data-zebra", DEFAULT_TABLE_ATTRS.zebra),
      caption: textAttr("caption", "data-caption"),
      source: textAttr("source", "data-source"),
      label: {
        default: DEFAULT_TABLE_ATTRS.label,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-label") ?? DEFAULT_TABLE_ATTRS.label,
        renderHTML: (attrs: Record<string, unknown>) => ({ "data-label": String(attrs.label ?? "") }),
      },
      size: {
        default: null as number | null,
        parseHTML: (el: HTMLElement) => {
          const raw = Number(el.getAttribute("data-size"));
          return Number.isFinite(raw) && raw > 0 ? raw : null;
        },
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.size == null ? {} : { "data-size": String(attrs.size) },
      },
    };
  },

  addCommands() {
    return {
      ...(this.parent?.() ?? {}),

      setTableAttributes:
        (attrs) =>
        ({ commands }) =>
          commands.updateAttributes("table", attrs),

      // Alinhamento é propriedade da **coluna**, não da célula: numa tabela de
      // dados ninguém quer alinhar 40 células uma a uma para pôr os números à
      // direita. Percorre a coluna pelo mapa da tabela e marca todas de uma vez.
      setTableColumnAlign:
        (align) =>
        ({ state, dispatch }) => {
          if (!isInTable(state)) return false;
          const rect = selectedRect(state);
          const { tr } = state;
          const seen = new Set<number>();

          for (let col = rect.left; col < rect.right; col += 1) {
            for (let row = 0; row < rect.map.height; row += 1) {
              const pos = rect.map.map[row * rect.map.width + col];
              if (seen.has(pos)) continue;
              seen.add(pos);
              const cell = rect.table.nodeAt(pos);
              if (!cell) continue;
              // `setNodeMarkup` não muda o tamanho do documento, então as
              // posições do mapa continuam válidas durante o laço.
              tr.setNodeMarkup(rect.tableStart + pos, undefined, { ...cell.attrs, align });
            }
          }

          if (!tr.docChanged) return false;
          dispatch?.(tr);
          return true;
        },

      setTableCellVerticalAlign:
        (valign) =>
        ({ state, dispatch }) =>
          setCellAttr("valign", valign)(state, dispatch),

      distributeTableColumns:
        () =>
        ({ state, dispatch }) => {
          if (!isInTable(state)) return false;
          const rect = selectedRect(state);
          const { tr } = state;
          const seen = new Set<number>();

          for (let col = 0; col < rect.map.width; col += 1) {
            for (let row = 0; row < rect.map.height; row += 1) {
              const pos = rect.map.map[row * rect.map.width + col];
              if (seen.has(pos)) continue;
              seen.add(pos);
              const cell = rect.table.nodeAt(pos);
              if (!cell || cell.attrs.colwidth == null) continue;
              tr.setNodeMarkup(rect.tableStart + pos, undefined, { ...cell.attrs, colwidth: null });
            }
          }

          if (!tr.docChanged) return false;
          dispatch?.(tr);
          return true;
        },
    };
  },
});

/** Alinhamento vertical, comum a `td` e `th`. */
const verticalAlignAttribute = {
  default: null as string | null,
  parseHTML: (el: HTMLElement) => el.style.verticalAlign || null,
  renderHTML: (attrs: Record<string, unknown>) =>
    attrs.valign ? { style: `vertical-align: ${String(attrs.valign)}` } : {},
};

export const FoliumTableCell = TableCell.extend({
  addAttributes() {
    return { ...(this.parent?.() ?? {}), valign: verticalAlignAttribute };
  },
});

export const FoliumTableHeader = TableHeader.extend({
  addAttributes() {
    return { ...(this.parent?.() ?? {}), valign: verticalAlignAttribute };
  },
});

/** Campos da figura que o autor edita direto na folha. */
type FigureField = "caption" | "source";

const PLACEHOLDERS: Record<FigureField, string> = {
  caption: "Título da tabela",
  source: "Fonte: …",
};

/**
 * Visão da tabela na folha: a `TableView` do TipTap mais a legenda e a linha de
 * fonte, que são **atributos** do nó desenhados aqui.
 *
 * Elas são editáveis direto na página (é onde a pessoa espera escrever o
 * título), mas ficam **fora do `contentDOM`** — o ProseMirror não as lê. Duas
 * peças seguram isso: `ignoreMutation` faz o editor ignorar o que o navegador
 * escreve ali, e `stopEvent` impede que ele tente tratar as teclas e o clique
 * como se fossem do documento. O texto volta para o documento como atributo,
 * por `setNodeMarkup` — assim entra no histórico (desfazer funciona) e no
 * autosave, sem virar conteúdo do corpo do texto.
 *
 * Nota: o `columnResizing` do prosemirror-tables constrói a visão com três
 * argumentos e **sem** os `HTMLAttributes` do renderHTML, então quem escreve os
 * `data-*` no DOM é esta classe, a partir de `node.attrs`.
 */
export class FoliumTableView extends TableView {
  private editorView: EditorView;
  private figureFields = new Map<FigureField, HTMLElement>();
  private commitTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    node: ProseMirrorNode,
    cellMinWidth: number,
    view?: EditorView,
    HTMLAttributes: Record<string, unknown> = {},
  ) {
    super(node, cellMinWidth, view, HTMLAttributes as Record<string, string>);
    this.editorView = view as EditorView;
    this.dom.classList.add("folium-table-figure");
    this.table.classList.add("folium-table");
    this.sync(node);
  }

  update(node: ProseMirrorNode): boolean {
    if (!super.update(node)) return false;
    this.sync(node);
    return true;
  }

  /** O editor não deve reinterpretar o que se digita na legenda. */
  ignoreMutation(mutation: ViewMutationRecord): boolean {
    const target = mutation.target as Node;
    for (const el of this.figureFields.values()) {
      if (el === target || el.contains(target)) return true;
    }
    return super.ignoreMutation(mutation);
  }

  /** Teclas e cliques na legenda são do navegador, não do documento. */
  stopEvent(event: Event): boolean {
    const target = event.target as Node | null;
    if (!target) return false;
    for (const el of this.figureFields.values()) {
      if (el === target || el.contains(target)) return true;
    }
    return false;
  }

  destroy() {
    if (this.commitTimer) clearTimeout(this.commitTimer);
  }

  /** Espelha os atributos do nó no DOM: `data-*`, corpo e os dois campos. */
  private sync(node: ProseMirrorNode) {
    const attrs = node.attrs as FoliumTableAttrs;

    for (const host of [this.dom, this.table]) {
      host.setAttribute("data-preset", attrs.preset);
      host.setAttribute("data-density", attrs.density);
      host.setAttribute("data-width", attrs.width);
      host.setAttribute("data-align", attrs.align);
      host.setAttribute("data-caption-placement", attrs.captionPlacement);
      host.setAttribute("data-zebra", attrs.zebra ? "1" : "0");
    }

    if (attrs.size) this.dom.style.setProperty("--tbl-size", `${attrs.size}pt`);
    else this.dom.style.removeProperty("--tbl-size");

    this.syncField("caption", attrs.caption, attrs.label);
    this.syncField("source", attrs.source, "");
  }

  private syncField(field: FigureField, value: string | null, label: string) {
    const existing = this.figureFields.get(field);

    if (value == null) {
      existing?.remove();
      this.figureFields.delete(field);
      return;
    }

    const el = existing ?? this.createField(field);
    if (field === "caption") el.setAttribute("data-label", label);
    // Não sobrescrever enquanto a pessoa digita: o texto do DOM já é o mais
    // recente, e reescrevê-lo jogaria o cursor para o começo a cada tecla.
    if (document.activeElement !== el && el.textContent !== value) el.textContent = value;
    el.classList.toggle("is-empty", el.textContent?.length === 0);
  }

  private createField(field: FigureField): HTMLElement {
    const el = document.createElement(field === "caption" ? "caption" : "div");
    el.className = field === "caption" ? "folium-table-caption" : "folium-table-source";
    el.contentEditable = "true";
    el.spellcheck = true;
    el.setAttribute("data-placeholder", PLACEHOLDERS[field]);
    el.setAttribute("data-folium-figure-field", field);

    el.addEventListener("input", () => {
      el.classList.toggle("is-empty", el.textContent?.length === 0);
      this.scheduleCommit(field, el);
    });
    el.addEventListener("blur", () => this.commit(field, el));
    el.addEventListener("keydown", (event) => {
      // Legenda é uma linha só: Enter e Escape encerram a edição em vez de
      // quebrar a linha (uma quebra aqui não vai para o documento).
      if (event.key === "Enter" || event.key === "Escape") {
        event.preventDefault();
        el.blur();
      }
    });
    // Colar aqui é colar texto: o HTML da área de transferência não pertence a
    // este campo, que guarda uma string em um atributo.
    el.addEventListener("paste", (event) => {
      event.preventDefault();
      const text = (event as ClipboardEvent).clipboardData?.getData("text/plain") ?? "";
      el.textContent = `${el.textContent ?? ""}${text.replace(/\s+/g, " ")}`;
      el.classList.toggle("is-empty", el.textContent.length === 0);
      this.scheduleCommit(field, el);
    });

    if (field === "caption") this.table.insertBefore(el, this.table.firstChild);
    else this.dom.appendChild(el);

    this.figureFields.set(field, el);
    return el;
  }

  private scheduleCommit(field: FigureField, el: HTMLElement) {
    if (this.commitTimer) clearTimeout(this.commitTimer);
    this.commitTimer = setTimeout(() => this.commit(field, el), 500);
  }

  private commit(field: FigureField, el: HTMLElement) {
    if (this.commitTimer) {
      clearTimeout(this.commitTimer);
      this.commitTimer = null;
    }
    const pos = this.tablePos();
    if (pos == null) return;
    const node = this.editorView.state.doc.nodeAt(pos);
    if (!node || node.type.name !== "table") return;

    const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    if (node.attrs[field] === text) return;
    this.editorView.dispatch(
      this.editorView.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, [field]: text }),
    );
  }

  /**
   * Posição desta tabela no documento. A visão do `columnResizing` não recebe
   * `getPos`, então ela é reconstruída a partir do DOM do corpo da tabela.
   */
  private tablePos(): number | null {
    try {
      const inside = this.editorView.posAtDOM(this.contentDOM, 0);
      const $pos = this.editorView.state.doc.resolve(inside);
      for (let depth = $pos.depth; depth > 0; depth -= 1) {
        if ($pos.node(depth).type.name === "table") return $pos.before(depth);
      }
    } catch {
      return null;
    }
    return null;
  }
}
