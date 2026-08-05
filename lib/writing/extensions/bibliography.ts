import { Node, mergeAttributes, type JSONContent } from "@tiptap/core";
import { Fragment, type Node as PMNode } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import type { CitationStyle } from "@/lib/references/format";
import type { BibliographyScope } from "@/lib/writing/bibliography";

export type BibliographyAttrs = {
  /** Norma em que a lista foi escrita. */
  style: CitationStyle;
  /** De onde saíram as obras — serve para refazer a lista do mesmo jeito. */
  scope: BibliographyScope;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    bibliography: {
      /**
       * Escreve (ou reescreve) a lista de referências. Se já existe uma no
       * documento, o conteúdo dela é trocado **no lugar**; senão, a lista entra
       * no fim do documento, precedida do título da seção.
       */
      setBibliography: (args: {
        entries: JSONContent[];
        style: CitationStyle;
        scope: BibliographyScope;
        /** Título usado só quando a seção ainda não existe. */
        title: string;
        titleAlign: "center" | "left";
      }) => ReturnType;
    };
  }
}

/** A lista de referências do documento, se houver. */
export function findBibliography(doc: PMNode): { pos: number; node: PMNode } | null {
  let found: { pos: number; node: PMNode } | null = null;
  doc.forEach((node, pos) => {
    if (!found && node.type.name === "bibliography") found = { pos, node };
  });
  return found;
}

/**
 * Seção de referências do documento.
 *
 * É um nó de bloco que **contém parágrafos comuns**, e não um nó atômico com
 * texto calculado: assim a lista é editável à mão (um autor que a norma não
 * cobre, uma entrada acrescentada na unha) e, sobretudo, a paginação consegue
 * repartir a lista entre folhas linha a linha, como faz com uma lista comum —
 * um bloco atômico de duas páginas atravessaria a virada.
 *
 * O nó existe para dar **identidade** à lista: é por ele que o botão da faixa
 * acha a seção e a reescreve no lugar, em vez de empilhar uma lista nova a cada
 * clique, e é dele que sai a norma/escopo usados da última vez.
 */
export const Bibliography = Node.create({
  name: "bibliography",
  group: "block",
  content: "paragraph+",
  defining: true,

  addAttributes() {
    return {
      style: {
        default: "abnt" as CitationStyle,
        parseHTML: (el) => (el.getAttribute("data-style") as CitationStyle) || "abnt",
        renderHTML: (attrs) => ({ "data-style": attrs.style ?? "abnt" }),
      },
      scope: {
        default: "cited" as BibliographyScope,
        parseHTML: (el) => (el.getAttribute("data-scope") as BibliographyScope) || "cited",
        renderHTML: (attrs) => ({ "data-scope": attrs.scope ?? "cited" }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'section[data-type="bibliography"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "section",
      mergeAttributes(HTMLAttributes, {
        "data-type": "bibliography",
        class: "folium-bibliography",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setBibliography:
        ({ entries, style, scope, title, titleAlign }) =>
        ({ state, dispatch, tr }) => {
          if (entries.length === 0) return false;

          const section = state.schema.nodeFromJSON({
            type: this.name,
            attrs: { style, scope },
            content: entries,
          });
          const existing = findBibliography(state.doc);
          if (!dispatch) return true;

          let at: number;
          if (existing) {
            tr.replaceWith(existing.pos, existing.pos + existing.node.nodeSize, section);
            at = existing.pos;
          } else {
            const heading = state.schema.nodeFromJSON({
              type: "heading",
              attrs: { level: 1, textAlign: titleAlign },
              // Negrito explícito: a 6023 pede o título da seção em negrito, e
              // o editor não põe bold em título por conta própria.
              content: [{ type: "text", text: title, marks: [{ type: "bold" }] }],
            });
            at = state.doc.content.size;
            tr.insert(at, Fragment.fromArray([heading, section]));
            at += heading.nodeSize;
          }

          // Leva o cursor (e a rolagem) até a lista recém-escrita: ela costuma
          // nascer fora da tela, no fim do documento.
          const $start = tr.doc.resolve(Math.min(at + 1, tr.doc.content.size));
          tr.setSelection(TextSelection.near($start)).scrollIntoView();
          dispatch(tr);
          return true;
        },
    };
  },
});

export default Bibliography;
