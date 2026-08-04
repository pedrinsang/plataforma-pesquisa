-- Campos bibliográficos que a ABNT NBR 6023:2018 exige e que a tabela não
-- guardava. Sem eles a referência sai incompleta por construção — não é
-- questão de formatação, é dado que não existe.
--
--  * `place` é **elemento essencial** em livro, tese, evento e site
--    ("Local: Editora, ano"). Era o buraco mais grave: toda referência de livro
--    saía sem cidade.
--  * `degree`/`program`/`institution` compõem o modelo de trabalho acadêmico:
--    "2006. Tese (Doutorado em Economia) – Faculdade de …, Fortaleza, 2006".
--    O *tipo* do trabalho (tese/dissertação/TCC) não é coluna: sai do grau.
--  * `issued_month` guarda o mês ou o período do fascículo ("jul./dez."), que
--    fecha a referência de artigo de periódico.
--  * `year_text` existe porque na 6023 o ano é obrigatório mesmo quando
--    desconhecido: entra uma aproximação entre colchetes ("[2010?]",
--    "[ca. 2005]", "[200-]"). É texto livre justamente porque a norma prevê
--    sete formas diferentes, e inventar um enum para elas só empurraria o
--    problema para o formulário.
--  * `event_number` é a numeração do evento ("6.", em "CONGRESSO …, 6., 2003").
--
-- Nenhuma coluna é NOT NULL: as referências que já estão no banco continuam
-- válidas, e o formatador omite o que estiver vazio.

alter table public.project_references
  add column if not exists place text,
  add column if not exists institution text,
  add column if not exists degree text,
  add column if not exists program text,
  add column if not exists issued_month text,
  add column if not exists year_text text,
  add column if not exists event_number text;

comment on column public.project_references.place is
  'Local de publicação (cidade). Elemento essencial da ABNT NBR 6023:2018.';
comment on column public.project_references.year_text is
  'Ano aproximado entre colchetes quando não há ano certo: [2010?], [ca. 2005], [200-].';
comment on column public.project_references.degree is
  'Grau do trabalho acadêmico: Doutorado, Mestrado, Especialização, Graduação.';
