import { demoBarbershops } from "@/data/demo-barbershops";
import { getLocalDateInputValue } from "@/lib/format";
import { getSupabaseClient } from "@/lib/supabase";

export type OwnerBarbershopSummary = {
  name: string;
  slug: string;
  barberCount: number;
  appointmentCount: number;
};

export type OwnerDashboardMetrics = {
  knownBarbershopsCount: number;
  totalBarbersCount: number;
  totalAppointmentsCount: number;
  todayAppointmentsCount: number;
  activeServicesCount: number;
  barbershops: OwnerBarbershopSummary[];
};

async function countBarbersForBarbershop(barbershopSlug: string) {
  const { count, error } = await getSupabaseClient()
    .from("barbers")
    .select("id", { count: "exact", head: true })
    .eq("barbershop_slug", barbershopSlug)
    .is("deleted_at", null);

  return {
    count: count ?? 0,
    error,
  };
}

async function countAppointmentsForBarbershop(barbershopSlug: string) {
  const { count, error } = await getSupabaseClient()
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("barbershop_slug", barbershopSlug)
    .neq("status", "deleted");

  return {
    count: count ?? 0,
    error,
  };
}

export async function getOwnerDashboardMetrics() {
  const today = getLocalDateInputValue();

  const [
    totalBarbersResult,
    totalAppointmentsResult,
    todayAppointmentsResult,
    activeServicesResult,
    barbershopSummaries,
  ] = await Promise.all([
    getSupabaseClient()
      .from("barbers")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
    getSupabaseClient()
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .neq("status", "deleted"),
    getSupabaseClient()
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("appointment_date", today)
      .neq("status", "deleted"),
    getSupabaseClient()
      .from("barber_services")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .is("deleted_at", null),
    Promise.all(
      demoBarbershops.map(async (barbershop) => {
        const [barbersResult, appointmentsResult] = await Promise.all([
          countBarbersForBarbershop(barbershop.slug),
          countAppointmentsForBarbershop(barbershop.slug),
        ]);

        const fallbackBarberCount = barbershop.barbers.filter(
          (barber) => barber.isActive,
        ).length;

        return {
          name: barbershop.name,
          slug: barbershop.slug,
          barberCount:
            barbersResult.error || barbersResult.count === 0
              ? fallbackBarberCount
              : barbersResult.count,
          appointmentCount: appointmentsResult.count,
        };
      }),
    ),
  ]);

  const fallbackTotalBarbers = demoBarbershops.reduce(
    (total, barbershop) =>
      total + barbershop.barbers.filter((barber) => barber.isActive).length,
    0,
  );

  return {
    data: {
      knownBarbershopsCount: demoBarbershops.length,
      totalBarbersCount:
        totalBarbersResult.error || (totalBarbersResult.count ?? 0) === 0
          ? fallbackTotalBarbers
          : totalBarbersResult.count ?? 0,
      totalAppointmentsCount: totalAppointmentsResult.count ?? 0,
      todayAppointmentsCount: todayAppointmentsResult.count ?? 0,
      activeServicesCount: activeServicesResult.count ?? 0,
      barbershops: barbershopSummaries,
    } satisfies OwnerDashboardMetrics,
    error:
      totalBarbersResult.error ??
      totalAppointmentsResult.error ??
      todayAppointmentsResult.error ??
      activeServicesResult.error ??
      null,
  };
}
