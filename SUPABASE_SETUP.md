# Como configurar o Supabase no SellMind

## 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Guarde a **Project URL**, a **anon key** e a **service_role key**

## 2. Aplicar o schema

**Opção A — Dashboard (mais simples):**
Abra o Supabase Dashboard → SQL Editor → cole o conteúdo de `supabase/migrations/001_initial_schema.sql` → Execute

**Opção B — Supabase CLI:**
```bash
npx supabase login
npx supabase link --project-ref <seu-project-ref>
npx supabase db push
```

## 3. Configurar variáveis de ambiente

**`apps/api/.env`**
```
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
SUPABASE_ANON_KEY=<anon_key>
```

**`apps/web/.env`**
```
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
```

> ⚠️ A `service_role_key` ignora RLS — nunca exponha no frontend.

## 4. Configurar autenticação (opcional)

No Supabase Dashboard → Authentication → Settings:
- **Site URL**: URL do seu frontend (ex: `http://localhost:5173`)
- **Redirect URLs**: idem
- Se quiser desabilitar confirmação de e-mail em dev: Authentication → Email → "Confirm email" → desativar

## 5. Instalar dependências e rodar

```bash
npm install       # na raiz do projeto

# Terminal 1
cd apps/api && npm run dev

# Terminal 2
cd apps/web && npm run dev
```

## 6. Webhook do Stripe (produção)

```bash
stripe listen --forward-to localhost:3001/stripe/webhook
```

## Diferenças do PocketBase

| PocketBase                    | Supabase                             |
|-------------------------------|--------------------------------------|
| `pb.collection('x').create()` | `supabase.from('x').insert()`        |
| `pb.collection('x').getFullList()` | `supabase.from('x').select('*')` |
| `pb.authStore.model`          | `session.user`                       |
| `pb.authStore.isValid`        | `session !== null`                   |
| `pb.collection('users').authWithPassword()` | `supabase.auth.signInWithPassword()` |
| `pb.collection('users').create()` | `supabase.auth.signUp()`         |
| `pb.collection('_superusers').authWithPassword()` | `service_role_key` |
| `pb_migrations/*.js`          | `supabase/migrations/*.sql`          |
| Arquivo storage em PocketBase | Supabase Storage (bucket `ai-images`) |
