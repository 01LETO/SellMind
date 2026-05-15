# SellMind — Guia para Claude Code

## Estrutura do projeto

```
apps/
  api/        Express.js backend (Node ESM)
  web/        React + Vite frontend
supabase/
  migrations/ SQL migrations do Supabase
```

## Stack

| Camada       | Tecnologia                        |
|--------------|-----------------------------------|
| Banco        | Supabase (PostgreSQL + Auth + Storage) |
| Backend API  | Express 5, Node.js ESM            |
| Frontend     | React 18, Vite, Tailwind, shadcn  |
| Pagamentos   | Stripe (checkout + webhooks)      |
| IA           | OpenAI GPT-4 (sales pages)        |

## Comandos principais

```bash
# Instalar dependências
npm install           # raiz (workspaces)

# Dev
cd apps/api && npm run dev      # API na :3001
cd apps/web && npm run dev      # Web na :3000

# Supabase CLI
npx supabase db push            # aplicar migrations
npx supabase gen types typescript --local > types.ts
```

## Variáveis de ambiente

### apps/api/.env
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=   # nunca expor ao browser
SUPABASE_ANON_KEY=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
FRONTEND_URL=http://localhost:5173
```

### apps/web/.env
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=      # anon key é segura no browser
```

## Tabelas do Supabase

| Tabela                    | Descrição                              |
|---------------------------|----------------------------------------|
| `profiles`                | Dados do usuário (plan_type, etc.)     |
| `pages`                   | Páginas de vendas geradas              |
| `subscribers`             | Dados de assinatura Stripe             |
| `integrated_ai_messages`  | Histórico do chat com IA               |

Todas com Row Level Security (RLS). O backend usa `service_role` (ignora RLS).

## Auth

- **Frontend**: `supabase.auth.signInWithPassword / signUp / signOut`
- **Backend (middleware)**: verifica `Authorization: Bearer <access_token>` via `supabase.auth.getUser(token)`
- O trigger `handle_new_user()` cria `profiles` automaticamente no signup

## Storage

Bucket `ai-images` para imagens do chat com IA (público, 5MB máx).

## Arquivos-chave modificados vs PocketBase original

| Arquivo                                      | Mudança                          |
|----------------------------------------------|----------------------------------|
| `apps/api/src/utils/supabaseClient.js`       | Substitui pocketbaseClient.js    |
| `apps/api/src/middleware/supabase-auth.js`   | Substitui pocketbase-auth.js     |
| `apps/api/src/routes/stripe.js`              | Queries Supabase                 |
| `apps/api/src/routes/integrated-ai.js`       | Usa supabaseAuth                 |
| `apps/api/src/api/integrated-ai.js`          | Storage + history em Supabase    |
| `apps/web/src/lib/supabaseClient.js`         | Substitui pocketbaseClient.js    |
| `apps/web/src/contexts/AuthContext.jsx`      | Auth via Supabase                |
| `apps/web/src/lib/integratedAiClient.js`     | Token via session.access_token   |
| `apps/web/src/pages/DashboardPage.jsx`       | Queries Supabase                 |
| `apps/web/src/pages/ResultPage.jsx`          | Insert Supabase                  |
| `supabase/migrations/001_initial_schema.sql` | Schema completo (novo)           |
