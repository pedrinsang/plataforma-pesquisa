import Link from "next/link";
import { notFound } from "next/navigation";
import { Beaker, BookMarked, ListChecks, TrendingUp, Users, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProject, getUser } from "@/lib/supabase/queries";
import type { ProjectMemberRole } from "@/lib/types/database";
import { MilestoneTimeline } from "./MilestoneTimeline";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKS = 8;

function roleLabel(role: ProjectMemberRole, title: string | null): string {
  if (title) return title;
  return role === "owner" ? "Autor(a)" : role === "editor" ? "Colaborador(a)" : "Leitor(a)";
}

// Agrega as amostras em semanas (últimas 8), conta as desta semana e estima a
// tendência (últimas 4 vs. 4 anteriores). Fica fora do componente porque usa
// Date.now() — impuro no render de um componente.
function computeSampleStats(samples: { collected_at: string }[]) {
  const now = Date.now();
  const buckets = new Array(WEEKS).fill(0); // 0 = mais antiga … WEEKS-1 = atual
  let thisWeek = 0;
  for (const s of samples) {
    const daysAgo = Math.floor((now - new Date(s.collected_at).getTime()) / DAY_MS);
    if (daysAgo < 7) thisWeek += 1;
    const wk = Math.floor(daysAgo / 7);
    if (wk >= 0 && wk < WEEKS) buckets[WEEKS - 1 - wk] += 1;
  }
  const last4 = buckets.slice(4).reduce((a, b) => a + b, 0);
  const prev4 = buckets.slice(0, 4).reduce((a, b) => a + b, 0);
  const trendPct = prev4 > 0 ? Math.round(((last4 - prev4) / prev4) * 100) : null;
  return { buckets, thisWeek, total: samples.length, trendPct };
}

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  // Reaproveitam (via cache() por request) as chamadas já feitas no layout —
  // sem novos round-trips ao Supabase. Ver lib/supabase/queries.ts.
  const [user, project] = await Promise.all([getUser(), getProject(projectId)]);

  if (!project) notFound();

  // ── dados do dashboard (em paralelo) ──────────────────────────────────────
  const [
    { data: milestones },
    { data: samples },
    { count: refsTotal },
    { count: refsEssential },
    { data: members },
  ] = await Promise.all([
    supabase
      .from("project_milestones")
      .select("id, title, detail, status, position")
      .eq("project_id", projectId)
      .order("position", { ascending: true }),
    supabase.from("project_samples").select("collected_at").eq("project_id", projectId),
    supabase
      .from("project_references")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId),
    supabase
      .from("project_references")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("is_essential", true),
    supabase
      .from("project_members")
      .select("id, user_id, role, member_title, status, profiles(full_name, email)")
      .eq("project_id", projectId)
      .eq("status", "accepted")
      .order("created_at", { ascending: true }),
  ]);

  const me = members?.find((m) => m.user_id === user?.id);
  const canManage = me?.role === "owner" || me?.role === "editor";

  // marcos / progresso
  const ms = milestones ?? [];
  const doneCount = ms.filter((m) => m.status === "done").length;
  const progress = ms.length > 0 ? Math.round((doneCount / ms.length) * 100) : 0;
  const nextMilestone =
    ms.find((m) => m.status === "in_progress") ?? ms.find((m) => m.status === "pending");

  // amostras + gráfico semanal
  const { buckets, thisWeek, total: samplesTotal, trendPct } = computeSampleStats(samples ?? []);

  const acceptedCount = members?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* ── tags do projeto (linha fina) ── */}
      <div className="flex flex-wrap items-center gap-2">
        {acceptedCount > 1 ? (
          <span className="tag tag-outline">
            <Users size={12} /> Compartilhado
          </span>
        ) : (
          <span className="tag tag-neutral">
            <Lock size={12} /> Privado
          </span>
        )}
        {project.project_type && <span className="tag tag-neutral">{project.project_type}</span>}
        {project.protocol_code && <span className="tag tag-neutral">{project.protocol_code}</span>}
      </div>

      {/* ── stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          Icon={Beaker}
          kicker="Amostras coletadas"
          value={project.sample_target ? `${samplesTotal}/${project.sample_target}` : `${samplesTotal}`}
          note={thisWeek > 0 ? `▲ ${thisWeek} esta semana` : "sem coletas esta semana"}
          positive={thisWeek > 0}
          href={`/projects/${projectId}/statistics/samples`}
        />
        <StatCard
          Icon={BookMarked}
          kicker="Referências"
          value={`${refsTotal ?? 0}`}
          note={`${refsEssential ?? 0} marcadas como essenciais`}
        />
        <StatCard
          Icon={ListChecks}
          kicker="Marcos concluídos"
          value={`${doneCount}/${ms.length}`}
          note={nextMilestone ? `Próximo: ${nextMilestone.title}` : "todos concluídos"}
        />
        <ProgressCard progress={progress} />
      </div>

      {/* ── linha do tempo + coluna direita ── */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* linha do tempo */}
        <MilestoneTimeline projectId={projectId} milestones={ms} canManage={canManage} />

        {/* participantes + gráfico */}
        <div className="space-y-4">
          <section className="card !gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-foreground">Participantes</h2>
              <span className="text-[11.5px] tabular-nums text-text-dim">{acceptedCount}</span>
            </div>
            {acceptedCount === 0 ? (
              <p className="text-sm text-text-dim">Nenhum participante.</p>
            ) : (
              <div className="space-y-2.5">
                {members?.map((m) => {
                  const name = m.profiles?.full_name || m.profiles?.email || "—";
                  return (
                    <div key={m.id} className="flex items-center gap-2.5">
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-full font-serif text-[12px] font-semibold"
                        style={{
                          background: "var(--color-accent-200)",
                          color: "var(--color-accent-800)",
                        }}
                      >
                        {name.trim().charAt(0).toUpperCase() || "?"}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-foreground">
                        {name}
                      </span>
                      <span className="shrink-0 text-[11px] text-accent-teal">
                        {roleLabel(m.role, m.member_title)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <WeeklyChart buckets={buckets} trendPct={trendPct} hasData={samplesTotal > 0} />
        </div>
      </div>
    </div>
  );
}

// ── subcomponentes ──────────────────────────────────────────────────────────

function StatCard({
  Icon,
  kicker,
  value,
  note,
  positive,
  href,
}: {
  Icon: typeof Beaker;
  kicker: string;
  value: string;
  note: string;
  positive?: boolean;
  href?: string;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[0.62rem] uppercase tracking-[0.14em] text-accent-teal">{kicker}</span>
        <Icon size={15} className="text-text-dim" strokeWidth={1.7} />
      </div>
      <div className="font-serif text-[2rem] font-semibold leading-none tabular-nums text-foreground">
        {value}
      </div>
      <div className={positive ? "text-[11.5px] text-pos" : "text-[11.5px] text-text-dim"}>
        {note}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="card !gap-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lift"
      >
        {inner}
      </Link>
    );
  }

  return <div className="card !gap-1.5">{inner}</div>;
}

// Progresso geral como 4º card do painel, alinhado ao estilo dos StatCards.
function ProgressCard({ progress }: { progress: number }) {
  return (
    <div className="card !gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[0.62rem] uppercase tracking-[0.14em] text-accent-teal">
          Progresso geral
        </span>
        <TrendingUp size={15} className="text-text-dim" strokeWidth={1.7} />
      </div>
      <div className="flex items-baseline gap-0.5 font-serif text-[2rem] font-semibold leading-none tabular-nums text-foreground">
        {progress}
        <span className="text-lg text-text-dim">%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-accent-100">
        <div
          className="h-full rounded-full bg-accent-teal transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function WeeklyChart({
  buckets,
  trendPct,
  hasData,
}: {
  buckets: number[];
  trendPct: number | null;
  hasData: boolean;
}) {
  const max = Math.max(...buckets, 1);
  const W = 260;
  const H = 96;
  const n = buckets.length;
  const gap = 8;
  const barW = (W - gap * (n - 1)) / n;

  return (
    <section className="card !gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-lg font-semibold text-foreground">Coleta por semana</h2>
        <span className="text-[10.5px] uppercase tracking-[0.12em] text-text-dim">8 semanas</span>
      </div>
      {!hasData ? (
        <p className="text-sm text-text-dim">Nenhuma amostra registrada ainda.</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Coleta por semana">
            {buckets.map((v, i) => {
              const h = Math.max(2, (v / max) * (H - 6));
              return (
                <rect
                  key={i}
                  x={i * (barW + gap)}
                  y={H - h}
                  width={barW}
                  height={h}
                  rx={2}
                  fill="var(--color-accent-teal)"
                  opacity={i === n - 1 ? 1 : 0.5 + (i / n) * 0.4}
                />
              );
            })}
          </svg>
          <div className="flex items-center gap-1.5 text-[11.5px] text-text-dim">
            {trendPct !== null && trendPct >= 0 && (
              <TrendingUp size={13} className="text-pos" strokeWidth={2} />
            )}
            {trendPct === null
              ? "Coletas nas últimas semanas"
              : `${trendPct >= 0 ? "Tendência crescente · +" : "Queda · "}${trendPct}% no último mês`}
          </div>
        </>
      )}
    </section>
  );
}
