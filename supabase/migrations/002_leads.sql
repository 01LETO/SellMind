-- =============================================================
-- SellMind — Leads (captura de dados de formulários públicos)
-- =============================================================

create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references public.pages(id) on delete cascade,
  data       jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists leads_page_id_idx on public.leads(page_id);
create index if not exists leads_created_at_idx on public.leads(created_at desc);

alter table public.leads enable row level security;

-- Apenas o dono da página pode consultar os leads via cliente direto
create policy "leads: select pelo dono da página" on public.leads
  for select using (
    exists (
      select 1 from public.pages
      where pages.id = leads.page_id
        and pages.user_id = auth.uid()
    )
  );

-- Inserção pública (sem autenticação) — feita via service_role no backend
-- RLS não bloqueia service_role, então não precisamos de política de insert pública
