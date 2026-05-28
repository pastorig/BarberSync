import {
  getSupabaseClient,
  type BarbershopGalleryPhotoRow,
} from "@/lib/supabase";

const GALLERY_BUCKET = "barbershop-gallery";

const gallerySelect =
  "id, created_at, barbershop_slug, storage_path, public_url, caption, sort_order, deleted_at";

export async function listGalleryPhotosByBarbershop(barbershopSlug: string) {
  return getSupabaseClient()
    .from("barbershop_gallery_photos")
    .select(gallerySelect)
    .eq("barbershop_slug", barbershopSlug)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
}

export async function uploadGalleryPhoto({
  barbershopSlug,
  file,
  caption,
  sortOrder,
}: {
  barbershopSlug: string;
  file: File;
  caption?: string | null;
  sortOrder?: number;
}) {
  const supabase = getSupabaseClient();
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(extension)
    ? extension
    : "jpg";
  const storagePath = `${barbershopSlug}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    return { data: null, error: uploadError };
  }

  const { data: publicUrlData } = supabase.storage
    .from(GALLERY_BUCKET)
    .getPublicUrl(storagePath);

  const { data, error } = await supabase
    .from("barbershop_gallery_photos")
    .insert({
      barbershop_slug: barbershopSlug,
      storage_path: storagePath,
      public_url: publicUrlData.publicUrl,
      caption: caption ?? null,
      sort_order: sortOrder ?? 0,
    })
    .select(gallerySelect)
    .single();

  if (error || !data) {
    // Si falla el insert, removemos el archivo subido para no dejar basura.
    await supabase.storage.from(GALLERY_BUCKET).remove([storagePath]);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function softDeleteGalleryPhoto(photoId: string) {
  return getSupabaseClient()
    .from("barbershop_gallery_photos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", photoId)
    .select(gallerySelect)
    .single();
}

export async function hardDeleteGalleryPhoto({
  photoId,
  storagePath,
}: {
  photoId: string;
  storagePath: string;
}) {
  const supabase = getSupabaseClient();
  // Borramos primero del Storage; si falla el delete del Storage igual
  // continuamos con el delete de la fila (puede haber quedado huérfana).
  await supabase.storage.from(GALLERY_BUCKET).remove([storagePath]);
  return supabase
    .from("barbershop_gallery_photos")
    .delete()
    .eq("id", photoId);
}

export async function updateGalleryPhotoOrder({
  photoId,
  sortOrder,
}: {
  photoId: string;
  sortOrder: number;
}) {
  return getSupabaseClient()
    .from("barbershop_gallery_photos")
    .update({ sort_order: sortOrder })
    .eq("id", photoId)
    .select(gallerySelect)
    .single();
}

export async function updateGalleryPhotoCaption({
  photoId,
  caption,
}: {
  photoId: string;
  caption: string | null;
}) {
  return getSupabaseClient()
    .from("barbershop_gallery_photos")
    .update({ caption })
    .eq("id", photoId)
    .select(gallerySelect)
    .single();
}

export type GalleryPhoto = BarbershopGalleryPhotoRow;
