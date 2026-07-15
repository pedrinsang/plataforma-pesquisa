-- TEMPORARIO: inspeciona a definicao real das policies de projects (sem dados de usuario).
create or replace function public.debug_projects_policies()
returns table (policy_name text, cmd text, permissive text, with_check text, using_expr text)
language sql
stable
security definer
set search_path = public
as $$
  select polname,
         case polcmd
           when 'r' then 'select' when 'a' then 'insert'
           when 'w' then 'update' when 'd' then 'delete' else polcmd::text
         end,
         case when polpermissive then 'permissive' else 'restrictive' end,
         pg_get_expr(polwithcheck, polrelid),
         pg_get_expr(polqual, polrelid)
  from pg_policy
  where polrelid = 'public.projects'::regclass;
$$;

grant execute on function public.debug_projects_policies() to authenticated;
