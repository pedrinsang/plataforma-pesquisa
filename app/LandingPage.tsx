"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  ArrowRight,
  Check,
  Link2,
  Shield,
  Users,
  FileText,
  PenLine,
  BookMarked,
  BarChart3,
} from "lucide-react";
import { AppMark } from "@/components/layout/AppMark";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

// Cores fixas do painel-instrumento (seção "do rascunho ao gráfico") — é um
// painel escuro por natureza, independente do tema da página.
const PD = {
  bg: "#171b1c",
  surface: "#1f2526",
  text: "#eceae7",
  teal: "#5bb8c2",
  grid: "rgba(91,184,194,.16)",
  dim: "rgba(236,234,231,.55)",
};

const PAPER = "var(--paper)";

export function LandingPage() {
  // Reveal de scroll: fora do prefers-reduced-motion, cada [data-reveal] entra
  // ao cruzar a viewport (o "papel virando produto"). Com movimento reduzido,
  // tudo já aparece assentado — sem transição.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (reduce) {
      items.forEach((n) => n.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const n = e.target as HTMLElement;
          const d = parseInt(n.dataset.revealDelay || "0", 10);
          n.style.transitionDelay = `${d}ms`;
          n.classList.add("is-visible");
          io.unobserve(n);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
    );
    items.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  const dim = (p: number) => `color-mix(in srgb, var(--color-text) ${p}%, transparent)`;

  return (
    <div className="overflow-x-clip" id="top">
      {/* ══════════ NAV ══════════ */}
      <nav className="sticky top-0 z-50 flex items-center gap-5 border-b border-border-subtle px-[clamp(20px,5vw,64px)] py-3.5 backdrop-blur-md"
        style={{ background: "color-mix(in srgb, var(--color-bg) 86%, transparent)" }}>
        <Link href="#top" className="flex items-center gap-2.5 text-foreground">
          <AppMark size={26} />
          <span className="font-serif text-[21px] font-semibold tracking-tight">Folium</span>
        </Link>
        <div className="ml-6 hidden gap-6 text-sm md:flex">
          <a href="#manuscrito" className="lnk text-text-dim transition-colors hover:text-accent-teal">O manuscrito</a>
          <a href="#recursos" className="lnk text-text-dim transition-colors hover:text-accent-teal">Recursos</a>
          <a href="#seguranca" className="lnk text-text-dim transition-colors hover:text-accent-teal">Segurança</a>
        </div>
        <div className="ml-auto flex items-center gap-3.5">
          <ThemeToggle />
          <Link href="/login" className="text-sm text-text-dim transition-colors hover:text-accent-teal">
            Entrar
          </Link>
          <span className="hidden md:contents">
            <Link href="/signup" className="btn btn-primary">
              <Plus size={15} /> Criar projeto gratuito
            </Link>
          </span>
        </div>
      </nav>

      {/* ══════════ 1 · HERO ══════════ */}
      <header className="mx-auto grid max-w-[1200px] items-center gap-[clamp(32px,5vw,72px)] px-[clamp(20px,5vw,64px)] py-[clamp(44px,7vw,96px)] md:grid-cols-[1.05fr_.95fr]">
        <div className="reveal" data-reveal>
          <div className="mb-5 flex items-center gap-2.5 text-[12px] uppercase tracking-[0.14em] tabular-nums" style={{ color: "var(--color-accent-700)" }}>
            <span className="h-px w-6" style={{ background: "var(--color-accent)" }} />
            Plataforma de pesquisa científica
          </div>
          <h1 className="font-serif text-[clamp(38px,5.2vw,62px)] font-semibold leading-[1.05] tracking-tight text-foreground">
            Toda descoberta parte de um registro bem-organizado.
            <br />
            <span style={{ color: "var(--color-accent-700)" }}>A sua começa aqui.</span>
          </h1>
          <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed" style={{ color: dim(80) }}>
            Escrita, referências e estatística do seu projeto científico em uma plataforma só —
            segura, colaborativa e pensada para o seu trabalho.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <Link href="/signup" className="btn btn-primary text-[15px]" style={{ padding: "11px 20px" }}>
              Criar projeto gratuito
            </Link>
            <a href="#manuscrito" className="btn btn-ghost text-[15px]" style={{ padding: "11px 20px" }}>
              Ver como funciona <ArrowRight size={15} />
            </a>
          </div>
          <div className="mt-6 flex items-center gap-2 text-[12.5px]" style={{ color: dim(60) }}>
            <Check size={14} strokeWidth={2} style={{ color: "var(--color-accent-700)" }} />
            Gratuito nesta fase · sem cartão de crédito
          </div>
        </div>

        {/* a folha manuscrita */}
        <div className="reveal floaty relative paper-light" data-reveal data-reveal-delay="120">
          <div
            className="absolute rounded-[var(--radius-md)] border border-border-subtle"
            style={{ inset: "14px -10px -14px 12px", background: "var(--color-neutral-200)", transform: "rotate(1.6deg)" }}
          />
          <article
            className="relative rounded-[var(--radius-md)] border border-border-subtle p-[34px] elev-lg"
            style={{ background: PAPER, transform: "rotate(-1deg)", backgroundImage: "repeating-linear-gradient(transparent,transparent 30px,var(--paper-rule) 30px,var(--paper-rule) 31px)" }}
          >
            <div className="mb-4 flex items-baseline justify-between border-b border-border-subtle pb-2 text-[11px] uppercase tracking-[0.1em] tabular-nums" style={{ color: "var(--color-accent-700)" }}>
              <span>Caderno de campo</span>
              <span>fól. 12</span>
            </div>
            <div className="hand text-[26px] leading-tight line-through" style={{ color: "#8a6a2e", opacity: 0.75, textDecorationColor: "rgba(138,106,46,.4)" }}>
              Anotar a hipótese — revisar as fontes por semana…
            </div>
            <h3 className="mt-3.5 font-serif text-[23px] font-semibold leading-snug text-foreground">
              Da pergunta à evidência: um registro que resiste à revisão
            </h3>
            <p className="mt-2.5 text-[13px] leading-relaxed" style={{ color: dim(70) }}>
              Hipótese, método, dados e referências — reunidos e versionados desde a primeira
              anotação até a submissão.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 gap-y-2 border-t border-border-subtle pt-3.5">
              <span className="tag tag-outline !text-[10.5px]">Protocolo 042/2025</span>
              <span className="tag tag-neutral !text-[10.5px]">Projeto de pesquisa</span>
              <span className="ml-auto inline-flex items-center gap-1.5 text-[11px]" style={{ color: "var(--color-accent-700)" }}>
                <span className="size-1.5 rounded-full" style={{ background: "var(--color-accent)" }} />
                sincronizado
              </span>
            </div>
            <div className="hand absolute text-[19px] leading-tight" style={{ right: -14, top: 74, color: "var(--color-accent-700)", transform: "rotate(7deg)", maxWidth: 130, textAlign: "center" }}>
              registrar
              <br />
              na nuvem →
            </div>
          </article>
        </div>

        {/* nota de scroll */}
        <p className="reveal col-span-full mt-2 flex items-start gap-2.5 text-[12px] leading-normal" data-reveal style={{ color: dim(55) }}>
          <span className="hand shrink-0 text-[17px]" style={{ color: "var(--color-accent-700)" }}>nota de scroll ›</span>
          <span className="max-w-[70ch]">
            Ao rolar, a caligrafia rascunhada do caderno se dissolve na tipografia limpa do título —
            o “papel virando produto”. <em>Movimento reduzido:</em> o título já aparece tipografado,
            sem transição.
          </span>
        </p>
      </header>

      {/* ══════════ 2 · DA MARGEM À REFERÊNCIA ══════════ */}
      <section id="manuscrito" className="border-t border-border-subtle" style={{ background: "color-mix(in srgb, var(--color-neutral-200) 40%, var(--color-bg))" }}>
        <div className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,64px)] py-[clamp(56px,7vw,104px)]">
          <div className="reveal max-w-[62ch]" data-reveal>
            <span className="mb-3.5 block text-[12px] uppercase tracking-[0.14em]" style={{ color: "var(--color-accent-700)" }}>
              Do papel para a nuvem · 01
            </span>
            <h2 className="font-serif text-[clamp(28px,3.6vw,42px)] font-semibold leading-[1.1] tracking-tight text-foreground">
              A anotação da margem vira uma referência de verdade.
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed" style={{ color: dim(78) }}>
              Aquilo que você rabiscaria ao lado de um parágrafo passa a ser uma citação estruturada
              — com DOI, um clique para a fonte e um lugar na sua biblioteca.
            </p>
          </div>

          <div className="mt-10 grid items-center gap-[clamp(20px,3vw,44px)] md:grid-cols-[1fr_auto_1fr]">
            {/* antes: papel */}
            <div className="reveal" data-reveal data-axis="left">
              <div className="paper-light relative rounded-[var(--radius-md)] border border-border-subtle p-7 elev-md" style={{ background: PAPER }}>
                <div className="font-serif text-[15px] leading-[1.9] hyphens-auto text-justify" style={{ color: dim(82) }}>
                  …os resultados observados corroboram os achados descritos na literatura recente,
                  ainda que sob condições metodológicas distintas das aqui empregadas, o que reforça
                  a necessidade de replicação.
                </div>
                <div className="hand mt-3.5 text-[20px]" style={{ color: "var(--color-accent-700)", transform: "rotate(-1.5deg)" }}>
                  ↑ ver Silva et al. 2021 — comparar método!
                </div>
                <span className="absolute right-4 top-3.5 text-[10.5px] uppercase tracking-[0.08em]" style={{ color: dim(45) }}>
                  manuscrito
                </span>
              </div>
            </div>

            {/* seta */}
            <div className="reveal hidden flex-col items-center gap-1.5 md:flex" data-reveal data-reveal-delay="150" aria-hidden style={{ color: "var(--color-accent-700)" }}>
              <ArrowRight size={34} strokeWidth={1.5} />
              <span className="text-[10.5px] uppercase tracking-[0.08em]">vira</span>
            </div>

            {/* depois: citação */}
            <div className="reveal" data-reveal data-axis="right" data-reveal-delay="250">
              <div className="card elev-sm !gap-3 !p-6">
                <div className="flex items-start justify-between gap-2.5">
                  <span className="tag tag-accent">Referência</span>
                  <span className="text-[11px] tabular-nums" style={{ color: dim(50) }}>2021 · citada 1×</span>
                </div>
                <div className="font-serif text-[19px] font-semibold leading-snug text-foreground">
                  Reprodutibilidade e transparência na prática de pesquisa contemporânea
                </div>
                <div className="text-[13px]" style={{ color: dim(68) }}>
                  Silva R. et al. · <span className="italic">Nature Human Behaviour</span>
                </div>
                <div className="flex items-center gap-1.5 text-[12.5px] tabular-nums" style={{ color: "var(--color-accent-700)" }}>
                  <Link2 size={13} /> DOI 10.3168/jds.S0022-0302(05)72953-8
                </div>
                <div className="flex gap-2 pt-1">
                  <span className="btn btn-primary !px-3.5 !py-1.5 !text-[12.5px]">
                    <Plus size={13} /> Adicionar à biblioteca
                  </span>
                  <span className="btn btn-ghost !px-3.5 !py-1.5 !text-[12.5px]">Ver PDF</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ 3 · DO RASCUNHO AO GRÁFICO (painel escuro) ══════════ */}
      <section style={{ background: PD.bg, color: PD.text }}>
        <div className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,64px)] py-[clamp(56px,7vw,104px)]">
          <div className="reveal max-w-[64ch]" data-reveal>
            <span className="mb-3.5 block text-[12px] uppercase tracking-[0.14em]" style={{ color: PD.teal }}>
              Do papel para a nuvem · 02
            </span>
            <h2 className="font-serif text-[clamp(28px,3.6vw,42px)] font-semibold leading-[1.1] tracking-tight" style={{ color: PD.text }}>
              A tabela rabiscada na margem vira análise em tempo real.
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed" style={{ color: PD.dim }}>
              Os números que você somava à mão passam a alimentar gráficos, testes estatísticos e
              intervalos de confiança — o instrumento por trás do caderno.
            </p>
          </div>

          <div className="mt-11 grid items-center gap-[clamp(24px,4vw,56px)] md:grid-cols-[.85fr_1.15fr]">
            {/* rascunho */}
            <div className="reveal" data-reveal>
              <div className="paper-light rounded-[var(--radius-md)] p-6 elev-lg" style={{ background: PAPER, transform: "rotate(-1.4deg)", color: "#3a2f18" }}>
                <div className="hand mb-2.5 text-[22px]" style={{ color: "#4a3c20" }}>resultado por período ↓</div>
                <svg viewBox="0 0 240 120" width="100%" style={{ overflow: "visible" }}>
                  <path d="M6 6 V110 H236" fill="none" stroke="#4a3c20" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M6 92 q34 -6 56 -20 q30 -18 60 -30 q34 -14 108 -24" fill="none" stroke="var(--color-accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: "2 5" }} />
                  <g className="hand" fill="#4a3c20" fontSize="12">
                    <text x="2" y="120">s1</text>
                    <text x="120" y="120">s4</text>
                    <text x="212" y="120">s7</text>
                  </g>
                </svg>
                <div className="hand mt-2 text-[18px]" style={{ color: "var(--color-accent-700)", transform: "rotate(1deg)" }}>
                  condição A supera sempre ✓
                </div>
              </div>
              <p className="reveal mt-3.5 flex items-start gap-2 px-1 text-[12px] leading-normal" data-reveal style={{ color: PD.dim }}>
                <span className="hand shrink-0 text-[16px]" style={{ color: PD.teal }}>nota de scroll ›</span>
                <span>o traço a lápis se endireita e vira a curva limpa do painel. <em>Movimento reduzido:</em> mostra os dois lado a lado, já estáticos.</span>
              </p>
            </div>

            {/* painel limpo */}
            <div className="reveal" data-reveal data-reveal-delay="180">
              <div className="rounded-[var(--radius-md)] px-6 pb-5 pt-6" style={{ background: PD.surface, border: "1px solid rgba(91,184,194,.22)", boxShadow: "0 20px 50px rgba(0,0,0,.45)" }}>
                <div className="mb-4.5 flex items-baseline justify-between" style={{ marginBottom: 18 }}>
                  <div>
                    <div className="font-serif text-[19px] font-semibold">Resultado acumulado por período</div>
                    <div className="mt-0.5 text-[11.5px]" style={{ color: PD.dim }}>Condição A (intervenção) vs. B (controle) · % por período</div>
                  </div>
                  <div className="hidden gap-3.5 text-[11px] sm:flex">
                    <span className="inline-flex items-center gap-1.5"><span className="inline-block h-0.5 w-3.5" style={{ background: PD.teal }} />Condição A</span>
                    <span className="inline-flex items-center gap-1.5" style={{ color: PD.dim }}><span className="inline-block h-0.5 w-3.5" style={{ background: "rgba(236,234,231,.4)" }} />Condição B</span>
                  </div>
                </div>
                <svg viewBox="0 0 520 220" width="100%" style={{ overflow: "visible" }}>
                  <g stroke={PD.grid} strokeWidth="1">
                    <line x1="40" y1="10" x2="40" y2="185" />
                    <line x1="40" y1="185" x2="510" y2="185" />
                    <line x1="40" y1="140" x2="510" y2="140" />
                    <line x1="40" y1="95" x2="510" y2="95" />
                    <line x1="40" y1="50" x2="510" y2="50" />
                  </g>
                  <g fill={PD.dim} fontSize="10">
                    <text x="12" y="189">0</text>
                    <text x="8" y="144">25</text>
                    <text x="8" y="99">50</text>
                    <text x="8" y="54">75</text>
                    <text x="4" y="14">100</text>
                  </g>
                  <g fill={PD.dim} fontSize="10" textAnchor="middle">
                    <text x="40" y="203">s1</text>
                    <text x="118" y="203">s2</text>
                    <text x="196" y="203">s3</text>
                    <text x="274" y="203">s4</text>
                    <text x="352" y="203">s5</text>
                    <text x="430" y="203">s6</text>
                    <text x="510" y="203">s7</text>
                  </g>
                  <polyline points="40,168 118,158 196,150 274,138 352,128 430,120 510,112" fill="none" stroke="rgba(236,234,231,.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="40,164 118,140 196,118 274,92 352,66 430,44 510,28" fill="none" stroke={PD.teal} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  <g fill={PD.teal}>
                    <circle cx="40" cy="164" r="3" />
                    <circle cx="196" cy="118" r="3" />
                    <circle cx="352" cy="66" r="3" />
                    <circle cx="510" cy="28" r="3.4" />
                  </g>
                </svg>
                <div className="mt-4 flex gap-5 border-t pt-4" style={{ borderColor: "rgba(91,184,194,.18)" }}>
                  {[
                    { k: "Diferença s7", v: "+18 pts", teal: true },
                    { k: "valor-p", v: "0,004", teal: false },
                    { k: "IC 95%", v: "9–27", teal: false },
                  ].map((s) => (
                    <div key={s.k}>
                      <div className="text-[11px] uppercase tracking-[0.06em]" style={{ color: PD.dim }}>{s.k}</div>
                      <div className="font-serif text-[26px] font-semibold tabular-nums" style={{ color: s.teal ? PD.teal : PD.text }}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ 4 · A PESQUISA NA NUVEM (produto real) ══════════ */}
      <section className="border-t border-border-subtle">
        <div className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,64px)] py-[clamp(56px,7vw,104px)]">
          <div className="reveal mx-auto max-w-[60ch] text-center" data-reveal>
            <span className="mb-3.5 block text-[12px] uppercase tracking-[0.14em]" style={{ color: "var(--color-accent-700)" }}>
              Do papel para a nuvem · 03
            </span>
            <h2 className="font-serif text-[clamp(28px,3.6vw,42px)] font-semibold leading-[1.1] tracking-tight text-foreground">
              E o caderno inteiro passa a viver na plataforma.
            </h2>
            <p className="mx-auto mt-4 text-[16px] leading-relaxed" style={{ color: dim(78) }}>
              Seus projetos, sua equipe e seus dados em um só lugar — a mesma linguagem editorial,
              agora navegável.
            </p>
          </div>

          {/* mock em moldura de navegador */}
          <div className="reveal mx-auto mt-10 max-w-[1000px]" data-reveal data-reveal-delay="120">
            <div className="overflow-hidden rounded-xl border border-border-subtle elev-lg" style={{ background: "var(--color-bg)" }}>
              <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5" style={{ background: "var(--color-surface)" }}>
                <span className="size-2.5 rounded-full" style={{ background: "var(--color-neutral-300)" }} />
                <span className="size-2.5 rounded-full" style={{ background: "var(--color-neutral-300)" }} />
                <span className="size-2.5 rounded-full" style={{ background: "var(--color-neutral-300)" }} />
                <div className="ml-3 flex max-w-[320px] flex-1 items-center gap-1.5 rounded-md border border-border-subtle px-3 py-1 text-[11.5px]" style={{ background: "var(--color-bg)", color: dim(55) }}>
                  folium.app/meus-projetos
                </div>
              </div>
              <div className="flex min-h-[340px]">
                <aside className="hidden w-[172px] shrink-0 flex-col gap-1 border-r border-border-subtle p-3 sm:flex" style={{ background: "var(--color-surface)" }}>
                  <div className="flex items-center gap-2 px-1.5 pb-4 pt-0.5">
                    <AppMark size={20} />
                    <span className="font-serif text-[16px] font-semibold">Folium</span>
                  </div>
                  <span className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px]" style={{ background: "var(--color-accent-100)", color: "var(--color-accent-800)" }}>
                    <FileText size={14} /> Meus Projetos
                  </span>
                  <span className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px]" style={{ color: dim(72) }}>
                    <PenLine size={14} /> Escrita / Estudo
                  </span>
                  <span className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px]" style={{ color: dim(72) }}>
                    <BarChart3 size={14} /> Estatística
                  </span>
                </aside>
                <div className="min-w-0 flex-1 p-5" style={{ background: "var(--color-bg)" }}>
                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      <div className="font-serif text-[22px] font-semibold">Meus Projetos</div>
                      <div className="mt-0.5 text-[11.5px]" style={{ color: dim(60) }}>Bom dia, Helena — 2 aguardam revisão.</div>
                    </div>
                    <span className="btn btn-primary !px-3 !py-1.5 !text-[11.5px]"><Plus size={12} /> Novo</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      { t: "Aprendizagem ativa no ensino superior", p: 62, m: "62% · há 2 h", tag: "Compartilhado", outline: true },
                      { t: "Qualidade da água em bacias urbanas", p: 40, m: "40% · ontem", tag: "Compartilhado", outline: true },
                      { t: "Adesão a tratamento em idosos", p: 88, m: "88% · há 5 h", tag: "Privado", outline: false },
                    ].map((c) => (
                      <div key={c.t} className="card mcard elev-sm !gap-2 !rounded-lg !p-3.5">
                        <span className={`tag ${c.outline ? "tag-outline" : "tag-neutral"} self-start !text-[9.5px]`}>{c.tag}</span>
                        <div className="font-serif text-[14px] font-semibold leading-tight">{c.t}</div>
                        <div className="mt-auto h-1 overflow-hidden rounded-full" style={{ background: "var(--color-accent-100)" }}>
                          <div className="h-full" style={{ width: `${c.p}%`, background: "var(--color-accent)" }} />
                        </div>
                        <div className="text-[10px] tabular-nums" style={{ color: dim(55) }}>{c.m}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ 5 · RECURSOS (tríptico) ══════════ */}
      <section id="recursos" className="border-t border-border-subtle" style={{ background: "color-mix(in srgb, var(--color-neutral-200) 40%, var(--color-bg))" }}>
        <div className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,64px)] py-[clamp(56px,7vw,104px)]">
          <div className="reveal" data-reveal>
            <span className="mb-3.5 block text-[12px] uppercase tracking-[0.14em]" style={{ color: "var(--color-accent-700)" }}>
              Três pilares, um só projeto
            </span>
            <h2 className="max-w-[20ch] font-serif text-[clamp(28px,3.6vw,42px)] font-semibold leading-[1.1] tracking-tight text-foreground">
              Do primeiro parágrafo ao valor-p final.
            </h2>
          </div>
          <div className="mt-9 grid border-t border-border-subtle md:grid-cols-3">
            {[
              { Icon: PenLine, t: "Escrita & Estudo", d: "Um editor que entende estrutura acadêmica: seções, notas, versões e comentários da equipe lado a lado com suas referências." },
              { Icon: BookMarked, t: "Referências", d: "Importe por DOI, organize por essencialidade e cite sem sair do texto. A biblioteca acompanha o projeto, não o contrário." },
              { Icon: BarChart3, t: "Estatística", d: "Testes, gráficos e intervalos de confiança a partir dos seus próprios dados — com o rigor que a revisão por pares vai exigir." },
            ].map((f, i) => (
              <div
                key={f.t}
                className="reveal border-border-subtle px-8 py-7 max-md:border-b md:[&:not(:last-child)]:border-r"
                data-reveal
                data-reveal-delay={i * 120}
              >
                <f.Icon size={26} strokeWidth={1.5} style={{ color: "var(--color-accent-700)" }} />
                <h3 className="mt-4 font-serif text-2xl font-semibold text-foreground">{f.t}</h3>
                <p className="mt-3 hyphens-auto text-justify text-[15px] leading-relaxed" style={{ color: dim(78) }}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ 6 · SEGURANÇA & COLABORAÇÃO ══════════ */}
      <section id="seguranca" className="border-t border-border-subtle">
        <div className="mx-auto grid max-w-[1200px] gap-[clamp(24px,4vw,56px)] px-[clamp(20px,5vw,64px)] py-[clamp(48px,6vw,88px)] md:grid-cols-3">
          {[
            { Icon: Shield, t: "Seus dados, seus", d: "Criptografia em repouso e em trânsito. Você decide quem vê cada projeto." },
            { Icon: Users, t: "Feito para equipes", d: "Orientadores, estatísticos e bolsistas no mesmo projeto, com papéis definidos." },
            { Icon: FileText, t: "Pronto para publicar", d: "Exporte o manuscrito, as referências e as figuras no formato do periódico." },
          ].map((s, i) => (
            <div key={s.t} className="reveal flex gap-3.5" data-reveal data-reveal-delay={i * 120}>
              <s.Icon size={22} strokeWidth={1.6} className="mt-0.5 shrink-0" style={{ color: "var(--color-accent-700)" }} />
              <div>
                <h4 className="font-serif text-[18px] font-semibold text-foreground">{s.t}</h4>
                <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: dim(72) }}>{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ 7 · CTA FINAL ══════════ */}
      <section id="criar" className="border-t border-border-subtle" style={{ background: "color-mix(in srgb, var(--color-neutral-200) 55%, var(--color-bg))" }}>
        <div className="reveal mx-auto max-w-[720px] px-[clamp(20px,5vw,64px)] py-[clamp(64px,8vw,120px)] text-center" data-reveal>
          <div className="hand text-[24px]" style={{ color: "var(--color-accent-700)", transform: "rotate(-1.5deg)" }}>
            comece o seu caderno de pesquisa
          </div>
          <h2 className="mt-2.5 font-serif text-[clamp(30px,4.4vw,52px)] font-semibold leading-[1.08] tracking-tight text-foreground">
            A sua próxima descoberta merece um bom começo.
          </h2>
          <p className="mx-auto mt-4.5 max-w-[48ch] text-[16px] leading-relaxed" style={{ color: dim(78), marginTop: 18 }}>
            Crie um projeto gratuito hoje e traga sua pesquisa do papel para a nuvem — sem perder o
            cuidado editorial de um bom manuscrito.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="btn btn-primary text-[15px]" style={{ padding: "12px 24px" }}>
              Criar projeto gratuito
            </Link>
            <a href="#recursos" className="btn btn-ghost text-[15px]" style={{ padding: "12px 24px" }}>
              Falar com a equipe
            </a>
          </div>
          <div className="mt-4.5 text-[12.5px]" style={{ color: dim(58), marginTop: 18 }}>
            Gratuito nesta fase · sem cartão de crédito
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="border-t border-border-subtle">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-5 px-[clamp(20px,5vw,64px)] py-9">
          <Link href="#top" className="flex items-center gap-2 text-foreground">
            <AppMark size={22} />
            <span className="font-serif text-[18px] font-semibold">Folium</span>
          </Link>
          <div className="ml-3 flex gap-5 text-[13px]">
            <a href="#recursos" className="transition-colors hover:text-accent-teal" style={{ color: dim(60) }}>Recursos</a>
            <a href="#seguranca" className="transition-colors hover:text-accent-teal" style={{ color: dim(60) }}>Segurança</a>
            <Link href="/login" className="transition-colors hover:text-accent-teal" style={{ color: dim(60) }}>Entrar</Link>
          </div>
          <div className="ml-auto text-[12px]" style={{ color: dim(55) }}>
            © 2026 Folium · Plataforma de gestão científica
          </div>
        </div>
      </footer>
    </div>
  );
}
