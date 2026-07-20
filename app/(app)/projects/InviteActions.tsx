"use client";

import { useTransition } from "react";
import { acceptInvite, declineInvite } from "@/lib/actions/participants";
import { Button } from "@/components/ui/Button";

export function InviteActions({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <Button
        className="px-3 py-1.5 text-xs"
        disabled={isPending}
        onClick={() => startTransition(() => acceptInvite(projectId))}
      >
        Aceitar
      </Button>
      <Button
        variant="ghost"
        className="px-3 py-1.5 text-xs"
        disabled={isPending}
        onClick={() => startTransition(() => declineInvite(projectId))}
      >
        Recusar
      </Button>
    </div>
  );
}
