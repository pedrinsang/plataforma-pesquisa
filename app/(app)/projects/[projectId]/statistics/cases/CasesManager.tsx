"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, FolderKanban, ChevronRight } from "lucide-react";
import { FieldsEditorButton } from "../../FieldsEditorButton";
import type { FieldDef } from "../../CustomFieldsManager";
import { deleteCase } from "@/lib/actions/cases";
import { CaseModal, STATUS_META, type CaseRow } from "./CaseModal";

export type { CaseRow };

export function CasesManager({
  projectId,
  cases,
  caseFields,
  canManage,
}: {
  projectId: string;
  cases: CaseRow[];
  caseFields: FieldDef[];
  canManage: boolean;
}) {
  const [editing, setEditing] = useState<CaseRow | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <section className="card !gap-0 !p-0">
      <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
        <div className="flex items-center gap-2">
          <FolderKanban size={17} className="text-accent-teal" strokeWidth={1.8} />
          <h2 className="font-serif text-lg font-semibold text-foreground">Casos</h2>
          <span className="text-[11.5px] tabular-nums text-text-dim">{cases.length}</span>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <FieldsEditorButton
              projectId={projectId}
              entity="case"
              fields={caseFields}
              canManage={canManage}
            />
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="btn btn-primary !py-1.5 !text-[12.5px]"
            >
              <Plus size={14} /> Novo caso
            </button>
          </div>
        )}
      </div>

      {cases.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-text-dim">
          {canManage ? "Nenhum caso ainda — crie o primeiro acima." : "Nenhum caso cadastrado."}
        </p>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {cases.map((c) => (
            <li key={c.id} className="group flex items-center gap-3 px-5 py-3.5">
              <Link
                href={`/projects/${projectId}/statistics/cases/${c.id}`}
                className="flex min-w-0 flex-1 items-center gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-[13.5px] font-semibold text-foreground transition-colors group-hover:text-accent-teal">
                      {c.code}
                    </span>
                    <span className={`tag ${STATUS_META[c.status].cls} shrink-0 !text-[10.5px]`}>
                      {STATUS_META[c.status].label}
                    </span>
                  </div>
                  {c.description && (
                    <p className="mt-0.5 line-clamp-1 text-[12.5px] text-text-dim">{c.description}</p>
                  )}
                </div>
                <ChevronRight
                  size={15}
                  className="shrink-0 text-text-dim opacity-0 transition-opacity group-hover:opacity-100"
                />
              </Link>

              <span className="shrink-0 text-[11.5px] tabular-nums text-text-dim">
                {c.sampleCount} {c.sampleCount === 1 ? "amostra" : "amostras"}
              </span>

              {canManage && (
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => setEditing(c)}
                    aria-label="Editar caso"
                    title="Editar"
                    className="ib !size-7 !border-0 text-text-dim hover:text-accent-teal"
                  >
                    <Pencil size={13} />
                  </button>
                  <DeleteCaseButton caseId={c.id} projectId={projectId} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {(creating || editing) && (
        <CaseModal
          projectId={projectId}
          caseFields={caseFields}
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

function DeleteCaseButton({ caseId, projectId }: { caseId: string; projectId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => {
        await deleteCase(caseId, projectId);
      })}
      aria-label="Excluir caso"
      title="Excluir"
      className="ib !size-7 !border-0 text-text-dim hover:text-neg disabled:opacity-30"
    >
      <Trash2 size={13} />
    </button>
  );
}
