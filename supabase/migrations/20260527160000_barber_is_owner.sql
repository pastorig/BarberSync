-- Flag is_owner para identificar al barbero "cabeza" de cada barbería.
-- Solo puede haber UN owner activo por barbershop_slug (partial unique index
-- sobre los activos y no eliminados). La landing pública lo muestra primero
-- y con borde gold; en /admin/barbers tiene un badge "Cabeza".

alter table public.barbers
  add column if not exists is_owner boolean not null default false;

-- Solo un owner activo por barbería.
create unique index if not exists barbers_unique_owner_per_barbershop
  on public.barbers (barbershop_slug)
  where is_owner = true
    and deleted_at is null;

comment on column public.barbers.is_owner is
  'Si true, este barbero es la "cabeza" de la barbería. Único por barbería. Aparece primero en la landing y en el admin, con borde gold en la card pública.';

-- Backfill: para cada barbería sin owner asignado, marcar como owner al
-- barbero activo más antiguo (created_at ASC). Si una barbería ya tiene
-- owner cargado manualmente, no se toca.
with first_active_per_barbershop as (
  select distinct on (barbershop_slug)
    id
  from public.barbers
  where is_active = true
    and deleted_at is null
  order by barbershop_slug, created_at asc
)
update public.barbers as b
   set is_owner = true
  from first_active_per_barbershop as f
 where b.id = f.id
   and not exists (
     select 1
       from public.barbers as existing
      where existing.barbershop_slug = b.barbershop_slug
        and existing.is_owner = true
        and existing.deleted_at is null
   );
