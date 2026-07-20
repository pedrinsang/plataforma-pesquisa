"use client";

import { useActionState, useRef } from "react";
import { inviteMember, type InviteMemberState } from "@/lib/actions/participants";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";

const initialState: InviteMemberState = { error: null };

export function InviteMemberForm({
  projectId,
  canInviteOwner,
}: {
  projectId: string;
  canInviteOwner: boolean;
}) {
  const inviteMemberToProject = inviteMember.bind(null, projectId);
  const [state, formAction, isPending] = useActionState(inviteMemberToProject, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <div className="min-w-[200px] flex-1">
        <Label htmlFor="email">Convidar por e-mail</Label>
        <Input id="email" name="email" type="email" placeholder="pessoa@exemplo.com" required />
      </div>
      <div>
        <Label htmlFor="role">Papel</Label>
        <Select id="role" name="role" defaultValue="viewer">
          <option value="viewer">Leitor</option>
          <option value="editor">Editor</option>
          {canInviteOwner && <option value="owner">Dono</option>}
        </Select>
      </div>
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "Convidando..." : "Convidar"}
      </Button>
      <div className="w-full">
        <FormMessage error={state.error ?? undefined} />
      </div>
    </form>
  );
}
