"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";

const initialState: AuthActionState = { error: null };

export function LoginForm({ infoMessage }: { infoMessage?: string }) {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {infoMessage && <FormMessage success={infoMessage} />}
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      <FormMessage error={state.error ?? undefined} />
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Entrando..." : "Entrar"}
      </Button>
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Ainda não tem conta?{" "}
        <Link href="/signup" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}
