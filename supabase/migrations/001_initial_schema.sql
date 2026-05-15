-- =============================================================
-- SellMind — Supabase Initial Schema
-- Equivalente às migrations do PocketBase
-- =============================================================

-- ────────────────────────────────────────────────────────────
-- PROFILES
-- ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  plan_type   text not null default 'free',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select próprio"  on public.profiles for select using (auth.uid() = user_id);
create policy "profiles: insert próprio"  on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles: update próprio"  on public.profiles for update using (auth.uid() = user_id);
create policy "profiles: delete próprio"  on public.profiles for delete using (auth.uid() = user_id);

-- trigger: mantém updated_at sempre atualizado
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- trigger: cria o profile automaticamente quando um usuário é criado
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (user_id, email, full_name, plan_type)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'free'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- PAGES (páginas de vendas geradas)
-- ────────────────────────────────────────────────────────────
create table if not exists public.pages (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  product_name     text not null,
  target_audience  text,
  main_pain        text,
  transformation   text,
  tone_of_voice    text,
  html_content     text,
  title            text,
  word_count       integer,
  generated_at     timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

alter table public.pages enable row level security;

create policy "pages: select próprio"  on public.pages for select using (auth.uid() = user_id);
create policy "pages: insert próprio"  on public.pages for insert with check (auth.uid() = user_id);
create policy "pages: update próprio"  on public.pages for update using (auth.uid() = user_id);
create policy "pages: delete próprio"  on public.pages for delete using (auth.uid() = user_id);

create index idx_pages_user_id     on public.pages (user_id);
create index idx_pages_created_at  on public.pages (created_at desc);

-- ────────────────────────────────────────────────────────────
-- SUBSCRIBERS (dados de assinatura / Stripe)
-- ────────────────────────────────────────────────────────────
create table if not exists public.subscribers (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  email               text not null unique,
  stripe_customer_id  text,
  subscribed          boolean not null default false,
  subscription_tier   text,
  subscription_end    timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.subscribers enable row level security;

create policy "subscribers: select próprio"  on public.subscribers for select using (auth.uid() = user_id);
create policy "subscribers: insert próprio"  on public.subscribers for insert with check (auth.uid() = user_id);
create policy "subscribers: update próprio"  on public.subscribers for update using (auth.uid() = user_id);

-- service_role ignora RLS (usado no webhook do Stripe no backend)

create trigger subscribers_updated_at
  before update on public.subscribers
  for each row execute procedure public.handle_updated_at();

create index idx_subscribers_user_id           on public.subscribers (user_id);
create index idx_subscribers_stripe_customer   on public.subscribers (stripe_customer_id);

-- ────────────────────────────────────────────────────────────
-- INTEGRATED AI MESSAGES (histórico do chat com IA)
-- ────────────────────────────────────────────────────────────
create table if not exists public.integrated_ai_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     jsonb not null,
  created_at  timestamptz not null default now()
);

alter table public.integrated_ai_messages enable row level security;

create policy "ai_messages: select próprio"  on public.integrated_ai_messages for select using (auth.uid() = user_id);
create policy "ai_messages: delete próprio"  on public.integrated_ai_messages for delete using (auth.uid() = user_id);
-- inserts são feitos pelo service_role no backend (sem RLS)

create index idx_ai_messages_user_id    on public.integrated_ai_messages (user_id);
create index idx_ai_messages_created_at on public.integrated_ai_messages (created_at asc);

-- ────────────────────────────────────────────────────────────
-- STORAGE: bucket para imagens do AI chat
-- ────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ai-images',
  'ai-images',
  true,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "ai-images: upload autenticado"
  on storage.objects for insert
  with check (bucket_id = 'ai-images' and auth.role() = 'authenticated');

create policy "ai-images: leitura pública"
  on storage.objects for select
  using (bucket_id = 'ai-images');
