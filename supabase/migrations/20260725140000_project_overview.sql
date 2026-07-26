-- Dashboard "Visão geral" do projeto: metadados, marcos (linha do tempo),
-- amostras (coleta) e referências. Alimentam progresso geral, os stat cards,
-- a linha do tempo e o gráfico "coleta por semana".
--
-- Convenção de RLS (igual a documents/datasets): membro do projeto lê; apenas
-- owner/editor escreve (via is_project_member / is_project_editor).

-- ── 1. Metadados no projeto ────────────────────────────────────────────────
alter table public.projects
  add column if not exists project_type text,
  add column if not exists protocol_code text,
  add column if not exists sample_target integer
    check (sample_target is null or sample_target >= 0);

-- Rótulo livre do participante (Orientador, Estatístico, Bolsista…). A
-- permissão continua em `role` (owner/editor/viewer); isto é só apresentação.
alter table public.project_members
  add column if not exists member_title text;

-- ── 2. Marcos / linha do tempo ─────────────────────────────────────────────
create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  detail text,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'done')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists project_milestones_project_idx
  on public.project_milestones (project_id, position);

alter table public.project_milestones enable row level security;
create policy "project_milestones: membros veem"
  on public.project_milestones for select using (public.is_project_member(project_id));
create policy "project_milestones: owner/editor criam"
  on public.project_milestones for insert with check (public.is_project_editor(project_id));
create policy "project_milestones: owner/editor atualizam"
  on public.project_milestones for update using (public.is_project_editor(project_id));
create policy "project_milestones: owner/editor excluem"
  on public.project_milestones for delete using (public.is_project_editor(project_id));

-- ── 3. Amostras / coleta ───────────────────────────────────────────────────
create table if not exists public.project_samples (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  label text,
  collected_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists project_samples_project_idx
  on public.project_samples (project_id, collected_at);

alter table public.project_samples enable row level security;
create policy "project_samples: membros veem"
  on public.project_samples for select using (public.is_project_member(project_id));
create policy "project_samples: owner/editor criam"
  on public.project_samples for insert
  with check (public.is_project_editor(project_id) and (created_by is null or created_by = auth.uid()));
create policy "project_samples: owner/editor atualizam"
  on public.project_samples for update using (public.is_project_editor(project_id));
create policy "project_samples: owner/editor excluem"
  on public.project_samples for delete using (public.is_project_editor(project_id));

-- ── 4. Referências ─────────────────────────────────────────────────────────
create table if not exists public.project_references (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  authors text,
  year integer,
  doi text,
  is_essential boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists project_references_project_idx
  on public.project_references (project_id);

alter table public.project_references enable row level security;
create policy "project_references: membros veem"
  on public.project_references for select using (public.is_project_member(project_id));
create policy "project_references: owner/editor criam"
  on public.project_references for insert
  with check (public.is_project_editor(project_id) and (created_by is null or created_by = auth.uid()));
create policy "project_references: owner/editor atualizam"
  on public.project_references for update using (public.is_project_editor(project_id));
create policy "project_references: owner/editor excluem"
  on public.project_references for delete using (public.is_project_editor(project_id));
