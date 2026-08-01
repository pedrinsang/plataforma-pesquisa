-- Biblioteca de referências do projeto (artigos, livros, sites, teses…).
--
-- A tabela `project_references` já existia com um núcleo mínimo (title, authors,
-- year, doi, is_essential) só para alimentar o card da Visão geral. Agora ela
-- vira a fonte única de citações do projeto: qualquer tipo de fonte, com o
-- arquivo (PDF) anexado e os metadados bibliográficos completos.
--
-- Decisões:
--  * `csl` guarda o registro CSL-JSON cru vindo do Crossref/PubMed. Os campos
--    "planos" (container_title, volume…) são o que a UI edita e exibe; o csl é
--    a matéria-prima para formatar ABNT/APA/Vancouver com precisão depois.
--  * `citation_key` é o identificador estável usado para citar a referência em
--    qualquer parte do projeto (menção "@" no editor, achados, casos…). Único
--    por projeto.
--  * Nada de IA: os metadados vêm de APIs bibliográficas públicas e gratuitas
--    (Crossref, PubMed, OpenLibrary, arXiv) ou das meta tags da própria página.
--
-- Convenção de RLS (igual a milestones/samples/cases): membro do projeto lê;
-- apenas owner/editor escreve (is_project_member / is_project_editor).

-- ── 1. Campos novos da referência ───────────────────────────────────────────
alter table public.project_references
  -- tipo de fonte; 'article' cobre o que já existia
  add column if not exists ref_type text not null default 'article'
    check (ref_type in (
      'article', 'preprint', 'book', 'chapter', 'thesis', 'conference',
      'report', 'website', 'dataset', 'software', 'other'
    )),
  add column if not exists url text,
  add column if not exists container_title text,   -- revista, livro, site
  add column if not exists publisher text,
  add column if not exists volume text,
  add column if not exists issue text,
  add column if not exists pages text,
  add column if not exists edition text,
  add column if not exists abstract text,
  add column if not exists isbn text,
  add column if not exists issn text,
  add column if not exists pmid text,
  add column if not exists arxiv_id text,
  add column if not exists accessed_at date,       -- data de acesso (sites)
  add column if not exists citation_key text,
  add column if not exists csl jsonb not null default '{}'::jsonb,
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists notes text,
  -- arquivo anexado no bucket `reference-files` (path relativo ao bucket)
  add column if not exists file_path text,
  add column if not exists file_name text,
  add column if not exists file_size bigint,
  add column if not exists file_mime text,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_project_references_updated_at on public.project_references;
create trigger set_project_references_updated_at
  before update on public.project_references
  for each row execute function public.set_updated_at();

-- Deduplicação: o mesmo DOI não entra duas vezes no mesmo projeto.
create unique index if not exists project_references_doi_uniq
  on public.project_references (project_id, lower(doi))
  where doi is not null and doi <> '';

-- A chave de citação precisa ser única dentro do projeto para o "@" resolver
-- sem ambiguidade.
create unique index if not exists project_references_citation_key_uniq
  on public.project_references (project_id, citation_key)
  where citation_key is not null;

create index if not exists project_references_project_created_idx
  on public.project_references (project_id, created_at desc);

-- ── 2. Bucket dos arquivos (PDFs) ───────────────────────────────────────────
-- Privado: artigos costumam ser material com direitos autorais e o projeto pode
-- ser confidencial. O acesso sai por URL assinada de curta duração, emitida no
-- servidor só depois de checar o vínculo do usuário com o projeto.
-- Caminho: reference-files/<project_id>/<uuid>.<ext>

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'reference-files',
  'reference-files',
  false,
  52428800, -- 50 MB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/rtf',
    'application/epub+zip',
    'text/plain',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Extrai o project_id do primeiro segmento do path. Devolve null (em vez de
-- estourar) se o path não começar por um uuid — assim uma policy nunca quebra
-- por causa de um objeto com nome inesperado.
create or replace function public.storage_path_project_id(p_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return split_part(p_name, '/', 1)::uuid;
exception when others then
  return null;
end;
$$;

drop policy if exists "reference-files: membros leem" on storage.objects;
create policy "reference-files: membros leem"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'reference-files'
    and public.is_project_member(public.storage_path_project_id(name))
  );

drop policy if exists "reference-files: owner/editor enviam" on storage.objects;
create policy "reference-files: owner/editor enviam"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'reference-files'
    and public.is_project_editor(public.storage_path_project_id(name))
  );

drop policy if exists "reference-files: owner/editor atualizam" on storage.objects;
create policy "reference-files: owner/editor atualizam"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'reference-files'
    and public.is_project_editor(public.storage_path_project_id(name))
  );

drop policy if exists "reference-files: owner/editor removem" on storage.objects;
create policy "reference-files: owner/editor removem"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'reference-files'
    and public.is_project_editor(public.storage_path_project_id(name))
  );
