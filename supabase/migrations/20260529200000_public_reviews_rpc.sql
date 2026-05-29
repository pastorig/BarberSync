begin;

-- ─────────────────────────────────────────────────────────────────────────
-- RPC pública para mostrar reseñas en la landing de la barbería.
-- Solo devuelve campos seguros (rating, comment, primer nombre, fecha,
-- service_name, barber_name). No expone telefono ni id de appointment.
-- Filtra: rating >= 4, comment no-null no-vacío, las más recientes primero.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.list_public_reviews_by_barbershop_slug(
  p_barbershop_slug text,
  p_limit int default 6
)
returns table (
  id uuid,
  rating int,
  comment text,
  customer_first_name text,
  service_name text,
  barber_name text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    r.id,
    r.rating,
    r.comment,
    -- Solo el primer nombre por privacidad
    split_part(trim(coalesce(a.customer_name, 'Cliente')), ' ', 1) as customer_first_name,
    a.service_name,
    a.barber_name,
    r.created_at
  from public.appointment_reviews r
  join public.appointments a on a.id = r.appointment_id
  where r.barbershop_slug = p_barbershop_slug
    and r.rating >= 4
    and r.comment is not null
    and length(trim(r.comment)) > 0
  order by r.created_at desc
  limit greatest(1, least(coalesce(p_limit, 6), 20));
$$;

revoke all on function public.list_public_reviews_by_barbershop_slug(text, int) from public;
grant execute on function public.list_public_reviews_by_barbershop_slug(text, int)
  to anon, authenticated;

commit;
