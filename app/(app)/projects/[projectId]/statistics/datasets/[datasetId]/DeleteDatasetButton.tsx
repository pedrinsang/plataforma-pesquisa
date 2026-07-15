"use client";

import { deleteDataset } from "@/lib/actions/datasets";
import { Button } from "@/components/ui/Button";

export function DeleteDatasetButton({
  datasetId,
  projectId,
}: {
  datasetId: string;
  projectId: string;
}) {
  return (
    <Button
      variant="danger"
      onClick={() => {
        if (confirm("Excluir esta planilha e todos os seus dados?")) {
          deleteDataset(datasetId, projectId);
        }
      }}
    >
      Excluir planilha
    </Button>
  );
}
