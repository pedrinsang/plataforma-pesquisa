import { Extension } from "@tiptap/core";

export type ParagraphIndentAttrs = {
  /** Recuo à esquerda, em px (padding-inline-start). */
  indentLeft: number;
  /** Recuo à direita, em px (padding-inline-end). */
  indentRight: number;
  /** Recuo da primeira linha, em px (text-indent). Pode ser negativo (deslocado). */
  firstLine: number;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    foliumParagraphIndent: {
      /** Aplica recuos (esquerda/direita/primeira linha) aos blocos selecionados. */
      setParagraphIndent: (attrs: Partial<ParagraphIndentAttrs>) => ReturnType;
    };
  }
}

const round = (n: number) => Math.round(n);

/**
 * Recuos contínuos de parágrafo em px, controlados pela régua horizontal (estilo
 * Word): esquerda, direita e primeira linha. Independente do recuo por níveis da
 * barra de ferramentas (`foliumIndent`, em `em`) — este é medido em px pela régua.
 */
export const ParagraphIndent = Extension.create({
  name: "foliumParagraphIndent",

  addOptions() {
    return { types: ["paragraph", "heading"] as string[] };
  },

  addGlobalAttributes() {
    // Cada atributo emite seu próprio pedaço de `style`; o TipTap mescla os
    // vários `style` (como já ocorre com text-align/line-height/indent).
    const numeric = (name: string, dataAttr: string, cssProp: string) => ({
      default: 0,
      parseHTML: (element: HTMLElement) => {
        const raw = Number.parseFloat(element.getAttribute(dataAttr) ?? "0");
        return Number.isNaN(raw) ? 0 : raw;
      },
      renderHTML: (attributes: Record<string, unknown>) => {
        const value = Number(attributes[name]) || 0;
        if (value === 0) return {};
        return { [dataAttr]: String(value), style: `${cssProp}: ${value}px` };
      },
    });

    return [
      {
        types: this.options.types,
        attributes: {
          indentLeft: numeric("indentLeft", "data-indent-left", "padding-inline-start"),
          indentRight: numeric("indentRight", "data-indent-right", "padding-inline-end"),
          firstLine: numeric("firstLine", "data-first-line", "text-indent"),
        },
      },
    ];
  },

  addCommands() {
    const { types } = this.options;
    return {
      setParagraphIndent:
        (attrs: Partial<ParagraphIndentAttrs>) =>
        ({ state, dispatch, tr }) => {
          const { from, to } = state.selection;
          let changed = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!types.includes(node.type.name)) return;
            const nextAttrs = { ...node.attrs };
            if (attrs.indentLeft !== undefined) nextAttrs.indentLeft = round(Math.max(0, attrs.indentLeft));
            if (attrs.indentRight !== undefined) nextAttrs.indentRight = round(Math.max(0, attrs.indentRight));
            if (attrs.firstLine !== undefined) nextAttrs.firstLine = round(attrs.firstLine);
            tr.setNodeMarkup(pos, undefined, nextAttrs);
            changed = true;
          });
          if (changed && dispatch) dispatch(tr);
          return changed;
        },
    };
  },
});

export default ParagraphIndent;
