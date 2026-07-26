"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import {
  CustomFields,
  initCustomValues,
  missingRequired,
  type CustomValues,
} from "../../CustomFields";
import type { FieldDef } from "../../CustomFieldsManager";
import { createSample, updateSample } from "@/lib/actions/samples";

export type Sample = {
  id: string;
  label: string | null;
  collected_at: string;
  case_id: string | null;
  notes: string | null;
  custom: CustomValues;
};
export type CaseOption = { id: string; code: string };

// Datas ficam gravadas em UTC (meia-noite) — formata e edita sempre em UTC para
// o dia não "voltar um" em fusos negativos (Brasil = UTC-3).
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const toDateInput = (iso: string) => iso.slice(0, 10);
const todayInput = () => new Date().toISOString().slice(0, 10);

export function SampleModal({
  projectId,
  cases,
  sampleFields,
  initial,
  fixedCaseId,
  onClose,
}: {
  projectId: string;
  cases: CaseOption[];
  sampleFields: FieldDef[];
  initial: Sample | null;
  // Quando definido (ex.: dentro do detalhe de um caso), a amostra já nasce
  // vinculada a esse caso e o seletor de caso some.
  fixedCaseId?: string;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState(initial?.label ?? "");
  const [date, setDate] = useState(initial ? toDateInput(initial.collected_at) : todayInput());
  const [caseId, setCaseId] = useState(fixedCaseId ?? initial?.case_id ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [custom, setCustom] = useState<CustomValues>(() =>
    initCustomValues(sampleFields, initial?.custom),
  );
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const missing = missingRequired(sampleFields, custom);
    if (missing.length > 0) {
      setError(`Preencha os campos obrigatórios: ${missing.join(", ")}.`);
      return;
    }
    setError(null);
    startTransition(async () => {
      const payload = {
        label: label.trim() || null,
        collectedAt: date,
        caseId: (fixedCaseId ?? caseId) || null,
        notes: notes || null,
        custom,
      };
      const res = initial
        ? await updateSample(initial.id, projectId, payload)
        : await createSample(projectId, payload);
      if (res.error) setError(res.error);
      else onClose();
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      kicker="Amostra"
      title={initial ? "Editar amostra" : "Registrar amostra"}
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
          <label className="block">
            <span className="mb-1 block text-[11.5px] text-text-dim">Identificador</span>
            <input
              className="input !py-1.5 !text-[14px]"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: A-014 (opcional)"
              autoFocus
              disabled={pending}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] text-text-dim">Data da coleta</span>
            <input
              type="date"
              className="input !py-1.5 !text-[14px]"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={pending}
            />
          </label>
        </div>

        {!fixedCaseId && cases.length > 0 && (
          <label className="block">
            <span className="mb-1 block text-[11.5px] text-text-dim">Caso</span>
            <select
              className="input !py-1.5 !text-[14px]"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              disabled={pending}
            >
              <option value="">Sem caso</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>
          </label>
        )}

        {sampleFields.length > 0 && (
          <div className="border-t border-border-subtle pt-4">
            <p className="mb-3 text-[0.62rem] uppercase tracking-[0.14em] text-accent-teal">
              Campos da amostra
            </p>
            <CustomFields
              defs={sampleFields}
              values={custom}
              onChange={(key, value) => setCustom((prev) => ({ ...prev, [key]: value }))}
              disabled={pending}
            />
          </div>
        )}

        <label className="block">
          <span className="mb-1 block text-[11.5px] text-text-dim">Observações</span>
          <textarea
            className="input !min-h-20 !py-1.5 !text-[14px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas livres (opcional)"
            disabled={pending}
          />
        </label>

        {error && <p className="text-[12px] text-neg">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn btn-ghost !text-[13px]" onClick={onClose} disabled={pending}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary !text-[13px]" onClick={submit} disabled={pending}>
            {pending ? "Salvando…" : initial ? "Salvar amostra" : "Registrar amostra"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
