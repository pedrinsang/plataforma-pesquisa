-- Configuração de página por documento: margens e entrelinha.
--
-- Até aqui a folha era A4 com 2,5 cm nos quatro lados, fixo no código. Nenhum
-- trabalho escrito no Folium saía conforme a ABNT NBR 14724:2024, que pede
-- margens **assimétricas** — 3 cm em cima e à esquerda, 2 cm embaixo e à
-- direita — e entrelinha 1,5 no corpo do texto. E norma não é a única razão:
-- cada revista científica publica o seu próprio gabarito.
--
-- Em centímetros (numeric), não em px: é a unidade em que um edital escreve a
-- regra e a que o usuário digita. A conversão para pixel de tela é da
-- `pageGeometry` (96 dpi, as mesmas medidas do Word).
--
-- Os padrões repetem o que já estava no código, então documento antigo não
-- muda de aparência ao abrir depois desta migration.
--
-- Sem RLS nova: são colunas de `documents`, que já tem as políticas de membro
-- lê / owner-editor escreve.

-- `line_height` é **nulo** por padrão, e nulo quer dizer "a entrelinha que o
-- editor sempre usou". Um número aqui mudaria a altura de cada parágrafo de
-- todo documento já escrito — e, como a paginação é medida, mudaria também
-- onde cada página vira. Só quem escolher uma entrelinha grava um valor.
alter table public.documents
  add column if not exists margin_top numeric(4, 2) not null default 2.5,
  add column if not exists margin_right numeric(4, 2) not null default 2.5,
  add column if not exists margin_bottom numeric(4, 2) not null default 2.5,
  add column if not exists margin_left numeric(4, 2) not null default 2.5,
  add column if not exists line_height numeric(3, 2);

-- Margem negativa ou maior que a folha quebraria a medição da paginação (a
-- área de texto ficaria com altura negativa e o planejador não convergiria).
alter table public.documents
  drop constraint if exists documents_margins_sane;
alter table public.documents
  add constraint documents_margins_sane check (
    margin_top >= 0 and margin_bottom >= 0 and margin_left >= 0 and margin_right >= 0
    and margin_top + margin_bottom < 29.7
    and margin_left + margin_right < 21
  );

alter table public.documents
  drop constraint if exists documents_line_height_sane;
alter table public.documents
  add constraint documents_line_height_sane check (
    line_height is null or (line_height >= 0.5 and line_height <= 3)
  );

comment on column public.documents.margin_top is
  'Margem superior em cm. ABNT NBR 14724:2024 pede 3 cm (anverso).';
comment on column public.documents.line_height is
  'Entrelinha do corpo. Nulo = padrão do editor. ABNT NBR 14724:2024 pede 1,5.';
