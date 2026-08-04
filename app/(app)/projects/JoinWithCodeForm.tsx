"use client";

import { useActionState, useState } from "react";
import { KeyRound } from "lucide-react";
import { redeemInvite, type RedeemState } from "@/lib/actions/participants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";
import { formatInviteCode } from "@/lib/invites/format";

const initialState: RedeemState = { error: null };

/** "Tenho um código": entra num projeto pelo código recebido. */
export function JoinWithCodeForm() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [state, formAction, isPending] = useActionState(redeemInvite, initialState);

  if (!open) {
    return (
      <Button variant="ghost" className="!px-3 !py-1.5 text-[13px]" onClick={() => setOpen(true)}>
        <KeyRound size={14} className="mr-1.5 inline align-[-2px]" />
        Tenho um código
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <Input
        name="code"
        value={code}
        onChange={(e) => setCode(formatInviteCode(e.target.value))}
        placeholder="XXXX-XXXX-XXXX"
        aria-label="Código do convite"
        autoFocus
        className="!min-h-0 w-[190px] !py-1.5 font-mono text-[13px] tracking-[0.12em]"
      />
      <Button type="submit" variant="secondary" disabled={isPending} className="!py-1.5">
        {isPending ? "Entrando..." : "Entrar"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="!px-2 !py-1.5 text-xs"
        onClick={() => setOpen(false)}
      >
        Fechar
      </Button>
      <div className="w-full">
        <FormMessage error={state.error ?? undefined} />
      </div>
    </form>
  );
}
