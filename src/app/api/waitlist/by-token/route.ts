import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * GET /api/waitlist/by-token?token=<>
 *
 * Devuelve datos públicos de una entrada de waitlist por su token único.
 * Usado por la página /w/[token] del cliente.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Falta token." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { data: entry, error } = await supabase
    .from("waitlist_entries")
    .select(
      "id, barbershop_slug, barber_id, service_name, service_duration_minutes, customer_name, customer_phone, customer_email, preferred_date, status, notes",
    )
    .eq("confirmation_token", token)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !entry) {
    return NextResponse.json({ error: "Entrada no encontrada." }, { status: 404 });
  }

  // Traemos también el nombre del barbero y de la barbería para mostrar.
  const [{ data: barber }, { data: barbershop }] = await Promise.all([
    supabase
      .from("barbers")
      .select("name, display_name")
      .eq("id", entry.barber_id)
      .maybeSingle(),
    supabase
      .from("barbershops")
      .select("name, slug")
      .eq("slug", entry.barbershop_slug)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    ok: true,
    entry: {
      ...entry,
      barber_name: barber?.display_name?.trim() || barber?.name || "—",
      barbershop_name: barbershop?.name ?? entry.barbershop_slug,
    },
  });
}
