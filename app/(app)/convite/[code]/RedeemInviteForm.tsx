"use client";

import { useActionState } from "react";
import Link from "next/link";
import { redeemInvite, type RedeemState } from "@/lib/actions/participants";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";

const initialState: RedeemState = { error: null };

export function RedeemInviteForm({ code }: { code: string }) {
  const [state, formAction, isPending] = useActionState(redeemInvite, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="code" value={code} />
      <FormMessage error={state.error ?? undefined} />
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Entrando..." : "Aceitar e entrar no projeto"}
        </Button>
        <Link href="/projects" className="btn btn-ghost">
          Agora não
        </Link>
      </div>
    </form>
  );
}
