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

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-text-dim">
          Participantes
        </h2>
        <span className="font-mono text-[0.7rem] text-text-dim">{members?.length ?? 0}</span>
      </div>

      <div className="divide-y divide-border-subtle">
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
