-- Fase 2: documentos da area de Escrita

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null default 'Documento sem título',
  content_json jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  template_type text,
  word_goal integer,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_project_id_idx on public.documents (project_id);

alter table public.documents enable row level security;

create trigger set_documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

create policy "documents: membros veem"
  on public.documents for select
  using (public.is_project_member(project_id));

create policy "documents: membros criam"
  on public.documents for insert
  with check (public.is_project_member(project_id) and created_by = auth.uid());

create policy "documents: membros atualizam"
  on public.documents for update
  using (public.is_project_member(project_id));

create policy "documents: membros excluem"
  on public.documents for delete
  using (public.is_project_member(project_id));
