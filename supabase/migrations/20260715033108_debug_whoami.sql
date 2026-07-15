-- TEMPORARIO: apenas para depurar um 42501 inesperado no INSERT de projects.
-- Sera removido assim que o diagnostico terminar.
create or replace function public.debug_whoami()
returns table (uid_value uuid, role_value text, jwt_claims text)
language sql
stable
as $$
  select auth.uid(), auth.role(), current_setting('request.jwt.claims', true);
$$;

grant execute on function public.debug_whoami() to authenticated;
