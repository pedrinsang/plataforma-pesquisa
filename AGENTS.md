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
(linha do tempo com CRUD e reordenação) e **amostras/coleta** (CRUD em
`statistics/samples`, alimenta o card e o gráfico semanal da visão geral).

Falta (do brief): feed de atividade (pode vir do `audit_log`), status do
projeto, biblioteca de **referências/citações** (inserção via "@" no editor),
histórico de versões do texto, bloco de ideias/kanban, **gráficos** (nenhuma lib
instalada — o node `statChart` já prevê `statType: 'chart'` para quando existir),
importação CSV/Excel, **campos customizáveis** das amostras e **achados**.

Notas: o editor já tem link e imagem — quando o conteúdo for renderizado fora do
TipTap (export/print), avaliar sanitização XSS do HTML. Upload de imagem usa o
bucket `writing-images` (migration `20260727120000`; rodar `npx supabase db push`).
Convites não enviam e-mail (vinculam por `invited_email` no cadastro).
