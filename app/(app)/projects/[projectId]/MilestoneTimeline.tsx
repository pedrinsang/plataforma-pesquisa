"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  CircleDot,
  Circle,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
} from "lucide-react";
import type { MilestoneStatus } from "@/lib/types/database";
import {
  createMilestone,
  updateMilestone,
  setMilestoneStatus,
  deleteMilestone,
  moveMilestone,
} from "@/lib/actions/milestones";

export type Milestone = {
  id: string;
  title: string;
  detail: string | null;
  status: MilestoneStatus;
};

const STATUS_META: Record<
  MilestoneStatus,
  { Icon: typeof Circle; iconClass: string; tag: string; tagClass: string }
> = {
  done: { Icon: CheckCircle2, iconClass: "text-accent-teal", tag: "Concluído", tagClass: "tag-neutral" },
  in_progress: { Icon: CircleDot, iconClass: "text-accent-teal", tag: "Em andamento", tagClass: "tag-outline" },
  pending: { Icon: Circle, iconClass: "text-text-dim opacity-50", tag: "Pendente", tagClass: "tag-neutral" },
};

// clicar no ícone avança o status em ciclo
const NEXT_STATUS: Record<MilestoneStatus, MilestoneStatus> = {
  pending: "in_progress",
  in_progress: "done",
  done: "pending",
};

export function MilestoneTimeline({
  projectId,
  milestones,
  canManage,
}: {
  projectId: string;
  milestones: Milestone[];
  canManage: boolean;
}) {
  const doneCount = milestones.filter((m) => m.status === "done").length;

  return (
    <section className="card !gap-0 !p-0">
      <div className="flex items-baseline justify-between border-b border-border-subtle px-5 py-4">
        <h2 className="font-serif text-lg font-semibold text-foreground">Linha do tempo</h2>
        {milestones.length > 0 && (
          <span className="text-[11.5px] tabular-nums text-text-dim">
            {doneCount} de {milestones.length} fases
          </span>
        )}
      </div>

      {milestones.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-text-dim">
          {canManage ? "Nenhuma fase ainda — adicione a primeira abaixo." : "Nenhuma fase definida ainda."}
        </p>
      ) : (
        <ol className="divide-y divide-border-subtle">
          {milestones.map((m, i) => (
            <TimelineRow
              key={m.id}
              milestone={m}
              projectId={projectId}
              canManage={canManage}
              isFirst={i === 0}
              isLast={i === milestones.length - 1}
            />
          ))}
        </ol>
      )}

      {canManage && <AddMilestoneRow projectId={projectId} />}
    </section>
  );
}

function TimelineRow({
  milestone,
  projectId,
  canManage,
  isFirst,
  isLast,
}: {
  milestone: Milestone;
  projectId: string;
  canManage: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(milestone.title);
  const [detail, setDetail] = useState(milestone.detail ?? "");
  const [error, setError] = useState<string | null>(null);

  const meta = STATUS_META[milestone.status];
  const active = milestone.status === "in_progress";

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
    });
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateMilestone(milestone.id, projectId, {
        title,
        detail: detail.trim() || null,
      });
      if (res.error) setError(res.error);
      else setEditing(false);
    });
  }

  if (editing) {
    return (
      <li className="flex flex-col gap-2 px-5 py-3.5">
        <input
          className="input !py-1.5 !text-[14px]"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do marco"
          autoFocus
          disabled={pending}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <input
          className="input !py-1.5 !text-[12.5px]"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Detalhe (opcional)"
          disabled={pending}
        />
        {error && <p className="text-[11.5px] text-neg">{error}</p>}
        <div className="flex gap-1.5">
          <button type="button" className="btn btn-primary !py-1 !text-[12px]" onClick={save} disabled={pending}>
            <Check size={13} /> Salvar
          </button>
          <button
            type="button"
            className="btn btn-ghost !py-1 !text-[12px]"
            onClick={() => {
              setEditing(false);
              setTitle(milestone.title);
              setDetail(milestone.detail ?? "");
              setError(null);
            }}
            disabled={pending}
          >
            Cancelar
          </button>
        </div>
      </li>
    );
  }

  return (
    <li
      className={`group flex items-center gap-3 px-5 py-3.5 ${active ? "bg-accent-teal-soft" : ""} ${
        pending ? "opacity-60" : ""
      }`}
    >
      <button
        type="button"
        disabled={!canManage || pending}
        onClick={() => run(() => setMilestoneStatus(milestone.id, projectId, NEXT_STATUS[milestone.status]))}
        title={canManage ? "Avançar status" : undefined}
        className={`shrink-0 ${canManage ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}`}
        aria-label={`Status: ${meta.tag}`}
      >
        <meta.Icon size={19} strokeWidth={1.8} className={meta.iconClass} />
      </button>

      <div className="min-w-0 flex-1">
        <div
          className={`text-[14px] font-medium ${
            milestone.status === "pending" ? "text-text-dim" : "text-foreground"
          }`}
        >
          {milestone.title}
        </div>
        {milestone.detail && <div className="mt-0.5 text-[11.5px] text-text-dim">{milestone.detail}</div>}
      </div>

      <span className={`tag ${meta.tagClass} shrink-0 !text-[10.5px]`}>{meta.tag}</span>

      {canManage && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <RowIcon
            label="Subir"
            disabled={isFirst || pending}
            onClick={() => run(() => moveMilestone(projectId, milestone.id, "up"))}
          >
            <ChevronUp size={15} />
          </RowIcon>
          <RowIcon
            label="Descer"
            disabled={isLast || pending}
            onClick={() => run(() => moveMilestone(projectId, milestone.id, "down"))}
          >
            <ChevronDown size={15} />
          </RowIcon>
          <RowIcon label="Editar" disabled={pending} onClick={() => setEditing(true)}>
            <Pencil size={13} />
          </RowIcon>
          <RowIcon
            label="Excluir"
            disabled={pending}
            danger
            onClick={() => run(() => deleteMilestone(milestone.id, projectId))}
          >
            <Trash2 size={13} />
          </RowIcon>
        </div>
      )}
    </li>
  );
}

function RowIcon({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`ib !size-7 !border-0 ${
        danger ? "text-text-dim hover:text-neg" : "text-text-dim hover:text-accent-teal"
      } disabled:cursor-not-allowed disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

function AddMilestoneRow({ projectId }: { projectId: string }) {
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function add() {
    if (!title.trim()) {
      setError("Informe um título para o marco.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await createMilestone(projectId, { title, detail: detail.trim() || null });
      if (res.error) {
        setError(res.error);
      } else {
        setTitle("");
        setDetail("");
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <div className="border-t border-border-subtle px-5 py-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-[13px] text-accent-teal transition-colors hover:text-accent"
        >
          <Plus size={15} /> Adicionar marco
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border-subtle px-5 py-3.5">
      <input
        className="input !py-1.5 !text-[14px]"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título do marco (ex: Coleta de dados)"
        autoFocus
        disabled={pending}
        onKeyDown={(e) => {
          if (e.key === "Enter") add();
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <input
        className="input !py-1.5 !text-[12.5px]"
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder="Detalhe (opcional)"
        disabled={pending}
      />
      {error && <p className="text-[11.5px] text-neg">{error}</p>}
      <div className="flex gap-1.5">
        <button type="button" className="btn btn-primary !py-1 !text-[12px]" onClick={add} disabled={pending}>
          <Plus size={13} /> {pending ? "Adicionando…" : "Adicionar"}
        </button>
        <button
          type="button"
          className="btn btn-ghost !py-1 !text-[12px]"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={pending}
        >
          <X size={13} /> Cancelar
        </button>
      </div>
    </div>
  );
}
