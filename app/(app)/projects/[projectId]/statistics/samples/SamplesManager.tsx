"use client";

import { useState, useTransition } from "react";
import { Beaker, Pencil, Trash2, Plus } from "lucide-react";
import { FieldsEditorButton } from "../../FieldsEditorButton";
import type { FieldDef } from "../../CustomFieldsManager";
import { deleteSample } from "@/lib/actions/samples";
import { SampleModal, fmtDate, type Sample, type CaseOption } from "./SampleModal";

export type { Sample, CaseOption };

export function SamplesManager({
  projectId,
  samples,
  cases,
  sampleFields,
  canManage,
}: {
  projectId: string;
  samples: Sample[];
  cases: CaseOption[];
  sampleFields: FieldDef[];
  canManage: boolean;
}) {
  const [editing, setEditing] = useState<Sample | null>(null);
  const [creating, setCreating] = useState(false);
  const caseCode = (id: string | null) => (id ? cases.find((c) => c.id === id)?.code ?? null : null);

  return (
    <section className="card !gap-0 !p-0">
      <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
        <div className="flex items-center gap-2">
          <Beaker size={17} className="text-accent-teal" strokeWidth={1.8} />
          <h2 className="font-serif text-lg font-semibold text-foreground">Amostras coletadas</h2>
          <span className="text-[11.5px] tabular-nums text-text-dim">{samples.length}</span>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <FieldsEditorButton
              projectId={projectId}
              entity="sample"
              fields={sampleFields}
              canManage={canManage}
            />
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="btn btn-primary !py-1.5 !text-[12.5px]"
            >
              <Plus size={14} /> Registrar amostra
            </button>
          </div>
        )}
      </div>

      {samples.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-text-dim">
          {canManage
            ? "Nenhuma amostra registrada — clique em “Registrar amostra”."
            : "Nenhuma amostra registrada ainda."}
        </p>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {samples.map((s) => (
            <li key={s.id} className="group flex items-center gap-3 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-medium text-foreground">
                  {s.label || <span className="text-text-dim">Amostra sem identificador</span>}
                </div>
                {caseCode(s.case_id) && (
                  <div className="mt-0.5 font-mono text-[11px] text-accent-teal">
                    {caseCode(s.case_id)}
                  </div>
                )}
              </div>

              <span className="shrink-0 text-[12px] tabular-nums text-text-dim">
                {fmtDate(s.collected_at)}
              </span>

              {canManage && (
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => setEditing(s)}
                    aria-label="Editar amostra"
                    title="Editar"
                    className="ib !size-7 !border-0 text-text-dim hover:text-accent-teal"
                  >
                    <Pencil size={13} />
                  </button>
                  <DeleteSampleButton sampleId={s.id} projectId={projectId} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {(creating || editing) && (
        <SampleModal
          projectId={projectId}
          cases={cases}
          sampleFields={sampleFields}
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}

function DeleteSampleButton({ sampleId, projectId }: { sampleId: string; projectId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => {
        await deleteSample(sampleId, projectId);
      })}
      aria-label="Excluir amostra"
      title="Excluir"
      className="ib !size-7 !border-0 text-text-dim hover:text-neg disabled:opacity-30"
    >
      <Trash2 size={13} />
    </button>
  );
}
