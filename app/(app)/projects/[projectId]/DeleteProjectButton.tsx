"use client";

import { useState } from "react";
import { deleteProject } from "@/lib/actions/projects";
import { Button } from "@/components/ui/Button";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Excluir projeto
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        Excluir de vez, junto com todo o conteúdo do projeto?
      </span>
      <form action={deleteProject.bind(null, projectId)}>
        <Button type="submit" variant="danger">
          Sim, excluir
        </Button>
      </form>
      <Button variant="ghost" onClick={() => setConfirming(false)}>
        Cancelar
      </Button>
    </div>
  );
}
