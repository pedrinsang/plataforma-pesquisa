import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default async function StatisticsAreaPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <h3 className="font-medium text-zinc-900 dark:text-zinc-50">🗺️ Plano de pesquisa</h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Em breve.</p>
      </Card>
      <Link href={`/projects/${projectId}/statistics/datasets`}>
        <Card className="h-full transition-shadow hover:shadow-md">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-50">📈 Coleta de dados</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Planilhas de dados, com cálculos e gráficos em breve.
          </p>
        </Card>
      </Link>
    </div>
  );
}
