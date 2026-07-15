-- Cria o projeto do lado do servidor (owner_id vem de auth.uid(), nunca do cliente),
-- evitando depender do cliente enviar um owner_id que bata exatamente com a policy de INSERT.
create or replace function public.create_project(p_title text, p_description text default null)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project public.projects;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.projects (owner_id, title, description)
  values (auth.uid(), p_title, p_description)
  returning * into v_project;

  return v_project;
end;
$$;

grant execute on function public.create_project(text, text) to authenticated;

-- Limpa as funcoes de depuracao temporarias criadas durante o diagnostico do RLS.
drop function if exists public.debug_whoami();
drop function if exists public.debug_projects_policies();
