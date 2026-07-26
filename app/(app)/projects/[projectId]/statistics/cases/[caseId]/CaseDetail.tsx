"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Plus, Beaker, Trash2 } from "lucide-react";
import { CustomValuesList, type CustomValues } from "../../../CustomFields";
import type { FieldDef } from "../../../CustomFieldsManager";
import { CaseModal, STATUS_META, type CaseRow } from "../CaseModal";
import { SampleModal, fmtDate, type Sample } from "../../samples/SampleModal";
import { deleteSample } from "@/lib/actions/samples";

export function CaseDetail({
  projectId,
  caseData,
  caseFields,
  samples,
  sampleFields,
  canManage,
}: {
  projectId: string;
  caseData: CaseRow;
  caseFields: FieldDef[];
  samples: Sample[];
  sampleFields: FieldDef[];
  canManage: boolean;
}) {
  const [editingCase, setEditingCase] = useState(false);
  const [creatingSample, setCreatingSample] = useState(false);
  const [editingSample, setEditingSample] = useState<Sample | null>(null);

  return (
    <div className="space-y-5">
      <Link
        href={`/projects/${projectId}/statistics/cases`}
        className="inline-flex items-center gap-1.5 text-[12.5px] text-text-dim transition-colors hover:text-accent-teal"
      >
        <ArrowLeft size={14} /> Todos os casos
      </Link>

      {/* cabeçalho do caso */}
      <section className="card !gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-xl font-semibold text-foreground">{caseData.code}</h1>
              <span className={`tag ${STATUS_META[caseData.status].cls} !text-[10.5px]`}>
                {STATUS_META[caseData.status].label}
              </span>
            </div>
            {caseData.description && (
              <p className="mt-1.5 max-w-2xl text-[13.5px] text-text-dim">{caseData.description}</p>
            )}
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setEditingCase(true)}
              className="btn btn-secondary !py-1.5 !text-[12.5px]"
            >
              <Pencil size={14} /> Editar caso
            </button>
          )}
        </div>

        {caseFields.length > 0 && (
          <div className="border-t border-border-subtle pt-4">
            <CustomValuesList defs={caseFields} values={caseData.custom} />
          </div>
        )}
      </section>

      {/* amostras deste caso */}
      <section className="card !gap-0 !p-0">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div className="flex items-center gap-2">
            <Beaker size={17} className="text-accent-teal" strokeWidth={1.8} />
            <h2 className="font-serif text-lg font-semibold text-foreground">Amostras do caso</h2>
            <span className="text-[11.5px] tabular-nums text-text-dim">{samples.length}</span>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setCreatingSample(true)}
              className="btn btn-primary !py-1.5 !text-[12.5px]"
            >
              <Plus size={14} /> Adicionar amostra
            </button>
          )}
        </div>

        {samples.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-text-dim">
            {canManage
              ? "Nenhuma amostra neste caso — clique em “Adicionar amostra”."
              : "Nenhuma amostra neste caso."}
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {samples.map((s) => (
              <li key={s.id} className="group flex items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1 text-[14px] font-medium text-foreground">
                  {s.label || <span className="text-text-dim">Amostra sem identificador</span>}
                </div>
                <span className="shrink-0 text-[12px] tabular-nums text-text-dim">
                  {fmtDate(s.collected_at)}
                </span>
                {canManage && (
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => setEditingSample(s)}
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
      </section>

      {editingCase && (
        <CaseModal
          projectId={projectId}
          caseFields={caseFields}
          initial={caseData}
          onClose={() => setEditingCase(false)}
        />
      )}

      {(creatingSample || editingSample) && (
        <SampleModal
          projectId={projectId}
          cases={[]}
          sampleFields={sampleFields}
          initial={editingSample}
          fixedCaseId={caseData.id}
          onClose={() => {
            setCreatingSample(false);
            setEditingSample(null);
          }}
        />
      )}
    </div>
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
