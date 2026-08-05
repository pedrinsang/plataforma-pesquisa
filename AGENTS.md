<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Contexto do projeto

**Folium** — plataforma de gestão de projetos de pesquisa científica (uso
individual e em equipe). Gratuita nesta fase — sem cobrança, mas com conceito de
papéis/membros já pronto para monetizar depois. Prioridades do produto:
**segurança**, **praticidade** e **design** (o visual é tão importante quanto a
função). O nome oficial da marca é **Folium** (latim para "folha/página" — a
folha do caderno de pesquisa, no espírito editorial do produto).

## Stack e arquitetura

- **Next.js 16** (App Router, Turbopack) + **TypeScript** + **Tailwind v4**.
- **Supabase** (Postgres + Auth + RLS) — **não** usar Prisma nem auth própria.
  A autorização vive no banco via Row Level Security.
- Mutações sensíveis passam por **RPCs `SECURITY DEFINER`** no Postgres
  (padrão `create_project`, `invite_project_member`, etc.), não por lógica
  de aplicação confiando no cliente.
- Papéis por projeto em `project_members`: `owner` / `editor` / `viewer`.
  Helpers: `is_project_member()`, `is_project_editor()`, `is_project_owner()`.
- Tipos do banco escritos à mão em `lib/types/database.ts` — manter em sincronia
  com as migrations a cada mudança de schema.
- Migrations em `supabase/migrations/`; aplicadas no Supabase remoto com
  `npx supabase db push` (ver `SETUP.md`).

## Design (identidade visual) — sistema "Folium"

Linguagem **editorial, tipo livro**, derivada do design system "Classical"
(Claude Design). Referência oficial — toda tela nova segue este padrão.

- **Princípios**: superfícies de papel quase-branco, régua fina (hairline) como
  estrutura, cor aplicada como **traço** (bordas, sublinhados, contornos), nunca
  como preenchimento chapado. Cards e botões são **contornados**, não preenchidos.
  Elevação é um sussurro (`--elev-sm/md/lg`), leading generoso (densidade 1.15×).
- **Cor**: acento único **petróleo `#146b74`** (`--color-accent`, rampa
  `--color-accent-100…900`) sobre chão quente (`--color-bg`, `--color-surface`).
  Neutros quentes; sinais `--color-pos`/`--color-neg`. Modo claro **e** escuro
  (variante escura no `.dark`). Nunca hardcodar cores — usar os tokens
  (`text-accent-teal`/`text-accent`, `bg-surface`, `border-border-subtle`,
  `text-text-dim`, `.tag-outline`, etc.).
- **Fontes**: **Cormorant Garamond** (serifada de display, títulos —
  `font-serif`/`--font-heading`), **Lora** (serifada, corpo —
  `--font-body`), **Caveat** (caligrafia, só notas de margem na landing —
  `.hand`/`font-hand`). Bold é evitado: títulos de interface no máximo semibold;
  números tabulares (`tabular-nums`) onde forem figuras.
- **Conceito "manuscrito × instrumento"** (dentro do projeto): Escrita usa papel
  pautado (`.ruled-paper`, acento dourado herdado `--color-accent-gold`);
  Estatística usa painel escuro com grade técnica (`.panel-ink`, `.grid-teal`,
  petróleo). A landing dramatiza essa passagem "papel → produto".
- **Componentes**: classes em `app/globals.css` — `.btn`(`.btn-primary/-secondary/
  -ghost/-danger`), `.tag`(`.tag-accent/-neutral/-outline`), `.card`,
  `.input`/`.field`, `.seg`, `.navlink`, `.ib`, `.mcard`. Os wrappers em
  `components/ui/*` (Button, Card, Input) usam essas classes. Estrutura de app:
  **sidebar** (`components/layout/Sidebar`) + **topbar** (`Topbar`); páginas de
  projeto usam `ProjectTabs`. Ícones: **Lucide**.
- **Marca**: `AppMark` = agulha de bússola inscrita num círculo; wordmark
  "Folium" em Cormorant.
- **Ilhas de tema**: `.paper-light` força os tokens claros (papel sobre fundo
  escuro) e `.folium-shell` faz o inverso — força os tokens do `.dark` no editor
  de Escrita em tela cheia, que é "instrumento" e fica escuro nos dois temas,
  com a folha branca no centro. Dentro do shell a UI usa **IBM Plex Sans/Mono**
  (`--font-plex-sans`/`--font-plex-mono`); fora dele, Cormorant + Lora.
- Animações (reveals de scroll na landing) respeitam `prefers-reduced-motion`
  com estado estático equivalente. Ao mexer em UI, conferir claro **e** escuro.

## Estado (atualizado em jul/2026)

Feito: auth, CRUD de projetos, **editor de Escrita nível processador de texto**
(TipTap 3 + StarterKit; fonte/tamanho, cor/destaque, sub/sobrescrito, alinhamento,
listas, recuo e espaçamento entre linhas, títulos 1–4/citação, link, imagem via
Storage, tabela, quebra de página; toolbar agrupada sticky + menu "Mais";
autosave/contador preservados) e **estatística embutida na Escrita** (node
`statChart` que renderiza uma planilha da aba Estatística ao vivo pelo `statId`,
inserida por painel lateral estilo Canva — `components/writing/*`,
`lib/writing/extensions/*`),
planilha de dados (react-data-grid), dark/light, **segurança reforçada**
(RLS por papel, rate limit de login, `audit_log`), **convites de participantes
funcionando de ponta a ponta** (por e-mail com link ou por código aleatório;
exclusão de participante restrita ao dono), **redesign visual completo — sistema "Folium"**
(editorial/petróleo, Cormorant + Lora, claro/escuro), **timeline/marcos**
(linha do tempo com CRUD e reordenação), **amostras/coleta** (CRUD em
`statistics/samples`, alimenta o card e o gráfico semanal da visão geral) e
**recursos "estilo Word" no editor**: folha direto na página (sem a moldura
cinza — rola com a página), **localizar e substituir** (Ctrl+F/Ctrl+H, extensão
`search-replace` com decorações), **sumário/navegação** (`OutlinePanel`, rola até
o título), **régua horizontal** com recuos arrastáveis (`WritingRuler` +
extensão `paragraph-indent`, esquerda/direita/primeira linha em px) e
**cabeçalho/rodapé por página** (`HeaderFooterControl`, tokens `{n}`/`{total}`,
render no overlay do `WritingCanvas`). O editor de um documento agora é uma
**tela cheia** (design "Escrita — Editor em tela cheia", Claude Design):
`.folium-shell` (`fixed inset-0`) com três linhas de chrome — barra do documento
(46 px), abas da faixa (34 px: Início · Inserir · Layout · Revisão · Referências)
e faixa agrupada (78 px, grupos com rótulo em versalete) —, faixa da régua
(24 px, fora da rolagem), folha centralizada, **dois trilhos de painéis** (44 px
cada) e barra de status (28 px: página atual, contagens, meta e zoom). Os seis
instrumentos ficavam num trilho só, à direita, e os rótulos verticais não cabiam
na altura de um notebook — a lista era cortada. Agora à **direita** ficam os
instrumentos que vêm de fora do texto (Estatísticas · Referências · Artigos) e à
**esquerda** a navegação do próprio texto (Sumário · Notas · Versões); cada
trilho tem seu painel, então dá para ler o sumário e a biblioteca ao mesmo tempo.
Notas e Versões continuam apagados "em breve". Arquivos: `DocumentTopBar`,
`RibbonTabs`, `ribbon/*`, `SideRail`, `ReferencesPanel`, `ArticleReader`,
`WritingStatusBar`, `WritingCanvas`, `WritingRuler` (`RulerBand`), `ui.tsx`.
A folha deixou de ser contínua: agora é uma **pilha de páginas A4 separadas**
com vão real entre elas e **paginação por medição** (`extensions/pagination.ts`
+ `planPages` no `WritingCanvas`), e a quebra de página explícita consome o
resto da folha de verdade. A paginação é **por linha, não por bloco**: um
parágrafo longo é **repartido entre duas folhas** como num processador de texto,
com controle de viúvas e órfãs (`MIN_LINES = 2`) contado **por parágrafo** — numa
lista, cada item conta por si, e o item que não consegue deixar duas linhas dos
dois lados desce inteiro. Títulos têm **"manter com o próximo"**
(`KEEP_WITH_NEXT`): um título não termina a folha sozinho, desce junto com o
bloco que ele abre. O rodapé não tem mais numeração automática — quem quer número
de página escreve `{n}`/`{total}` no rodapé (`HeaderFooterControl`).

Feito também: **biblioteca de referências** (aba própria `references` do projeto:
qualquer tipo de fonte, PDF anexado em bucket privado, metadados importados de
APIs públicas e gratuitas — Crossref/PubMed/arXiv/OpenLibrary/meta tags, **sem
IA** — e formatação ABNT/APA/Vancouver em `lib/references/format.ts`).

Feito também: **citar selecionando o trecho do artigo**. O PDF anexado deixou de
ser um `<iframe>` e passou a ser desenhado por nós com **pdf.js**
(`components/writing/PdfArticleView.tsx`, `lib/writing/pdf.ts`): o visualizador
do navegador roda fora do nosso documento, então `getSelection()` não enxergava
nada — sem renderizar o PDF não existe "selecionar e citar". Marcando um trecho
aparece uma bolha (`CiteBubble`, no `ArticleReader`) com "Citar com o trecho" e
"Só a chamada"; a página sai do `data-page` da folha onde a seleção começa e
vira o `p. N`. `lib/writing/quote.ts` limpa o texto do PDF (junta a palavra que
o PDF hifenizou na quebra, desfaz as quebras de linha) e monta a citação **na
forma que a norma pede para aquele tamanho**: curta entre aspas no meio do
parágrafo; longa em parágrafo próprio, recuado (4 cm na ABNT, 1,27 cm em
APA/Vancouver), entrelinha simples e — na ABNT — corpo 10 pt. O corte é por
caracteres na ABNT (que conta linhas) e por palavras na APA (que conta 40).
A citação agora é um **nó vinculado** (`lib/writing/extensions/citation.tsx`):
guarda `referenceId`/`citation_key`/página, não o texto — a forma é recalculada
a partir da referência, então corrigir o ano na aba Referências conserta todas
as chamadas no texto, e trocar a norma no painel reescreve o documento inteiro
(`setCitationStyle`). O `label` fica gravado como retrato da última forma
conhecida (é o que sai no HTML exportado e o que sobra se a linha sumir da
biblioteca — nesse caso o nó fica dourado, "referência removida").
Os assets de runtime do pdf.js (worker, CMaps, fontes-padrão, wasm, ICC) **não
vão para o git**: `scripts/sync-pdfjs-assets.mjs` copia de `node_modules` para
`public/pdfjs/` no `predev`/`prebuild`. Esse caminho está fora do matcher do
`proxy.ts` — são arquivos de biblioteca, e dentro do matcher cada CMap custaria
um `getUser()` no Supabase. O route handler do arquivo ganhou `?raw=1`, que
devolve os **bytes** pela nossa origem: o pdf.js precisa ler por fetch, e assim
não dependemos do CORS do Storage nem entregamos a URL assinada ao cliente.
Link/DOI externo continua em `<iframe>` — é outra origem, a seleção não é
legível, e o rodapé do leitor diz isso em vez de deixar o usuário tentando.

Feito também: **tabela de revista**. A tabela do TipTap entrava no texto como um
card — moldura em volta, cabeçalho com fundo petróleo, grade fechada —, que é o
oposto do que um periódico aceita. Agora o padrão é o das ciências (o "booktabs"
do LaTeX): **três réguas horizontais** (topo, sob o cabeçalho, base), **nenhuma
vertical**, nenhum preenchimento, corpo de 10 pt e números em `tabular-nums`.
O desenho é atributo do nó `table` (`lib/writing/extensions/table.ts` +
`lib/writing/table-style.ts`), não classe solta: preset de réguas (científica ·
linhas horizontais · quadro fechado da ABNT · aberta), faixa alternada,
densidade, corpo em pontos, largura (coluna do texto ou ajustada ao conteúdo) e
alinhamento na página. Como o documento é gravado em **JSON**, tudo isso
sobrevive à releitura; o `renderHTML`/`parseHTML` em `data-*` faz o mesmo para
copiar e colar.
A **legenda é da tabela**, não um parágrafo solto acima dela: `caption` e
`source` são atributos, desenhados pela `FoliumTableView` como `<caption>` e uma
linha de fonte, e o número ("Tabela 3") sai de um **contador de CSS** — entra
sozinho e se refaz quando outra tabela nasce antes. `null` nesses atributos
significa "esta tabela não tem legenda" (o elemento nem existe) e `""` significa
"tem, e está em branco" — é o que evita reservar uma linha vazia em toda tabela
e ainda assim mostrar a dica de preenchimento. Os dois campos são editáveis
**direto na folha**, embora fiquem fora do `contentDOM`: `ignoreMutation` faz o
ProseMirror ignorar o que o navegador escreve ali e `stopEvent` impede que ele
trate as teclas como do documento; o texto volta por `setNodeMarkup` (logo, entra
no histórico e no autosave). A visão precisa achar a própria posição por
`posAtDOM` porque o `columnResizing` do prosemirror-tables constrói a `View` com
três argumentos — **sem** `getPos` e sem os `HTMLAttributes` do `renderHTML`, e é
por isso que quem escreve os `data-*` no DOM é a classe, não o schema.
A **estatística embutida** (`statChart`) seguiu junto: era um card (moldura
arredondada, `figcaption` em versalete com o nome da planilha) e agora é a
**mesma figura** — as classes `.folium-table-figure`/`.folium-table`, os mesmos
presets e a mesma legenda numerada, entrando na mesma contagem de "Tabela N" que
as tabelas escritas à mão. A legenda em branco herda o nome da planilha (é o que
o bloco já mostrava), e escrever por cima substitui; as colunas de `number`/
`integer` alinham à direita sozinhas. O chrome do vínculo (largura P/M/G,
estilo, atualizar, remover, "vinculada · N linhas") virou uma barra flutuante que
só aparece no hover — é **absoluta**, então não ocupa espaço nem mexe na
paginação, e some na impressão. Como o bloco inteiro é alça de arraste
(`data-drag-handle`), os campos de legenda param o `mousedown`: sem isso, clicar
na legenda arrastaria a figura em vez de pôr o cursor no texto.

Uma segunda armadilha, esta na rolagem: `focusEnd` do `WritingCanvas` ("clicar no
papel fora do texto põe o cursor no fim", como no Word) escuta o `mousedown` da
pilha de folhas — e **portais do React sobem pela árvore de componentes, não pelo
DOM**. A paleta de estilo da estatística embutida é um portal aberto de dentro do
editor, que está dentro da pilha: clicar num item do menu caía no `focusEnd`, o
alvo não estava no fluxo do texto e o cursor ia para o fim do documento, levando
a rolagem junto. Por isso o `focusEnd` exige que o alvo esteja **de fato dentro
da pilha** (`stackRef.contains`) antes de qualquer coisa. Vale para qualquer menu
novo que nasça dentro da folha.

Uma armadilha custou a primeira versão inteira: o `prose` do Tailwind desenha um
filete embaixo de **cada linha** (`tbody tr`, e não nas células). Com ele de pé,
toda tabela nascia com régua em cada linha — o preset científico saía idêntico ao
de linhas horizontais e **trocar de preset parecia não fazer nada**. Por isso
`.folium-editor .folium-table tr` zera a borda: dentro da figura, quem manda nas
réguas é o preset, e nada mais. Ao mexer nas tabelas, testar sempre com as
classes reais do editor (`folium-editor prose prose-zinc prose-lg …`), senão o
`prose` fica invisível no teste e aparece no app.

Os comandos ficam numa **aba contextual "Tabela"** (dourada, ao lado das abas
fixas — só existe com o cursor dentro de uma tabela; `CONTEXTUAL_TABS` em
`RibbonTabs`, conteúdo em `ribbon/TableTools.tsx`), e "Inserir ▸ Tabela" virou a
grade de escolher o tamanho (`ribbon/TableInsertMenu.tsx`), que já abre a legenda
em branco. O alinhamento é **por coluna** (`setTableColumnAlign` percorre a
coluna pelo `TableMap`): ninguém alinha 40 células à mão para pôr os números à
direita. Duas regras do CSS não devem ser desfeitas: a régua do cabeçalho sai de
`tr:not(:has(> td))` — "linha em que *todas* as células são `th`" —, senão uma
coluna-título desenharia régua embaixo de cada linha; e o parágrafo dentro da
célula tem margem zero, porque as margens do corpo do texto viravam um vão
enorme dentro de uma caixa de 10 pt.

Feito também: **bibliografia gerada** no documento. O botão "Bibliografia" da
faixa Referências abre um painel com dois escopos — **obras citadas no texto**
(lidas dos nós de citação, na ordem em que aparecem) ou **a biblioteca inteira do
projeto** — e escreve a lista no fim do documento
(`lib/writing/bibliography.ts` monta, `extensions/bibliography.ts` é o nó). A
lista é **gerada, não viva**: por fora é um nó só (`bibliography`), para o botão
poder reescrevê-la **no lugar** em vez de empilhar uma cópia a cada clique; por
dentro são parágrafos comuns, editáveis à mão e — o ponto que decidiu o desenho —
repartíveis pela paginação (`bibliography` entrou em `SPLITTABLE` no
`WritingCanvas`). Um nó atômico com o texto calculado atravessaria a virada, e
uma lista de referências passa de uma folha com facilidade. A forma de cada
entrada sai da norma e vira atributo do parágrafo: ABNT alinhada à esquerda com
entrelinha simples e branco entre entradas; APA com recuo deslocado de 1,27 cm e
entrelinha dupla; Vancouver simples, na ordem de citação e **sem número** (a
chamada no texto ainda é autor-data — numerar aqui criaria um número que não
corresponde a nada). Trocar a norma no painel Referências reescreve as citações
**e** refaz a lista, senão o documento ficaria com a chamada em APA e a entrada
em ABNT. O título ("REFERÊNCIAS") entra como título de primeiro nível **fora** do
nó: assim vale o "manter com o próximo" (`KEEP_WITH_NEXT`), ele aparece no
sumário e quem quiser pode reescrevê-lo sem perder o vínculo da lista.

Feito também: **conformidade real com as normas**. O texto das NBR é vendido pela
ABNT, então as regras foram levantadas dos manuais de normalização que as
bibliotecas universitárias publicam de graça (UFV 2025, UFC 2020) — que é também
o que a banca de fato cobra, já que cada instituição escreve o seu por cima da
norma. O levantamento está em `docs/normas-abnt.md`, com a fonte de cada regra.
Edições vigentes: **6023:2018** (referências), **10520:2023** (citações),
**14724:2024** (apresentação). Três achados mudaram código: a 10520 **acabou com
a caixa alta** na chamada em 2023 (`(Silva, 2019)`, não `(SILVA, 2019)`) — a
caixa alta continua na lista, que é da 6023 e não foi revisada; a 14724 pede
margens **assimétricas** (3 cm em cima e à esquerda, 2 cm embaixo e à direita) e
entrelinha 1,5, e a folha era 2,5 cm fixo nos quatro lados; e a 6023 exige
**destaque tipográfico** num elemento por tipo de documento — o título no livro,
o **periódico** no artigo. Por causa do destaque, `formatReference` deixou de ser
a função principal: quem manda é `formatReferenceSpans`, que devolve trechos
marcados (`RefSpan[]`) e vira negrito/itálico de verdade na lista; a versão em
texto puro continua para prévia e busca. O corte entre citação curta e longa
deixou de ser o chute de "3 × 90 caracteres" e passa por `lib/writing/line-metrics.ts`,
que mede as linhas no canvas com a fonte real da folha lida do `.folium-editor`.
As margens deixaram de ser constante: `pageGeometry(margins)` é a fonte única
para a medição da paginação **e** para o desenho — se as duas divergirem, o papel
sai diferente da tela —, e a UI é o botão "Margens" da faixa Layout
(`PageSetupControl`), com predefinição ABNT. A entrelinha é uma variável CSS
(`--folium-line-height`) posta no shell, e é **nula por padrão** de propósito:
gravar um número mudaria a altura de cada parágrafo de todo documento já escrito
e, como a paginação é medida, mudaria onde cada página vira. Os modelos de
referência têm teste contra os exemplos **literais** do guia da UFC
(`npm test` → `scripts/test-references.mjs`, no test runner do Node, sem
framework novo): divergiu um caractere, quebrou.

Falta (do brief): feed de atividade (pode vir do `audit_log`), status do
projeto, cadastro de referência de dentro do editor ("Nova", na faixa
Referências, segue desabilitado), vínculo de
referência a casos/achados, histórico de versões do texto, bloco de
ideias/kanban, **gráficos** (nenhuma lib instalada — o node `statChart` já prevê
`statType: 'chart'` para quando existir), importação CSV/Excel, **campos
customizáveis** das amostras e **achados**.

Notas: o editor já tem link e imagem — quando o conteúdo for renderizado fora do
TipTap (export/print), avaliar sanitização XSS do HTML. Upload de imagem usa o
bucket `writing-images` (migration `20260727120000`; rodar `npx supabase db push`).
Cabeçalho/rodapé precisam da migration `20260728120000_document_header_footer`
(colunas `header_text`/`footer_text` em `documents`) — **rodar `npx supabase db
push`**; até lá a busca é tolerante (campos vazios, editor não quebra).
Duas migrations novas da conformidade ABNT também esperam `npx supabase db push`:
`20260806120000_reference_abnt_fields` (colunas `place`, `institution`, `degree`,
`program`, `issued_month`, `year_text`, `event_number` em `project_references`) e
`20260806130000_document_page_setup` (margens e `line_height` em `documents`). A
segunda é tolerante como a do cabeçalho; a **primeira não** — o `select` da aba
Referências lista as colunas por nome e falha enquanto elas não existirem.
A paginação é **medida no cliente** (não é do ProseMirror): `WritingCanvas` lê a
geometria e manda espaçadores para a extensão `foliumPagination`, que os desenha
como widget decorations. São **dois tipos** de espaçador (`PageSpacer.inline`):
um `div` entre blocos, que desce o bloco inteiro, e um `span` da largura da
coluna **dentro** do parágrafo (`.folium-line-spacer`), que reparte o parágrafo
sem que ele deixe de ser um único nó do documento. Por isso a medição desce ao
nível da linha: `readLines` monta as caixas de linha com `Range.getClientRects()`
e ancora a virada com `view.posAtCoords`. Duas regras vieram das listas e não
devem ser desfeitas. Primeira: os retângulos saem de um `Range` sobre **cada nó
de texto** (`textLineRects`), nunca de um `Range` sobre o bloco inteiro — um
Range que atravessa elementos devolve também a caixa de cada bloco de dentro (o
`<li>`, o `<p>` da citação), e como as faixas são agrupadas pelo ponto médio essa
caixa engolia todas as linhas do item numa faixa só: a lista virava uma fila de
"linhas" do tamanho de um item e nunca partia por dentro. Segunda: quando a
virada cai na **primeira linha de um parágrafo interno**, o vão vai para o *fim
do parágrafo anterior* (`resolveAnchor`), e não para o começo do que desce —
senão o `<li>` fica na folha de cima com o marcador ("•", o número) e o texto vai
sozinho para a de baixo. A posição no doc é resolvida **só na linha que vira
quebra**: `posAtCoords` custa ~1 ms e um documento de 45 páginas tem mais de mil
linhas — resolver todas travava a digitação por segundos (era ~2 s por tecla;
hoje ~20 ms). Por isso a identidade do parágrafo, usada em toda linha para viúva
e órfã, vem do DOM (`TEXTBLOCK_SELECTOR` + `closest`), que é de graça.
Três coisas seguram o resto de pé e também não
devem ser desfeitas: `.folium-editor` é `display:flex; flex-direction:column`
(em contexto flex as margens **não colapsam**, senão inserir/remover espaçador
muda o espaço entre parágrafos e a medição oscila); o agendamento usa
`setTimeout`, não `requestAnimationFrame` (rAF não roda em aba oculta); e os
retângulos de linha vêm **com o zoom aplicado**, então todo delta é dividido por
`zoom` antes de virar coordenada natural (os `offsetTop`/`offsetHeight` dos
blocos, não — transform não os afeta). As linhas são agrupadas em faixas pelo
**ponto médio** do retângulo, não por sobreposição: com entrelinha apertada
(Cormorant nos títulos) as caixas de linhas vizinhas se sobrepõem, e agrupar por
sobreposição fundiria o bloco inteiro numa faixa só — sem ponto de virada, sem
quebra. Título e bloco de código só partem quando são mais altos que a folha
(`SPLITTABLE_IF_TALL`); tabela/imagem/gráfico não partem e, se forem mais altos
que uma folha, ainda atravessam a virada — o `.folium-seam` mascara o vão.
A medição **desconta os dois tipos de espaçador em qualquer lugar do DOM**
(`SPACER_SELECTOR`), e não só o de linha dentro do bloco: um vão que não é
descontado faz todo bloco abaixo ser lido baixo demais, e o plano seguinte
reserva vãos que não chegam à folha de baixo. Pelo mesmo motivo o remapeamento
de posições no `apply` da extensão **preserva o `inline`** — sem ele um vão de
linha vira `div` de bloco dentro do parágrafo depois de qualquer edição. As
faixas de espaçador são reconhecidas por **sobreposição**, não por retângulo
idêntico (o navegador pode devolver a caixa com altura de linha, e o ProseMirror
insere separadores invisíveis ao lado de um widget). Por fim, `paginate` compara
com o estado **do plugin** (não com uma cópia local) e guarda a assinatura dos
planos já tentados desde a última mudança de conteúdo: repetir uma assinatura é
ciclo (aplicar A leva a medir B, e B de volta a A) e a paginação congela no
desenho atual em vez de piscar — era esse ciclo que também disparava o
"Maximum update depth exceeded" do React, uma volta por `setState`.
A tipografia da folha é medida em **unidades de papel**
(`lib/writing/typography.ts`): a folha é A4 a 96 dpi, as mesmas medidas do Word,
então o tamanho de fonte é gravado em `pt` (`setFontSize("12pt")`) e o corpo
padrão de `.folium-editor` é **12 pt** — o "12" que os editais pedem, e não o
1,125rem do `prose-lg`. Enquanto isso era px, "12" na faixa saía a 12 px (9 pt) e
a contagem de páginas não batia com a do Word. Documentos antigos guardaram px;
`fontSizeToPt` converte na leitura, então a caixa da faixa mostra o corpo real.
Espaçamento de parágrafo e recuo de citação já vinham em pt/cm.
A fonte padrão da folha é **Arial 12** (`SHEET_FONT_FAMILY`), títulos inclusive —
é o que os editais e a 14724 pedem, e trocar a fonte padrão num processador de
texto vale para o documento inteiro (por isso o `prose-headings:font-serif` saiu
do editor e `.folium-editor h1…h6` herda a família; a Cormorant continua na
lista de fontes). O padrão vive no **CSS**, não como atributo em cada parágrafo:
texto sem `fontFamily`/`fontSize` gravado acompanha o padrão se ele mudar, e
documentos antigos não precisam ser reescritos. Os títulos ganharam escala de
processador de texto (16/14/13/12 pt, `HEADING_PT`) — o `prose` os dava em `em`
(32 pt no h1), que é desenho de página web e não de folha A4. Os valores em pt
do `globals.css` e o `HEADING_PT` são **espelhos**: divergir faz a leitura no
cursor mentir. Essa leitura é o outro lado da mudança
(`lib/writing/cursor-format.ts`): a faixa e a barra de status mostram o que está
valendo **no cursor** — família e corpo resolvidos (o explícito quando existe,
senão o padrão daquele bloco), estilo do bloco, alinhamento, entrelinha e
espaçamento (`CursorFormatReadout`, na barra de status, visível em qualquer aba
da faixa). Antes a caixa da faixa caía num literal: dizia "Lora 12" dentro de um
título, que é outra fonte e outro corpo.
No editor em tela cheia, "Baixar PDF" e
"Imprimir" são o mesmo `window.print()`, e o papel sai **igual à tela**: no
`beforeprint` o `WritingCanvas` monta a **via de impressão** (`.folium-print`) —
uma folha A4 por página, cada uma recortando (`overflow:hidden`) um clone da
pilha deslocado pelo topo daquela folha —, e o `afterprint` esvazia. Ou seja, a
paginação impressa é a **mesma medida na tela**, com cabeçalho e rodapé no lugar; o motor de impressão não reparte nada (`@page margin: 0`, as margens
vêm desenhadas dentro do clone). O `@media print` esconde o resto com `:has()`:
o que não é o shell nem ancestral dele (sidebar, topbar, abas do projeto) e, dentro
do shell, tudo que não é `.folium-print` nem ancestral dele (chrome, régua, trilho,
painéis, a pilha da tela com zoom/sombra/vão). Por isso **não se deve mexer nas
alturas do clone** (inclusive espaçadores) no CSS de impressão — só no que é
puramente visual (sombra da folha, vão, selo da quebra).

O editor já **enxerga a biblioteca**: o painel Referências do trilho da direita
(`ReferencesPanel`, leitura pelo cliente em `lib/writing/reference-sources.ts`)
lista as referências do projeto, insere a citação no corpo do texto (ABNT/APA/
Vancouver, texto simples — ainda **não** é um nó de citação vinculado ao
`citation_key`) e abre o artigo **sem sair do editor**: o item vai para o painel
"Artigos" (`ArticleReader`), que divide a página em duas — texto à esquerda,
artigo à direita, com divisória arrastável e abas dos artigos abertos. O PDF
anexado entra pelo route handler de URL assinada (sempre embute); link/DOI
externo entra em `sandbox` e pode ser recusado pelo site (X-Frame-Options) — por
isso o recado de "abrir em nova aba" fica desenhado **por baixo** do iframe, que
é transparente de propósito.

**Convites de participantes** (migrations `20260804120000` +
`20260804130000`): todo convite é uma linha em `project_invite_codes` com um
**código** de ~59 bits gerado no servidor (`lib/invites/code.ts`, alfabeto sem
caracteres ambíguos, formato `XXXX-XXXX-XXXX`) que vira o link `/convite/<code>`.
Dois formatos na mesma tabela — **por e-mail** (`email` preenchido,
`max_uses = 1`, ainda cria a linha `pending` em `project_members` para o cartão
"Convites pendentes") e **por código** (`email` nulo, com validade e limite de
usos opcionais, qualquer pessoa logada entra). RPCs: `create_project_invite`,
`revoke_project_invite`, `preview_project_invite` (a tela do convite roda antes
de a pessoa ser membro, então quem responde é SECURITY DEFINER) e
`redeem_project_invite` (trava a linha com `for update` — o limite de usos vale
sob concorrência — e nunca **rebaixa** o papel de quem já é membro). Regras de
papel: owner/editor **convidam**, mas só **dono exclui participante**
(`remove_project_member` exige `is_project_owner` e recusa auto-exclusão).
O envio de e-mail é **opcional por design** (`lib/email/send.ts`, Resend via
`fetch`, sem dependência nova): sem `RESEND_API_KEY`/`EMAIL_FROM` o convite vale
igual e a interface mostra o link/código para copiar. Toda RPC de convite teve o
`execute` revogado de `public`/`anon` — o Postgres concede a PUBLIC por padrão, e
essas funções são SECURITY DEFINER. O desvio para o login preserva o destino
(`?next=`, saneado contra open redirect no `proxy.ts` e em `lib/actions/auth.ts`),
para o link do e-mail sobreviver ao cadastro.

O espaçamento entre parágrafos é definido em `.folium-editor > *`
(8 pt embaixo, 0 em cima; 12 pt antes dos títulos) e **não pode voltar para o
`prose`**: como o editor é `display:flex`, as margens não colapsam e as margens
do typography somavam dos dois lados — ~48 px de vão a cada Enter. A regra
`.folium-editor > .folium-page-spacer { margin: 0 }` tem de continuar existindo,
senão a medição da paginação oscila. As **listas** seguem o mesmo raciocínio: o
`prose` trata cada item como um bloco de texto (0,75em em cima e embaixo do
parágrafo de dentro, mais 0,5em no próprio item), o que abria ~21 px entre
tópicos — quase o triplo dos 8 pt entre dois parágrafos do corpo, e a lista saía
frouxa como se fosse outro documento. Agora o vão entre itens é de um lado só e
em medida de papel: `.folium-editor li > p { margin: 0 }` e
`.folium-editor li { margin-bottom: 4pt }`, com os 8 pt do bloco ficando depois
da lista inteira.

Os arquivos de referência usam o bucket **privado** `reference-files`
(migration `20260801120000`), com o `project_id` como primeiro segmento do path
— é dele que as policies do Storage tiram a permissão; o download sai por URL
assinada no route handler `references/[referenceId]/file`. A busca de metadados
roda no servidor com guarda anti-SSRF (`lib/references/safe-fetch.ts`): ela abre
uma URL escolhida pelo usuário, então resolve o host por DNS e barra faixas
privadas antes de conectar.
