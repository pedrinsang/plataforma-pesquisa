# Folium

**Folium** — plataforma de gestão de projetos de pesquisa científica. Reúne escrita,
referências e estatística de cada projeto em um só lugar, com cuidado editorial. Dividida em duas
áreas por projeto de pesquisa:

- **Escrita**: documentos, notas/ideias, referências bibliográficas (ABNT, APA, Vancouver, MDT).
- **Estatística**: plano de pesquisa, coleta de dados, cálculos estatísticos, gráficos.

Stack: Next.js (App Router) + Supabase (Postgres + Auth) + Vercel, tudo em camada gratuita. Veja o plano completo em `docs/plano.md`.

## Setup local

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um projeto gratuito em [supabase.com](https://supabase.com) (você precisa de uma conta — isso não pode ser feito por mim).

3. Copie `.env.local.example` para `.env.local` e preencha com a URL e a chave anônima do seu projeto (em *Project Settings → API* no painel do Supabase):

   ```bash
   cp .env.local.example .env.local
   ```

4. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Abra [http://localhost:3000](http://localhost:3000).

### Supabase local (opcional, recomendado para desenvolvimento)

O CLI do Supabase já está instalado como dependência de desenvolvimento (`npx supabase`). Para rodar um Postgres local via Docker, sem gastar a cota do projeto gratuito na nuvem:

```bash
npx supabase start   # requer Docker Desktop rodando
npx supabase db push # aplica as migrations em supabase/migrations/
```

## Deploy (Vercel)

1. Suba este repositório para o GitHub.
2. Em [vercel.com](https://vercel.com), importe o repositório (conta gratuita).
3. Configure as variáveis de ambiente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no painel do projeto na Vercel (mesmos valores do `.env.local`, apontando para o projeto Supabase de produção).
4. Cada push na branch principal gera um deploy automático.

Essas etapas exigem contas próprias (Supabase e Vercel/GitHub) e não podem ser feitas por mim — o restante do projeto já está pronto para ser conectado assim que você tiver essas contas.
