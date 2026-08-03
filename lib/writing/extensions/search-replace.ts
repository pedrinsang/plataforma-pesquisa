import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, type EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

export type SearchMatch = { from: number; to: number };

export type SearchReplaceStorage = {
  searchTerm: string;
  replaceTerm: string;
  caseSensitive: boolean;
  results: SearchMatch[];
  /** Índice do resultado "atual" (destacado em foco), ou -1 se não há. */
  currentIndex: number;
};

declare module "@tiptap/core" {
  interface Storage {
    foliumSearchReplace: SearchReplaceStorage;
  }
  interface Commands<ReturnType> {
    foliumSearchReplace: {
      /** Define o termo buscado e recalcula as ocorrências. */
      setSearchTerm: (term: string) => ReturnType;
      /** Define o termo de substituição (não altera o documento). */
      setReplaceTerm: (term: string) => ReturnType;
      /** Liga/desliga a sensibilidade a maiúsculas. */
      setSearchCaseSensitive: (value: boolean) => ReturnType;
      /** Move o foco para a próxima ocorrência (circular). */
      nextSearchResult: () => ReturnType;
      /** Move o foco para a ocorrência anterior (circular). */
      previousSearchResult: () => ReturnType;
      /** Substitui a ocorrência em foco pelo termo de substituição. */
      replaceCurrent: () => ReturnType;
      /** Substitui todas as ocorrências. */
      replaceAll: () => ReturnType;
      /** Limpa a busca e remove os destaques. */
      clearSearch: () => ReturnType;
    };
  }
}

const searchPluginKey = new PluginKey("foliumSearchReplace");

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Percorre o documento e devolve as posições de cada ocorrência do termo. As
 * buscas acontecem dentro de cada sequência contígua de texto (mesmo pai), o que
 * evita casar através de fronteiras de blocos.
 */
function findMatches(
  doc: ProseMirrorNode,
  searchTerm: string,
  caseSensitive: boolean,
): SearchMatch[] {
  const results: SearchMatch[] = [];
  if (!searchTerm) return results;

  const flags = caseSensitive ? "g" : "gi";
  let regex: RegExp;
  try {
    regex = new RegExp(escapeRegExp(searchTerm), flags);
  } catch {
    return results;
  }

  // Agrupa nós de texto irmãos num único trecho, preservando a posição inicial.
  // O trecho corrente é acumulado por referência e fechado no primeiro nó que
  // não é texto — indexar por um contador deixaria buracos no array (todo bloco
  // sem texto pula um índice) e `for..of` os percorre como `undefined`.
  const runs: Array<{ text: string; pos: number }> = [];
  let run: { text: string; pos: number } | null = null;
  doc.descendants((node, pos) => {
    if (node.isText) {
      if (run) run.text += node.text ?? "";
      else {
        run = { text: node.text ?? "", pos };
        runs.push(run);
      }
    } else {
      run = null;
    }
  });

  for (const { text, pos } of runs) {
    if (!text) continue;
    for (const match of text.matchAll(regex)) {
      const start = match.index ?? 0;
      results.push({ from: pos + start, to: pos + start + match[0].length });
    }
  }
  return results;
}

/**
 * Localizar e substituir estilo processador de texto. Mantém o termo, o texto de
 * substituição e as ocorrências no `storage`; um plugin ProseMirror pinta as
 * ocorrências com decorações inline (a atual em destaque mais forte).
 */
export const SearchReplace = Extension.create<
  Record<string, never>,
  SearchReplaceStorage
>({
  name: "foliumSearchReplace",

  addStorage() {
    return {
      searchTerm: "",
      replaceTerm: "",
      caseSensitive: false,
      results: [],
      currentIndex: -1,
    };
  },

  addCommands() {
    const recompute = (state: EditorState) => {
      const { searchTerm, caseSensitive } = this.storage;
      this.storage.results = findMatches(state.doc, searchTerm, caseSensitive);
      if (this.storage.results.length === 0) this.storage.currentIndex = -1;
      else if (this.storage.currentIndex >= this.storage.results.length)
        this.storage.currentIndex = 0;
    };

    const focusMatch = (index: number) => {
      const match = this.storage.results[index];
      if (!match) return;
      const { view } = this.editor;
      const dom = view.domAtPos(match.from)?.node as HTMLElement | undefined;
      const el = dom?.nodeType === 3 ? dom.parentElement : (dom ?? null);
      el?.scrollIntoView?.({ block: "center", behavior: "smooth" });
    };

    // Força o plugin a redesenhar as decorações (mesmo sem mudar o doc).
    const refresh = (tr: import("@tiptap/pm/state").Transaction) =>
      tr.setMeta(searchPluginKey, { refresh: true });

    return {
      setSearchTerm:
        (term: string) =>
        ({ state, dispatch, tr }) => {
          this.storage.searchTerm = term;
          this.storage.currentIndex = term ? 0 : -1;
          recompute(state);
          if (this.storage.results.length > 0) this.storage.currentIndex = 0;
          if (dispatch) dispatch(refresh(tr));
          return true;
        },

      setReplaceTerm:
        (term: string) =>
        () => {
          this.storage.replaceTerm = term;
          return true;
        },

      setSearchCaseSensitive:
        (value: boolean) =>
        ({ state, dispatch, tr }) => {
          this.storage.caseSensitive = value;
          recompute(state);
          if (dispatch) dispatch(refresh(tr));
          return true;
        },

      nextSearchResult:
        () =>
        ({ dispatch, tr }) => {
          const total = this.storage.results.length;
          if (total === 0) return false;
          this.storage.currentIndex = (this.storage.currentIndex + 1) % total;
          if (dispatch) dispatch(refresh(tr));
          focusMatch(this.storage.currentIndex);
          return true;
        },

      previousSearchResult:
        () =>
        ({ dispatch, tr }) => {
          const total = this.storage.results.length;
          if (total === 0) return false;
          this.storage.currentIndex = (this.storage.currentIndex - 1 + total) % total;
          if (dispatch) dispatch(refresh(tr));
          focusMatch(this.storage.currentIndex);
          return true;
        },

      replaceCurrent:
        () =>
        ({ dispatch, tr }) => {
          const previousIndex = this.storage.currentIndex;
          const match = this.storage.results[previousIndex];
          if (!match) return false;
          if (dispatch) {
            tr.insertText(this.storage.replaceTerm, match.from, match.to);
            // Recalcula já sobre o doc resultante, para o plugin pintar certo.
            this.storage.results = findMatches(
              tr.doc,
              this.storage.searchTerm,
              this.storage.caseSensitive,
            );
            this.storage.currentIndex =
              this.storage.results.length > 0
                ? Math.min(previousIndex, this.storage.results.length - 1)
                : -1;
            dispatch(refresh(tr));
            focusMatch(this.storage.currentIndex);
          }
          return true;
        },

      replaceAll:
        () =>
        ({ dispatch, tr }) => {
          const { results, replaceTerm } = this.storage;
          if (results.length === 0) return false;
          if (dispatch) {
            // De trás para frente, para as posições anteriores não deslocarem.
            for (let i = results.length - 1; i >= 0; i -= 1) {
              tr.insertText(replaceTerm, results[i].from, results[i].to);
            }
            this.storage.results = findMatches(
              tr.doc,
              this.storage.searchTerm,
              this.storage.caseSensitive,
            );
            this.storage.currentIndex = this.storage.results.length > 0 ? 0 : -1;
            dispatch(refresh(tr));
          }
          return true;
        },

      clearSearch:
        () =>
        ({ dispatch, tr }) => {
          this.storage.searchTerm = "";
          this.storage.replaceTerm = "";
          this.storage.results = [];
          this.storage.currentIndex = -1;
          if (dispatch) dispatch(refresh(tr));
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const storage = this.storage;
    return [
      new Plugin({
        key: searchPluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const meta = tr.getMeta(searchPluginKey);
            // Reconstrói as decorações a partir do storage só quando um comando de
            // busca pede refresh (aí as posições estão sincronizadas com o doc).
            if (meta?.refresh) {
              if (storage.results.length === 0) return DecorationSet.empty;
              const decorations = storage.results.map((r, i) =>
                Decoration.inline(r.from, r.to, {
                  class:
                    i === storage.currentIndex
                      ? "folium-search-match folium-search-current"
                      : "folium-search-match",
                }),
              );
              return DecorationSet.create(tr.doc, decorations);
            }
            // Edições comuns: mapeia os destaques existentes para as novas posições.
            if (tr.docChanged) return old.map(tr.mapping, tr.doc);
            return old;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});

export default SearchReplace;
