# SellMind — Runbook de Operações

## 1. Backup do banco de dados (Supabase)

### Backup automático (recomendado)
O Supabase faz backup diário automático em todos os planos pagos.

**Para verificar/ativar:**
1. Acesse [app.supabase.com](https://app.supabase.com) → seu projeto
2. Vá em **Settings → Backups**
3. Confirme que "Daily backups" está ativado
4. Plano Free: backups por 7 dias | Plano Pro: 30 dias

### Backup manual via CLI
```bash
# Exportar schema + dados
npx supabase db dump --db-url "postgresql://postgres:[senha]@[host]:5432/postgres" -f backup.sql

# Restaurar
psql "postgresql://postgres:[senha]@[host]:5432/postgres" < backup.sql
```

### Restaurar um backup
1. Acesse **Settings → Backups** no dashboard
2. Clique em **Restore** ao lado do backup desejado
3. Confirme — o processo leva alguns minutos

---

## 2. Expiração do token de reset de senha

Por padrão o Supabase expira tokens de reset em **1 hora**. Para alterar:

1. Acesse **Authentication → Email** no dashboard
2. Encontre **"Reset password token expiry"**
3. Ajuste para o valor desejado (em segundos)
   - 3600 = 1 hora (padrão)
   - 86400 = 24 horas

---

## 3. Deploy

### Frontend (Vercel)
- Deploy automático a cada push na branch `main`
- Variáveis de ambiente: Vercel Dashboard → Settings → Environment Variables
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### Backend API (Railway)
- Deploy automático a cada push na branch `main`
- Variáveis de ambiente: Railway Dashboard → Variables
  - Copie todas as variáveis do `apps/api/.env.example`

---

## 4. Aplicar migrations do Supabase

```bash
# Aplicar todas as migrations pendentes
npx supabase db push

# Verificar status
npx supabase migration list
```

---

## 5. Monitoramento de erros (Sentry)

1. Crie um projeto em [sentry.io](https://sentry.io) → tipo **Node.js**
2. Copie o DSN gerado
3. Adicione `SENTRY_DSN=<seu-dsn>` nas variáveis do Railway
4. Alertas chegam por e-mail automaticamente

---

## 6. Stripe — Webhooks

Para que pagamentos funcionem em produção:

1. Acesse [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Clique em **Add endpoint**
   - URL: `https://sua-api.up.railway.app/stripe/webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
3. Copie o **Signing secret** e adicione como `STRIPE_WEBHOOK_SECRET` no Railway

---

## 7. Checklist pré-lançamento

- [ ] Todas as variáveis de ambiente configuradas no Railway e Vercel
- [ ] Backup automático ativo no Supabase
- [ ] Webhook Stripe configurado e testado
- [ ] SENTRY_DSN configurado
- [ ] CI/CD passando (GitHub Actions)
- [ ] Domínio customizado configurado no Vercel
- [ ] `FRONTEND_URL` no Railway apontando para o domínio de produção
- [ ] `DOCS_DISABLED=true` no Railway (opcional — oculta /docs em produção)
