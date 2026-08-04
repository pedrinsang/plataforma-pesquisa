-- Fecha o acesso anônimo às RPCs de convite/participantes.
--
-- O Postgres concede EXECUTE a PUBLIC em toda função nova, então o `grant ... to
-- authenticated` das migrations anteriores não *restringia* nada: o papel `anon`
-- (visitante sem login, chave pública do Supabase) também alcançava as funções.
-- Elas são SECURITY DEFINER — rodam como o dono do banco —, então o certo é a
-- porta ficar fechada por padrão e só o papel logado entrar.
--
-- Na prática o corpo das funções já recusava anônimo (auth.uid() nulo), mas a
-- `preview_project_invite` respondia a quem tivesse um código válido sem estar
-- logado. Aqui isso deixa de ser possível.
--
-- Os helpers de autorização (is_project_member/editor/owner) **não** entram
-- nesta lista: eles são chamados dentro das policies de RLS e precisam continuar
-- executáveis por todo mundo.

do $$
declare
  v_signature text;
begin
  foreach v_signature in array array[
    'public.create_project_invite(uuid, text, text, text, integer, integer)',
    'public.revoke_project_invite(uuid)',
    'public.redeem_project_invite(text)',
    'public.preview_project_invite(text)',
    'public.normalize_invite_code(text)',
    'public.project_role_rank(text)',
    'public.invite_project_member(uuid, text, text)',
    'public.accept_project_invite(uuid)',
    'public.decline_project_invite(uuid)',
    'public.remove_project_member(uuid)',
    'public.update_member_role(uuid, text)'
  ]
  loop
    execute format('revoke all on function %s from public, anon', v_signature);
    execute format('grant execute on function %s to authenticated', v_signature);
  end loop;
end;
$$;
