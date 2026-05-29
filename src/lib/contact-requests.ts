import {
  getSupabaseClient,
  type ContactRequestInsert,
} from "@/lib/supabase";

const contactRequestSelect =
  "id, created_at, name, email, phone, message, source, handled_at, handled_by, deleted_at";

export async function createContactRequest(input: ContactRequestInsert) {
  return getSupabaseClient()
    .from("contact_requests")
    .insert({
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      message: input.message,
      source: input.source ?? "home",
    })
    .select("id, created_at")
    .single();
}

export async function listContactRequests() {
  return getSupabaseClient()
    .from("contact_requests")
    .select(contactRequestSelect)
    .order("created_at", { ascending: false });
}

export async function markContactRequestHandled({
  requestId,
  handledByUserId,
}: {
  requestId: string;
  handledByUserId: string | null;
}) {
  return getSupabaseClient()
    .from("contact_requests")
    .update({
      handled_at: new Date().toISOString(),
      handled_by: handledByUserId,
    })
    .eq("id", requestId)
    .select(contactRequestSelect)
    .single();
}

export async function unmarkContactRequestHandled(requestId: string) {
  return getSupabaseClient()
    .from("contact_requests")
    .update({
      handled_at: null,
      handled_by: null,
    })
    .eq("id", requestId)
    .select(contactRequestSelect)
    .single();
}

export async function softDeleteContactRequest(requestId: string) {
  return getSupabaseClient()
    .from("contact_requests")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", requestId)
    .select(contactRequestSelect)
    .single();
}

export async function restoreContactRequest(requestId: string) {
  return getSupabaseClient()
    .from("contact_requests")
    .update({ deleted_at: null })
    .eq("id", requestId)
    .select(contactRequestSelect)
    .single();
}

export async function hardDeleteContactRequest(requestId: string) {
  return getSupabaseClient()
    .from("contact_requests")
    .delete()
    .eq("id", requestId);
}
