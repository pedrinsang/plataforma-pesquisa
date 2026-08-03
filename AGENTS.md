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
com aceite do convidado**, **redesign visual completo — sistema "Folium"**
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
com controle de viúvas e órfãs (`MIN_LINES = 2`).

Feito também: **biblioteca de referências** (aba própria `references` do projeto:
qualquer tipo de fonte, PDF anexado em bucket privado, metadados importados de
APIs públicas e gratuitas — Crossref/PubMed/arXiv/OpenLibrary/meta tags, **sem
IA** — e formatação ABNT/APA/Vancouver em `lib/references/format.ts`).

Falta (do brief): feed de atividade (pode vir do `audit_log`), status do
projeto, **citação da biblioteca dentro do projeto** (menção "@" no editor de
Escrita usando `citation_key`, e vínculo de referência a casos/achados),
histórico de versões do texto, bloco de ideias/kanban, **gráficos** (nenhuma lib
instalada — o node `statChart` já prevê `statType: 'chart'` para quando existir),
importação CSV/Excel, **campos customizáveis** das amostras e **achados**.

Notas: o editor já tem link e imagem — quando o conteúdo for renderizado fora do
TipTap (export/print), avaliar sanitização XSS do HTML. Upload de imagem usa o
bucket `writing-images` (migration `20260727120000`; rodar `npx supabase db push`).
Cabeçalho/rodapé precisam da migration `20260728120000_document_header_footer`
(colunas `header_text`/`footer_text` em `documents`) — **rodar `npx supabase db
push`**; até lá a busca é tolerante (campos vazios, editor não quebra).
A paginação é **medida no cliente** (não é do ProseMirror): `WritingCanvas` lê a
geometria e manda espaçadores para a extensão `foliumPagination`, que os desenha
como widget decorations. São **dois tipos** de espaçador (`PageSpacer.inline`):
um `div` entre blocos, que desce o bloco inteiro, e um `span` da largura da
coluna **dentro** do parágrafo (`.folium-line-spacer`), que reparte o parágrafo
sem que ele deixe de ser um único nó do documento. Por isso a medição desce ao
nível da linha: `readLines` monta as caixas de linha com `Range.getClientRects()`
e ancora a virada com `view.posAtCoords`. Três coisas seguram isso de pé e não
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
que uma folha, ainda atravessam a virada — o `.folium-seam` mascara o vão. Convites não enviam e-mail (vinculam
por `invited_email` no cadastro). No editor em tela cheia, "Baixar PDF" e
"Imprimir" são o mesmo `window.print()`, e o papel sai **igual à tela**: no
`beforeprint` o `WritingCanvas` monta a **via de impressão** (`.folium-print`) —
uma folha A4 por página, cada uma recortando (`overflow:hidden`) um clone da
pilha deslocado pelo topo daquela folha —, e o `afterprint` esvazia. Ou seja, a
paginação impressa é a **mesma medida na tela**, com cabeçalho/rodapé/numeração
no lugar; o motor de impressão não reparte nada (`@page margin: 0`, as margens
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
é transparente de propósito. Falta ainda: nó de citação vinculado e bibliografia
gerada no documento ("Nova" e "Bibliografia" na faixa seguem desabilitados).

O espaçamento entre parágrafos é definido em `.folium-editor > *`
(8 pt embaixo, 0 em cima; 12 pt antes dos títulos) e **não pode voltar para o
`prose`**: como o editor é `display:flex`, as margens não colapsam e as margens
do typography somavam dos dois lados — ~48 px de vão a cada Enter. A regra
`.folium-editor > .folium-page-spacer { margin: 0 }` tem de continuar existindo,
senão a medição da paginação oscila.

Os arquivos de referência usam o bucket **privado** `reference-files`
(migration `20260801120000`), com o `project_id` como primeiro segmento do path
— é dele que as policies do Storage tiram a permissão; o download sai por URL
assinada no route handler `references/[referenceId]/file`. A busca de metadados
roda no servidor com guarda anti-SSRF (`lib/references/safe-fetch.ts`): ela abre
uma URL escolhida pelo usuário, então resolve o host por DNS e barra faixas
privadas antes de conectar.
