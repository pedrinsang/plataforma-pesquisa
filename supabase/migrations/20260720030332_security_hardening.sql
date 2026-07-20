-- Reforço de segurança: autorização por papel, rate limiting de login e log de auditoria.

-- ---------------------------------------------------------------------------
-- 1) Autorização por papel (owner/editor podem escrever, viewer só lê)
-- ---------------------------------------------------------------------------
create or replace function public.is_project_editor(p_project_id uuid)
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
      and pm.role in ('owner', 'editor')
  );
$$;

-- projects: dono OU editor podem atualizar (antes só o dono via owner_id)
drop policy if exists "projects: dono atualiza o projeto" on public.projects;
create policy "projects: dono ou editor atualiza o projeto"
  on public.projects for update
  using (public.is_project_editor(id));

-- documents: viewers passam a só ler; criar/atualizar/excluir exige owner/editor
drop policy if exists "documents: membros criam" on public.documents;
create policy "documents: owner/editor criam"
  on public.documents for insert
  with check (public.is_project_editor(project_id) and created_by = auth.uid());

drop policy if exists "documents: membros atualizam" on public.documents;
create policy "documents: owner/editor atualizam"
  on public.documents for update
  using (public.is_project_editor(project_id));

drop policy if exists "documents: membros excluem" on public.documents;
create policy "documents: owner/editor excluem"
  on public.documents for delete
  using (public.is_project_editor(project_id));

-- datasets
drop policy if exists "datasets: membros criam" on public.datasets;
create policy "datasets: owner/editor criam"
  on public.datasets for insert
  with check (public.is_project_editor(project_id) and created_by = auth.uid());

drop policy if exists "datasets: membros atualizam" on public.datasets;
create policy "datasets: owner/editor atualizam"
  on public.datasets for update
  using (public.is_project_editor(project_id));

drop policy if exists "datasets: membros excluem" on public.datasets;
create policy "datasets: owner/editor excluem"
  on public.datasets for delete
  using (public.is_project_editor(project_id));

-- dataset_columns
drop policy if exists "dataset_columns: membros criam" on public.dataset_columns;
create policy "dataset_columns: owner/editor criam"
  on public.dataset_columns for insert
  with check (public.is_project_editor(project_id));

drop policy if exists "dataset_columns: membros atualizam" on public.dataset_columns;
create policy "dataset_columns: owner/editor atualizam"
  on public.dataset_columns for update
  using (public.is_project_editor(project_id));

drop policy if exists "dataset_columns: membros excluem" on public.dataset_columns;
create policy "dataset_columns: owner/editor excluem"
  on public.dataset_columns for delete
  using (public.is_project_editor(project_id));

-- dataset_rows
drop policy if exists "dataset_rows: membros criam" on public.dataset_rows;
create policy "dataset_rows: owner/editor criam"
  on public.dataset_rows for insert
  with check (public.is_project_editor(project_id));

drop policy if exists "dataset_rows: membros atualizam" on public.dataset_rows;
create policy "dataset_rows: owner/editor atualizam"
  on public.dataset_rows for update
  using (public.is_project_editor(project_id));

drop policy if exists "dataset_rows: membros excluem" on public.dataset_rows;
create policy "dataset_rows: owner/editor excluem"
  on public.dataset_rows for delete
  using (public.is_project_editor(project_id));

-- ---------------------------------------------------------------------------
-- 2) Rate limiting de login (bloqueio temporário após tentativas falhas)
-- ---------------------------------------------------------------------------
create table public.login_attempts (
  email text primary key,
  failed_count integer not null default 0,
  locked_until timestamptz,
  last_attempt_at timestamptz not null default now()
);

-- RLS habilitado sem nenhuma policy: ninguém acessa a tabela diretamente,
-- só via as funções SECURITY DEFINER abaixo (chamadas pelo server action de login).
alter table public.login_attempts enable row level security;

create or replace function public.check_login_rate_limit(p_email text)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_locked_until timestamptz;
begin
  select locked_until into v_locked_until
  from public.login_attempts
  where email = lower(p_email);

  if v_locked_until is not null and v_locked_until > now() then
    return query select false, ceil(extract(epoch from (v_locked_until - now())))::integer;
  end if;

  return query select true, 0;
end;
$$;

create or replace function public.register_login_failure(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.login_attempts (email, failed_count, last_attempt_at)
  values (lower(p_email), 1, now())
  on conflict (email) do update
    set failed_count = case
          -- janela de 15 min: reseta a contagem se a última tentativa foi antes disso
          when public.login_attempts.last_attempt_at < now() - interval '15 minutes' then 1
          else public.login_attempts.failed_count + 1
        end,
        last_attempt_at = now()
  returning failed_count into v_count;

  if v_count >= 5 then
    update public.login_attempts
      set locked_until = now() + interval '15 minutes'
      where email = lower(p_email);
  end if;
end;
$$;

create or replace function public.register_login_success(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.login_attempts where email = lower(p_email);
end;
$$;

grant execute on function public.check_login_rate_limit(text) to anon, authenticated;
grant execute on function public.register_login_failure(text) to anon, authenticated;
grant execute on function public.register_login_success(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3) Log de auditoria (quem alterou o quê e quando, por projeto)
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  action text not null check (action in ('insert', 'update', 'delete')),
  entity_type text not null,
  entity_id uuid not null,
  created_at timestamptz not null default now()
);

create index audit_log_project_id_idx on public.audit_log (project_id, created_at desc);

alter table public.audit_log enable row level security;

create policy "audit_log: membros veem o log do projeto"
  on public.audit_log for select
  using (public.is_project_member(project_id));

create or replace function public.log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
  v_entity_id uuid;
begin
  v_project_id := coalesce(new.project_id, old.project_id);
  v_entity_id := coalesce(new.id, old.id);

  insert into public.audit_log (project_id, actor_id, action, entity_type, entity_id)
  values (v_project_id, auth.uid(), lower(tg_op), tg_table_name, v_entity_id);

  return coalesce(new, old);
end;
$$;

create trigger documents_audit
  after insert or update or delete on public.documents
  for each row execute function public.log_audit_event();

create trigger datasets_audit
  after insert or update or delete on public.datasets
  for each row execute function public.log_audit_event();

create trigger dataset_rows_audit
  after insert or update or delete on public.dataset_rows
  for each row execute function public.log_audit_event();
