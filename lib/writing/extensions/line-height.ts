import { Extension } from "@tiptap/core";

export type LineHeightOptions = {
  /** Nós em que o espaçamento entre linhas pode ser aplicado. */
  types: string[];
  /** Valores permitidos (mantém o documento previsível). */
  values: string[];
  defaultValue: string | null;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    foliumLineHeight: {
      /** Define o espaçamento entre linhas do(s) bloco(s) selecionado(s). */
      setLineHeight: (lineHeight: string) => ReturnType;
      /** Remove o espaçamento explícito, voltando ao padrão do documento. */
      unsetLineHeight: () => ReturnType;
    };
  }
}

/**
 * LineHeight em nível de bloco (parágrafo/título), ao contrário da extensão
 * oficial do TipTap v3 que aplica `line-height` no mark `textStyle` (inline).
 * Para um editor estilo processador de texto, o espaçamento entre linhas é uma
 * propriedade do parágrafo — inclusive de parágrafos vazios —, então guardamos
 * o valor como atributo do nó e renderizamos `style="line-height: …"`.
 */
export const LineHeight = Extension.create<LineHeightOptions>({
  name: "foliumLineHeight",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
      values: ["1", "1.15", "1.5", "2"],
      defaultValue: null,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: this.options.defaultValue,
            parseHTML: (element) => element.style.lineHeight || null,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) return {};
              return { style: `line-height: ${attributes.lineHeight}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight:
        (lineHeight) =>
        ({ commands }) => {
          if (!this.options.values.includes(lineHeight)) return false;
          return this.options.types
            .map((type) => commands.updateAttributes(type, { lineHeight }))
            .some(Boolean);
        },
      unsetLineHeight:
        () =>
        ({ commands }) => {
          return this.options.types
            .map((type) => commands.resetAttributes(type, "lineHeight"))
            .some(Boolean);
        },
    };
  },
});

export default LineHeight;
