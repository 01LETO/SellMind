-- =============================================================
-- SellMind — Page Views (analytics de visualizações públicas)
-- =============================================================

create table if not exists public.page_views (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references public.pages(id) on delete cascade,
  viewed_at  timestamptz not null default now()
);

create index if not exists page_views_page_id_idx on public.page_views(page_id);
create index if not exists page_views_viewed_at_idx on public.page_views(viewed_at desc);

alter table public.page_views enable row level security;

create policy "page_views: select pelo dono da página" on public.page_views
  for select using (
    exists (
      select 1 from public.pages
      where pages.id = page_views.page_id
        and pages.user_id = auth.uid()
    )
  );
