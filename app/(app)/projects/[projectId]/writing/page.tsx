import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default async function WritingAreaPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Link href={`/projects/${projectId}/writing/documents`}>
        <Card className="h-full transition-shadow hover:shadow-md">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-50">📄 Documentos</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Textos, modelos e contador de palavras.
          </p>
        </Card>
      </Link>
      <Card>
        <h3 className="font-medium text-zinc-900 dark:text-zinc-50">🗒️ Notas</h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Em breve.</p>
      </Card>
      <Card>
        <h3 className="font-medium text-zinc-900 dark:text-zinc-50">📚 Referências</h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Em breve.</p>
      </Card>
    </div>
  );
}
