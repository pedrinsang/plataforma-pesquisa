"use client";

import { useState, useTransition } from "react";
import { ChevronUp, ChevronDown, Pencil, Trash2, Plus, Check, X, Sparkles } from "lucide-react";
import type { FieldEntity, FieldType } from "@/lib/types/database";
import {
  createFieldDef,
  updateFieldDef,
  deleteFieldDef,
  moveFieldDef,
  addExampleFields,
} from "@/lib/actions/fieldDefs";

export type FieldDef = {
  id: string;
  entity: FieldEntity;
  field_key: string;
  label: string;
  field_type: FieldType;
  options: string[];
  required: boolean;
};

const TYPE_LABELS: Record<FieldType, string> = {
  text: "Texto",
  textarea: "Texto longo",
  number: "Número",
  date: "Data",
  select: "Seleção",
  boolean: "Sim / Não",
};
const TYPE_ORDER: FieldType[] = ["text", "textarea", "number", "date", "select", "boolean"];

type Draft = { label: string; fieldType: FieldType; options: string; required: boolean };
const emptyDraft: Draft = { label: "", fieldType: "text", options: "", required: false };
const toOptions = (s: string) => s.split(",").map((o) => o.trim()).filter(Boolean);

// Editor dos campos personalizados de UMA entidade (caso ou amostra). Aparece
// nas próprias telas de Casos/Amostras, dentro de um modal — não escondido em
// Configurações.
export function EntityFieldsEditor({
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
  const noun = entity === "case" ? "caso" : "amostra";
  return (
    <div className="flex flex-col">
      <p className="mb-4 text-[12.5px] text-text-dim">
        Estes campos aparecem no formulário {entity === "case" ? "do caso" : "da amostra"}. Ajuste-os
        para a sua pesquisa — a plataforma se adapta à sua área.
      </p>

      {fields.length === 0 ? (
        <EmptyState projectId={projectId} entity={entity} noun={noun} canManage={canManage} />
      ) : (
        <ul className="divide-y divide-border-subtle rounded-lg border border-border-subtle">
          {fields.map((f, i) => (
            <FieldRow
              key={f.id}
              field={f}
              projectId={projectId}
              canManage={canManage}
              isFirst={i === 0}
              isLast={i === fields.length - 1}
            />
          ))}
        </ul>
      )}

      {canManage && fields.length > 0 && <AddField projectId={projectId} entity={entity} />}
    </div>
  );
}

function EmptyState({
  projectId,
  entity,
  noun,
  canManage,
}: {
  projectId: string;
  entity: FieldEntity;
  noun: string;
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);

  if (!canManage) {
    return <p className="py-6 text-center text-sm text-text-dim">Nenhum campo personalizado.</p>;
  }

  if (adding) {
    return (
      <div className="rounded-lg border border-border-subtle p-4">
        <AddFieldForm projectId={projectId} entity={entity} onDone={() => setAdding(false)} />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-border-strong p-5 text-center">
      <p className="text-sm text-text-dim">
        Ainda não há campos personalizados para {noun}. Comece com um conjunto de exemplo — dá para
        editar ou apagar depois.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          className="btn btn-primary !py-1.5 !text-[12.5px]"
          disabled={pending}
          onClick={() => startTransition(async () => void addExampleFields(projectId, entity))}
        >
          <Sparkles size={14} /> {pending ? "Adicionando…" : "Adicionar campos de exemplo"}
        </button>
        <button
          type="button"
          className="btn btn-ghost !py-1.5 !text-[12.5px]"
          onClick={() => setAdding(true)}
        >
          <Plus size={14} /> Criar do zero
        </button>
      </div>
    </div>
  );
}

function FieldRow({
  field,
  projectId,
  canManage,
  isFirst,
  isLast,
}: {
  field: FieldDef;
  projectId: string;
  canManage: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
    });
  }

  if (editing) {
    return (
      <li className="px-4 py-3.5">
        <FieldForm
          initial={{
            label: field.label,
            fieldType: field.field_type,
            options: field.options.join(", "),
            required: field.required,
          }}
          pending={pending}
          error={error}
          submitLabel="Salvar"
          onCancel={() => {
            setEditing(false);
            setError(null);
          }}
          onSubmit={(draft) => {
            setError(null);
            startTransition(async () => {
              const res = await updateFieldDef(field.id, projectId, {
                label: draft.label,
                fieldType: draft.fieldType,
                options: toOptions(draft.options),
                required: draft.required,
              });
              if (res.error) setError(res.error);
              else setEditing(false);
            });
          }}
        />
      </li>
    );
  }

  return (
    <li className={`group flex items-center gap-3 px-4 py-3 ${pending ? "opacity-60" : ""}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[14px] font-medium text-foreground">
          <span className="truncate">{field.label}</span>
          {field.required && (
            <span className="text-neg" title="Obrigatório">
              *
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[11px] text-text-dim">
          {TYPE_LABELS[field.field_type]}
          {field.field_type === "select" && field.options.length > 0 && ` · ${field.options.join(", ")}`}
        </div>
      </div>

      {canManage && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <RowIcon
            label="Subir"
            disabled={isFirst || pending}
            onClick={() => run(() => moveFieldDef(projectId, field.id, field.entity, "up"))}
          >
            <ChevronUp size={15} />
          </RowIcon>
          <RowIcon
            label="Descer"
            disabled={isLast || pending}
            onClick={() => run(() => moveFieldDef(projectId, field.id, field.entity, "down"))}
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
            onClick={() => run(() => deleteFieldDef(field.id, projectId))}
          >
            <Trash2 size={13} />
          </RowIcon>
        </div>
      )}
    </li>
  );
}

function AddField({ projectId, entity }: { projectId: string; entity: FieldEntity }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 self-start text-[13px] text-accent-teal transition-colors hover:text-accent"
      >
        <Plus size={15} /> Adicionar campo
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-border-subtle p-4">
      <AddFieldForm projectId={projectId} entity={entity} onDone={() => setOpen(false)} />
    </div>
  );
}

function AddFieldForm({
  projectId,
  entity,
  onDone,
}: {
  projectId: string;
  entity: FieldEntity;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <FieldForm
      initial={emptyDraft}
      pending={pending}
      error={error}
      submitLabel="Adicionar"
      onCancel={onDone}
      onSubmit={(draft) => {
        setError(null);
        startTransition(async () => {
          const res = await createFieldDef(projectId, {
            entity,
            label: draft.label,
            fieldType: draft.fieldType,
            options: toOptions(draft.options),
            required: draft.required,
          });
          if (res.error) setError(res.error);
          else onDone();
        });
      }}
    />
  );
}

function FieldForm({
  initial,
  pending,
  error,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: Draft;
  pending: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (draft: Draft) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(initial.label);
  const [fieldType, setFieldType] = useState<FieldType>(initial.fieldType);
  const [options, setOptions] = useState(initial.options);
  const [required, setRequired] = useState(initial.required);

  function submit() {
    if (!label.trim()) return;
    onSubmit({ label, fieldType, options, required });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_9rem]">
        <input
          className="input !py-1.5 !text-[14px]"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nome do campo (ex: Espécie)"
          autoFocus
          disabled={pending}
          onKeyDown={(e) => {
            if (e.key === "Enter" && fieldType !== "select") submit();
            if (e.key === "Escape") onCancel();
          }}
        />
        <select
          className="input !py-1.5 !text-[13px]"
          value={fieldType}
          onChange={(e) => setFieldType(e.target.value as FieldType)}
          disabled={pending}
        >
          {TYPE_ORDER.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {fieldType === "select" && (
        <input
          className="input !py-1.5 !text-[13px]"
          value={options}
          onChange={(e) => setOptions(e.target.value)}
          placeholder="Opções separadas por vírgula (ex: Canina, Felina, Outra)"
          disabled={pending}
        />
      )}

      <label className="flex items-center gap-2 text-[12.5px] text-text-dim">
        <input
          type="checkbox"
          checked={required}
          onChange={(e) => setRequired(e.target.checked)}
          disabled={pending}
        />
        Obrigatório
      </label>

      {error && <p className="text-[11.5px] text-neg">{error}</p>}

      <div className="flex gap-1.5">
        <button type="button" className="btn btn-primary !py-1 !text-[12px]" onClick={submit} disabled={pending}>
          <Check size={13} /> {pending ? "Salvando…" : submitLabel}
        </button>
        <button type="button" className="btn btn-ghost !py-1 !text-[12px]" onClick={onCancel} disabled={pending}>
          <X size={13} /> Cancelar
        </button>
      </div>
    </div>
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
