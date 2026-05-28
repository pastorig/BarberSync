-- Tarea A: logo_url en barbershops (URL pública del archivo subido a Storage).
alter table public.barbershops
  add column if not exists logo_url text null;

comment on column public.barbershops.logo_url is
  'URL pública del logo de la barbería (Supabase Storage bucket barbershop-logos).';

-- Tarea B: tabla de fotos de galería por barbería.
create table if not exists public.barbershop_gallery_photos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  barbershop_slug text not null,
  storage_path text not null,
  public_url text not null,
  caption text null,
  sort_order int not null default 0,
  deleted_at timestamptz null
);

comment on table public.barbershop_gallery_photos is
  'Fotos de galería pública de cada barbería. Storage path apunta al bucket barbershop-gallery.';

create index if not exists barbershop_gallery_slug_idx
  on public.barbershop_gallery_photos (barbershop_slug, sort_order)
  where deleted_at is null;

-- RLS para gallery_photos
alter table public.barbershop_gallery_photos enable row level security;

-- Lectura pública (anon) de fotos activas.
drop policy if exists "gallery_public_select_active" on public.barbershop_gallery_photos;
create policy "gallery_public_select_active"
on public.barbershop_gallery_photos
for select
to anon, authenticated
using (deleted_at is null);

-- INSERT/UPDATE/DELETE solo si sos admin de esa barbería.
drop policy if exists "gallery_admin_insert" on public.barbershop_gallery_photos;
create policy "gallery_admin_insert"
on public.barbershop_gallery_photos
for insert
to authenticated
with check (
  exists (
    select 1 from public.barbershop_admins ba
    where ba.user_id = auth.uid()
      and ba.barbershop_slug = barbershop_gallery_photos.barbershop_slug
  )
);

drop policy if exists "gallery_admin_update" on public.barbershop_gallery_photos;
create policy "gallery_admin_update"
on public.barbershop_gallery_photos
for update
to authenticated
using (
  exists (
    select 1 from public.barbershop_admins ba
    where ba.user_id = auth.uid()
      and ba.barbershop_slug = barbershop_gallery_photos.barbershop_slug
  )
)
with check (
  exists (
    select 1 from public.barbershop_admins ba
    where ba.user_id = auth.uid()
      and ba.barbershop_slug = barbershop_gallery_photos.barbershop_slug
  )
);

drop policy if exists "gallery_admin_delete" on public.barbershop_gallery_photos;
create policy "gallery_admin_delete"
on public.barbershop_gallery_photos
for delete
to authenticated
using (
  exists (
    select 1 from public.barbershop_admins ba
    where ba.user_id = auth.uid()
      and ba.barbershop_slug = barbershop_gallery_photos.barbershop_slug
  )
);

-- ════════════════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- ════════════════════════════════════════════════════════════════════

-- Bucket para logos (1 logo por barbería).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'barbershop-logos',
  'barbershop-logos',
  true,
  2 * 1024 * 1024, -- 2MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Bucket para galería de fotos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'barbershop-gallery',
  'barbershop-gallery',
  true,
  5 * 1024 * 1024, -- 5MB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Policies de Storage: lectura pública.
drop policy if exists "logos_public_read" on storage.objects;
create policy "logos_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'barbershop-logos');

drop policy if exists "gallery_public_read" on storage.objects;
create policy "gallery_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'barbershop-gallery');

-- Policies de Storage: write (insert/update/delete) solo si sos admin
-- de la barbería cuyo slug coincide con la primera carpeta del path.
-- Convención de path: <barbershop_slug>/<filename>.
drop policy if exists "logos_admin_insert" on storage.objects;
create policy "logos_admin_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'barbershop-logos'
  and exists (
    select 1 from public.barbershop_admins ba
    where ba.user_id = auth.uid()
      and ba.barbershop_slug = (storage.foldername(name))[1]
  )
);

drop policy if exists "logos_admin_update" on storage.objects;
create policy "logos_admin_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'barbershop-logos'
  and exists (
    select 1 from public.barbershop_admins ba
    where ba.user_id = auth.uid()
      and ba.barbershop_slug = (storage.foldername(name))[1]
  )
);

drop policy if exists "logos_admin_delete" on storage.objects;
create policy "logos_admin_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'barbershop-logos'
  and exists (
    select 1 from public.barbershop_admins ba
    where ba.user_id = auth.uid()
      and ba.barbershop_slug = (storage.foldername(name))[1]
  )
);

drop policy if exists "gallery_admin_insert_storage" on storage.objects;
create policy "gallery_admin_insert_storage"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'barbershop-gallery'
  and exists (
    select 1 from public.barbershop_admins ba
    where ba.user_id = auth.uid()
      and ba.barbershop_slug = (storage.foldername(name))[1]
  )
);

drop policy if exists "gallery_admin_update_storage" on storage.objects;
create policy "gallery_admin_update_storage"
on storage.objects for update
to authenticated
using (
  bucket_id = 'barbershop-gallery'
  and exists (
    select 1 from public.barbershop_admins ba
    where ba.user_id = auth.uid()
      and ba.barbershop_slug = (storage.foldername(name))[1]
  )
);

drop policy if exists "gallery_admin_delete_storage" on storage.objects;
create policy "gallery_admin_delete_storage"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'barbershop-gallery'
  and exists (
    select 1 from public.barbershop_admins ba
    where ba.user_id = auth.uid()
      and ba.barbershop_slug = (storage.foldername(name))[1]
  )
);
