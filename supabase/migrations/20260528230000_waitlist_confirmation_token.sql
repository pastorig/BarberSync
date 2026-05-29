begin;

-- Token único para que cada entrada de waitlist pueda generar un link
-- al cliente. El cliente lo abre, ve slots y confirma → se crea el turno.

alter table public.waitlist_entries
  add column if not exists confirmation_token uuid
    not null default gen_random_uuid();

create index if not exists waitlist_entries_token_idx
  on public.waitlist_entries (confirmation_token);

comment on column public.waitlist_entries.confirmation_token is
  'Token único para link público /w/<token>. El cliente lo usa para confirmar el turno cuando el admin lo contacta.';

commit;
