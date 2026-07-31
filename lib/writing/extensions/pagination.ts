import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/** Espaçador calculado: empurra o bloco em `pos` para o topo da folha seguinte. */
export type PageSpacer = { pos: number; height: number };

export const paginationKey = new PluginKey<PageSpacer[]>("foliumPagination");

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    foliumPagination: {
      /** Aplica os espaçadores calculados pela medição do canvas. */
      setPageSpacers: (spacers: PageSpacer[]) => ReturnType;
    };
  }
}

function sameSpacers(a: PageSpacer[], b: PageSpacer[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((s, i) => s.pos === b[i].pos && Math.abs(s.height - b[i].height) < 0.5);
}

/**
 * Paginação por medição. O documento é um fluxo contínuo (ProseMirror não
 * quebra blocos entre folhas), então o `WritingCanvas` mede a geometria real e
 * manda para cá a lista de blocos que atravessariam o fim de uma folha; cada um
 * recebe um **espaçador** (widget decoration) da altura exata que falta para
 * começar no topo da folha seguinte.
 *
 * Por que widget e não `margin-top`: o espaçamento de parágrafo
 * (`foliumParagraphSpacing`) já escreve `margin-top` inline, e o recuo/estilo do
 * bloco podem ter borda ou fundo — um `div` vazio antes do bloco é um vão limpo,
 * que a impressão simplesmente esconde (`@media print`).
 */
export const Pagination = Extension.create({
  name: "foliumPagination",

  addCommands() {
    return {
      setPageSpacers:
        (spacers) =>
        ({ tr, dispatch }) => {
          if (dispatch) dispatch(tr.setMeta(paginationKey, spacers));
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<PageSpacer[]>({
        key: paginationKey,

        state: {
          init: () => [],
          apply(tr, value) {
            const next = tr.getMeta(paginationKey) as PageSpacer[] | undefined;
            if (next) return sameSpacers(value, next) ? value : next;
            if (!tr.docChanged) return value;
            // Reposiciona os espaçadores existentes; a medição seguinte corrige
            // as alturas, isto só evita que "pulem" durante a digitação.
            return value
              .map((s) => ({ pos: tr.mapping.map(s.pos, -1), height: s.height }))
              .filter((s) => s.height > 0.5);
          },
        },

        props: {
          decorations(state) {
            const spacers = paginationKey.getState(state);
            if (!spacers || spacers.length === 0) return DecorationSet.empty;
            const decorations: Decoration[] = [];
            for (const { pos, height } of spacers) {
              if (pos < 0 || pos > state.doc.content.size) continue;
              decorations.push(
                Decoration.widget(
                  pos,
                  () => {
                    const el = document.createElement("div");
                    el.className = "folium-page-spacer";
                    el.setAttribute("aria-hidden", "true");
                    el.style.height = `${Math.round(height)}px`;
                    return el;
                  },
                  { side: -1, key: `spacer-${pos}-${Math.round(height)}` },
                ),
              );
            }
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

export default Pagination;
