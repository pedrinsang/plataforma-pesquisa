import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import {
  BookOpen,
  ClipboardList,
  Database,
  LineChart,
  NotebookPen,
  PenLine,
  Quote,
} from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/projects");

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="font-serif text-lg font-semibold text-foreground">Plataforma de Pesquisa</span>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/login" className="px-3 py-2 text-zinc-600 hover:text-foreground dark:text-zinc-400">
            Entrar
          </Link>
          <Link href="/signup">
            <Button>Criar conta grátis</Button>
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-20 px-6 pb-24 pt-8 text-center sm:pt-16">
        <div className="max-w-2xl space-y-5">
          <span className="inline-flex items-center rounded-full border border-border-subtle bg-surface px-3 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Feito para pesquisadores · custo zero para começar
          </span>
          <h1 className="text-balance font-serif text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            Sua pesquisa, do texto aos dados, em um só lugar
          </h1>
          <p className="text-balance text-lg text-zinc-600 dark:text-zinc-400">
            Escrita, referências, plano de pesquisa, coleta de dados e gráficos — organizados por
            projeto, sem planilhas espalhadas nem abas demais.
          </p>
          <div className="flex justify-center gap-3 pt-2">
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

        <div className="grid w-full gap-6 text-left sm:grid-cols-2">
          <div className="rounded-2xl border border-amber-200/60 bg-amber-50/60 p-6 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <PenLine size={20} />
            </div>
            <h2 className="font-serif text-xl font-semibold text-foreground">Área de Escrita</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Do rascunho à bibliografia, sem trocar de ferramenta.
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
              <li className="flex items-center gap-2.5">
                <NotebookPen size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
                Documentos com modelos prontos (TCC, artigo, projeto)
              </li>
              <li className="flex items-center gap-2.5">
                <Quote size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
                Referências em ABNT, APA, Vancouver e MDT
              </li>
              <li className="flex items-center gap-2.5">
                <BookOpen size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
                Organizador de revisão de literatura
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-teal-200/60 bg-teal-50/60 p-6 dark:border-teal-900/40 dark:bg-teal-950/20">
            <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-400">
              <LineChart size={20} />
            </div>
            <h2 className="font-serif text-xl font-semibold text-foreground">Área de Estatística</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Planeje, colete e visualize sem sair do navegador.
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
              <li className="flex items-center gap-2.5">
                <ClipboardList size={16} className="shrink-0 text-teal-600 dark:text-teal-400" />
                Plano de pesquisa com cronograma visual
              </li>
              <li className="flex items-center gap-2.5">
                <Database size={16} className="shrink-0 text-teal-600 dark:text-teal-400" />
                Planilha de coleta com colunas e tipos próprios
              </li>
              <li className="flex items-center gap-2.5">
                <LineChart size={16} className="shrink-0 text-teal-600 dark:text-teal-400" />
                Cálculos estatísticos e gráficos exportáveis
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
