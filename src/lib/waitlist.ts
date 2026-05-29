import { getSupabaseClient, type WaitlistEntryRow } from "@/lib/supabase";

const waitlistSelect =
  "id, created_at, barbershop_slug, barber_id, service_name, service_duration_minutes, customer_name, customer_phone, customer_email, preferred_date, preferred_time_from, preferred_time_to, notes, status, resolved_at, deleted_at";

export async function listWaitlistByBarbershop(barbershopSlug: string) {
  return getSupabaseClient()
    .from("waitlist_entries")
    .select(waitlistSelect)
    .eq("barbershop_slug", barbershopSlug)
    .is("deleted_at", null)
    .order("preferred_date", { ascending: true })
    .order("created_at", { ascending: true });
}

export type WaitlistEntry = WaitlistEntryRow;
