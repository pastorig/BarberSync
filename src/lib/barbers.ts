import {
  getSupabaseClient,
  type BarberInsert,
  type BarberUpdate,
} from "@/lib/supabase";

type CreateBarberInput = BarberInsert;
type UpdateBarberInput = {
  barberId: string;
  values: BarberUpdate;
};
type ToggleBarberActiveInput = {
  barberId: string;
  isActive: boolean;
};

export async function listBarbersByBarbershop(barbershopSlug: string) {
  const { data, error } = await getSupabaseClient()
    .from("barbers")
    .select(
      "id, created_at, barbershop_slug, name, display_name, role, whatsapp, is_active, deleted_at",
    )
    .eq("barbershop_slug", barbershopSlug)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  return { data, error };
}

export async function listActiveBarbersByBarbershop(barbershopSlug: string) {
  const { data, error } = await getSupabaseClient()
    .from("barbers")
    .select(
      "id, created_at, barbershop_slug, name, display_name, role, whatsapp, is_active, deleted_at",
    )
    .eq("barbershop_slug", barbershopSlug)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  return { data, error };
}

export async function createBarber(barber: CreateBarberInput) {
  return getSupabaseClient().from("barbers").insert(barber).select().single();
}

export async function updateBarber({ barberId, values }: UpdateBarberInput) {
  return getSupabaseClient()
    .from("barbers")
    .update(values)
    .eq("id", barberId)
    .select()
    .single();
}

export async function toggleBarberActive({
  barberId,
  isActive,
}: ToggleBarberActiveInput) {
  return updateBarber({
    barberId,
    values: {
      is_active: isActive,
    },
  });
}

export async function deleteBarber(barberId: string) {
  return updateBarber({
    barberId,
    values: {
      is_active: false,
      deleted_at: new Date().toISOString(),
    },
  });
}
