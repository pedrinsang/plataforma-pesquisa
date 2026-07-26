-- Casos (agrupam amostras) + campos personalizados por projeto.
--
-- Modelo genérico: cada entidade tem um núcleo pequeno e fixo, e os campos
-- específicos de cada área de pesquisa são definidos pelo próprio projeto em
-- `project_field_defs` e guardados como jsonb na coluna `custom`. Assim a mesma
-- plataforma serve patologia veterinária, ciências sociais, laboratório, etc.
--
-- Convenção de RLS (igual a milestones/samples/references): membro do projeto
-- lê; apenas owner/editor escreve (is_project_member / is_project_editor).

-- ── 1. Casos ────────────────────────────────────────────────────────────────
create table if not exists public.project_cases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  code text not null,
  description text,
  status text not null default 'active'
    check (status in ('active', 'completed', 'archived')),
  custom jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists project_cases_project_idx
  on public.project_cases (project_id, created_at desc);

alter table public.project_cases enable row level security;
create policy "project_cases: membros veem"
  on public.project_cases for select using (public.is_project_member(project_id));
create policy "project_cases: owner/editor criam"
  on public.project_cases for insert
  with check (public.is_project_editor(project_id) and (created_by is null or created_by = auth.uid()));
create policy "project_cases: owner/editor atualizam"
  on public.project_cases for update using (public.is_project_editor(project_id));
create policy "project_cases: owner/editor excluem"
  on public.project_cases for delete using (public.is_project_editor(project_id));

-- ── 2. Amostras: vínculo ao caso + campos extras ────────────────────────────
-- Amostra órfã (case_id null) continua válida — nem todo projeto usa casos.
alter table public.project_samples
  add column if not exists case_id uuid references public.project_cases (id) on delete set null,
  add column if not exists notes text,
  add column if not exists custom jsonb not null default '{}'::jsonb;
create index if not exists project_samples_case_idx
  on public.project_samples (case_id);

-- ── 3. Definições de campos personalizados por projeto ──────────────────────
create table if not exists public.project_field_defs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  entity text not null check (entity in ('case', 'sample')),
  field_key text not null,
  label text not null,
  field_type text not null default 'text'
    check (field_type in ('text', 'textarea', 'number', 'date', 'select', 'boolean')),
  options jsonb not null default '[]'::jsonb, -- rótulos usados quando field_type = 'select'
  required boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (project_id, entity, field_key)
);
create index if not exists project_field_defs_project_idx
  on public.project_field_defs (project_id, entity, position);

alter table public.project_field_defs enable row level security;
create policy "project_field_defs: membros veem"
  on public.project_field_defs for select using (public.is_project_member(project_id));
create policy "project_field_defs: owner/editor criam"
  on public.project_field_defs for insert with check (public.is_project_editor(project_id));
create policy "project_field_defs: owner/editor atualizam"
  on public.project_field_defs for update using (public.is_project_editor(project_id));
create policy "project_field_defs: owner/editor excluem"
  on public.project_field_defs for delete using (public.is_project_editor(project_id));
