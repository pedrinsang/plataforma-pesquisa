import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AppMark } from "@/components/layout/AppMark";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ cadastro?: string; next?: string }>;
}) {
  const { cadastro, next } = await searchParams;
  const infoMessage =
    cadastro === "confirme-seu-email"
      ? "Cadastro realizado! Confira seu e-mail para confirmar a conta antes de entrar."
      : next?.startsWith("/convite/")
        ? "Entre na sua conta para aceitar o convite."
        : undefined;
  // só caminho interno sobrevive (o mesmo cuidado da action contra open redirect)
  const safeNext = next && /^\/(?!\/)/.test(next) ? next : undefined;

  return (
    <div className="flex min-h-full flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <AppMark size={30} />
          <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
            Folium
          </span>
        </Link>
        <p className="text-center text-[0.72rem] uppercase tracking-[0.16em] text-accent-teal">
          Bem-vindo de volta
        </p>
        <h1 className="mb-6 mt-2 text-center font-serif text-3xl font-semibold text-foreground">
          Entrar
        </h1>
        <Card>
          <LoginForm infoMessage={infoMessage} next={safeNext} />
        </Card>
      </div>
    </div>
  );
}
