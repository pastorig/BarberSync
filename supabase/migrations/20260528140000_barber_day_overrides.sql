begin;

create table if not exists public.barber_day_overrides (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  barbershop_slug text not null,
  barber_id uuid not null references public.barbers (id) on delete cascade,
  override_date date not null,
  start_time time not null,
  end_time time not null,
  is_working boolean not null default true,
  deleted_at timestamptz,
  constraint barber_day_overrides_time_range_check
    check (start_time < end_time),
  constraint barber_day_overrides_barber_date_unique
    unique (barber_id, override_date)
);

create index if not exists barber_day_overrides_barber_date_idx
on public.barber_day_overrides (barbershop_slug, barber_id, override_date)
where deleted_at is null;

alter table public.barber_day_overrides enable row level security;

drop policy if exists "barber_day_overrides_public_select_active" on public.barber_day_overrides;
create policy "barber_day_overrides_public_select_active"
on public.barber_day_overrides
for select
to anon, authenticated
using (deleted_at is null);

drop policy if exists "barber_day_overrides_admin_manage_own_barbershop_select" on public.barber_day_overrides;
create policy "barber_day_overrides_admin_manage_own_barbershop_select"
on public.barber_day_overrides
for select
to authenticated
using (
  public.current_user_has_barbershop_access(barbershop_slug)
  or public.current_user_is_platform_owner()
);

drop policy if exists "barber_day_overrides_admin_manage_own_barbershop_insert" on public.barber_day_overrides;
create policy "barber_day_overrides_admin_manage_own_barbershop_insert"
on public.barber_day_overrides
for insert
to authenticated
with check (
  public.current_user_has_barbershop_access(barbershop_slug)
  or public.current_user_is_platform_owner()
);

drop policy if exists "barber_day_overrides_admin_manage_own_barbershop_update" on public.barber_day_overrides;
create policy "barber_day_overrides_admin_manage_own_barbershop_update"
on public.barber_day_overrides
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

commit;
