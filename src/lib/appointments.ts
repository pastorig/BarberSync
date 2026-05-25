import {
  getSupabaseClient,
  type AppointmentInsert,
} from "@/lib/supabase";

type AppointmentDraft = Omit<AppointmentInsert, "status">;
type AppointmentAvailabilityInput = {
  barbershopSlug: string;
  barberId: string;
  appointmentDate: string;
};

type AppointmentTimeInput = AppointmentAvailabilityInput & {
  appointmentTime: string;
};

const activeAppointmentStatuses = ["pending", "confirmed"];

export async function createPendingAppointment(appointment: AppointmentDraft) {
  return getSupabaseClient()
    .from("appointments")
    .insert({ ...appointment, status: "pending" });
}

export async function confirmAppointment(appointmentId: string) {
  return getSupabaseClient()
    .from("appointments")
    .update({ status: "confirmed" })
    .eq("id", appointmentId);
}

export async function cancelAppointment(appointmentId: string) {
  return getSupabaseClient()
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId);
}

export async function listAppointmentsByBarbershop(barbershopSlug: string) {
  const { data, error } = await getSupabaseClient()
    .from("appointments")
    .select(
      "id, barbershop_slug, barber_id, barber_name, customer_name, customer_phone, service_name, service_price, service_duration_minutes, appointment_date, appointment_time, comment, status, created_at",
    )
    .eq("barbershop_slug", barbershopSlug)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

  return { data, error };
}

export async function listOccupiedAppointmentTimes({
  barbershopSlug,
  barberId,
  appointmentDate,
}: AppointmentAvailabilityInput) {
  const { data, error } = await getSupabaseClient()
    .from("appointments")
    .select("appointment_time")
    .eq("barbershop_slug", barbershopSlug)
    .eq("barber_id", barberId)
    .eq("appointment_date", appointmentDate)
    .in("status", activeAppointmentStatuses);

  return {
    data: data?.map((appointment) => appointment.appointment_time) ?? [],
    error,
  };
}

export async function validateAppointmentTimeIsAvailable({
  barbershopSlug,
  barberId,
  appointmentDate,
  appointmentTime,
}: AppointmentTimeInput) {
  const { data, error } = await listOccupiedAppointmentTimes({
    barbershopSlug,
    barberId,
    appointmentDate,
  });

  if (error) {
    return { isAvailable: false, error };
  }

  return {
    isAvailable: !data.includes(appointmentTime),
    error: null,
  };
}
