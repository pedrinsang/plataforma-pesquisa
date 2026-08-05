"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProjectMemberRole } from "@/lib/types/database";
import {
  inviteCodeSchema,
  inviteMemberSchema,
  redeemCodeSchema,
} from "@/lib/validations/participants";
import { generateInviteCode } from "@/lib/invites/code";
import { inviteLink, normalizeInviteCode } from "@/lib/invites/format";
import { getAppUrl } from "@/lib/utils/app-url";
import { sendEmail } from "@/lib/email/send";
import { inviteEmail } from "@/lib/email/invite-template";

export type ActionState = { error: string | null };

export type InviteMemberState = {
  error: string | null;
  /** Preenchido no sucesso: o link a copiar (e se o e-mail chegou a sair). */
  invite?: {
    code: string;
    link: string;
    email: string | null;
    emailSent: boolean;
    emailProblem: "not-configured" | "failed" | null;
    /** Motivo cru devolvido pelo provedor, para o convidante saber o que ajustar. */
    emailDetail?: string | null;
  };
};

// Erros vindos das RPCs chegam como texto do Postgres; traduzimos os
// conhecidos e escondemos o resto (não vazar detalhe do banco para a tela).
function translate(message: string, fallback: string): string {
  const cases: [string, string][] = [
    ["already a member", "Essa pessoa já faz parte do projeto."],
    ["only an owner can invite another owner", "Só o dono do projeto pode convidar outro dono."],
    ["only an owner can remove members", "Só o dono do projeto pode excluir participantes."],
    [
      "only an owner can grant or revoke",
      "Só o dono do projeto pode conceder ou retirar o papel de dono.",
    ],
    ["you cannot remove yourself", "Você não pode se excluir do projeto."],
    ["must keep at least one owner", "O projeto precisa ter pelo menos um dono."],
    ["not authorized", "Você não tem permissão para isso."],
    ["invalid email", "Informe um e-mail válido."],
    ["invite not found", "Convite não encontrado."],
    ["invite revoked", "Este convite foi cancelado."],
    ["invite expired", "Este convite expirou."],
    ["invite exhausted", "Este convite já atingiu o limite de usos."],
    ["belongs to another email", "Este convite é para outro e-mail."],
    ["invalid invite code", "Código inválido."],
    ["member not found", "Participante não encontrado."],
  ];

  const hit = cases.find(([needle]) => message.includes(needle));
  return hit ? hit[1] : fallback;
}

// ---------------------------------------------------------------------------
// Convidar por e-mail
// ---------------------------------------------------------------------------
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
  const code = generateInviteCode();

  const { error } = await supabase.rpc("create_project_invite", {
    p_project_id: projectId,
    p_code: code,
    p_role: parsed.data.role,
    p_email: parsed.data.email,
  });

  if (error) {
    return { error: translate(error.message, "Não foi possível criar o convite.") };
  }

  const delivery = await deliverInviteEmail({
    projectId,
    code,
    to: parsed.data.email,
    role: parsed.data.role,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/settings`);

  return {
    error: null,
    invite: {
      code,
      link: delivery.link,
      email: parsed.data.email,
      emailSent: delivery.sent,
      emailProblem: delivery.problem,
      emailDetail: delivery.detail,
    },
  };
}

// ---------------------------------------------------------------------------
// Convidar por código aleatório (link aberto)
// ---------------------------------------------------------------------------
export async function createInviteCode(
  projectId: string,
  _prevState: InviteMemberState,
  formData: FormData,
): Promise<InviteMemberState> {
  const parsed = inviteCodeSchema.safeParse({
    role: formData.get("role"),
    expiresInDays: formData.get("expiresInDays"),
    maxUses: formData.get("maxUses"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const code = generateInviteCode();

  const { error } = await supabase.rpc("create_project_invite", {
    p_project_id: projectId,
    p_code: code,
    p_role: parsed.data.role,
    p_email: null,
    p_max_uses: parsed.data.maxUses,
    p_expires_in_days: parsed.data.expiresInDays,
  });

  if (error) {
    return { error: translate(error.message, "Não foi possível gerar o código.") };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/settings`);

  return {
    error: null,
    invite: {
      code,
      link: inviteLink(await getAppUrl(), code),
      email: null,
      emailSent: false,
      emailProblem: null,
    },
  };
}

// ---------------------------------------------------------------------------
// Reenviar o e-mail de um convite já existente
// ---------------------------------------------------------------------------
export async function resendInvite(
  inviteId: string,
  projectId: string,
): Promise<InviteMemberState> {
  const supabase = await createClient();

  const { data: invite, error } = await supabase
    .from("project_invite_codes")
    .select("id, code, role, email, revoked_at")
    .eq("id", inviteId)
    .single();

  if (error || !invite) return { error: "Convite não encontrado." };
  if (invite.revoked_at) return { error: "Este convite foi cancelado." };
  if (!invite.email) return { error: "Este convite não tem e-mail — compartilhe o link." };

  const delivery = await deliverInviteEmail({
    projectId,
    code: invite.code,
    to: invite.email,
    role: invite.role,
  });

  return {
    error: delivery.sent
      ? null
      : delivery.detail
        ? `O provedor recusou o envio: ${delivery.detail}`
        : "Não foi possível enviar o e-mail. Copie o link e envie você.",
    invite: {
      code: invite.code,
      link: delivery.link,
      email: invite.email,
      emailSent: delivery.sent,
      emailProblem: delivery.problem,
      emailDetail: delivery.detail,
    },
  };
}

// ---------------------------------------------------------------------------
// Cancelar um convite
// ---------------------------------------------------------------------------
export async function revokeInvite(inviteId: string, projectId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_project_invite", { p_invite_id: inviteId });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/settings`);

  return { error: error ? translate(error.message, "Não foi possível cancelar o convite.") : null };
}

// ---------------------------------------------------------------------------
// Participantes
// ---------------------------------------------------------------------------
export async function removeMember(memberId: string, projectId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_project_member", { p_member_id: memberId });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/settings`);

  return {
    error: error ? translate(error.message, "Não foi possível excluir o participante.") : null,
  };
}

export async function updateMemberRole(
  memberId: string,
  projectId: string,
  role: ProjectMemberRole,
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_member_role", {
    p_member_id: memberId,
    p_role: role,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/settings`);

  return { error: error ? translate(error.message, "Não foi possível trocar o papel.") : null };
}

// ---------------------------------------------------------------------------
// Convidado: aceitar / recusar / resgatar código
// ---------------------------------------------------------------------------
export async function acceptInvite(projectId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_project_invite", { p_project_id: projectId });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);

  return { error: error ? translate(error.message, "Não foi possível aceitar o convite.") : null };
}

export async function declineInvite(projectId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("decline_project_invite", { p_project_id: projectId });

  revalidatePath("/projects");

  return { error: error ? translate(error.message, "Não foi possível recusar o convite.") : null };
}

export type RedeemState = { error: string | null };

/** Resgata o código e leva direto para o projeto. */
export async function redeemInvite(
  _prevState: RedeemState,
  formData: FormData,
): Promise<RedeemState> {
  const parsed = redeemCodeSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Código inválido." };
  }

  const supabase = await createClient();
  const { data: projectId, error } = await supabase.rpc("redeem_project_invite", {
    p_code: parsed.data.code,
  });

  if (error || !projectId) {
    return {
      error: error
        ? translate(error.message, "Não foi possível usar este convite.")
        : "Convite não encontrado.",
    };
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

// ---------------------------------------------------------------------------
// Envio do e-mail (o convite vale mesmo se o envio falhar — a interface
// mostra o link para quem convidou repassar por outro canal)
// ---------------------------------------------------------------------------
async function deliverInviteEmail({
  projectId,
  code,
  to,
  role,
}: {
  projectId: string;
  code: string;
  to: string;
  role: string;
}): Promise<{
  sent: boolean;
  problem: "not-configured" | "failed" | null;
  detail: string | null;
  link: string;
}> {
  const link = inviteLink(await getAppUrl(), code);
  const supabase = await createClient();

  const [{ data: project }, { data: userData }] = await Promise.all([
    supabase.from("projects").select("title").eq("id", projectId).single(),
    supabase.auth.getUser(),
  ]);

  let inviterName: string | null = userData?.user?.email ?? null;
  if (userData?.user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userData.user.id)
      .single();
    inviterName = profile?.full_name || profile?.email || inviterName;
  }

  const { subject, html, text } = inviteEmail({
    projectTitle: project?.title ?? "Projeto de pesquisa",
    inviterName,
    role,
    link,
    code: normalizeInviteCode(code),
  });

  const result = await sendEmail({ to, subject, html, text });

  if (!result.ok && result.reason === "failed") {
    // No terminal do servidor, com status e mensagem do provedor — o convite
    // continua válido, mas quem administra precisa enxergar o motivo.
    console.error(
      `[convite] envio recusado pelo provedor (status ${result.status ?? "?"}): ${result.detail ?? "sem detalhe"}`,
    );
  }

  return {
    sent: result.ok,
    problem: result.ok ? null : result.reason,
    detail: result.ok ? null : (result.detail ?? null),
    link,
  };
}
