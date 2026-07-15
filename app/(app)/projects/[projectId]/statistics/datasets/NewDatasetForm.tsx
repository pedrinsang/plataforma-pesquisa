"use client";

import { useState, useTransition } from "react";
import { createDataset } from "@/lib/actions/datasets";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function NewDatasetForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return <Button onClick={() => setOpen(true)}>+ Nova planilha</Button>;
  }

  return (
    <Card className="max-w-lg space-y-4">
      <div>
        <Label htmlFor="dataset-name">Nome</Label>
        <Input
          id="dataset-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Coleta piloto"
          autoFocus
        />
      </div>
      <div>
        <Label htmlFor="dataset-description">Descrição (opcional)</Label>
        <Textarea
          id="dataset-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => startTransition(() => createDataset(projectId, name, description))}
          disabled={isPending}
        >
          {isPending ? "Criando..." : "Criar planilha"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </Card>
  );
}
