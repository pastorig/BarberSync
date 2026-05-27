-- BarberSync — fix de ambigüedad en RPCs de confirmación/cancelación por token
--
-- Bug detectado en runtime:
--   ERROR 42702: column reference "status" is ambiguous
--   It could refer to either a PL/pgSQL variable or a table column.
--
-- Causa:
--   Los RPCs `confirm_appointment_by_token` y `cancel_appointment_by_token`
--   declaraban `RETURNS TABLE (ok boolean, status text, reason text)`. La
--   columna `status` del RETURNS TABLE choca con la columna `status` de la
--   tabla appointments dentro del UPDATE.
--
-- Fix:
--   Cambiar el return type a `json` y construir la respuesta con
--   json_build_object. Más simple para PostgREST, sin ambigüedades.

begin;

-- ─────────────────────────────────────────────────────────────────────────
-- confirm_appointment_by_token (replace)
-- ─────────────────────────────────────────────────────────────────────────

drop function if exists public.confirm_appointment_by_token(uuid);

create or replace function public.confirm_appointment_by_token(
  p_token uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_status text;
begin
  select a.status
    into v_current_status
    from public.appointments as a
   where a.confirmation_token = p_token
   limit 1;

  if v_current_status is null then
    return json_build_object('ok', false, 'status', null, 'reason', 'not_found');
  end if;

  if v_current_status = 'confirmed' then
    return json_build_object('ok', true, 'status', v_current_status, 'reason', 'already_confirmed');
  end if;

  if v_current_status <> 'pending' then
    return json_build_object('ok', false, 'status', v_current_status, 'reason', 'invalid_state');
  end if;

  update public.appointments as a
     set status = 'confirmed'
   where a.confirmation_token = p_token
     and a.status = 'pending';

  return json_build_object('ok', true, 'status', 'confirmed', 'reason', 'ok');
end;
$$;

revoke all on function public.confirm_appointment_by_token(uuid) from public;
grant execute on function public.confirm_appointment_by_token(uuid)
  to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- cancel_appointment_by_token (replace)
-- ─────────────────────────────────────────────────────────────────────────

drop function if exists public.cancel_appointment_by_token(uuid);

create or replace function public.cancel_appointment_by_token(
  p_token uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_status text;
begin
  select a.status
    into v_current_status
    from public.appointments as a
   where a.confirmation_token = p_token
   limit 1;

  if v_current_status is null then
    return json_build_object('ok', false, 'status', null, 'reason', 'not_found');
  end if;

  if v_current_status = 'cancelled' then
    return json_build_object('ok', true, 'status', v_current_status, 'reason', 'already_cancelled');
  end if;

  if v_current_status not in ('pending', 'confirmed') then
    return json_build_object('ok', false, 'status', v_current_status, 'reason', 'invalid_state');
  end if;

  update public.appointments as a
     set status = 'cancelled'
   where a.confirmation_token = p_token
     and a.status in ('pending', 'confirmed');

  return json_build_object('ok', true, 'status', 'cancelled', 'reason', 'ok');
end;
$$;

revoke all on function public.cancel_appointment_by_token(uuid) from public;
grant execute on function public.cancel_appointment_by_token(uuid)
  to anon, authenticated;

commit;
