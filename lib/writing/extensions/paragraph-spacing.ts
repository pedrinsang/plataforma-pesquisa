import { Extension } from "@tiptap/core";

export type ParagraphSpacingOptions = {
  /** Nós em que o espaçamento de parágrafo pode ser aplicado. */
  types: string[];
  /** Valores permitidos, em pontos (mantém o documento previsível). */
  values: number[];
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    foliumParagraphSpacing: {
      /** Espaço (em pt) antes do(s) bloco(s) selecionado(s). */
      setSpaceBefore: (pt: number) => ReturnType;
      /** Espaço (em pt) depois do(s) bloco(s) selecionado(s). */
      setSpaceAfter: (pt: number) => ReturnType;
      /** Remove o espaçamento explícito antes/depois. */
      unsetParagraphSpacing: () => ReturnType;
    };
  }
}

/**
 * Espaçamento antes/depois de parágrafo (estilo processador de texto). Assim como
 * o LineHeight, é uma propriedade do bloco — guardada como atributo do nó e
 * renderizada em `style="margin-top/bottom: …pt"`. Complementa o `foliumLineHeight`.
 */
export const ParagraphSpacing = Extension.create<ParagraphSpacingOptions>({
  name: "foliumParagraphSpacing",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
      values: [0, 4, 6, 8, 10, 12, 18, 24],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          spaceBefore: {
            default: null,
            parseHTML: (element) => {
              const v = parseFloat(element.style.marginTop);
              return Number.isFinite(v) ? v : null;
            },
            renderHTML: (attributes) => {
              if (attributes.spaceBefore == null) return {};
              return { style: `margin-top: ${attributes.spaceBefore}pt` };
            },
          },
          spaceAfter: {
            default: null,
            parseHTML: (element) => {
              const v = parseFloat(element.style.marginBottom);
              return Number.isFinite(v) ? v : null;
            },
            renderHTML: (attributes) => {
              if (attributes.spaceAfter == null) return {};
              return { style: `margin-bottom: ${attributes.spaceAfter}pt` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setSpaceBefore:
        (pt) =>
        ({ commands }) => {
          if (!this.options.values.includes(pt)) return false;
          return this.options.types
            .map((type) => commands.updateAttributes(type, { spaceBefore: pt || null }))
            .some(Boolean);
        },
      setSpaceAfter:
        (pt) =>
        ({ commands }) => {
          if (!this.options.values.includes(pt)) return false;
          return this.options.types
            .map((type) => commands.updateAttributes(type, { spaceAfter: pt || null }))
            .some(Boolean);
        },
      unsetParagraphSpacing:
        () =>
        ({ commands }) => {
          return this.options.types
            .map(
              (type) =>
                commands.resetAttributes(type, "spaceBefore") ||
                commands.resetAttributes(type, "spaceAfter"),
            )
            .some(Boolean);
        },
    };
  },
});

export default ParagraphSpacing;
