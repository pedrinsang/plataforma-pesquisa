import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Espaçador calculado pela medição do canvas: reserva o vão que falta para o
 * conteúdo em `pos` recomeçar no topo da folha seguinte.
 *
 * `inline` distingue os dois casos. Sem ele, `pos` é o início de um bloco e o
 * vão é um `div` entre blocos (o bloco inteiro desce). Com ele, `pos` está no
 * meio de um parágrafo e o vão é uma faixa da largura da coluna desenhada entre
 * duas linhas — é isso que **reparte o parágrafo** entre duas folhas sem que ele
 * deixe de ser um único nó do documento.
 */
export type PageSpacer = { pos: number; height: number; inline?: boolean };

export const paginationKey = new PluginKey<PageSpacer[]>("foliumPagination");

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    foliumPagination: {
      /** Aplica os espaçadores calculados pela medição do canvas. */
      setPageSpacers: (spacers: PageSpacer[]) => ReturnType;
    };
  }
}

/** Seletor dos dois tipos de espaçador — a medição do canvas depende dele. */
export const SPACER_SELECTOR = ".folium-page-spacer, .folium-line-spacer";

export function sameSpacers(a: PageSpacer[], b: PageSpacer[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (s, i) =>
      s.pos === b[i].pos &&
      Boolean(s.inline) === Boolean(b[i].inline) &&
      Math.abs(s.height - b[i].height) < 0.5,
  );
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
            //
            // O `inline` tem de sobreviver ao remapeamento: sem ele um vão que
            // reparte um parágrafo vira um `div` de bloco **dentro** do
            // parágrafo, o que quebra o texto em blocos anônimos e faz a
            // medição seguinte ler a folha errada — era daí que vinha a
            // paginação oscilando entre dois desenhos.
            return value
              .map((s) => ({ ...s, pos: tr.mapping.map(s.pos, -1) }))
              .filter((s) => s.height > 0.5 && s.pos >= 0 && s.pos <= tr.doc.content.size);
          },
        },

        props: {
          decorations(state) {
            const spacers = paginationKey.getState(state);
            if (!spacers || spacers.length === 0) return DecorationSet.empty;
            const decorations: Decoration[] = [];
            for (const { pos, height, inline } of spacers) {
              if (pos < 0 || pos > state.doc.content.size) continue;
              decorations.push(
                Decoration.widget(
                  pos,
                  () => {
                    // No meio do parágrafo o vão é um `span` da largura da
                    // coluna: por não caber ao lado do texto ele cai sozinho numa
                    // caixa de linha, e `vertical-align: top` faz essa caixa ter
                    // exatamente a altura pedida (sem o acréscimo da entrelinha).
                    const el = document.createElement(inline ? "span" : "div");
                    el.className = inline ? "folium-line-spacer" : "folium-page-spacer";
                    el.setAttribute("aria-hidden", "true");
                    el.contentEditable = "false";
                    el.style.height = `${Math.round(height)}px`;
                    return el;
                  },
                  {
                    side: -1,
                    key: `spacer-${inline ? "i" : "b"}-${pos}-${Math.round(height)}`,
                  },
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
