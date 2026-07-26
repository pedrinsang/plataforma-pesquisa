-- Corrige recursão infinita de RLS (Postgres 42P17) ao ler `profiles`.
--
-- Ciclo: a policy "profiles: vê perfis de coparticipantes" consulta
-- `project_members`; a policy "project_members: usuário vê seus convites
-- pendentes" consultava `profiles` via subquery direto — e a avaliação de uma
-- disparava a outra indefinidamente. Isso quebrava qualquer leitura que
-- embutisse `profiles` (ex.: a lista de participantes no dashboard), fazendo a
-- query falhar e, de quebra, zerar o `canManage` da tela do projeto.
--
-- Solução: encapsular a leitura do e-mail do usuário numa função
-- SECURITY DEFINER (que ignora RLS), cortando a aresta do ciclo. É o mesmo
-- padrão já usado por is_project_member()/is_project_editor().

create or replace function public.current_user_email()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select email from public.profiles where id = auth.uid();
$$;

grant execute on function public.current_user_email() to authenticated;

-- Recria a policy de convites pendentes usando a função (sem tocar em RLS de profiles).
drop policy if exists "project_members: usuário vê seus convites pendentes" on public.project_members;
create policy "project_members: usuário vê seus convites pendentes"
  on public.project_members for select
  using (
    status = 'pending'
    and (
      user_id = auth.uid()
      or invited_email = public.current_user_email()
    )
  );
