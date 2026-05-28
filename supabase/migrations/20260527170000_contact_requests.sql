-- Tabla contact_requests: leads del formulario público de /
-- (home comercial de BarberSync). Solo el owner de plataforma lee.

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text null,
  phone text null,
  message text not null,
  source text not null default 'home',
  handled_at timestamptz null,
  handled_by uuid null references auth.users(id) on delete set null
);

comment on table public.contact_requests is
  'Leads del formulario de contacto público en la home comercial.';

create index if not exists contact_requests_created_at_idx
  on public.contact_requests (created_at desc);

create index if not exists contact_requests_handled_at_idx
  on public.contact_requests (handled_at)
  where handled_at is null;

-- RLS
alter table public.contact_requests enable row level security;

-- INSERT público (anon + authenticated) — formulario sin login.
drop policy if exists "contact_requests_public_insert" on public.contact_requests;
create policy "contact_requests_public_insert"
on public.contact_requests
for insert
to anon, authenticated
with check (true);

-- SELECT solo para platform owners.
drop policy if exists "contact_requests_owner_select" on public.contact_requests;
create policy "contact_requests_owner_select"
on public.contact_requests
for select
to authenticated
using (
  exists (
    select 1
      from public.platform_owners as owner
     where owner.user_id = auth.uid()
  )
);

-- UPDATE (marcar handled) solo platform owners.
drop policy if exists "contact_requests_owner_update" on public.contact_requests;
create policy "contact_requests_owner_update"
on public.contact_requests
for update
to authenticated
using (
  exists (
    select 1
      from public.platform_owners as owner
     where owner.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
      from public.platform_owners as owner
     where owner.user_id = auth.uid()
  )
);
