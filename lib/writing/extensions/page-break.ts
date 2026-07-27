import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    foliumPageBreak: {
      /** Insere uma quebra de página na posição do cursor. */
      setPageBreak: () => ReturnType;
    };
  }
}

/**
 * Quebra de página. Na tela é uma régua fina rotulada; ao imprimir/exportar
 * para PDF, o `break-after: page` força uma nova folha. Nó atômico de bloco.
 */
export const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  parseHTML() {
    return [{ tag: 'div[data-type="page-break"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "page-break",
        class: "folium-page-break",
        contenteditable: "false",
      }),
    ];
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ chain }) =>
          chain()
            .insertContent({ type: this.name })
            .run(),
    };
  },
});

export default PageBreak;
