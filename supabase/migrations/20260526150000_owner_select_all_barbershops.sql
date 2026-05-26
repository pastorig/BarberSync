-- BarberSync — phase 7: el platform owner puede ver TODAS las barbershops
--
-- Why:
-- La policy `barbershops_public_select_active` filtra is_active=true.
-- Sin esta nueva policy, el platform owner no puede ver las barbershops
-- soft-deleted desde el cliente (necesario para la sección "Inactivas"
-- del OwnerDashboard con acciones Reactivar / Eliminar definitivamente).
--
-- Diseño:
-- Policy adicional para `authenticated` que usa la función helper
-- `current_user_is_platform_owner()`. Las RLS son OR — si el owner cumple
-- esta condición, ve también las inactivas. El público anon sigue limitado
-- a las activas.

begin;

drop policy if exists "barbershops_owner_select_all" on public.barbershops;
create policy "barbershops_owner_select_all"
on public.barbershops
for select
to authenticated
using (
  public.current_user_is_platform_owner()
);

commit;
