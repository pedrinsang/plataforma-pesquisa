-- Cabeçalho e rodapé por documento (estilo processador de texto). Texto simples,
-- repetido em cada página na Escrita; aceita os tokens {n} (número da página) e
-- {total} (total de páginas), resolvidos na renderização.
--
-- Sem RLS nova: herda as políticas de `documents` (membro lê; owner/editor
-- escreve), pois são apenas colunas na tabela existente.

alter table public.documents
  add column if not exists header_text text,
  add column if not exists footer_text text;
