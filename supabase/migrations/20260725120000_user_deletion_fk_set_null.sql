-- Fase de manutenção: permitir excluir um usuário (auth.users) sem travar.
--
-- Antes desta migration, apagar um usuário cascateava para `profiles` e, daí,
-- para os projetos dele — mas duas coisas barravam a exclusão:
--   1. `documents.created_by` / `datasets.created_by` referenciavam `profiles`
--      SEM `on delete`, e como eram NOT NULL, um conteúdo criado por um usuário
--      dentro de um projeto de OUTRO (projeto compartilhado) impedia remover o
--      perfil.
--   2. o trigger de auditoria `log_audit_event()` disparava no DELETE em cascata
--      e tentava inserir em `audit_log` referenciando um projeto que já havia
--      sido removido — violando `audit_log_project_id_fkey`.
--
-- Correções:
--   - `created_by` (documents, datasets) e `actor_id` (audit_log) passam a
--     `on delete set null`, preservando o registro sem o vínculo do autor.
--   - `created_by` deixa de ser NOT NULL (necessário para o SET NULL).
--   - o trigger de auditoria ignora DELETE quando o projeto já não existe.

-- ── 1. documents.created_by ────────────────────────────────────────────────
alter table public.documents alter column created_by drop not null;
alter table public.documents drop constraint if exists documents_created_by_fkey;
alter table public.documents
  add constraint documents_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

-- ── 2. datasets.created_by ─────────────────────────────────────────────────
alter table public.datasets alter column created_by drop not null;
alter table public.datasets drop constraint if exists datasets_created_by_fkey;
alter table public.datasets
  add constraint datasets_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

-- ── 3. audit_log.actor_id (já anulável) ────────────────────────────────────
alter table public.audit_log drop constraint if exists audit_log_actor_id_fkey;
alter table public.audit_log
  add constraint audit_log_actor_id_fkey
  foreign key (actor_id) references public.profiles (id) on delete set null;

-- ── 4. trigger de auditoria: não auditar DELETE de projeto já removido ──────
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

  -- Em exclusões em cascata (remoção de projeto ou de usuário), o projeto pode
  -- já ter sido apagado — não há o que auditar e o insert violaria a FK.
  if tg_op = 'DELETE' and not exists (
    select 1 from public.projects where id = v_project_id
  ) then
    return old;
  end if;

  insert into public.audit_log (project_id, actor_id, action, entity_type, entity_id)
  values (v_project_id, auth.uid(), lower(tg_op), tg_table_name, v_entity_id);

  return coalesce(new, old);
end;
$$;
