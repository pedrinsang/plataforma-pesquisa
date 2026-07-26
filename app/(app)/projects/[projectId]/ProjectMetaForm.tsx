"use client";

import { useActionState } from "react";
import { updateProjectMeta } from "@/lib/actions/overview";
import { Button } from "@/components/ui/Button";
import { Label, Input } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";

const initialState = { error: null as string | null };

export function ProjectMetaForm({
  projectId,
  projectType,
  protocolCode,
  sampleTarget,
}: {
  projectId: string;
  projectType: string | null;
  protocolCode: string | null;
  sampleTarget: number | null;
}) {
  const action = updateProjectMeta.bind(null, projectId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="field">
        <Label htmlFor="project_type">Tipo de estudo</Label>
        <Input
          id="project_type"
          name="project_type"
          defaultValue={projectType ?? ""}
          placeholder="Ex.: Ensaio clínico randomizado"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <Label htmlFor="protocol_code">Código do protocolo</Label>
          <Input
            id="protocol_code"
            name="protocol_code"
            defaultValue={protocolCode ?? ""}
            placeholder="Ex.: CEUA 042/2025"
          />
        </div>
        <div className="field">
          <Label htmlFor="sample_target">Meta de amostras</Label>
          <Input
            id="sample_target"
            name="sample_target"
            type="number"
            min={0}
            defaultValue={sampleTarget ?? ""}
            placeholder="Ex.: 180"
          />
        </div>
      </div>
      <FormMessage error={state.error ?? undefined} />
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar metadados"}
      </Button>
    </form>
  );
}
