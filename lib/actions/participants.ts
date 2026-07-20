"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ProjectMemberRole } from "@/lib/types/database";
import { inviteMemberSchema } from "@/lib/validations/participants";

export type InviteMemberState = { error: string | null };

export async function inviteMember(
  projectId: string,
  _prevState: InviteMemberState,
  formData: FormData,
): Promise<InviteMemberState> {
  const parsed = inviteMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("invite_project_member", {
    p_project_id: projectId,
    p_email: parsed.data.email,
    p_role: parsed.data.role,
  });

  if (error) {
    if (error.message.includes("already a member")) {
      return { error: "Essa pessoa já faz parte do projeto." };
    }
    if (error.message.includes("only an owner")) {
      return { error: "Só o dono do projeto pode convidar outro dono." };
    }
    return { error: "Não foi possível enviar o convite." };
  }

  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function removeMember(memberId: string, projectId: string) {
  const supabase = await createClient();
  await supabase.rpc("remove_project_member", { p_member_id: memberId });
  revalidatePath(`/projects/${projectId}`);
}

export async function updateMemberRole(
  memberId: string,
  projectId: string,
  role: ProjectMemberRole,
) {
  const supabase = await createClient();
  await supabase.rpc("update_member_role", { p_member_id: memberId, p_role: role });
  revalidatePath(`/projects/${projectId}`);
}

export async function acceptInvite(projectId: string) {
  const supabase = await createClient();
  await supabase.rpc("accept_project_invite", { p_project_id: projectId });
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}

export async function declineInvite(projectId: string) {
  const supabase = await createClient();
  await supabase.rpc("decline_project_invite", { p_project_id: projectId });
  revalidatePath("/projects");
}
