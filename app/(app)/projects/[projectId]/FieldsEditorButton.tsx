"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { FieldEntity } from "@/lib/types/database";
import { Modal } from "@/components/ui/Modal";
import { EntityFieldsEditor, type FieldDef } from "./CustomFieldsManager";

// Botão nas telas de Casos/Amostras que abre o editor dos campos personalizados
// daquela entidade num modal — acesso em contexto, sem ir a Configurações.
export function FieldsEditorButton({
  projectId,
  entity,
  fields,
  canManage,
}: {
  projectId: string;
  entity: FieldEntity;
  fields: FieldDef[];
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const title = entity === "case" ? "Campos do caso" : "Campos da amostra";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-secondary !py-1.5 !text-[12.5px]"
        title="Personalizar os campos deste formulário"
      >
        <SlidersHorizontal size={14} /> Campos
      </button>
      <Modal open={open} onClose={() => setOpen(false)} kicker="Personalizar" title={title}>
        <EntityFieldsEditor
          projectId={projectId}
          entity={entity}
          fields={fields}
          canManage={canManage}
        />
      </Modal>
    </>
  );
}
