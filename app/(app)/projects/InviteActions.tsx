"use client";

import { useState, useTransition } from "react";
import { acceptInvite, declineInvite } from "@/lib/actions/participants";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";

export function InviteActions({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button
          className="px-3 py-1.5 text-xs"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await acceptInvite(projectId);
              setError(result.error);
            })
          }
        >
          Aceitar
        </Button>
        <Button
          variant="ghost"
          className="px-3 py-1.5 text-xs"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await declineInvite(projectId);
              setError(result.error);
            })
          }
        >
          Recusar
        </Button>
      </div>
      <FormMessage error={error ?? undefined} />
    </div>
  );
}
