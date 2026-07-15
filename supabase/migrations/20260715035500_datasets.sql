-- Fase 3: planilha de coleta de dados da area de Estatistica

create table public.datasets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  description text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index datasets_project_id_idx on public.datasets (project_id);

alter table public.datasets enable row level security;

create trigger set_datasets_updated_at
  before update on public.datasets
  for each row execute function public.set_updated_at();

create table public.dataset_columns (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references public.datasets (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  data_type text not null default 'text' check (data_type in ('text', 'number', 'integer', 'date', 'boolean', 'categorical')),
  options jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index dataset_columns_dataset_id_idx on public.dataset_columns (dataset_id, position);
create index dataset_columns_project_id_idx on public.dataset_columns (project_id);

alter table public.dataset_columns enable row level security;

create table public.dataset_rows (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references public.datasets (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  position integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index dataset_rows_dataset_id_idx on public.dataset_rows (dataset_id, position);
create index dataset_rows_project_id_idx on public.dataset_rows (project_id);

alter table public.dataset_rows enable row level security;

create trigger set_dataset_rows_updated_at
  before update on public.dataset_rows
  for each row execute function public.set_updated_at();

-- policies: mesmo padrao is_project_member para as 3 tabelas
create policy "datasets: membros veem" on public.datasets for select using (public.is_project_member(project_id));
create policy "datasets: membros criam" on public.datasets for insert with check (public.is_project_member(project_id) and created_by = auth.uid());
create policy "datasets: membros atualizam" on public.datasets for update using (public.is_project_member(project_id));
create policy "datasets: membros excluem" on public.datasets for delete using (public.is_project_member(project_id));

create policy "dataset_columns: membros veem" on public.dataset_columns for select using (public.is_project_member(project_id));
create policy "dataset_columns: membros criam" on public.dataset_columns for insert with check (public.is_project_member(project_id));
create policy "dataset_columns: membros atualizam" on public.dataset_columns for update using (public.is_project_member(project_id));
create policy "dataset_columns: membros excluem" on public.dataset_columns for delete using (public.is_project_member(project_id));

create policy "dataset_rows: membros veem" on public.dataset_rows for select using (public.is_project_member(project_id));
create policy "dataset_rows: membros criam" on public.dataset_rows for insert with check (public.is_project_member(project_id));
create policy "dataset_rows: membros atualizam" on public.dataset_rows for update using (public.is_project_member(project_id));
create policy "dataset_rows: membros excluem" on public.dataset_rows for delete using (public.is_project_member(project_id));
