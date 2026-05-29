import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * POST /api/waitlist
 *
 * Inserción pública en la lista de espera de una barbería.
 * Para el flow desde /reservar cuando el cliente no encuentra slot.
 */
export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const barbershopSlug =
    typeof payload.barbershopSlug === "string" ? payload.barbershopSlug : "";
  const barberId =
    typeof payload.barberId === "string" ? payload.barberId : "";
  const serviceName =
    typeof payload.serviceName === "string" ? payload.serviceName : "";
  const customerName =
    typeof payload.customerName === "string" ? payload.customerName.trim() : "";
  const customerPhone =
    typeof payload.customerPhone === "string"
      ? payload.customerPhone.trim()
      : "";
  const preferredDate =
    typeof payload.preferredDate === "string" ? payload.preferredDate : "";

  if (
    !barbershopSlug ||
    !barberId ||
    !serviceName ||
    !customerName ||
    !customerPhone ||
    !preferredDate
  ) {
    return NextResponse.json(
      { error: "Faltan datos obligatorios." },
      { status: 400 },
    );
  }

  const customerEmail =
    typeof payload.customerEmail === "string" && payload.customerEmail.trim()
      ? payload.customerEmail.trim()
      : null;
  const preferredTimeFrom =
    typeof payload.preferredTimeFrom === "string" &&
    /^\d{2}:\d{2}/.test(payload.preferredTimeFrom)
      ? payload.preferredTimeFrom
      : null;
  const preferredTimeTo =
    typeof payload.preferredTimeTo === "string" &&
    /^\d{2}:\d{2}/.test(payload.preferredTimeTo)
      ? payload.preferredTimeTo
      : null;
  const notes =
    typeof payload.notes === "string" && payload.notes.trim()
      ? payload.notes.trim()
      : null;
  const serviceDurationMinutes =
    typeof payload.serviceDurationMinutes === "number" &&
    payload.serviceDurationMinutes > 0
      ? payload.serviceDurationMinutes
      : 30;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("waitlist_entries")
    .insert({
      barbershop_slug: barbershopSlug,
      barber_id: barberId,
      service_name: serviceName,
      service_duration_minutes: serviceDurationMinutes,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      preferred_date: preferredDate,
      preferred_time_from: preferredTimeFrom,
      preferred_time_to: preferredTimeTo,
      notes,
    })
    .select("id, created_at")
    .single();

  if (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "No pudimos guardarte en la lista." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id: data?.id }, { status: 201 });
}
