import { Card } from "@/components/ui/Card";

export default function WritingAreaPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <h3 className="font-medium text-zinc-900 dark:text-zinc-50">📄 Documentos</h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Em breve.</p>
      </Card>
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
