-- Convites de participantes com confirmação do convidado.

-- ---------------------------------------------------------------------------
-- Helper: usuário é dono (owner) aceito do projeto
-- ---------------------------------------------------------------------------
create or replace function public.is_project_owner(p_project_id uuid)
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
      and pm.role = 'owner'
  );
$$;

-- ---------------------------------------------------------------------------
-- Visibilidade: membro vê o perfil (nome/e-mail) de quem divide projeto com ele
-- (a policy existente só deixa cada um ler o próprio perfil, o que quebraria
-- a listagem de participantes)
-- ---------------------------------------------------------------------------
create policy "profiles: vê perfis de coparticipantes"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.project_members mine
      join public.project_members theirs on theirs.project_id = mine.project_id
      where mine.user_id = auth.uid()
        and mine.status = 'accepted'
        and theirs.user_id = profiles.id
        and theirs.status = 'accepted'
    )
  );

-- ---------------------------------------------------------------------------
-- Visibilidade: convidado enxerga seus próprios convites pendentes
-- (a policy existente só cobre membros já aceitos)
-- ---------------------------------------------------------------------------
create policy "project_members: usuário vê seus convites pendentes"
  on public.project_members for select
  using (
    status = 'pending'
    and (
      user_id = auth.uid()
      or invited_email = (select email from public.profiles where id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Convidar participante (owner/editor; só owner convida como owner)
-- ---------------------------------------------------------------------------
create or replace function public.invite_project_member(
  p_project_id uuid,
  p_email text,
  p_role text default 'viewer'
)
returns public.project_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_invited_user_id uuid;
  v_member public.project_members;
begin
  if not public.is_project_editor(p_project_id) then
    raise exception 'not authorized';
  end if;

  if p_role not in ('owner', 'editor', 'viewer') then
    raise exception 'invalid role';
  end if;

  if p_role = 'owner' and not public.is_project_owner(p_project_id) then
    raise exception 'only an owner can invite another owner';
  end if;

  select id into v_invited_user_id from public.profiles where email = v_email;

  if v_invited_user_id is not null and exists (
    select 1 from public.project_members
    where project_id = p_project_id and user_id = v_invited_user_id and status = 'accepted'
  ) then
    raise exception 'user is already a member';
  end if;

  insert into public.project_members (project_id, user_id, invited_email, role, status)
  values (p_project_id, v_invited_user_id, v_email, p_role, 'pending')
  on conflict on constraint project_members_unique_user
    do update set role = excluded.role, status = 'pending', invited_at = now(), accepted_at = null
  returning * into v_member;

  return v_member;
end;
$$;

grant execute on function public.invite_project_member(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Aceitar convite (o próprio convidado)
-- ---------------------------------------------------------------------------
create or replace function public.accept_project_invite(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := (select email from public.profiles where id = auth.uid());
begin
  update public.project_members
    set user_id = auth.uid(), status = 'accepted', accepted_at = now()
    where project_id = p_project_id
      and status = 'pending'
      and (user_id = auth.uid() or invited_email = v_email);

  if not found then
    raise exception 'invite not found';
  end if;
end;
$$;

grant execute on function public.accept_project_invite(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Recusar convite (o próprio convidado)
-- ---------------------------------------------------------------------------
create or replace function public.decline_project_invite(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := (select email from public.profiles where id = auth.uid());
begin
  delete from public.project_members
    where project_id = p_project_id
      and status = 'pending'
      and (user_id = auth.uid() or invited_email = v_email);
end;
$$;

grant execute on function public.decline_project_invite(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Remover membro (owner/editor; só owner remove outro owner; nunca zera os owners)
-- ---------------------------------------------------------------------------
create or replace function public.remove_project_member(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
  v_role text;
  v_owner_count integer;
begin
  select project_id, role into v_project_id, v_role
  from public.project_members where id = p_member_id;

  if v_project_id is null then
    raise exception 'member not found';
  end if;

  if not public.is_project_editor(v_project_id) then
    raise exception 'not authorized';
  end if;

  if v_role = 'owner' then
    if not public.is_project_owner(v_project_id) then
      raise exception 'only an owner can remove another owner';
    end if;

    select count(*) into v_owner_count
    from public.project_members
    where project_id = v_project_id and role = 'owner' and status = 'accepted';

    if v_owner_count <= 1 then
      raise exception 'a project must keep at least one owner';
    end if;
  end if;

  delete from public.project_members where id = p_member_id;
end;
$$;

grant execute on function public.remove_project_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Trocar papel de um membro já aceito (mesmas regras de proteção do owner)
-- ---------------------------------------------------------------------------
create or replace function public.update_member_role(p_member_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
  v_current_role text;
  v_owner_count integer;
begin
  if p_role not in ('owner', 'editor', 'viewer') then
    raise exception 'invalid role';
  end if;

  select project_id, role into v_project_id, v_current_role
  from public.project_members where id = p_member_id;

  if v_project_id is null then
    raise exception 'member not found';
  end if;

  if not public.is_project_editor(v_project_id) then
    raise exception 'not authorized';
  end if;

  if (v_current_role = 'owner' or p_role = 'owner') and not public.is_project_owner(v_project_id) then
    raise exception 'only an owner can grant or revoke the owner role';
  end if;

  if v_current_role = 'owner' and p_role <> 'owner' then
    select count(*) into v_owner_count
    from public.project_members
    where project_id = v_project_id and role = 'owner' and status = 'accepted';

    if v_owner_count <= 1 then
      raise exception 'a project must keep at least one owner';
    end if;
  end if;

  update public.project_members set role = p_role where id = p_member_id;
end;
$$;

grant execute on function public.update_member_role(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Ao criar a conta, vincula automaticamente convites pendentes com esse e-mail
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');

  update public.project_members
    set user_id = new.id
    where invited_email = new.email
      and status = 'pending'
      and user_id is null;

  return new;
end;
$$;
