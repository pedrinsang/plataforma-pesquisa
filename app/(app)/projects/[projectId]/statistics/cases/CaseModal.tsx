"use client";

import { useState, useTransition } from "react";
import type { CaseStatus } from "@/lib/types/database";
import { Modal } from "@/components/ui/Modal";
import {
  CustomFields,
  initCustomValues,
  missingRequired,
  type CustomFieldDef,
  type CustomValues,
} from "../../CustomFields";
import { createCase, updateCase } from "@/lib/actions/cases";

export type CaseRow = {
  id: string;
  code: string;
  description: string | null;
  status: CaseStatus;
  custom: CustomValues;
  sampleCount: number;
};

export const STATUS_META: Record<CaseStatus, { label: string; cls: string }> = {
  active: { label: "Ativo", cls: "tag-outline" },
  completed: { label: "Concluído", cls: "tag-neutral" },
  archived: { label: "Arquivado", cls: "tag-neutral" },
};
const STATUS_ORDER: CaseStatus[] = ["active", "completed", "archived"];

export function CaseModal({
  projectId,
  caseFields,
  initial,
  onClose,
}: {
  projectId: string;
  caseFields: CustomFieldDef[];
  initial: CaseRow | null;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState(initial?.code ?? "");
  const [status, setStatus] = useState<CaseStatus>(initial?.status ?? "active");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [custom, setCustom] = useState<CustomValues>(() =>
    initCustomValues(caseFields, initial?.custom),
  );
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!code.trim()) {
      setError("Informe um código para o caso.");
      return;
    }
    const missing = missingRequired(caseFields, custom);
    if (missing.length > 0) {
      setError(`Preencha os campos obrigatórios: ${missing.join(", ")}.`);
      return;
    }
    setError(null);
    startTransition(async () => {
      const payload = { code, description: description || null, status, custom };
      const res = initial
        ? await updateCase(initial.id, projectId, payload)
        : await createCase(projectId, payload);
      if (res.error) setError(res.error);
      else onClose();
    });
  }

  return (
    <Modal open onClose={onClose} kicker="Caso" title={initial ? "Editar caso" : "Novo caso"}>
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
          <label className="block">
            <span className="mb-1 block text-[11.5px] text-text-dim">Código do caso *</span>
            <input
              className="input !py-1.5 !text-[14px] font-mono"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: C-001"
              autoFocus
              disabled={pending}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] text-text-dim">Status</span>
            <select
              className="input !py-1.5 !text-[14px]"
              value={status}
              onChange={(e) => setStatus(e.target.value as CaseStatus)}
              disabled={pending}
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-[11.5px] text-text-dim">Descrição</span>
          <textarea
            className="input !min-h-20 !py-1.5 !text-[14px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contexto do caso (opcional)"
            disabled={pending}
          />
        </label>

        {caseFields.length > 0 && (
          <div className="border-t border-border-subtle pt-4">
            <p className="mb-3 text-[0.62rem] uppercase tracking-[0.14em] text-accent-teal">
              Campos do caso
            </p>
            <CustomFields
              defs={caseFields}
              values={custom}
              onChange={(key, value) => setCustom((prev) => ({ ...prev, [key]: value }))}
              disabled={pending}
            />
          </div>
        )}

        {error && <p className="text-[12px] text-neg">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn btn-ghost !text-[13px]" onClick={onClose} disabled={pending}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary !text-[13px]" onClick={submit} disabled={pending}>
            {pending ? "Salvando…" : initial ? "Salvar caso" : "Criar caso"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
