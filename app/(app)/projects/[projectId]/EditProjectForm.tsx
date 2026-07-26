"use client";

import { useActionState } from "react";
import { updateProject, type ProjectActionState } from "@/lib/actions/projects";
import { Button } from "@/components/ui/Button";
import { Label, Textarea, Input } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";

const initialState: ProjectActionState = { error: null };

export function EditProjectForm({
  projectId,
  title,
  description,
}: {
  projectId: string;
  title: string;
  description: string | null;
}) {
  const updateProjectWithId = updateProject.bind(null, projectId);
  const [state, formAction, isPending] = useActionState(updateProjectWithId, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="field">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" defaultValue={title} required />
      </div>
      <div className="field">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={description ?? ""} />
      </div>
      <FormMessage error={state.error ?? undefined} />
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
