import { ClipboardList, Database, Beaker, FolderKanban } from "lucide-react";
import { AreaCard } from "@/components/layout/AreaCard";

export default async function StatisticsAreaPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="space-y-5">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent-teal">
        Estatística · planeje, colete, visualize
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <AreaCard
          icon={ClipboardList}
          accent="teal"
          title="Plano de pesquisa"
          description="Objetivo, hipótese, metodologia e cronograma."
          comingSoon
        />
        <AreaCard
          href={`/projects/${projectId}/statistics/datasets`}
          icon={Database}
          accent="teal"
          title="Coleta de dados"
          description="Planilhas de dados, com cálculos e gráficos em breve."
        />
        <AreaCard
          href={`/projects/${projectId}/statistics/cases`}
          icon={FolderKanban}
          accent="teal"
          title="Casos"
          description="Agrupe amostras por caso, com campos personalizados por projeto."
        />
        <AreaCard
          href={`/projects/${projectId}/statistics/samples`}
          icon={Beaker}
          accent="teal"
          title="Amostras"
          description="Registre as coletas de campo — alimentam o painel e o gráfico semanal."
        />
      </div>
    </div>
  );
}
