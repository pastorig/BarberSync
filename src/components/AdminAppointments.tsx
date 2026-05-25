"use client";

import { useEffect, useState } from "react";
import type { DemoBarbershop } from "@/data/demo-barbershops";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  cancelAppointment,
  confirmAppointment,
  deleteAppointment,
  listAppointmentsByBarbershop,
  restoreDeletedAppointment,
} from "@/lib/appointments";
import { signOut } from "@/lib/auth";
import { listBarbersByBarbershop } from "@/lib/barbers";
import {
  formatDateForDisplay,
  formatPrice,
  getLocalDateInputValue,
  normalizeDateValue,
  normalizeTimeValue,
  timeValueToMinutes,
} from "@/lib/format";
import type { AppointmentRow, BarberRow } from "@/lib/supabase";
import { createWhatsAppConfirmationLink } from "@/lib/whatsapp";

type AdminAppointmentsProps = {
  barbershop: DemoBarbershop;
};

type AppointmentFilter =
  | "all"
  | "selectedDate"
  | "today"
  | "pending"
  | "confirmed"
  | "cancelled"
  | "deleted";

function getTodayInputValue() {
  return getLocalDateInputValue();
}

function getCurrentTimeValue() {
  return normalizeTimeValue(
    new Date().toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  );
}

export function AdminAppointments({ barbershop }: AdminAppointmentsProps) {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [barbers, setBarbers] = useState<BarberRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayInputValue());
  const [activeFilter, setActiveFilter] = useState<AppointmentFilter>("today");
  const [selectedBarberFilter, setSelectedBarberFilter] = useState("all");
  const [confirmingAppointmentId, setConfirmingAppointmentId] = useState<
    string | null
  >(null);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState<
    string | null
  >(null);
  const [deletingAppointmentId, setDeletingAppointmentId] = useState<
    string | null
  >(null);
  const [restoringAppointmentId, setRestoringAppointmentId] = useState<
    string | null
  >(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  function getStatusClasses(status: string) {
    if (status === "confirmed") {
      return "border-emerald-300/30 bg-emerald-300/10 text-emerald-200";
    }

    if (status === "cancelled") {
      return "border-red-300/30 bg-red-400/10 text-red-200";
    }

    if (status === "deleted") {
      return "border-stone-500/40 bg-stone-700/30 text-stone-300";
    }

    return "border-amber-300/30 bg-amber-300/10 text-amber-200";
  }

  const today = getTodayInputValue();
  const currentTime = getCurrentTimeValue();
  const currentTimeMinutes = timeValueToMinutes(currentTime);
  const isSelectedDateToday = selectedDate === today;
  const isSelectedDateFuture = selectedDate > today;
  const canShowUpcomingAppointment = isSelectedDateToday || isSelectedDateFuture;
  const appointmentMatchesSelectedBarber = (appointment: AppointmentRow) =>
    selectedBarberFilter === "all" ||
    appointment.barber_id === selectedBarberFilter;
  const visibleAppointments = appointments.filter(
    (appointment) =>
      appointment.status !== "deleted" &&
      appointmentMatchesSelectedBarber(appointment),
  );
  const deletedAppointments = appointments.filter(
    (appointment) =>
      appointment.status === "deleted" &&
      appointmentMatchesSelectedBarber(appointment),
  );
  const uniqueAppointmentBarbers = appointments.reduce<
    Array<{ id: string; name: string }>
  >((currentBarbers, appointment) => {
    if (
      currentBarbers.some((barber) => barber.id === appointment.barber_id)
    ) {
      return currentBarbers;
    }

    return [
      ...currentBarbers,
      {
        id: appointment.barber_id,
        name: appointment.barber_name,
      },
    ];
  }, []);
  const barberFilterOptions =
    barbers.length > 0
      ? barbers.map((barber) => ({
          id: barber.id,
          name: barber.display_name?.trim() || barber.name,
        }))
      : uniqueAppointmentBarbers;
  const todayAppointments = visibleAppointments.filter(
    (appointment) => normalizeDateValue(appointment.appointment_date) === today,
  );
  const activeTodayAppointments = todayAppointments.filter(
    (appointment) =>
      appointment.status === "pending" || appointment.status === "confirmed",
  );
  const selectedDateAppointments = visibleAppointments.filter(
    (appointment) =>
      normalizeDateValue(appointment.appointment_date) === selectedDate,
  );
  const upcomingAppointment = selectedDateAppointments
    .filter(
      (appointment) =>
        (appointment.status === "pending" ||
          appointment.status === "confirmed") &&
        canShowUpcomingAppointment &&
        (isSelectedDateFuture ||
          (isSelectedDateToday &&
            timeValueToMinutes(appointment.appointment_time) >=
              currentTimeMinutes)),
    )
    .sort((firstAppointment, secondAppointment) =>
      timeValueToMinutes(firstAppointment.appointment_time) -
      timeValueToMinutes(secondAppointment.appointment_time),
    )[0];
  const todaySummaryCards = [
    {
      label: "Turnos del dia",
      value: selectedDateAppointments.length,
    },
    {
      label: "Pendientes del dia",
      value: selectedDateAppointments.filter(
        (appointment) => appointment.status === "pending",
      ).length,
    },
    {
      label: "Confirmados del dia",
      value: selectedDateAppointments.filter(
        (appointment) => appointment.status === "confirmed",
      ).length,
    },
    {
      label: "Cancelados del dia",
      value: selectedDateAppointments.filter(
        (appointment) => appointment.status === "cancelled",
      ).length,
    },
  ];
  const filterCounts: Record<AppointmentFilter, number> = {
    all: visibleAppointments.length,
    selectedDate: selectedDateAppointments.length,
    today: activeTodayAppointments.length,
    pending: visibleAppointments.filter(
      (appointment) => appointment.status === "pending",
    ).length,
    confirmed: visibleAppointments.filter(
      (appointment) => appointment.status === "confirmed",
    ).length,
    cancelled: visibleAppointments.filter(
      (appointment) => appointment.status === "cancelled",
    ).length,
    deleted: deletedAppointments.length,
  };
  const filterOptions: Array<{ label: string; value: AppointmentFilter }> = [
    { label: "Hoy", value: "today" },
    { label: "Fecha seleccionada", value: "selectedDate" },
    { label: "Todos", value: "all" },
    { label: "Pendientes", value: "pending" },
    { label: "Confirmados", value: "confirmed" },
    { label: "Cancelados", value: "cancelled" },
    { label: "Eliminados", value: "deleted" },
  ];
  const filteredAppointments = appointments.filter((appointment) => {
    if (!appointmentMatchesSelectedBarber(appointment)) {
      return false;
    }

    if (activeFilter === "deleted") {
      return appointment.status === "deleted";
    }

    if (appointment.status === "deleted") {
      return false;
    }

    if (activeFilter === "all") {
      return true;
    }

    if (activeFilter === "today") {
      return (
        normalizeDateValue(appointment.appointment_date) === today &&
        (appointment.status === "pending" || appointment.status === "confirmed")
      );
    }

    if (activeFilter === "selectedDate") {
      return normalizeDateValue(appointment.appointment_date) === selectedDate;
    }

    return appointment.status === activeFilter;
  });
  const activeFilterLabel =
    filterOptions.find((filter) => filter.value === activeFilter)?.label ??
    "este filtro";
  const quickActions = [
    {
      label: "Gestionar barberos",
      href: `/${barbershop.slug}/admin/barbers`,
    },
    {
      label: "Ver reservas",
      href: "#reservas",
    },
    {
      label: "Pagina publica",
      href: `/${barbershop.slug}`,
    },
  ];

  async function handleConfirmAppointment(appointment: AppointmentRow) {
    if (!appointment.id) {
      setErrorMessage("No pudimos identificar la reserva.");
      return;
    }

    setErrorMessage("");
    setConfirmingAppointmentId(appointment.id);

    try {
      const { error } = await confirmAppointment(appointment.id);

      if (error) {
        setErrorMessage("No pudimos confirmar la reserva.");
        return;
      }

      setAppointments((currentAppointments) =>
        currentAppointments.map((currentAppointment) =>
          currentAppointment.id === appointment.id
            ? { ...currentAppointment, status: "confirmed" }
            : currentAppointment,
        ),
      );
    } catch {
      setErrorMessage("No pudimos confirmar la reserva.");
    } finally {
      setConfirmingAppointmentId(null);
    }
  }

  function handleSendWhatsApp(appointment: AppointmentRow) {
    if (appointment.status === "cancelled" || appointment.status === "deleted") {
      return;
    }

    const whatsappLink = createWhatsAppConfirmationLink({
      barbershopName: barbershop.name,
      clientName: appointment.customer_name,
      clientPhone: appointment.customer_phone,
      serviceName: appointment.service_name,
      date: formatDateForDisplay(appointment.appointment_date),
      time: appointment.appointment_time,
    });

    window.open(whatsappLink, "_blank", "noopener,noreferrer");
  }

  async function handleDeleteAppointment(appointment: AppointmentRow) {
    if (!appointment.id) {
      setErrorMessage("No pudimos identificar la reserva.");
      return;
    }

    const shouldDelete = window.confirm(
      `Eliminar visualmente el turno cancelado de ${appointment.customer_name}?`,
    );

    if (!shouldDelete) {
      return;
    }

    setErrorMessage("");
    setDeletingAppointmentId(appointment.id);

    try {
      const { error } = await deleteAppointment(appointment.id);

      if (error) {
        setErrorMessage("No pudimos eliminar visualmente la reserva.");
        return;
      }

      setAppointments((currentAppointments) =>
        currentAppointments.map((currentAppointment) =>
          currentAppointment.id === appointment.id
            ? { ...currentAppointment, status: "deleted" }
            : currentAppointment,
        ),
      );
    } catch {
      setErrorMessage("No pudimos eliminar visualmente la reserva.");
    } finally {
      setDeletingAppointmentId(null);
    }
  }

  async function handleRestoreAppointment(appointment: AppointmentRow) {
    if (!appointment.id) {
      setErrorMessage("No pudimos identificar la reserva.");
      return;
    }

    setErrorMessage("");
    setRestoringAppointmentId(appointment.id);

    try {
      const { error } = await restoreDeletedAppointment(appointment.id);

      if (error) {
        setErrorMessage("No pudimos restaurar la reserva.");
        return;
      }

      setAppointments((currentAppointments) =>
        currentAppointments.map((currentAppointment) =>
          currentAppointment.id === appointment.id
            ? { ...currentAppointment, status: "cancelled" }
            : currentAppointment,
        ),
      );
    } catch {
      setErrorMessage("No pudimos restaurar la reserva.");
    } finally {
      setRestoringAppointmentId(null);
    }
  }

  async function handleCancelAppointment(appointment: AppointmentRow) {
    if (!appointment.id) {
      setErrorMessage("No pudimos identificar la reserva.");
      return;
    }

    const shouldCancel = window.confirm(
      `¿Cancelar el turno de ${appointment.customer_name} del ${formatDateForDisplay(
        appointment.appointment_date,
      )} a las ${appointment.appointment_time}?`,
    );

    if (!shouldCancel) {
      return;
    }

    setErrorMessage("");
    setCancellingAppointmentId(appointment.id);

    try {
      const { error } = await cancelAppointment(appointment.id);

      if (error) {
        setErrorMessage("No pudimos cancelar la reserva.");
        return;
      }

      setAppointments((currentAppointments) =>
        currentAppointments.map((currentAppointment) =>
          currentAppointment.id === appointment.id
            ? { ...currentAppointment, status: "cancelled" }
            : currentAppointment,
        ),
      );
    } catch {
      setErrorMessage("No pudimos cancelar la reserva.");
    } finally {
      setCancellingAppointmentId(null);
    }
  }

  async function handleSignOut() {
    setErrorMessage("");
    setIsSigningOut(true);

    try {
      const { error } = await signOut();

      if (error) {
        setErrorMessage("No pudimos cerrar sesión.");
        return;
      }

      router.replace("/login");
    } catch {
      setErrorMessage("No pudimos cerrar sesión.");
    } finally {
      setIsSigningOut(false);
    }
  }

  function handleGoToToday() {
    const currentDate = getTodayInputValue();
    setSelectedDate(currentDate);
    setActiveFilter("selectedDate");
  }

  useEffect(() => {
    let isMounted = true;

    async function loadAppointments() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [appointmentsResult, barbersResult] = await Promise.all([
          listAppointmentsByBarbershop(barbershop.slug),
          listBarbersByBarbershop(barbershop.slug),
        ]);

        if (!isMounted) {
          return;
        }

        if (appointmentsResult.error) {
          setErrorMessage("No pudimos cargar las reservas.");
          setAppointments([]);
          return;
        }

        setAppointments(appointmentsResult.data ?? []);
        setBarbers(barbersResult.data ?? []);
      } catch {
        if (isMounted) {
          setErrorMessage("No pudimos cargar las reservas.");
          setAppointments([]);
          setBarbers([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAppointments();

    return () => {
      isMounted = false;
    };
  }, [barbershop.slug]);

  return (
    <main className="min-h-screen bg-stone-950 text-stone-50">
      <section className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-8 lg:px-12 lg:py-12">
        <div className="flex flex-col gap-3 pb-4 sm:border-b sm:border-stone-800 sm:pb-8">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase text-amber-300 sm:text-sm">
                BarberSync admin
              </p>
              <h1 className="mt-1 text-2xl font-black text-balance sm:text-5xl">
                Reservas de {barbershop.name}
              </h1>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-stone-400 sm:mt-2 sm:text-base sm:leading-7">
                Agenda operativa cargada desde Supabase para esta barberia.
                Confirmar turnos y enviar WhatsApp son acciones separadas.
              </p>
            </div>
            <div className="hidden rounded-md border border-stone-800 bg-stone-900 px-4 py-3 text-sm text-stone-300 sm:block">
              <span className="font-mono text-amber-300">
                {visibleAppointments.length}
              </span>{" "}
              reservas
            </div>
            <button
              type="button"
              disabled={isSigningOut}
              onClick={handleSignOut}
              className="hidden min-h-10 rounded-md border border-stone-700 px-3 py-2 text-sm font-bold text-stone-100 transition hover:border-amber-300 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-11 sm:px-4 lg:inline-flex lg:items-center lg:justify-center"
            >
              {isSigningOut ? "Cerrando..." : "Cerrar sesión"}
            </button>
          </div>
        </div>

        <div className="mt-3 sm:mt-8">
          {isLoading ? (
            <div className="border border-stone-800 bg-stone-900/70 p-6 text-stone-300">
              Cargando reservas...
            </div>
          ) : null}

          {!isLoading && errorMessage ? (
            <div className="border border-red-400/30 bg-red-500/10 p-6 text-sm font-semibold text-red-200">
              {errorMessage}
            </div>
          ) : null}

          {!isLoading && !errorMessage ? (
            <section className="mb-5 rounded-lg border border-stone-800 bg-stone-900/70 p-3 shadow-2xl shadow-black/25 sm:mb-8 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr] lg:items-start">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase text-amber-300">
                        Resumen por fecha
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-stone-100 sm:text-3xl">
                        {formatDateForDisplay(selectedDate)}
                      </h2>
                    </div>
                    <div className="rounded-md border border-stone-800 bg-stone-950 px-3 py-2 text-xs text-stone-400 sm:hidden">
                      <span className="font-mono font-black text-amber-300">
                        {visibleAppointments.length}
                      </span>{" "}
                      total
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                    <div>
                      <label
                        htmlFor="admin-date"
                        className="text-[11px] font-bold uppercase text-stone-500"
                      >
                        Fecha
                      </label>
                      <input
                        id="admin-date"
                        type="date"
                        value={selectedDate}
                        onChange={(event) => {
                          setSelectedDate(event.target.value);
                          setActiveFilter("selectedDate");
                        }}
                        className="mt-1 min-h-10 w-full rounded-md border border-stone-700 bg-stone-950 px-3 text-base text-stone-50 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20 sm:min-h-11 sm:px-4"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleGoToToday}
                      className="min-h-10 self-end rounded-md border border-stone-700 px-4 py-2 text-sm font-bold text-stone-100 transition hover:border-amber-300 hover:text-amber-200 sm:min-h-11"
                    >
                      Hoy
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
                    {todaySummaryCards.map((card) => (
                      <article
                        key={card.label}
                        className="rounded-md border border-stone-800 bg-stone-950 p-3 sm:p-4"
                      >
                        <p className="text-[10px] font-bold uppercase leading-4 text-stone-500 sm:text-xs">
                          {card.label}
                        </p>
                        <p className="mt-1 font-mono text-2xl font-black text-amber-300 sm:text-3xl">
                          {card.value}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3">
                  <article className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-4 shadow-lg shadow-black/20 sm:p-5">
                    <p className="text-[11px] font-bold uppercase leading-4 text-amber-200 sm:text-xs">
                      Proximo turno del dia
                    </p>
                    {upcomingAppointment ? (
                      <div className="mt-3 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 lg:block">
                        <p className="font-mono text-4xl font-black leading-none text-amber-300 sm:text-5xl">
                          {upcomingAppointment.appointment_time}
                        </p>
                        <div>
                          <p className="font-semibold text-stone-100 lg:mt-3">
                            {upcomingAppointment.customer_name}
                          </p>
                          <p className="text-sm text-stone-300 lg:mt-1">
                            {upcomingAppointment.service_name}
                          </p>
                          <p className="text-xs font-semibold text-stone-400 lg:mt-1">
                            {upcomingAppointment.barber_name}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm font-semibold text-stone-300">
                        Sin proximos turnos
                      </p>
                    )}
                  </article>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                    {quickActions.map((action) => (
                      <Link
                        key={action.label}
                        href={action.href}
                        className="inline-flex min-h-10 items-center justify-center rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-center text-[11px] font-bold uppercase text-stone-100 transition hover:border-amber-300 hover:text-amber-200 sm:min-h-11 sm:text-xs"
                      >
                        {action.label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      disabled={isSigningOut}
                      onClick={handleSignOut}
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-[11px] font-bold uppercase text-stone-100 transition hover:border-amber-300 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-11 sm:text-xs"
                    >
                      {isSigningOut ? "Cerrando..." : "Cerrar sesion"}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {!isLoading && !errorMessage && appointments.length > 0 ? (
            <div id="reservas" className="scroll-mt-4">
              {barberFilterOptions.length > 1 ? (
                <div className="mb-3 grid gap-1.5 sm:mb-4 sm:max-w-xs">
                  <label
                    htmlFor="admin-barber-filter"
                    className="text-[11px] font-bold uppercase text-stone-500"
                  >
                    Barbero
                  </label>
                  <select
                    id="admin-barber-filter"
                    value={selectedBarberFilter}
                    onChange={(event) =>
                      setSelectedBarberFilter(event.target.value)
                    }
                    className="min-h-10 w-full rounded-md border border-stone-700 bg-stone-900 px-3 text-sm font-semibold text-stone-100 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20 sm:min-h-11"
                  >
                    <option value="all">Todos los barberos</option>
                    {barberFilterOptions.map((barber) => (
                      <option key={barber.id} value={barber.id}>
                        {barber.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="mb-3 flex gap-2 overflow-x-auto pb-2 sm:mb-5">
                {filterOptions.map((filter) => {
                  const isActive = activeFilter === filter.value;

                  return (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setActiveFilter(filter.value)}
                      className={`min-h-10 shrink-0 rounded-md border px-3 py-2 text-xs font-bold transition sm:min-h-11 sm:px-4 sm:text-sm ${
                        isActive
                          ? "border-amber-300 bg-amber-300 text-stone-950"
                          : "border-stone-800 bg-stone-900 text-stone-300 hover:border-stone-600"
                      }`}
                    >
                      {filter.label} ({filterCounts[filter.value]})
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {!isLoading && !errorMessage && appointments.length === 0 ? (
            <div className="border border-stone-800 bg-stone-900/70 p-6 text-stone-300">
              Todavia no hay reservas para esta barberia.
            </div>
          ) : null}

          {!isLoading &&
          !errorMessage &&
          appointments.length > 0 &&
          filteredAppointments.length === 0 ? (
            <div className="border border-stone-800 bg-stone-900/70 p-6 text-stone-300">
              No hay reservas para el filtro {activeFilterLabel}.
            </div>
          ) : null}

          {!isLoading && !errorMessage && filteredAppointments.length > 0 ? (
            <div className="overflow-hidden lg:border lg:border-stone-800 lg:bg-stone-900/70">
              <div className="hidden grid-cols-[0.75fr_0.6fr_0.95fr_0.85fr_0.85fr_0.9fr_0.6fr_0.95fr_0.7fr_1.25fr] gap-4 border-b border-stone-800 px-5 py-4 text-xs font-bold uppercase text-stone-400 lg:grid">
                <span>Fecha</span>
                <span>Horario</span>
                <span>Cliente</span>
                <span>Teléfono</span>
                <span>Barbero</span>
                <span>Servicio</span>
                <span>Precio</span>
                <span>Comentario</span>
                <span>Estado</span>
                <span>Acción</span>
              </div>

              <div className="grid gap-3 lg:hidden">
                {filteredAppointments.map((appointment) => (
                  <article
                    key={
                      appointment.id ??
                      `${appointment.customer_phone}-${appointment.appointment_date}-${appointment.appointment_time}`
                    }
                    className="relative rounded-lg border border-stone-800 bg-stone-900/70 px-3 py-3 shadow-lg shadow-black/20"
                  >
                    {appointment.status === "cancelled" ? (
                      <button
                        type="button"
                        disabled={deletingAppointmentId === appointment.id}
                        onClick={() => handleDeleteAppointment(appointment)}
                        className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-md border border-stone-700 bg-stone-950 text-sm font-black text-stone-300 transition hover:border-red-300/50 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Eliminar turno cancelado"
                      >
                        ×
                      </button>
                    ) : null}
                    <div className="grid grid-cols-[auto_1fr] items-start gap-3">
                      <div className="min-w-14">
                        <p className="font-mono text-xl font-black text-amber-300">
                          {normalizeTimeValue(appointment.appointment_time)}
                        </p>
                        <p className="mt-0.5 text-[11px] font-bold uppercase text-stone-500">
                          {formatDateForDisplay(appointment.appointment_date)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-bold text-stone-100">
                            {appointment.customer_name}
                          </h3>
                          <span
                            className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${getStatusClasses(
                              appointment.status,
                            )}`}
                          >
                            {appointment.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-stone-300">
                          {appointment.service_name} ·{" "}
                          {formatPrice(appointment.service_price)}
                        </p>
                        <p className="mt-0.5 truncate text-xs font-semibold text-amber-200">
                          {appointment.barber_name}
                        </p>
                        <p className="mt-1 truncate text-xs text-stone-400">
                          {appointment.customer_phone}
                          {appointment.comment
                            ? ` · ${appointment.comment}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    {appointment.status === "deleted" ? (
                      <button
                        type="button"
                        disabled={restoringAppointmentId === appointment.id}
                        onClick={() => handleRestoreAppointment(appointment)}
                        className="mt-3 inline-flex min-h-9 w-full items-center justify-center rounded-md bg-amber-300 px-3 py-2 text-[11px] font-bold uppercase text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-amber-300"
                      >
                        {restoringAppointmentId === appointment.id
                          ? "Restaurando..."
                          : "Restaurar"}
                      </button>
                    ) : (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          disabled={
                            appointment.status === "confirmed" ||
                            appointment.status === "cancelled" ||
                            confirmingAppointmentId === appointment.id ||
                            cancellingAppointmentId === appointment.id
                          }
                          onClick={() => handleConfirmAppointment(appointment)}
                          className="inline-flex min-h-9 items-center justify-center rounded-md bg-amber-300 px-3 py-2 text-[11px] font-bold uppercase text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-amber-300"
                        >
                          {confirmingAppointmentId === appointment.id
                            ? "Confirmando..."
                            : appointment.status === "confirmed"
                              ? "Confirmado"
                              : "Confirmar"}
                        </button>
                        <button
                          type="button"
                          disabled={
                            appointment.status === "cancelled" ||
                            confirmingAppointmentId === appointment.id ||
                            cancellingAppointmentId === appointment.id
                          }
                          onClick={() => handleSendWhatsApp(appointment)}
                          className="inline-flex min-h-9 items-center justify-center rounded-md border border-emerald-300/40 px-2 py-2 text-[11px] font-bold uppercase text-emerald-100 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                        >
                          WhatsApp
                        </button>
                        <button
                          type="button"
                          disabled={
                            appointment.status === "cancelled" ||
                            confirmingAppointmentId === appointment.id ||
                            cancellingAppointmentId === appointment.id
                          }
                          onClick={() => handleCancelAppointment(appointment)}
                          className="inline-flex min-h-9 items-center justify-center rounded-md border border-red-300/40 px-3 py-2 text-[11px] font-bold uppercase text-red-100 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                        >
                          {cancellingAppointmentId === appointment.id
                            ? "Cancelando..."
                            : appointment.status === "cancelled"
                              ? "Cancelado"
                              : "Cancelar"}
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>

              <div className="hidden divide-y divide-stone-800 lg:block">
                {filteredAppointments.map((appointment) => (
                  <article
                    key={
                      appointment.id ??
                      `${appointment.customer_phone}-${appointment.appointment_date}-${appointment.appointment_time}`
                    }
                    className="relative grid gap-4 px-5 py-5 text-sm text-stone-100 lg:grid-cols-[0.75fr_0.6fr_0.95fr_0.85fr_0.85fr_0.9fr_0.6fr_0.95fr_0.7fr_1.25fr] lg:items-center"
                  >
                    {appointment.status === "cancelled" ? (
                      <button
                        type="button"
                        disabled={deletingAppointmentId === appointment.id}
                        onClick={() => handleDeleteAppointment(appointment)}
                        className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-md border border-stone-700 bg-stone-950 text-sm font-black text-stone-300 transition hover:border-red-300/50 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Eliminar turno cancelado"
                      >
                        ×
                      </button>
                    ) : null}
                    <div>
                      <p className="text-xs font-bold uppercase text-stone-500 lg:hidden">
                        Fecha
                      </p>
                      {formatDateForDisplay(appointment.appointment_date)}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-stone-500 lg:hidden">
                        Horario
                      </p>
                      <span className="font-mono text-amber-300">
                        {appointment.appointment_time}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-stone-500 lg:hidden">
                        Cliente
                      </p>
                      {appointment.customer_name}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-stone-500 lg:hidden">
                        Teléfono
                      </p>
                      {appointment.customer_phone}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-stone-500 lg:hidden">
                        Barbero
                      </p>
                      {appointment.barber_name}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-stone-500 lg:hidden">
                        Servicio
                      </p>
                      {appointment.service_name}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-stone-500 lg:hidden">
                        Precio
                      </p>
                      {formatPrice(appointment.service_price)}
                    </div>
                    <div className="text-stone-300">
                      <p className="text-xs font-bold uppercase text-stone-500 lg:hidden">
                        Comentario
                      </p>
                      {appointment.comment || "Sin comentario"}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-stone-500 lg:hidden">
                        Estado
                      </p>
                      <span
                        className={`inline-flex rounded-md border px-2 py-1 text-xs font-bold uppercase ${getStatusClasses(
                          appointment.status,
                        )}`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-stone-500 lg:hidden">
                        Acción
                      </p>
                      {appointment.status === "deleted" ? (
                        <button
                          type="button"
                          disabled={restoringAppointmentId === appointment.id}
                          onClick={() => handleRestoreAppointment(appointment)}
                          className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-amber-300 px-4 py-2 text-xs font-bold uppercase text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-amber-300 lg:mt-0"
                        >
                          {restoringAppointmentId === appointment.id
                            ? "Restaurando..."
                            : "Restaurar"}
                        </button>
                      ) : (
                      <div className="mt-2 grid gap-2 lg:mt-0">
                        <button
                          type="button"
                          disabled={
                            appointment.status === "confirmed" ||
                            appointment.status === "cancelled" ||
                            confirmingAppointmentId === appointment.id ||
                            cancellingAppointmentId === appointment.id
                          }
                          onClick={() => handleConfirmAppointment(appointment)}
                          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-amber-300 px-4 py-2 text-xs font-bold uppercase text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-amber-300"
                        >
                          {confirmingAppointmentId === appointment.id
                            ? "Confirmando..."
                            : appointment.status === "confirmed"
                              ? "Confirmado"
                              : "Confirmar turno"}
                        </button>
                        <button
                          type="button"
                          disabled={
                            appointment.status === "cancelled" ||
                            confirmingAppointmentId === appointment.id ||
                            cancellingAppointmentId === appointment.id
                          }
                          onClick={() => handleSendWhatsApp(appointment)}
                          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-emerald-300/40 px-4 py-2 text-xs font-bold uppercase text-emerald-100 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                        >
                          Enviar WhatsApp
                        </button>
                        <button
                          type="button"
                          disabled={
                            appointment.status === "cancelled" ||
                            confirmingAppointmentId === appointment.id ||
                            cancellingAppointmentId === appointment.id
                          }
                          onClick={() => handleCancelAppointment(appointment)}
                          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-red-300/40 px-4 py-2 text-xs font-bold uppercase text-red-100 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                        >
                          {cancellingAppointmentId === appointment.id
                            ? "Cancelando..."
                            : appointment.status === "cancelled"
                              ? "Cancelado"
                              : "Cancelar turno"}
                        </button>
                      </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
