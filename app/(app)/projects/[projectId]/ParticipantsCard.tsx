import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { isEmailConfigured } from "@/lib/email/send";
import { toPendingInvites, type PendingInviteCode } from "@/lib/invites/pending";
import { getAppUrl } from "@/lib/utils/app-url";
import { InviteMemberForm } from "./InviteMemberForm";
import { InviteCodesList } from "./InviteCodesList";
import { MemberRow } from "./MemberRow";

export async function ParticipantsCard({ projectId }: { projectId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: members } = await supabase
    .from("project_members")
    .select("id, user_id, invited_email, role, status, profiles(full_name, email)")
    .eq("project_id", projectId)
    .order("status", { ascending: false })
    .order("created_at", { ascending: true });

  const me = members?.find((m) => m.user_id === user?.id);
  const isOwner = me?.role === "owner";
  const canInvite = me?.role === "owner" || me?.role === "editor";
  const visible = (members ?? []).slice(0, 4);

  // Códigos em aberto: só owner/editor enxergam (policy de RLS), e a lista fica
  // fora do caminho de quem não convida.
  let invites: PendingInviteCode[] = [];
  if (canInvite) {
    const appUrl = await getAppUrl();
    const { data: rows } = await supabase
      .from("project_invite_codes")
      .select("id, code, role, email, max_uses, uses_count, expires_at")
      .eq("project_id", projectId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });

    invites = toPendingInvites(rows ?? [], appUrl);
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-foreground">Participantes</h2>
        <div className="flex items-center">
          {visible.map((m, i) => {
            const label = m.profiles?.full_name || m.profiles?.email || m.invited_email || "—";
            return (
              <span
                key={m.id}
                className="flex size-7 items-center justify-center rounded-full border-2 border-surface font-serif text-[11px] font-semibold"
                style={{
                  background: "var(--color-accent-200)",
                  color: "var(--color-accent-800)",
                  marginLeft: i === 0 ? 0 : -8,
                }}
                title={label}
              >
                {label.trim().charAt(0).toUpperCase() || "?"}
              </span>
            );
          })}
          {(members?.length ?? 0) > 4 && (
            <span
              className="flex size-7 items-center justify-center rounded-full border-2 border-surface text-[10px] font-semibold"
              style={{
                background: "var(--color-neutral-300)",
                color: "var(--color-neutral-800)",
                marginLeft: -8,
              }}
            >
              +{(members?.length ?? 0) - 4}
            </span>
          )}
        </div>
      </div>

      <div>
        {members?.map((member) => {
          const displayName =
            member.profiles?.full_name || member.profiles?.email || member.invited_email || "—";
          const isSelf = member.user_id === user?.id;
          return (
            <MemberRow
              key={member.id}
              memberId={member.id}
              projectId={projectId}
              name={displayName}
              role={member.role}
              pending={member.status === "pending"}
              canChangeRole={Boolean(canInvite) && !isSelf}
              // excluir participante é decisão de dono (regra também no banco)
              canRemove={Boolean(isOwner) && !isSelf}
              canManageOwner={Boolean(isOwner)}
            />
          );
        })}
      </div>

      {canInvite && (
        <InviteCodesList
          invites={invites}
          projectId={projectId}
          emailConfigured={isEmailConfigured()}
        />
      )}

      {canInvite && <InviteMemberForm projectId={projectId} canInviteOwner={Boolean(isOwner)} />}
    </Card>
  );
}
