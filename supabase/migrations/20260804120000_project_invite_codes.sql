-- Convites que realmente funcionam: por e-mail (com link) e por código aleatório.
--
-- Até aqui um convite era só uma linha `pending` em project_members: o convidado
-- só descobria o convite se já tivesse conta e entrasse na plataforma. Agora todo
-- convite ganha um **código** (segredo de ~60 bits) que vira link:
--   /convite/<CODE>
--
-- Dois formatos, a mesma tabela:
--  * **por e-mail** — `email` preenchido, `max_uses = 1`. Continua criando a
--    linha `pending` em project_members (para o cartão "Convites pendentes"),
--    e o link é enviado por e-mail pelo servidor.
--  * **por código** — `email` nulo. Qualquer pessoa com conta que abra o link
--    (ou digite o código) entra no projeto com o papel do convite. Aceita
--    validade (`expires_at`) e limite de usos (`max_uses`).
--
-- Decisões:
--  * O código é gerado na aplicação (`crypto.randomBytes`, alfabeto sem
--    caracteres ambíguos) e só validado aqui — pgcrypto não é garantido no
--    search_path do Supabase, e o CSPRNG do Node é mais forte que random().
--  * Toda escrita passa por RPC SECURITY DEFINER; a tabela não tem policy de
--    insert/update/delete. Só owner/editor **leem** os códigos (um código é uma
--    credencial: um leitor não pode ver o código que dá acesso de editor).
--  * `remove_project_member` passa a exigir **dono** (era owner/editor).

-- ---------------------------------------------------------------------------
-- 1. Tabela dos convites
-- ---------------------------------------------------------------------------
create table if not exists public.project_invite_codes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  code text not null unique,
  role text not null default 'viewer' check (role in ('owner', 'editor', 'viewer')),
  -- nulo = código aberto; preenchido = convite dirigido a esse e-mail
  email text,
  max_uses integer check (max_uses is null or max_uses between 1 and 500),
  uses_count integer not null default 0,
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists project_invite_codes_project_idx
  on public.project_invite_codes (project_id, created_at desc);

create index if not exists project_invite_codes_email_idx
  on public.project_invite_codes (project_id, email)
  where email is not null;

alter table public.project_invite_codes enable row level security;

drop policy if exists "project_invite_codes: owner/editor veem" on public.project_invite_codes;
create policy "project_invite_codes: owner/editor veem"
  on public.project_invite_codes for select
  using (public.is_project_editor(project_id));

-- Um mesmo e-mail não acumula convites abertos no mesmo projeto: o convite novo
-- substitui o anterior (ver create_project_invite).
create unique index if not exists project_invite_codes_email_uniq
  on public.project_invite_codes (project_id, lower(email))
  where email is not null and revoked_at is null;

-- Duas linhas `pending` para o mesmo e-mail sem conta também não fazem sentido
-- (a constraint unique (project_id, user_id) não pega, porque NULL nunca colide).
-- Limpa as duplicatas que o `on conflict` antigo deixou passar, mantendo a mais
-- recente, antes de criar o índice.
delete from public.project_members pm
where pm.user_id is null
  and exists (
    select 1 from public.project_members other
    where other.project_id = pm.project_id
      and other.user_id is null
      and lower(other.invited_email) = lower(pm.invited_email)
      and (other.invited_at, other.id) > (pm.invited_at, pm.id)
  );

create unique index if not exists project_members_pending_email_uniq
  on public.project_members (project_id, lower(invited_email))
  where user_id is null;

-- ---------------------------------------------------------------------------
-- 2. Normalização/validação do código
-- ---------------------------------------------------------------------------
-- Aceita o código com ou sem hifens/minúsculas e devolve a forma canônica
-- (maiúsculas, sem separadores). Levanta erro se não tiver corpo suficiente.
create or replace function public.normalize_invite_code(p_code text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if length(v_code) < 12 or length(v_code) > 40 then
    raise exception 'invalid invite code';
  end if;
  return v_code;
end;
$$;

grant execute on function public.normalize_invite_code(text) to authenticated;

-- Ordem dos papéis: usar um convite nunca **rebaixa** quem já é membro.
create or replace function public.project_role_rank(p_role text)
returns integer
language sql
immutable
as $$
  select case p_role when 'owner' then 3 when 'editor' then 2 when 'viewer' then 1 else 0 end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Convite por e-mail: linha `pending` em project_members
--    (reescrito — o `on conflict` antigo não cobria o caso user_id nulo, que
--     duplicava convites do mesmo e-mail para quem ainda não tem conta)
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
  v_user_id uuid;
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

  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid email';
  end if;

  select id into v_user_id from public.profiles where lower(email) = v_email;

  -- (a) o convidado já tem conta e já tem linha nesse projeto
  if v_user_id is not null then
    select * into v_member
    from public.project_members
    where project_id = p_project_id and user_id = v_user_id;

    if found then
      if v_member.status = 'accepted' then
        raise exception 'user is already a member';
      end if;

      update public.project_members
        set role = p_role, invited_email = v_email, invited_at = now(), accepted_at = null
        where id = v_member.id
        returning * into v_member;
      return v_member;
    end if;
  end if;

  -- (b) já existe convite pendente para esse e-mail sem conta vinculada
  select * into v_member
  from public.project_members
  where project_id = p_project_id
    and user_id is null
    and lower(invited_email) = v_email;

  if found then
    update public.project_members
      set role = p_role, user_id = v_user_id, invited_at = now(), status = 'pending'
      where id = v_member.id
      returning * into v_member;
    return v_member;
  end if;

  -- (c) convite novo
  insert into public.project_members (project_id, user_id, invited_email, role, status)
  values (p_project_id, v_user_id, v_email, p_role, 'pending')
  returning * into v_member;

  return v_member;
end;
$$;

grant execute on function public.invite_project_member(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Criar convite (gera a linha do código; se tiver e-mail, também o pendente)
-- ---------------------------------------------------------------------------
create or replace function public.create_project_invite(
  p_project_id uuid,
  p_code text,
  p_role text default 'viewer',
  p_email text default null,
  p_max_uses integer default null,
  p_expires_in_days integer default null
)
returns public.project_invite_codes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := public.normalize_invite_code(p_code);
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_max_uses integer := p_max_uses;
  v_expires_at timestamptz;
  v_invite public.project_invite_codes;
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

  if p_expires_in_days is not null then
    if p_expires_in_days < 1 or p_expires_in_days > 365 then
      raise exception 'invalid expiry';
    end if;
    v_expires_at := now() + make_interval(days => p_expires_in_days);
  end if;

  if v_email is not null then
    -- convite dirigido: um uso só, e o pendente aparece para o convidado
    v_max_uses := 1;
    perform public.invite_project_member(p_project_id, v_email, p_role);

    -- convite anterior para o mesmo e-mail perde a validade
    update public.project_invite_codes
      set revoked_at = now()
      where project_id = p_project_id
        and lower(email) = v_email
        and revoked_at is null;
  end if;

  if v_max_uses is not null and (v_max_uses < 1 or v_max_uses > 500) then
    raise exception 'invalid max uses';
  end if;

  insert into public.project_invite_codes
    (project_id, code, role, email, max_uses, expires_at, created_by)
  values
    (p_project_id, v_code, p_role, v_email, v_max_uses, v_expires_at, auth.uid())
  returning * into v_invite;

  return v_invite;
end;
$$;

grant execute on function public.create_project_invite(uuid, text, text, text, integer, integer)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Revogar convite (dono, ou quem criou o convite)
-- ---------------------------------------------------------------------------
create or replace function public.revoke_project_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.project_invite_codes;
begin
  select * into v_invite from public.project_invite_codes where id = p_invite_id;

  if not found then
    raise exception 'invite not found';
  end if;

  if not (
    public.is_project_owner(v_invite.project_id)
    or (public.is_project_editor(v_invite.project_id) and v_invite.created_by = auth.uid())
  ) then
    raise exception 'not authorized';
  end if;

  update public.project_invite_codes
    set revoked_at = coalesce(revoked_at, now())
    where id = p_invite_id;

  -- convite por e-mail: cancelar o código cancela o convite pendente também
  if v_invite.email is not null then
    delete from public.project_members
      where project_id = v_invite.project_id
        and status = 'pending'
        and lower(invited_email) = lower(v_invite.email);
  end if;
end;
$$;

grant execute on function public.revoke_project_invite(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Pré-visualizar um convite (o convidado ainda não é membro: não enxerga o
--    projeto por RLS, então quem responde é uma função SECURITY DEFINER)
-- ---------------------------------------------------------------------------
create or replace function public.preview_project_invite(p_code text)
returns table (
  status text,          -- valid | not_found | revoked | expired | exhausted | wrong_email | already_member
  project_id uuid,
  project_title text,
  role text,
  invited_email text,
  inviter_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_invite public.project_invite_codes;
  v_user_email text;
  v_status text := 'valid';
begin
  begin
    v_code := public.normalize_invite_code(p_code);
  exception when others then
    return query select 'not_found'::text, null::uuid, null::text, null::text, null::text, null::text;
    return;
  end;

  select * into v_invite from public.project_invite_codes where code = v_code;

  if not found then
    return query select 'not_found'::text, null::uuid, null::text, null::text, null::text, null::text;
    return;
  end if;

  select lower(email) into v_user_email from public.profiles where id = auth.uid();

  if v_invite.revoked_at is not null then
    v_status := 'revoked';
  elsif v_invite.expires_at is not null and v_invite.expires_at < now() then
    v_status := 'expired';
  elsif v_invite.max_uses is not null and v_invite.uses_count >= v_invite.max_uses then
    v_status := 'exhausted';
  elsif v_invite.email is not null and v_invite.email <> coalesce(v_user_email, '') then
    v_status := 'wrong_email';
  elsif exists (
    select 1 from public.project_members
    where project_id = v_invite.project_id and user_id = auth.uid() and status = 'accepted'
  ) then
    v_status := 'already_member';
  end if;

  return query
    select
      v_status,
      v_invite.project_id,
      p.title,
      v_invite.role,
      v_invite.email,
      coalesce(inviter.full_name, inviter.email)
    from public.projects p
    left join public.profiles inviter on inviter.id = v_invite.created_by
    where p.id = v_invite.project_id;
end;
$$;

grant execute on function public.preview_project_invite(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Resgatar o convite (entrar no projeto)
-- ---------------------------------------------------------------------------
create or replace function public.redeem_project_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := public.normalize_invite_code(p_code);
  v_invite public.project_invite_codes;
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_member public.project_members;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  -- trava a linha: o limite de usos precisa valer sob concorrência
  select * into v_invite
  from public.project_invite_codes
  where code = v_code
  for update;

  if not found then
    raise exception 'invite not found';
  end if;

  if v_invite.revoked_at is not null then
    raise exception 'invite revoked';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    raise exception 'invite expired';
  end if;

  select lower(email) into v_user_email from public.profiles where id = v_user_id;

  if v_invite.email is not null and v_invite.email <> coalesce(v_user_email, '') then
    raise exception 'invite belongs to another email';
  end if;

  select * into v_member
  from public.project_members
  where project_id = v_invite.project_id and user_id = v_user_id;

  -- já é membro aceito: entrar de novo não consome uso nem rebaixa o papel
  if found and v_member.status = 'accepted' then
    if public.project_role_rank(v_invite.role) > public.project_role_rank(v_member.role) then
      update public.project_members set role = v_invite.role where id = v_member.id;
    end if;
    return v_invite.project_id;
  end if;

  if v_invite.max_uses is not null and v_invite.uses_count >= v_invite.max_uses then
    raise exception 'invite exhausted';
  end if;

  if found then
    update public.project_members
      set role = case
                   when public.project_role_rank(v_invite.role)
                        > public.project_role_rank(v_member.role)
                     then v_invite.role
                   else v_member.role
                 end,
          status = 'accepted',
          accepted_at = now()
      where id = v_member.id;
  else
    -- pode haver um pendente antigo por e-mail, ainda sem user_id
    select * into v_member
    from public.project_members
    where project_id = v_invite.project_id
      and user_id is null
      and lower(invited_email) = coalesce(v_user_email, '');

    if found then
      update public.project_members
        set user_id = v_user_id, role = v_invite.role, status = 'accepted', accepted_at = now()
        where id = v_member.id;
    else
      insert into public.project_members
        (project_id, user_id, invited_email, role, status, accepted_at)
      values
        (v_invite.project_id, v_user_id, v_user_email, v_invite.role, 'accepted', now());
    end if;
  end if;

  update public.project_invite_codes
    set uses_count = uses_count + 1,
        last_used_at = now()
    where id = v_invite.id;

  return v_invite.project_id;
end;
$$;

grant execute on function public.redeem_project_invite(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Remover participante: agora **só o dono**
--    (antes qualquer editor podia; excluir alguém do projeto é decisão de dono)
--    O projeto nunca fica sem dono, e o dono não se remove sozinho por engano.
-- ---------------------------------------------------------------------------
create or replace function public.remove_project_member(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.project_members;
  v_owner_count integer;
begin
  select * into v_member from public.project_members where id = p_member_id;

  if not found then
    raise exception 'member not found';
  end if;

  if not public.is_project_owner(v_member.project_id) then
    raise exception 'only an owner can remove members';
  end if;

  if v_member.user_id = auth.uid() then
    raise exception 'you cannot remove yourself';
  end if;

  if v_member.role = 'owner' and v_member.status = 'accepted' then
    select count(*) into v_owner_count
    from public.project_members
    where project_id = v_member.project_id and role = 'owner' and status = 'accepted';

    if v_owner_count <= 1 then
      raise exception 'a project must keep at least one owner';
    end if;
  end if;

  -- tirar a pessoa do projeto invalida os convites dirigidos a ela
  if v_member.invited_email is not null then
    update public.project_invite_codes
      set revoked_at = coalesce(revoked_at, now())
      where project_id = v_member.project_id
        and lower(email) = lower(v_member.invited_email)
        and revoked_at is null;
  end if;

  delete from public.project_members where id = p_member_id;
end;
$$;

grant execute on function public.remove_project_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 9. Recusar convite também derruba o código dirigido
-- ---------------------------------------------------------------------------
create or replace function public.decline_project_invite(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := (select lower(email) from public.profiles where id = auth.uid());
begin
  delete from public.project_members
    where project_id = p_project_id
      and status = 'pending'
      and (user_id = auth.uid() or lower(invited_email) = v_email);

  update public.project_invite_codes
    set revoked_at = coalesce(revoked_at, now())
    where project_id = p_project_id
      and lower(email) = v_email
      and revoked_at is null;
end;
$$;

grant execute on function public.decline_project_invite(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 10. Auditoria: entrada/saída de gente e criação/revogação de convites
-- ---------------------------------------------------------------------------
-- Igual ao log_audit_event, mas ignora o evento quando o projeto já não existe:
-- ao excluir um projeto, o cascade apaga membros e convites e o log iria
-- referenciar um projeto que acabou de sumir.
create or replace function public.log_membership_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid := coalesce(new.project_id, old.project_id);
begin
  if not exists (select 1 from public.projects where id = v_project_id) then
    return coalesce(new, old);
  end if;

  insert into public.audit_log (project_id, actor_id, action, entity_type, entity_id)
  values (v_project_id, auth.uid(), lower(tg_op), tg_table_name, coalesce(new.id, old.id));

  return coalesce(new, old);
end;
$$;

drop trigger if exists project_members_audit on public.project_members;
create trigger project_members_audit
  after insert or update or delete on public.project_members
  for each row execute function public.log_membership_event();

drop trigger if exists project_invite_codes_audit on public.project_invite_codes;
create trigger project_invite_codes_audit
  after insert or update or delete on public.project_invite_codes
  for each row execute function public.log_membership_event();
