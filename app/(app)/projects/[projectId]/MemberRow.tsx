"use client";

import { useState, useTransition } from "react";
import { removeMember, updateMemberRole } from "@/lib/actions/participants";
import type { ProjectMemberRole } from "@/lib/types/database";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";

const ROLE_LABELS: Record<ProjectMemberRole, string> = {
  owner: "Dono",
  editor: "Editor",
  viewer: "Leitor",
};

export function MemberRow({
  memberId,
  projectId,
  name,
  role,
  pending,
  canManage,
  canManageOwner,
}: {
  memberId: string;
  projectId: string;
  name: string;
  role: ProjectMemberRole;
  pending: boolean;
  canManage: boolean;
  canManageOwner: boolean;
}) {
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [isPending, startTransition] = useTransition();

  const showRoleSelect = canManage && (role !== "owner" || canManageOwner);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex items-center gap-3 border-b border-border-subtle py-2.5 last:border-b-0">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full font-serif text-[12px] font-semibold"
        style={{ background: "var(--color-accent-200)", color: "var(--color-accent-800)" }}
      >
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold text-foreground">{name}</p>
        {pending && <span className="text-[11px] text-text-dim">Convite pendente</span>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {showRoleSelect ? (
          <Select
            className="!min-h-0 w-auto !py-1 text-xs"
            value={role}
            disabled={isPending}
            onChange={(e) => {
              const newRole = e.target.value as ProjectMemberRole;
              startTransition(() => updateMemberRole(memberId, projectId, newRole));
            }}
          >
            <option value="viewer">Leitor</option>
            <option value="editor">Editor</option>
            {canManageOwner && <option value="owner">Dono</option>}
          </Select>
        ) : (
          <span className={role === "owner" ? "tag tag-accent" : "tag tag-neutral"}>
            {ROLE_LABELS[role]}
          </span>
        )}

        {canManage &&
          (role !== "owner" || canManageOwner) &&
          (confirmingRemove ? (
            <div className="flex items-center gap-1">
              <Button
                variant="danger"
                className="!px-2 !py-1 text-xs"
                disabled={isPending}
                onClick={() => startTransition(() => removeMember(memberId, projectId))}
              >
                Confirmar
              </Button>
              <Button
                variant="ghost"
                className="!px-2 !py-1 text-xs"
                onClick={() => setConfirmingRemove(false)}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="!px-2 !py-1 text-xs !text-[var(--color-neg)]"
              onClick={() => setConfirmingRemove(true)}
            >
              Remover
            </Button>
          ))}
      </div>
    </div>
  );
}
