export type DocumentTemplateId = "em_branco" | "tcc" | "artigo" | "projeto_pesquisa" | "resumo";

function heading(level: 1 | 2, text: string) {
  return { type: "heading", attrs: { level }, content: [{ type: "text", text }] };
}

function paragraph(text = "") {
  return text
    ? { type: "paragraph", content: [{ type: "text", text }] }
    : { type: "paragraph" };
}

function doc(content: unknown[]) {
  return { type: "doc", content };
}

export const DOCUMENT_TEMPLATES: Record<
  DocumentTemplateId,
  { label: string; description: string; content: () => object }
> = {
  em_branco: {
    label: "Em branco",
    description: "Comece sem estrutura pré-definida.",
    content: () => doc([paragraph()]),
  },
  tcc: {
    label: "TCC",
    description: "Introdução, referencial teórico, metodologia, resultados, conclusão.",
    content: () =>
      doc([
        heading(1, "Introdução"),
        paragraph(),
        heading(1, "Referencial teórico"),
        paragraph(),
        heading(1, "Metodologia"),
        paragraph(),
        heading(1, "Resultados e discussão"),
        paragraph(),
        heading(1, "Conclusão"),
        paragraph(),
        heading(1, "Referências"),
        paragraph(),
      ]),
  },
  artigo: {
    label: "Artigo científico",
    description: "Resumo, introdução, métodos, resultados, discussão, conclusão.",
    content: () =>
      doc([
        heading(1, "Resumo"),
        paragraph(),
        heading(1, "Introdução"),
        paragraph(),
        heading(1, "Métodos"),
        paragraph(),
        heading(1, "Resultados"),
        paragraph(),
        heading(1, "Discussão"),
        paragraph(),
        heading(1, "Conclusão"),
        paragraph(),
        heading(1, "Referências"),
        paragraph(),
      ]),
  },
  projeto_pesquisa: {
    label: "Projeto de pesquisa",
    description: "Justificativa, objetivos, metodologia, cronograma, referências.",
    content: () =>
      doc([
        heading(1, "Justificativa"),
        paragraph(),
        heading(1, "Objetivos"),
        heading(2, "Objetivo geral"),
        paragraph(),
        heading(2, "Objetivos específicos"),
        paragraph(),
        heading(1, "Metodologia"),
        paragraph(),
        heading(1, "Cronograma"),
        paragraph(),
        heading(1, "Referências"),
        paragraph(),
      ]),
  },
  resumo: {
    label: "Resumo/Abstract",
    description: "Estrutura curta: contexto, objetivo, método, resultados, conclusão.",
    content: () =>
      doc([
        heading(1, "Resumo"),
        paragraph("Contexto: "),
        paragraph("Objetivo: "),
        paragraph("Método: "),
        paragraph("Resultados: "),
        paragraph("Conclusão: "),
        heading(2, "Palavras-chave"),
        paragraph(),
      ]),
  },
};
