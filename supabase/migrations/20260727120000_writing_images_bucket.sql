-- Bucket de imagens da Escrita.
--
-- O editor de texto passa a permitir inserir imagens (upload). Guardamos os
-- arquivos no Storage do Supabase, não como base64 no JSON do documento (que
-- incharia a linha em `documents.content_json`). Caminho por projeto:
--   writing-images/<project_id>/<uuid>.<ext>
--
-- Leitura pública (imagens embutidas em documentos abrem por URL direta);
-- escrita apenas para usuários autenticados. O vínculo fino por papel de
-- projeto fica na aplicação — o path carrega o project_id para auditoria.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'writing-images',
  'writing-images',
  true,
  10485760, -- 10 MB
  array['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Leitura pública dos objetos do bucket.
drop policy if exists "writing-images: leitura publica" on storage.objects;
create policy "writing-images: leitura publica"
  on storage.objects for select
  using (bucket_id = 'writing-images');

-- Upload apenas por usuários autenticados.
drop policy if exists "writing-images: upload autenticado" on storage.objects;
create policy "writing-images: upload autenticado"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'writing-images');

-- Autor pode substituir/remover o próprio arquivo.
drop policy if exists "writing-images: dono atualiza" on storage.objects;
create policy "writing-images: dono atualiza"
  on storage.objects for update to authenticated
  using (bucket_id = 'writing-images' and owner = auth.uid());

drop policy if exists "writing-images: dono remove" on storage.objects;
create policy "writing-images: dono remove"
  on storage.objects for delete to authenticated
  using (bucket_id = 'writing-images' and owner = auth.uid());
