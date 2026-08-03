import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { useEffect, useState } from "react";
import { inTextCitation, type CitationStyle } from "@/lib/references/format";
import {
  getReference,
  onReferencesRefresh,
  peekReference,
} from "@/lib/writing/reference-sources";

export type CitationAttrs = {
  /** Linha de `project_references`. É o vínculo forte com a biblioteca. */
  referenceId: string | null;
  /** Chave estável ("silva2024") — legível, e sobrevive a export/import. */
  citationKey: string | null;
  /** Página de onde o trecho saiu, sem o "p.". Vazio na citação indireta. */
  locator: string | null;
  /** Norma em que esta citação está escrita. */
  style: CitationStyle;
  /** Última forma renderizada. Serve de fallback e é o que sai no HTML. */
  label: string;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    citation: {
      /** Insere uma citação vinculada a uma referência da biblioteca. */
      insertCitation: (attrs: Partial<CitationAttrs>) => ReturnType;
      /** Reescreve todas as citações do documento na norma indicada. */
      setCitationStyle: (style: CitationStyle) => ReturnType;
    };
  }
}

export type CitationOptions = {
  /** Projeto dono da biblioteca — de onde as citações leem seus dados. */
  projectId: string | null;
};

function CitationView({ node, updateAttributes, extension }: NodeViewProps) {
  const { referenceId, locator, style, label } = node.attrs as CitationAttrs;
  const { projectId } = extension.options as CitationOptions;

  // Começa pelo que já estiver em memória: numa releitura do documento a
  // biblioteca costuma já estar carregada, e assim não há piscada de texto.
  const known = projectId && referenceId ? peekReference(projectId, referenceId) : null;
  const [text, setText] = useState(known ? inTextCitation(known, style, locator) : label);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!projectId || !referenceId) return;
    let cancelled = false;

    const sync = () => {
      void getReference(projectId, referenceId).then((reference) => {
        if (cancelled) return;
        setMissing(!reference);
        if (reference) setText(inTextCitation(reference, style, locator));
      });
    };

    sync();
    const off = onReferencesRefresh(sync);
    return () => {
      cancelled = true;
      off();
    };
  }, [projectId, referenceId, style, locator]);

  // Mantém o atributo `label` alinhado ao que está na tela: é ele que sai no
  // HTML exportado e o que aparece se a biblioteca não puder ser lida depois.
  useEffect(() => {
    if (missing || !text || text === label) return;
    updateAttributes({ label: text });
  }, [text, label, missing, updateAttributes]);

  return (
    <NodeViewWrapper
      as="span"
      className={`folium-citation${missing ? " is-missing" : ""}`}
      data-locator={locator ?? undefined}
      title={
        missing
          ? "A referência citada não existe mais na biblioteca do projeto."
          : "Citação vinculada à biblioteca do projeto"
      }
    >
      {missing ? label || "(referência removida)" : text || label}
    </NodeViewWrapper>
  );
}

/**
 * Citação vinculada à biblioteca do projeto.
 *
 * O nó guarda o **vínculo** (`referenceId` + `citationKey` + página), não o
 * texto: a forma visível é recalculada a partir da referência a cada render.
 * Por isso corrigir o ano de um artigo na aba Referências conserta todas as
 * citações dele no texto, e trocar a norma (`setCitationStyle`) reescreve o
 * documento inteiro de uma vez. O `label` continua gravado como retrato da
 * última forma conhecida — é o que sobra num export ou se a linha sumir.
 */
export const Citation = Node.create<CitationOptions>({
  name: "citation",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return { projectId: null };
  },

  addAttributes() {
    return {
      referenceId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-reference-id") || null,
        renderHTML: (attrs) =>
          attrs.referenceId ? { "data-reference-id": attrs.referenceId } : {},
      },
      citationKey: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-citation-key") || null,
        renderHTML: (attrs) =>
          attrs.citationKey ? { "data-citation-key": attrs.citationKey } : {},
      },
      locator: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-locator") || null,
        renderHTML: (attrs) => (attrs.locator ? { "data-locator": attrs.locator } : {}),
      },
      style: {
        default: "abnt" as CitationStyle,
        parseHTML: (el) => (el.getAttribute("data-style") as CitationStyle) || "abnt",
        renderHTML: (attrs) => ({ "data-style": attrs.style ?? "abnt" }),
      },
      label: {
        default: "",
        parseHTML: (el) => el.textContent ?? "",
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="citation"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-type": "citation", class: "folium-citation" }),
      (node.attrs as CitationAttrs).label || "",
    ];
  },

  renderText({ node }) {
    return (node.attrs as CitationAttrs).label || "";
  },

  addNodeView() {
    return ReactNodeViewRenderer(CitationView, { as: "span" });
  },

  addCommands() {
    return {
      insertCitation:
        (attrs) =>
        ({ chain }) =>
          chain()
            .insertContent({
              type: this.name,
              attrs: {
                referenceId: attrs.referenceId ?? null,
                citationKey: attrs.citationKey ?? null,
                locator: attrs.locator ?? null,
                style: attrs.style ?? "abnt",
                label: attrs.label ?? "",
              },
            })
            .run(),

      setCitationStyle:
        (style) =>
        ({ state, dispatch, tr }) => {
          let changed = false;
          state.doc.descendants((node, pos) => {
            if (node.type.name !== this.name) return;
            if (node.attrs.style === style) return;
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, style });
            changed = true;
          });
          if (changed && dispatch) dispatch(tr);
          return changed;
        },
    };
  },
});

export default Citation;
