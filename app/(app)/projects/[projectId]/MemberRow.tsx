"use client";

import { useState, useTransition } from "react";
import { removeMember, updateMemberRole } from "@/lib/actions/participants";
import type { ProjectMemberRole } from "@/lib/types/database";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";

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
  canChangeRole,
  canRemove,
  canManageOwner,
}: {
  memberId: string;
  projectId: string;
  name: string;
  role: ProjectMemberRole;
  pending: boolean;
  canChangeRole: boolean;
  /** Só donos excluem participantes (a RPC recusa qualquer outro caso). */
  canRemove: boolean;
  canManageOwner: boolean;
}) {
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const showRoleSelect = canChangeRole && (role !== "owner" || canManageOwner);
  const showRemove = canRemove && (role !== "owner" || canManageOwner);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="border-b border-border-subtle py-2.5 last:border-b-0">
      <div className="flex items-center gap-3">
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
                startTransition(async () => {
                  const result = await updateMemberRole(memberId, projectId, newRole);
                  setError(result.error);
                });
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

          {showRemove &&
            (confirmingRemove ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="danger"
                  className="!px-2 !py-1 text-xs"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await removeMember(memberId, projectId);
                      setError(result.error);
                      setConfirmingRemove(false);
                    })
                  }
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
                title={pending ? "Cancelar o convite" : "Excluir do projeto"}
              >
                {pending ? "Cancelar" : "Excluir"}
              </Button>
            ))}
        </div>
      </div>

      {(error || confirmingRemove) && (
        <div className="mt-1 pl-11">
          {confirmingRemove && !error && (
            <p className="text-[11.5px] text-text-dim">
              {pending
                ? "Cancelar este convite? O link e o código deixam de funcionar."
                : `Excluir ${name} do projeto? A pessoa perde o acesso imediatamente.`}
            </p>
          )}
          <FormMessage error={error ?? undefined} />
        </div>
      )}
    </div>
  );
}
