"use client";

import type { FieldType, Json } from "@/lib/types/database";

// Definição de campo custom vinda de project_field_defs (options já normalizado
// para lista de rótulos). Usada para montar inputs dinâmicos em casos/amostras.
export type CustomFieldDef = {
  id: string;
  field_key: string;
  label: string;
  field_type: FieldType;
  options: string[];
  required: boolean;
};

export type CustomValues = Record<string, Json>;

// Valores iniciais a partir do jsonb `custom` já salvo (ou vazio para novo).
export function initCustomValues(defs: CustomFieldDef[], saved?: CustomValues | null): CustomValues {
  const base: CustomValues = {};
  for (const d of defs) base[d.field_key] = saved?.[d.field_key] ?? null;
  return base;
}

// Rótulos dos campos obrigatórios ainda vazios — para bloquear o salvar.
export function missingRequired(defs: CustomFieldDef[], values: CustomValues): string[] {
  return defs
    .filter((d) => d.required && isEmpty(values[d.field_key]))
    .map((d) => d.label);
}

function isEmpty(v: Json): boolean {
  return v === null || v === undefined || v === "" || v === false;
}

export function CustomFields({
  defs,
  values,
  onChange,
  disabled,
}: {
  defs: CustomFieldDef[];
  values: CustomValues;
  onChange: (key: string, value: Json) => void;
  disabled?: boolean;
}) {
  if (defs.length === 0) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {defs.map((def) => (
        <FieldInput
          key={def.id}
          def={def}
          value={values[def.field_key] ?? null}
          onChange={(v) => onChange(def.field_key, v)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

// Exibição só-leitura dos valores custom (ex.: no detalhe do caso). Pula os
// campos vazios e formata por tipo.
export function CustomValuesList({ defs, values }: { defs: CustomFieldDef[]; values: CustomValues }) {
  const filled = defs.filter((d) => !isEmpty(values[d.field_key] ?? null));
  if (filled.length === 0) return null;
  return (
    <dl className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
      {filled.map((d) => (
        <div key={d.id}>
          <dt className="text-[11px] uppercase tracking-[0.08em] text-text-dim">{d.label}</dt>
          <dd className="mt-0.5 text-[13.5px] text-foreground">{formatValue(d.field_type, values[d.field_key])}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatValue(type: FieldType, value: Json): string {
  if (value === null || value === undefined) return "—";
  if (type === "boolean") return value ? "Sim" : "Não";
  if (type === "date" && typeof value === "string") {
    return new Date(value).toLocaleDateString("pt-BR", {
      timeZone: "UTC",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return String(value);
}

function FieldInput({
  def,
  value,
  onChange,
  disabled,
}: {
  def: CustomFieldDef;
  value: Json;
  onChange: (value: Json) => void;
  disabled?: boolean;
}) {
  const wide = def.field_type === "textarea";

  if (def.field_type === "boolean") {
    return (
      <label className="flex items-center gap-2 self-end py-1.5 text-[13.5px] text-foreground">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        {def.label}
        {def.required && <span className="text-neg">*</span>}
      </label>
    );
  }

  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-[11.5px] text-text-dim">
        {def.label}
        {def.required && <span className="text-neg"> *</span>}
      </span>
      {def.field_type === "textarea" ? (
        <textarea
          className="input !min-h-20 !py-1.5 !text-[14px]"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
        />
      ) : def.field_type === "select" ? (
        <select
          className="input !py-1.5 !text-[14px]"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
        >
          <option value="">—</option>
          {def.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : def.field_type === "number" ? (
        <input
          type="number"
          className="input !py-1.5 !text-[14px]"
          value={typeof value === "number" ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          disabled={disabled}
        />
      ) : def.field_type === "date" ? (
        <input
          type="date"
          className="input !py-1.5 !text-[14px]"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
        />
      ) : (
        <input
          className="input !py-1.5 !text-[14px]"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
        />
      )}
    </label>
  );
}
