begin;

alter table public.contact_requests
  add column if not exists deleted_at timestamptz null;

create index if not exists contact_requests_deleted_at_idx
  on public.contact_requests (deleted_at)
  where deleted_at is null;

comment on column public.contact_requests.deleted_at is
  'Soft delete: el owner mueve el mensaje al apartado Eliminados. Desde ahí puede restaurar o borrar definitivo.';

commit;
