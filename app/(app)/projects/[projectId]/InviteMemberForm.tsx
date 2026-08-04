"use client";

import { useActionState, useRef, useState } from "react";
import { KeyRound, Mail } from "lucide-react";
import {
  createInviteCode,
  inviteMember,
  type InviteMemberState,
} from "@/lib/actions/participants";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";
import { CopyField } from "./CopyField";

const initialState: InviteMemberState = { error: null };

type Mode = "email" | "code";

export function InviteMemberForm({
  projectId,
  canInviteOwner,
}: {
  projectId: string;
  canInviteOwner: boolean;
}) {
  const [mode, setMode] = useState<Mode>("email");

  return (
    <div className="space-y-3 border-t border-border-subtle pt-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[0.68rem] uppercase tracking-[0.14em] text-accent-teal">
          Convidar participante
        </h3>
        <div className="seg">
          <button
            type="button"
            className="seg-opt"
            data-active={mode === "email"}
            onClick={() => setMode("email")}
          >
            <Mail size={13} className="mr-1.5 inline align-[-2px]" />
            Por e-mail
          </button>
          <button
            type="button"
            className="seg-opt"
            data-active={mode === "code"}
            onClick={() => setMode("code")}
          >
            <KeyRound size={13} className="mr-1.5 inline align-[-2px]" />
            Por código
          </button>
        </div>
      </div>

      {mode === "email" ? (
        <EmailInvite projectId={projectId} canInviteOwner={canInviteOwner} />
      ) : (
        <CodeInvite projectId={projectId} canInviteOwner={canInviteOwner} />
      )}
    </div>
  );
}

function RoleSelect({ canInviteOwner, id }: { canInviteOwner: boolean; id: string }) {
  return (
    <div>
      <Label htmlFor={id}>Papel</Label>
      <Select id={id} name="role" defaultValue="viewer">
        <option value="viewer">Leitor</option>
        <option value="editor">Editor</option>
        {canInviteOwner && <option value="owner">Dono</option>}
      </Select>
    </div>
  );
}

function EmailInvite({
  projectId,
  canInviteOwner,
}: {
  projectId: string;
  canInviteOwner: boolean;
}) {
  const action = inviteMember.bind(null, projectId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-3">
      <form
        ref={formRef}
        action={(formData) => {
          formAction(formData);
          formRef.current?.reset();
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <div className="min-w-[200px] flex-1">
          <Label htmlFor="invite-email">E-mail do convidado</Label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            placeholder="pessoa@exemplo.com"
            required
          />
        </div>
        <RoleSelect id="invite-email-role" canInviteOwner={canInviteOwner} />
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? "Enviando..." : "Enviar convite"}
        </Button>
      </form>

      <FormMessage error={state.error ?? undefined} />
      {state.invite && <InviteResult invite={state.invite} />}
    </div>
  );
}

function CodeInvite({
  projectId,
  canInviteOwner,
}: {
  projectId: string;
  canInviteOwner: boolean;
}) {
  const action = createInviteCode.bind(null, projectId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <div className="space-y-3">
      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <RoleSelect id="invite-code-role" canInviteOwner={canInviteOwner} />
        <div>
          <Label htmlFor="invite-expires">Validade</Label>
          <Select id="invite-expires" name="expiresInDays" defaultValue="7">
            <option value="1">1 dia</option>
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="">Sem validade</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="invite-uses">Usos</Label>
          <Select id="invite-uses" name="maxUses" defaultValue="1">
            <option value="1">1 pessoa</option>
            <option value="5">até 5</option>
            <option value="25">até 25</option>
            <option value="">Sem limite</option>
          </Select>
        </div>
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? "Gerando..." : "Gerar código"}
        </Button>
      </form>

      <p className="text-[11.5px] leading-relaxed text-text-dim">
        Quem abrir o link (ou digitar o código em <em>Meus Projetos</em>) entra no projeto com o
        papel escolhido. Cancele o código a qualquer momento na lista abaixo.
      </p>

      <FormMessage error={state.error ?? undefined} />
      {state.invite && <InviteResult invite={state.invite} />}
    </div>
  );
}

function InviteResult({ invite }: { invite: NonNullable<InviteMemberState["invite"]> }) {
  const message = invite.emailSent
    ? `Convite enviado para ${invite.email}.`
    : invite.email
      ? invite.emailProblem === "not-configured"
        ? "Convite criado. O envio de e-mail não está configurado — copie o link e mande para a pessoa."
        : "Convite criado, mas o e-mail não saiu. Copie o link e mande para a pessoa."
      : "Código criado. Compartilhe o link ou o código.";

  return (
    <div className="space-y-2 rounded-[var(--radius-sm)] border border-accent-teal/40 bg-accent-teal-soft/25 p-3">
      <p className="text-[12.5px] text-foreground">{message}</p>
      {invite.emailDetail && (
        <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--color-neg)" }}>
          Motivo do provedor: {invite.emailDetail}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <CopyField label="Link do convite" value={invite.link} />
        <CopyField label="Código" value={invite.code} mono />
      </div>
    </div>
  );
}
