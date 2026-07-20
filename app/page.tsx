import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import {
  BookOpen,
  ClipboardList,
  Database,
  LineChart,
  NotebookPen,
  Quote,
} from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/projects");

  return (
    <div className="flex flex-1 flex-col overflow-x-clip">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border-subtle px-4 py-4 sm:px-10">
        <span className="whitespace-nowrap font-mono text-[0.65rem] font-medium uppercase tracking-[0.15em] text-foreground sm:text-xs sm:tracking-[0.2em]">
          Plataforma de Pesquisa
        </span>
        <nav className="flex shrink-0 items-center gap-1 text-sm sm:gap-2">
          <Link href="/login" className="whitespace-nowrap px-2 py-2 text-text-dim hover:text-foreground sm:px-3">
            Entrar
          </Link>
          <Link href="/signup">
            <Button className="whitespace-nowrap px-3 sm:px-4">Criar conta grátis</Button>
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-24 px-6 pb-28 pt-16 text-center sm:pt-24">
        <div className="max-w-3xl space-y-6">
          <span
            className="anim-fade-up inline-flex items-center gap-2 rounded-full border border-border-subtle px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-text-dim"
            style={{ ["--delay" as string]: "0s" }}
          >
            <span className="size-1.5 rounded-full bg-accent-teal" />
            Feito para pesquisadores · custo zero para começar
          </span>

          <h1 className="text-balance font-serif text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            <span className="anim-fade-up block" style={{ ["--delay" as string]: "0.1s" }}>
              Sua pesquisa, do texto
            </span>
            <span
              className="anim-fade-up relative inline-block"
              style={{ ["--delay" as string]: "0.22s" }}
            >
              <span className="relative z-10">aos dados</span>
              <span
                aria-hidden
                className="anim-underline absolute inset-x-0 bottom-1 -z-0 h-[0.32em] bg-accent-gold-soft sm:bottom-2"
                style={{ ["--delay" as string]: "0.95s" }}
              />
            </span>{" "}
            <span className="anim-fade-up inline italic" style={{ ["--delay" as string]: "0.22s" }}>
              em um só lugar.
            </span>
          </h1>

          <p
            className="anim-fade-up text-balance text-lg text-text-dim"
            style={{ ["--delay" as string]: "0.34s" }}
          >
            Escrita, referências, plano de pesquisa, coleta de dados e gráficos — organizados por
            projeto, sem planilhas espalhadas nem abas demais.
          </p>

          <div
            className="anim-fade-up flex justify-center gap-3 pt-2"
            style={{ ["--delay" as string]: "0.44s" }}
          >
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

        <div
          className="anim-fade-up relative w-full overflow-hidden rounded-2xl border border-border-subtle bg-surface"
          style={{ ["--delay" as string]: "0.5s" }}
        >
          <svg
            viewBox="0 0 800 220"
            className="block h-auto w-full"
            role="img"
            aria-label="Gráfico de exemplo com um achado destacado"
          >
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-border-subtle"
                />
              </pattern>
            </defs>
            <rect width="800" height="220" fill="url(#grid)" />

            <path
              d="M0,168 C70,150 110,190 180,150 S 300,70 380,96 S 520,40 600,66 S 740,26 800,48"
              fill="none"
              stroke="var(--accent-teal)"
              strokeWidth="3"
              strokeLinecap="round"
              className="anim-draw"
              style={{ ["--delay" as string]: "0.9s" }}
            />

            <g className="anim-fade-up" style={{ ["--delay" as string]: "2.5s" }}>
              <circle
                cx="600"
                cy="66"
                r="14"
                fill="var(--accent-gold-soft)"
                className="anim-drift"
                style={{ transformOrigin: "600px 66px" }}
              />
              <circle cx="600" cy="66" r="5" fill="var(--accent-gold)" />
              <text
                x="618"
                y="62"
                className="font-mono text-[11px] uppercase tracking-wide"
                fill="var(--accent-gold)"
              >
                achado — p &lt; .01
              </text>
            </g>
          </svg>
        </div>

        <div className="grid w-full gap-6 text-left sm:grid-cols-2">
          <Reveal>
            <div className="relative h-full overflow-hidden rounded-2xl border border-border-subtle bg-surface p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, currentColor 0, currentColor 1px, transparent 1px, transparent 28px)",
                }}
              />
              <div className="relative">
                <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent-gold">
                  Área de escrita
                </span>
                <h2 className="mt-3 font-serif text-2xl font-semibold italic text-foreground">
                  Do rascunho à bibliografia
                </h2>
                <p className="mt-1 text-sm text-text-dim">Sem trocar de ferramenta.</p>
                <ul className="mt-6 space-y-3 text-sm text-foreground">
                  <li className="flex items-start gap-3">
                    <NotebookPen size={16} className="mt-0.5 shrink-0 text-accent-gold" />
                    Documentos com modelos prontos (TCC, artigo, projeto)
                  </li>
                  <li className="flex items-start gap-3">
                    <Quote size={16} className="mt-0.5 shrink-0 text-accent-gold" />
                    Referências em ABNT, APA, Vancouver e MDT
                  </li>
                  <li className="flex items-start gap-3">
                    <BookOpen size={16} className="mt-0.5 shrink-0 text-accent-gold" />
                    Organizador de revisão de literatura
                  </li>
                </ul>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative h-full overflow-hidden rounded-2xl bg-[#0a0f1c] p-8 text-[#e9edf5]">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.12]"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #2fd9c4 1px, transparent 1px), linear-gradient(to bottom, #2fd9c4 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
              <div className="relative">
                <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent-teal">
                  Área de estatística
                </span>
                <h2 className="mt-3 font-serif text-2xl font-semibold text-white">
                  Planeje, colete, visualize
                </h2>
                <p className="mt-1 text-sm text-[#8592a8]">Sem sair do navegador.</p>
                <ul className="mt-6 space-y-3 font-mono text-[0.8rem] text-[#dbe2ee]">
                  <li className="flex items-start gap-3">
                    <ClipboardList size={16} className="mt-0.5 shrink-0 text-accent-teal" />
                    Plano de pesquisa com cronograma visual
                  </li>
                  <li className="flex items-start gap-3">
                    <Database size={16} className="mt-0.5 shrink-0 text-accent-teal" />
                    Planilha de coleta com colunas e tipos próprios
                  </li>
                  <li className="flex items-start gap-3">
                    <LineChart size={16} className="mt-0.5 shrink-0 text-accent-teal" />
                    Cálculos estatísticos e gráficos exportáveis
                  </li>
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </main>
    </div>
  );
}
