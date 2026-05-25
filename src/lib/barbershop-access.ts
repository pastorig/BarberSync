import { getSupabaseClient, type BarbershopAdminRow } from "@/lib/supabase";

type BarbershopAccessResult = {
  isAuthenticated: boolean;
  hasAccess: boolean;
  admin: BarbershopAdminRow | null;
  error: unknown;
};

export async function getCurrentUserAdminBarbershops() {
  const {
    data: { user },
    error: userError,
  } = await getSupabaseClient().auth.getUser();

  if (userError || !user) {
    return {
      data: [],
      user: null,
      error: userError,
    };
  }

  const { data, error } = await getSupabaseClient()
    .from("barbershop_admins")
    .select("user_id, barbershop_slug, role")
    .eq("user_id", user.id)
    .order("barbershop_slug", { ascending: true });

  return {
    data: data ?? [],
    user,
    error,
  };
}

export async function userHasAccessToBarbershop(
  barbershopSlug: string,
): Promise<BarbershopAccessResult> {
  const {
    data: { user },
    error: userError,
  } = await getSupabaseClient().auth.getUser();

  if (userError || !user) {
    return {
      isAuthenticated: false,
      hasAccess: false,
      admin: null,
      error: userError,
    };
  }

  const { data, error } = await getSupabaseClient()
    .from("barbershop_admins")
    .select("user_id, barbershop_slug, role")
    .eq("user_id", user.id)
    .eq("barbershop_slug", barbershopSlug)
    .maybeSingle();

  return {
    isAuthenticated: true,
    hasAccess: Boolean(data) && !error,
    admin: data ?? null,
    error,
  };
}

export async function requireBarbershopAccess(barbershopSlug: string) {
  return userHasAccessToBarbershop(barbershopSlug);
}
