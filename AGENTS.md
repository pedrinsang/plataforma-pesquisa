<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Contexto do projeto

Plataforma de gestão de projetos de pesquisa científica (uso individual e em
equipe). Gratuita nesta fase — sem cobrança, mas com conceito de papéis/membros
já pronto para monetizar depois. Prioridades do produto: **segurança**,
**praticidade** e **design** (o visual é tão importante quanto a função).

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

## Design (identidade visual)

- Conceito **"manuscrito × instrumento"**: superfícies de papel (dourado,
  `.ruled-paper`) para a área de Escrita; painéis escuros com grade técnica
  (teal, `.grid-teal`, `.panel-ink`) para Estatística/dados.
- **Tokens de cor** em `app/globals.css` (navy + teal + dourado, claro/escuro).
  Nunca hardcodar cores — sempre usar os tokens (`text-accent-teal`,
  `bg-surface`, `border-border-subtle`, etc.).
- Fontes: **Fraunces** (serif, títulos), **IBM Plex Sans** (corpo),
  **IBM Plex Mono** (rótulos/eyebrows em caixa alta rastreada).
- Animações respeitam `prefers-reduced-motion`. Ao mexer em UI, conferir
  claro **e** escuro.

## Estado (atualizado em jul/2026)

Feito: auth, CRUD de projetos, editor TipTap (templates/autosave/contador),
planilha de dados (react-data-grid), dark/light, **segurança reforçada**
(RLS por papel, rate limit de login, `audit_log`), **convites de participantes
com aceite do convidado**, e **redesign visual completo**.

Falta (do brief): timeline/marcos, feed de atividade (pode vir do `audit_log`),
status do projeto, biblioteca de **referências/citações** (inserção via "@" no
editor), histórico de versões do texto, bloco de ideias/kanban, **gráficos**
(nenhuma lib instalada), importação CSV/Excel, **amostras** com campos
customizáveis, **achados**, e embutir estatísticas na escrita.

Notas: sanitização XSS só vira necessária quando o editor ganhar link/imagem.
Convites não enviam e-mail (vinculam por `invited_email` no cadastro).
