import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AppMark } from "@/components/layout/AppMark";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ cadastro?: string }>;
}) {
  const { cadastro } = await searchParams;
  const infoMessage =
    cadastro === "confirme-seu-email"
      ? "Cadastro realizado! Confira seu e-mail para confirmar a conta antes de entrar."
      : undefined;

  return (
    <div className="flex min-h-full flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <AppMark size={30} />
          <span className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.22em] text-foreground">
            Plataforma <span className="text-text-dim">/ Pesquisa</span>
          </span>
        </Link>
        <p className="text-center font-mono text-[0.7rem] uppercase tracking-[0.2em] text-text-dim">
          Bem-vindo de volta
        </p>
        <h1 className="mb-6 mt-2 text-center font-serif text-3xl font-semibold text-foreground">
          Entrar
        </h1>
        <Card>
          <LoginForm infoMessage={infoMessage} />
        </Card>
      </div>
    </div>
  );
}
