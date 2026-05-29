begin;

-- Tabla de lista de espera: clientes que querían un turno y no había
-- disponibilidad. El admin los puede contactar manualmente o el sistema
-- les avisa cuando se libera un slot que coincide.

create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  barbershop_slug text not null,
  barber_id uuid not null references public.barbers(id) on delete cascade,
  service_name text not null,
  service_duration_minutes integer not null default 30,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  preferred_date date not null,
  preferred_time_from time,
  preferred_time_to time,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'contacted', 'fulfilled', 'cancelled')),
  resolved_at timestamptz,
  deleted_at timestamptz
);

comment on table public.waitlist_entries is
  'Lista de espera por barbería: clientes que no encontraron turno y quieren ser avisados si se libera uno.';

create index if not exists waitlist_entries_active_idx
  on public.waitlist_entries (barbershop_slug, preferred_date)
  where deleted_at is null and status = 'pending';

create index if not exists waitlist_entries_barber_idx
  on public.waitlist_entries (barber_id, preferred_date)
  where deleted_at is null and status = 'pending';

-- RLS
alter table public.waitlist_entries enable row level security;

-- INSERT público (cualquiera puede anotarse).
drop policy if exists "waitlist_public_insert" on public.waitlist_entries;
create policy "waitlist_public_insert"
on public.waitlist_entries
for insert
to anon, authenticated
with check (true);

-- SELECT/UPDATE/DELETE: solo admin de la barbería o platform owner.
drop policy if exists "waitlist_admin_select" on public.waitlist_entries;
create policy "waitlist_admin_select"
on public.waitlist_entries
for select
to authenticated
using (
  public.current_user_has_barbershop_access(barbershop_slug)
  or public.current_user_is_platform_owner()
);

drop policy if exists "waitlist_admin_update" on public.waitlist_entries;
create policy "waitlist_admin_update"
on public.waitlist_entries
for update
to authenticated
using (
  public.current_user_has_barbershop_access(barbershop_slug)
  or public.current_user_is_platform_owner()
)
with check (
  public.current_user_has_barbershop_access(barbershop_slug)
  or public.current_user_is_platform_owner()
);

drop policy if exists "waitlist_admin_delete" on public.waitlist_entries;
create policy "waitlist_admin_delete"
on public.waitlist_entries
for delete
to authenticated
using (
  public.current_user_has_barbershop_access(barbershop_slug)
  or public.current_user_is_platform_owner()
);

commit;
