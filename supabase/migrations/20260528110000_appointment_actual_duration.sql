begin;

alter table public.appointments
  add column if not exists actual_duration_minutes integer;

alter table public.appointments
  drop constraint if exists appointments_actual_duration_minutes_positive;

alter table public.appointments
  add constraint appointments_actual_duration_minutes_positive
  check (actual_duration_minutes is null or actual_duration_minutes > 0);

commit;
