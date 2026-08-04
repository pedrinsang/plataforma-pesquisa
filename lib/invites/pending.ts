import type { ProjectMemberRole } from "@/lib/types/database";
import { inviteLink } from "@/lib/invites/format";

export type PendingInviteCode = {
  id: string;
  code: string;
  link: string;
  role: ProjectMemberRole;
  email: string | null;
  maxUses: number | null;
  usesCount: number;
  expiresAt: string | null;
  /** Resolvido aqui, fora do render: o relógio não entra em componente. */
  expired: boolean;
};

type InviteRow = {
  id: string;
  code: string;
  role: ProjectMemberRole;
  email: string | null;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
};

/**
 * Converte as linhas de `project_invite_codes` no formato da lista, já sem os
 * convites que esgotaram os usos (esses não valem mais nada) e com o link
 * pronto para copiar.
 */
export function toPendingInvites(rows: InviteRow[], appUrl: string): PendingInviteCode[] {
  const now = Date.now();

  return rows
    .filter((row) => row.max_uses === null || row.uses_count < row.max_uses)
    .map((row) => ({
      id: row.id,
      code: row.code,
      link: inviteLink(appUrl, row.code),
      role: row.role,
      email: row.email,
      maxUses: row.max_uses,
      usesCount: row.uses_count,
      expiresAt: row.expires_at,
      expired: row.expires_at ? new Date(row.expires_at).getTime() < now : false,
    }));
}
