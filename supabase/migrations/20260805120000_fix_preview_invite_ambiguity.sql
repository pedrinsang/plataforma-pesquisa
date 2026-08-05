-- Corrige o "column reference is ambiguous" em preview_project_invite.
--
-- A função é `returns table (status text, project_id uuid, …)`, e no PL/pgSQL
-- as colunas de saída viram **variáveis**. A checagem de "já é membro" usava
-- `where project_id = … and status = 'accepted'` sem qualificar: os dois nomes
-- existem ao mesmo tempo como coluna de project_members e como variável da
-- função, e o Postgres (com `variable_conflict = error`, o padrão) aborta.
--
-- O erro só aparecia no ramo do convite **válido** — as saídas anteriores
-- (not_found/revoked/expired/exhausted) retornam antes de chegar ali. Efeito
-- prático: abrir o link de um convite bom estourava a RPC e a tela dizia "Este
-- convite não existe", enquanto resgatar o mesmo código pela caixa "Tenho um
-- código" funcionava (redeem_project_invite devolve um uuid simples, sem
-- parâmetros de saída, então não tem o conflito).
--
-- Aqui toda referência a coluna passa a ser qualificada por alias.

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

  select * into v_invite
  from public.project_invite_codes ic
  where ic.code = v_code;

  if not found then
    return query select 'not_found'::text, null::uuid, null::text, null::text, null::text, null::text;
    return;
  end if;

  select lower(pr.email) into v_user_email
  from public.profiles pr
  where pr.id = auth.uid();

  if v_invite.revoked_at is not null then
    v_status := 'revoked';
  elsif v_invite.expires_at is not null and v_invite.expires_at < now() then
    v_status := 'expired';
  elsif v_invite.max_uses is not null and v_invite.uses_count >= v_invite.max_uses then
    v_status := 'exhausted';
  elsif v_invite.email is not null and v_invite.email <> coalesce(v_user_email, '') then
    v_status := 'wrong_email';
  elsif exists (
    -- alias obrigatório: sem ele, `project_id` e `status` colidem com as
    -- colunas de saída da função
    select 1
    from public.project_members pm
    where pm.project_id = v_invite.project_id
      and pm.user_id = auth.uid()
      and pm.status = 'accepted'
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

-- `create or replace` preserva a ACL, mas reafirmamos para não depender disso.
revoke all on function public.preview_project_invite(text) from public, anon;
grant execute on function public.preview_project_invite(text) to authenticated;
