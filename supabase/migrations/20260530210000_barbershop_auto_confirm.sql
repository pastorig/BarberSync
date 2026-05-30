begin;

-- ─────────────────────────────────────────────────────────────────────────
-- Auto-confirmar reservas entrantes
-- Cuando una barbería tiene este flag en true, las reservas entran como
-- 'confirmed' en lugar de 'pending', salteando el paso manual de confirmar
-- desde el admin. Default false para preservar el comportamiento actual.
-- Es opt-in: cada barbería lo activa en sus settings cuando confía en su
-- flujo (ej: pocos no-shows, clientela conocida).
-- ─────────────────────────────────────────────────────────────────────────

alter table public.barbershops
  add column if not exists auto_confirm_appointments boolean not null default false;

comment on column public.barbershops.auto_confirm_appointments is
  'Cuando true, las reservas nuevas se crean con status=confirmed automáticamente. Si false (default), entran como pending y necesitan confirmación manual desde el admin.';

commit;
