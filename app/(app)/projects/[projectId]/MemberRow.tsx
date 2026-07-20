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

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm text-foreground">{name}</p>
        {pending && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">Convite pendente</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {showRoleSelect ? (
          <Select
            className="w-auto py-1 text-xs"
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
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{ROLE_LABELS[role]}</span>
        )}

        {canManage && (role !== "owner" || canManageOwner) && (
          confirmingRemove ? (
            <div className="flex items-center gap-1">
              <Button
                variant="danger"
                className="px-2 py-1 text-xs"
                disabled={isPending}
                onClick={() => startTransition(() => removeMember(memberId, projectId))}
              >
                Confirmar
              </Button>
              <Button
                variant="ghost"
                className="px-2 py-1 text-xs"
                onClick={() => setConfirmingRemove(false)}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="px-2 py-1 text-xs text-red-600 dark:text-red-400"
              onClick={() => setConfirmingRemove(true)}
            >
              Remover
            </Button>
          )
        )}
      </div>
    </div>
  );
}
