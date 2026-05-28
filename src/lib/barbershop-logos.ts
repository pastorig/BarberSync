import { getSupabaseClient } from "@/lib/supabase";

const LOGO_BUCKET = "barbershop-logos";

function getLogoPath(barbershopSlug: string, extension: string) {
  return `${barbershopSlug}/logo.${extension}`;
}

function getExtensionFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/svg+xml":
      return "svg";
    default:
      return "png";
  }
}

/**
 * Sube un nuevo logo de barbería al bucket. Si ya había uno con la misma
 * extensión lo sobrescribe; si la extensión cambia, borra el anterior.
 * Devuelve la URL pública para guardar en barbershops.logo_url.
 */
export async function uploadBarbershopLogo({
  barbershopSlug,
  file,
  previousPath,
}: {
  barbershopSlug: string;
  file: File;
  previousPath?: string | null;
}) {
  const supabase = getSupabaseClient();
  const extension = getExtensionFromMime(file.type);
  const newPath = getLogoPath(barbershopSlug, extension);

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(newPath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return { data: null, error: uploadError };
  }

  // Si el path anterior es distinto, borramos el archivo viejo para no
  // dejar basura en el bucket.
  if (previousPath && previousPath !== newPath) {
    await supabase.storage.from(LOGO_BUCKET).remove([previousPath]);
  }

  const { data: publicUrlData } = supabase.storage
    .from(LOGO_BUCKET)
    .getPublicUrl(newPath);

  return {
    data: {
      storagePath: newPath,
      // Le agregamos un query param ?v=timestamp para forzar refresh del
      // navegador cuando el logo se actualiza (mismo path, distinto archivo).
      publicUrl: `${publicUrlData.publicUrl}?v=${Date.now()}`,
    },
    error: null,
  };
}

export async function removeBarbershopLogo({
  storagePath,
}: {
  storagePath: string;
}) {
  const supabase = getSupabaseClient();
  return supabase.storage.from(LOGO_BUCKET).remove([storagePath]);
}

/**
 * Extrae el storage_path desde una URL pública para poder borrarlo después.
 * Útil cuando solo guardamos public_url en barbershops.logo_url.
 */
export function getStoragePathFromPublicUrl(
  publicUrl: string | null | undefined,
): string | null {
  if (!publicUrl) return null;
  const match = publicUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+?)(\?|$)/);
  return match?.[1] ?? null;
}
