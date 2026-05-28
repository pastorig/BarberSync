begin;

create or replace function public.get_public_barber_day_appointments(
  p_barbershop_slug text,
  p_barber_id text,
  p_appointment_date text
)
returns table (
  appointment_time text,
  service_duration_minutes integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    appointment.appointment_time,
    coalesce(
      appointment.actual_duration_minutes,
      appointment.service_duration_minutes
    ) as service_duration_minutes
  from public.appointments as appointment
  where appointment.barbershop_slug = p_barbershop_slug
    and appointment.barber_id = p_barber_id
    and appointment.appointment_date = p_appointment_date::date
    and appointment.status in ('pending', 'confirmed');
$$;

revoke all on function public.get_public_barber_day_appointments(text, text, text) from public;
grant execute on function public.get_public_barber_day_appointments(text, text, text) to anon, authenticated;

commit;
