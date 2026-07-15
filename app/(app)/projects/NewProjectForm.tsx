"use client";

import { useActionState, useState } from "react";
import { createProject, type ProjectActionState } from "@/lib/actions/projects";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";
import { Card } from "@/components/ui/Card";

const initialState: ProjectActionState = { error: null };

export function NewProjectForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createProject, initialState);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>+ Novo projeto de pesquisa</Button>
    );
  }

  return (
    <Card className="max-w-lg">
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="title">Título da pesquisa</Label>
          <Input id="title" name="title" required autoFocus />
        </div>
        <div>
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Textarea id="description" name="description" rows={3} />
        </div>
        <FormMessage error={state.error ?? undefined} />
        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Criando..." : "Criar projeto"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
