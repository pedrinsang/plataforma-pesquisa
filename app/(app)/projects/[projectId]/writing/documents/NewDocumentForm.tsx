"use client";

import { useState, useTransition } from "react";
import { createDocument } from "@/lib/actions/documents";
import { DOCUMENT_TEMPLATES, type DocumentTemplateId } from "@/lib/writing/templates";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

export function NewDocumentForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState<DocumentTemplateId>("em_branco");
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return <Button onClick={() => setOpen(true)}>+ Novo documento</Button>;
  }

  function handleCreate() {
    startTransition(() => createDocument(projectId, title, templateId));
  }

  return (
    <Card className="max-w-2xl space-y-4">
      <div>
        <Label htmlFor="doc-title">Título</Label>
        <Input
          id="doc-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Rascunho do capítulo 1"
          autoFocus
        />
      </div>
      <div>
        <Label>Modelo</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(DOCUMENT_TEMPLATES).map(([id, template]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTemplateId(id as DocumentTemplateId)}
              className={cn(
                "rounded-lg border p-3 text-left text-sm transition-colors",
                templateId === id
                  ? "border-accent-teal bg-accent-teal-soft"
                  : "border-border-subtle hover:bg-zinc-900/5 dark:hover:bg-white/5",
              )}
            >
              <div className="font-medium text-foreground">{template.label}</div>
              <div className="text-zinc-500 dark:text-zinc-400">{template.description}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleCreate} disabled={isPending}>
          {isPending ? "Criando..." : "Criar documento"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </Card>
  );
}
