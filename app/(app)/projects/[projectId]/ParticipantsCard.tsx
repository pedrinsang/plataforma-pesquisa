import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { InviteMemberForm } from "./InviteMemberForm";
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
  const canManage = me?.role === "owner" || me?.role === "editor";
  const visible = (members ?? []).slice(0, 4);

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
          return (
            <MemberRow
              key={member.id}
              memberId={member.id}
              projectId={projectId}
              name={displayName}
              role={member.role}
              pending={member.status === "pending"}
              canManage={Boolean(canManage) && member.user_id !== user?.id}
              canManageOwner={isOwner}
            />
          );
        })}
      </div>

      {canManage && <InviteMemberForm projectId={projectId} canInviteOwner={isOwner} />}
    </Card>
  );
}
