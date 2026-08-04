"use client";

import { useState, useTransition } from "react";
import { KeyRound, Mail } from "lucide-react";
import { resendInvite, revokeInvite } from "@/lib/actions/participants";
import type { ProjectMemberRole } from "@/lib/types/database";
import type { PendingInviteCode } from "@/lib/invites/pending";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { CopyField } from "./CopyField";

const ROLE_LABELS: Record<ProjectMemberRole, string> = {
  owner: "Dono",
  editor: "Editor",
  viewer: "Leitor",
};

export function InviteCodesList({
  invites,
  projectId,
  emailConfigured,
}: {
  invites: PendingInviteCode[];
  projectId: string;
  emailConfigured: boolean;
}) {
  if (invites.length === 0) return null;

  return (
    <div className="space-y-2 border-t border-border-subtle pt-4">
      <h3 className="text-[0.68rem] uppercase tracking-[0.14em] text-accent-teal">
        Convites em aberto
      </h3>
      <div className="space-y-2">
        {invites.map((invite) => (
          <InviteRow
            key={invite.id}
            invite={invite}
            projectId={projectId}
            emailConfigured={emailConfigured}
          />
        ))}
      </div>
    </div>
  );
}

function InviteRow({
  invite,
  projectId,
  emailConfigured,
}: {
  invite: PendingInviteCode;
  projectId: string;
  emailConfigured: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmingRevoke, setConfirmingRevoke] = useState(false);
  const [showLink, setShowLink] = useState(false);

  const expiry = invite.expiresAt ? new Date(invite.expiresAt) : null;
  const expired = invite.expired;

  const usage = invite.maxUses
    ? `${invite.usesCount}/${invite.maxUses} uso${invite.maxUses === 1 ? "" : "s"}`
    : `${invite.usesCount} uso${invite.usesCount === 1 ? "" : "s"} · sem limite`;

  return (
    <div className="rounded-[var(--radius-md)] border border-border-subtle px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="text-text-dim">
          {invite.email ? <Mail size={14} /> : <KeyRound size={14} />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-foreground">
            {invite.email ?? (
              <span className="font-mono tracking-[0.12em]">{invite.code}</span>
            )}
          </p>
          <p className="text-[11px] tabular-nums text-text-dim">
            {ROLE_LABELS[invite.role]} · {usage}
            {expiry &&
              ` · ${expired ? "expirado em" : "expira em"} ${expiry.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            className="!px-2 !py-1 text-xs"
            onClick={() => setShowLink((v) => !v)}
          >
            {showLink ? "Ocultar link" : "Ver link"}
          </Button>

          {invite.email && emailConfigured && (
            <Button
              variant="ghost"
              className="!px-2 !py-1 text-xs"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await resendInvite(invite.id, projectId);
                  setError(result.error);
                  setSuccess(result.error ? null : "E-mail reenviado.");
                })
              }
            >
              Reenviar
            </Button>
          )}

          {confirmingRevoke ? (
            <>
              <Button
                variant="danger"
                className="!px-2 !py-1 text-xs"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await revokeInvite(invite.id, projectId);
                    setError(result.error);
                    setConfirmingRevoke(false);
                  })
                }
              >
                Confirmar
              </Button>
              <Button
                variant="ghost"
                className="!px-2 !py-1 text-xs"
                onClick={() => setConfirmingRevoke(false)}
              >
                Cancelar
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              className="!px-2 !py-1 text-xs !text-[var(--color-neg)]"
              onClick={() => setConfirmingRevoke(true)}
            >
              Cancelar convite
            </Button>
          )}
        </div>
      </div>

      {showLink && (
        <div className="mt-2 flex flex-wrap gap-2">
          <CopyField label="Link" value={invite.link} />
          <CopyField label="Código" value={invite.code} mono />
        </div>
      )}

      {(error || success) && (
        <div className="mt-1.5">
          <FormMessage error={error ?? undefined} success={success ?? undefined} />
        </div>
      )}
    </div>
  );
}
