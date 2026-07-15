import { Card } from "@/components/ui/Card";
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
        <h1 className="mb-6 text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Entrar
        </h1>
        <Card>
          <LoginForm infoMessage={infoMessage} />
        </Card>
      </div>
    </div>
  );
}
