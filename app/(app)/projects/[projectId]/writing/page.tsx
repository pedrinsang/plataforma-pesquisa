import { FileText, NotebookPen, BookOpen } from "lucide-react";
import { AreaCard } from "@/components/layout/AreaCard";

export default async function WritingAreaPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="space-y-5">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent-gold">
        Escrita · do rascunho à bibliografia
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <AreaCard
          href={`/projects/${projectId}/writing/documents`}
          icon={FileText}
          accent="amber"
          title="Documentos"
          description="Textos, modelos e contador de palavras."
        />
        <AreaCard
          icon={NotebookPen}
          accent="amber"
          title="Notas"
          description="Ideias soltas organizadas em cards."
          comingSoon
        />
        <AreaCard
          icon={BookOpen}
          accent="amber"
          title="Referências"
          description="Bibliografia em ABNT, APA, Vancouver e MDT."
          comingSoon
        />
      </div>
    </div>
  );
}
