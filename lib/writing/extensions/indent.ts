import { Extension } from "@tiptap/core";

export type IndentOptions = {
  /** Nós que aceitam recuo. */
  types: string[];
  /** Recuo por nível, em `em` (acompanha o tamanho da fonte). */
  step: number;
  minLevel: number;
  maxLevel: number;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    foliumIndent: {
      /** Aumenta o recuo do(s) bloco(s) selecionado(s). */
      indent: () => ReturnType;
      /** Diminui o recuo do(s) bloco(s) selecionado(s). */
      outdent: () => ReturnType;
    };
  }
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Recuo (indent/outdent) em nível de bloco. O TipTap não tem extensão oficial,
 * então guardamos um nível inteiro como atributo do nó e o traduzimos em
 * `margin-inline-start`. Em listas, o próprio comportamento de lista cuida do
 * aninhamento; aqui tratamos parágrafos e títulos.
 */
export const Indent = Extension.create<IndentOptions>({
  name: "foliumIndent",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
      step: 2.5,
      minLevel: 0,
      maxLevel: 8,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const level = Number.parseInt(element.getAttribute("data-indent") ?? "0", 10);
              return Number.isNaN(level) ? 0 : clamp(level, this.options.minLevel, this.options.maxLevel);
            },
            renderHTML: (attributes) => {
              const level = Number(attributes.indent) || 0;
              if (level <= 0) return {};
              return {
                "data-indent": String(level),
                style: `margin-inline-start: ${level * this.options.step}em`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    const { types, minLevel, maxLevel } = this.options;

    const shift =
      (direction: 1 | -1): (() => import("@tiptap/core").Command) =>
      () =>
      ({ tr, state, dispatch }) => {
        const { from, to } = state.selection;
        let changed = false;
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (!types.includes(node.type.name)) return;
          const current = Number(node.attrs.indent) || 0;
          const next = clamp(current + direction, minLevel, maxLevel);
          if (next === current) return;
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
          changed = true;
        });
        if (changed && dispatch) dispatch(tr);
        return changed;
      };

    return {
      indent: shift(1),
      outdent: shift(-1),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-]": () => this.editor.commands.indent(),
      "Mod-[": () => this.editor.commands.outdent(),
    };
  },
});

export default Indent;
