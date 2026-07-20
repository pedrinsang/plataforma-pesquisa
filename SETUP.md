# Rodar o projeto em outra máquina

Guia para continuar o desenvolvimento em outro computador (ex: notebook).
O código vem do GitHub; o banco é o Supabase na nuvem (compartilhado entre
máquinas — não é preciso recriar banco nem rodar migrations de novo).

## Primeira vez na máquina nova

Pré-requisitos: [Node.js LTS](https://nodejs.org) e [Git](https://git-scm.com).

```bash
# 1. Clonar o repositório (só na primeira vez)
git clone https://github.com/pedrinsang/plataforma-pesquisa
cd plataforma-pesquisa

# 2. Instalar dependências (node_modules não vem no git)
npm install

# 3. Criar o .env.local a partir do modelo
#    Windows PowerShell:
copy .env.local.example .env.local
#    macOS/Linux:
#    cp .env.local.example .env.local
```

Depois abra o `.env.local` e preencha as duas variáveis com os dados do
projeto Supabase (painel do Supabase → **Project Settings → API**):

```
NEXT_PUBLIC_SUPABASE_URL=          # "Project URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # chave "anon public"
```

> O `.env.local` **não** é versionado (contém as chaves). A forma mais fácil
> é copiar o arquivo do PC principal, ou repegar os valores no painel do Supabase.

```bash
# 4. Rodar em desenvolvimento
npm run dev          # abre em http://localhost:3000
```

## Rotina do dia a dia (nos dois PCs)

```bash
git pull             # SEMPRE antes de começar — traz o que foi feito no outro PC
# ... trabalha ...
git add -A
git commit -m "mensagem descritiva"
git push             # envia para o GitHub
```

- Rode `npm install` de novo só quando uma dependência nova for adicionada.
- Sempre `git pull` **antes** de mexer, para evitar conflitos entre as máquinas.

## Migrations do banco (quando houver mudança de schema)

As migrations ficam em `supabase/migrations/`. Quando uma nova for criada,
aplique no Supabase remoto uma única vez (de qualquer máquina):

```bash
npx supabase login          # se ainda não estiver logado
npx supabase link --project-ref <ref-do-projeto>
npx supabase db push
```

Como o banco é único na nuvem, aplicar de uma máquina já vale para todas.
