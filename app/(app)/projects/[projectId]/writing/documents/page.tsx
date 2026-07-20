import Link from "next/link";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { NewDocumentForm } from "./NewDocumentForm";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, updated_at")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-4">
      <NewDocumentForm projectId={projectId} />

      {documents && documents.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Link key={doc.id} href={`/projects/${projectId}/writing/documents/${doc.id}`} className="group">
              <Card interactive className="ruled-paper flex h-full flex-col">
                <FileText size={18} className="text-accent-gold" />
                <h3 className="mt-3 font-serif text-base font-semibold leading-snug text-foreground">
                  {doc.title}
                </h3>
                <p className="mt-auto pt-4 font-mono text-[0.68rem] uppercase tracking-wide text-text-dim">
                  {new Date(doc.updated_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface/50 px-6 py-14 text-center text-sm text-text-dim">
          Nenhum documento ainda. Crie o primeiro acima.
        </div>
      )}
    </div>
  );
}
