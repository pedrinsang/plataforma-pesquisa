-- Controle de linhas viúvas e órfãs, por documento.
--
-- A paginação exigia duas linhas do mesmo parágrafo de cada lado da virada,
-- sempre, sem opção. A consequência aparece na tela e foi relatada como defeito:
-- um parágrafo de **três linhas ou menos não tem corte possível** com esse
-- mínimo (qualquer corte deixaria uma linha sozinha de um dos lados), então ele
-- só pode descer inteiro — e o texto salta três linhas de uma vez em vez de
-- andar uma. O mesmo vale para um título com "manter com o próximo", que desce
-- levando as duas primeiras linhas do bloco que ele abre.
--
-- Isso é o que um processador de texto faz com o controle **ligado**, e é o que
-- uma banca espera de um trabalho em norma. Mas é rigor tipográfico, não regra
-- de correção, e no Folium ele estava imposto. Agora é escolha do documento, na
-- faixa Layout.
--
-- O padrão é **falso** — quebra suave, linha a linha. É o comportamento que não
-- surpreende quem está escrevendo; quem precisa do rigor liga, e a predefinição
-- ABNT já liga junto com as margens e a entrelinha.
--
-- Sem RLS nova: é coluna de `documents`, que já tem as políticas de
-- membro lê / owner-editor escreve.

alter table public.documents
  add column if not exists widow_control boolean not null default false;

comment on column public.documents.widow_control is
  'Exige 2 linhas do mesmo parágrafo de cada lado da quebra de página. '
  'Falso = quebra linha a linha (padrão). A predefinição ABNT liga.';
