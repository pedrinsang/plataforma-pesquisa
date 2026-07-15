-- Fase 1: identidade (profiles) e projetos de pesquisa (projects, project_members)

-- ---------------------------------------------------------------------------
-- Utilitário: mantém updated_at em dia em qualquer tabela que tenha a coluna
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Cria automaticamente um profile quando um usuário se cadastra via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create policy "profiles: usuário lê o próprio perfil"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: usuário atualiza o próprio perfil"
  on public.profiles for update
  using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_owner_id_idx on public.projects (owner_id);

alter table public.projects enable row level security;

create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- project_members
-- ---------------------------------------------------------------------------
create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  invited_email text,
  role text not null default 'owner' check (role in ('owner', 'editor', 'viewer')),
  status text not null default 'accepted' check (status in ('accepted', 'pending')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint project_members_user_or_invite check (
    user_id is not null or invited_email is not null
  ),
  constraint project_members_unique_user unique (project_id, user_id)
);

create index project_members_project_id_idx on public.project_members (project_id);
create index project_members_user_id_idx on public.project_members (user_id);

alter table public.project_members enable row level security;

-- Função central de autorização: um usuário é "membro" de um projeto se tem
-- uma linha aceita em project_members. Usada por todas as policies das
-- tabelas de negócio (presentes e futuras), então habilitar colaboradores
-- depois é só inserir em project_members — nenhuma policy muda.
create or replace function public.is_project_member(p_project_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = p_project_id
      and pm.user_id = auth.uid()
      and pm.status = 'accepted'
  );
$$;

-- Ao criar um projeto, insere automaticamente o dono como membro "owner".
-- SECURITY DEFINER: roda como o dono da função (bypassa RLS de project_members
-- só para esta inserção controlada, sem abrir INSERT direto pros usuários).
create or replace function public.handle_new_project()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.project_members (project_id, user_id, role, status, accepted_at)
  values (new.id, new.owner_id, 'owner', 'accepted', now());
  return new;
end;
$$;

create trigger on_project_created
  after insert on public.projects
  for each row execute function public.handle_new_project();

-- projects: policies
create policy "projects: membros veem o projeto"
  on public.projects for select
  using (public.is_project_member(id));

create policy "projects: usuário cria projeto como dono"
  on public.projects for insert
  with check (owner_id = auth.uid());

create policy "projects: dono atualiza o projeto"
  on public.projects for update
  using (owner_id = auth.uid());

create policy "projects: dono exclui o projeto"
  on public.projects for delete
  using (owner_id = auth.uid());

-- project_members: policies (sem policy de INSERT para usuários comuns —
-- a linha "owner" nasce via trigger; convites, na Fase 11, ganham sua própria
-- policy/RPC controlada)
create policy "project_members: membros veem os membros do projeto"
  on public.project_members for select
  using (public.is_project_member(project_id));
