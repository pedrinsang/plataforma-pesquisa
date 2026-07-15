import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/projects");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-zinc-50 px-6 text-center dark:bg-zinc-950">
      <div className="max-w-2xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Sua pesquisa, do texto aos dados, em um só lugar
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Escrita, referências, plano de pesquisa, coleta de dados e gráficos — organizados por
          projeto, com custo zero para começar.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/signup">
          <Button className="px-6 py-3 text-base">Criar conta grátis</Button>
        </Link>
        <Link href="/login">
          <Button variant="secondary" className="px-6 py-3 text-base">
            Entrar
          </Button>
        </Link>
      </div>
    </div>
  );
}
