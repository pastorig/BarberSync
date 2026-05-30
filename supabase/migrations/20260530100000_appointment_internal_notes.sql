begin;

-- ─────────────────────────────────────────────────────────────────────────
-- Notas internas por turno
-- Texto libre que solo ve el admin. Distinto de `comment` (que es el
-- comentario del cliente en la reserva pública).
-- ─────────────────────────────────────────────────────────────────────────

alter table public.appointments
  add column if not exists internal_notes text null;

comment on column public.appointments.internal_notes is
  'Notas privadas del owner sobre el turno específico (ej: "vino sin reserva", "me debe X", "atendió Carlos reemplazando"). Distintas de notas del cliente que viven en barbershop_clients.notes.';

commit;
