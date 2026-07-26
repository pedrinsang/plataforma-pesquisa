import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { InviteActions } from "./InviteActions";

const ROLE_LABELS: Record<string, string> = {
  owner: "dono",
  editor: "editor",
  viewer: "leitor",
};

export async function PendingInvites() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: invites } = await supabase
    .from("project_members")
    .select("id, project_id, role, projects(title)")
    .eq("status", "pending")
    .or(`user_id.eq.${user.id},invited_email.eq.${user.email}`);

  if (!invites || invites.length === 0) return null;

  return (
    <Card className="space-y-3 !border-accent-teal/40 bg-accent-teal-soft/30">
      <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
        <Mail size={16} className="text-accent-teal" /> Convites pendentes
      </h2>
      <div className="divide-y divide-border-subtle">
        {invites.map((invite) => (
          <div key={invite.id} className="flex items-center justify-between gap-3 py-2">
            <p className="text-sm text-foreground">
              <span className="font-medium">{invite.projects?.title ?? "Projeto"}</span>{" "}
              <span className="text-zinc-500 dark:text-zinc-400">
                — convite como {ROLE_LABELS[invite.role]}
              </span>
            </p>
            <InviteActions projectId={invite.project_id} />
          </div>
        ))}
      </div>
    </Card>
  );
}
