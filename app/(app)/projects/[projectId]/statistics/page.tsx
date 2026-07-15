import { ClipboardList, Database } from "lucide-react";
import { AreaCard } from "@/components/layout/AreaCard";

export default async function StatisticsAreaPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
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
    </div>
  );
}
