"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  LineChart,
  MessageCircle,
  Phone,
  Plus,
  Scissors,
  Settings,
  Star,
  TrendingUp,
  User,
  Users,
  Wallet,
} from "lucide-react";
import type { DemoBarbershop } from "@/data/demo-barbershops";
import { listAppointmentsByBarbershop } from "@/lib/appointments";
import { cn } from "@/lib/cn";
import {
  formatPrice,
  normalizeDateValue,
  normalizeTimeValue,
  timeValueToMinutes,
} from "@/lib/format";
import type { AppointmentRow } from "@/lib/supabase";
import { formatDayHeading, getTodayYmd } from "./date-utils";

type AdminDashboardProps = {
  barbershop: DemoBarbershop;
};

type RelativeTimeInfo = {
  text: string;
  tone: "info" | "warning" | "danger" | "neutral";
};

function getCurrentTimeMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function getRelativeTimeForAppointment(
  startMinutes: number,
  endMinutes: number,
  nowMinutes: number,
): RelativeTimeInfo {
  if (nowMinutes >= endMinutes) {
    return { text: "Finalizado", tone: "neutral" };
  }
  if (nowMinutes >= startMinutes) {
    return { text: "En curso", tone: "info" };
  }
  const minutesUntil = startMinutes - nowMinutes;
  if (minutesUntil <= 60) {
    return {
      text: `Empieza en ${minutesUntil} min`,
      tone: minutesUntil <= 15 ? "warning" : "info",
    };
  }
  const hours = Math.floor(minutesUntil / 60);
  return { text: `Empieza en ${hours}h`, tone: "info" };
}

const STATUS_META: Record<
  string,
  { label: string; dotColor: string; pillClasses: string }
> = {
  pending: {
    label: "Pendiente",
    dotColor: "bg-amber-400",
    pillClasses: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  },
  confirmed: {
    label: "Confirmado",
    dotColor: "bg-[color:var(--success)]",
    pillClasses:
      "border-[color:var(--success)]/40 bg-[color:var(--success-soft)] text-[color:var(--success)]",
  },
  cancelled: {
    label: "Cancelado",
    dotColor: "bg-[color:var(--danger)]",
    pillClasses:
      "border-[color:var(--danger)]/40 bg-[color:var(--danger-soft)] text-[color:var(--danger)]",
  },
};

const TONE_CHIP: Record<RelativeTimeInfo["tone"], string> = {
  info: "border-sky-400/30 bg-sky-400/[0.06] text-sky-300",
  warning: "border-amber-400/30 bg-amber-400/[0.06] text-amber-300",
  danger:
    "border-[color:var(--danger)]/30 bg-[color:var(--danger-soft)] text-[color:var(--danger)]",
  neutral:
    "border-[color:var(--border-default)] bg-[color:var(--surface-0)] text-[color:var(--text-muted)]",
};

/**
 * Hook que re-renderiza cada 60s para mantener fresca la información temporal.
 */
function useTickingMinute() {
  const [, force] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => force((v) => v + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);
}

export function AdminDashboard({ barbershop }: AdminDashboardProps) {
  useTickingMinute();

  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const today = getTodayYmd();
  const currentMinutes = getCurrentTimeMinutes();

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const { data, error } = await listAppointmentsByBarbershop(
          barbershop.slug,
        );
        if (!isMounted) return;
        if (error) {
          setErrorMessage("No pudimos cargar las reservas.");
          setAppointments([]);
          return;
        }
        setAppointments(data ?? []);
      } catch {
        if (isMounted) {
          setErrorMessage("No pudimos cargar las reservas.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [barbershop.slug]);

  // Turnos del día (sin eliminados)
  const todayAppointments = useMemo(
    () =>
      appointments.filter(
        (a) =>
          a.status !== "deleted" &&
          normalizeDateValue(a.appointment_date) === today,
      ),
    [appointments, today],
  );

  // Turnos activos (pending/confirmed) — el "trabajo del día"
  const activeAppointments = useMemo(
    () =>
      todayAppointments.filter(
        (a) => a.status === "pending" || a.status === "confirmed",
      ),
    [todayAppointments],
  );

  // KPIs operativos
  const stats = useMemo(() => {
    const total = todayAppointments.length;
    const pending = todayAppointments.filter(
      (a) => a.status === "pending",
    ).length;
    const confirmed = todayAppointments.filter(
      (a) => a.status === "confirmed",
    ).length;
    const cancelled = todayAppointments.filter(
      (a) => a.status === "cancelled",
    ).length;

    // Ingresos estimados = suma de service_price de activos (no cancelados/eliminados)
    const estimatedRevenue = activeAppointments.reduce(
      (sum, a) => sum + (a.service_price ?? 0),
      0,
    );

    // Ocupación = total minutos turnos activos / minutos disponibles del día
    const totalTurnoMinutes = activeAppointments.reduce(
      (sum, a) => sum + (a.service_duration_minutes ?? 0),
      0,
    );
    const workingStartMin = timeValueToMinutes(barbershop.workingHours.start);
    const workingEndMin = timeValueToMinutes(barbershop.workingHours.end);
    const availableMinutes = Math.max(
      0,
      (workingEndMin - workingStartMin) * Math.max(barbershop.barbers.length, 1),
    );
    const occupancyPct =
      availableMinutes > 0
        ? Math.min(100, Math.round((totalTurnoMinutes / availableMinutes) * 100))
        : 0;

    // Cierre estimado = max(start + duration) de los activos
    const latestEndMinutes = activeAppointments.reduce((max, a) => {
      const end =
        timeValueToMinutes(a.appointment_time) +
        (a.service_duration_minutes ?? 0);
      return end > max ? end : max;
    }, 0);
    const baseClosingMin = workingEndMin;
    const effectiveClosingMin =
      latestEndMinutes > baseClosingMin ? latestEndMinutes : baseClosingMin;

    return {
      total,
      pending,
      confirmed,
      cancelled,
      estimatedRevenue,
      occupancyPct,
      effectiveClosingMin,
      hasOvertime: latestEndMinutes > baseClosingMin,
      baseClosingMin,
    };
  }, [todayAppointments, activeAppointments, barbershop]);

  // Próximo turno + lista de siguientes
  const upcomingSorted = useMemo(() => {
    return activeAppointments
      .filter((a) => timeValueToMinutes(a.appointment_time) >= currentMinutes)
      .sort(
        (a, b) =>
          timeValueToMinutes(a.appointment_time) -
          timeValueToMinutes(b.appointment_time),
      );
  }, [activeAppointments, currentMinutes]);

  const upcomingAppointment = upcomingSorted[0];
  const nextFewAppointments = upcomingSorted.slice(0, 6);

  // Alertas operativas (dinámicas)
  const operationalAlerts = useMemo(() => {
    const alerts: Array<{
      key: string;
      tone: "warning" | "danger" | "info";
      text: string;
    }> = [];

    if (stats.pending > 0) {
      alerts.push({
        key: "pending",
        tone: stats.pending >= 3 ? "warning" : "info",
        text: `${stats.pending} turno${stats.pending === 1 ? "" : "s"} sin confirmar`,
      });
    }
    if (stats.hasOvertime) {
      const overMin = stats.effectiveClosingMin - stats.baseClosingMin;
      alerts.push({
        key: "overtime",
        tone: "warning",
        text: `Cierre extendido +${overMin} min (hasta ${formatMinutesToTime(stats.effectiveClosingMin)})`,
      });
    }
    if (stats.cancelled >= 3) {
      alerts.push({
        key: "cancellations",
        tone: "warning",
        text: `${stats.cancelled} turnos cancelados hoy`,
      });
    }

    return alerts;
  }, [stats]);

  // Resumen del día — texto inteligente que comunica "cómo va"
  const daySummary = useMemo(() => {
    if (stats.total === 0) return "Día sin turnos cargados todavía";
    if (stats.total === 1) return "1 turno programado";
    return `${stats.total} turnos programados`;
  }, [stats.total]);

  const baseClosingStr = formatMinutesToTime(stats.baseClosingMin);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ─────────────── HEADER útil ─────────────── */}
      <header className="animate-fade-up">
        <h1 className="text-3xl font-black uppercase tracking-tight text-balance text-white sm:text-4xl lg:text-5xl">
          {barbershop.name}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[color:var(--text-secondary)] sm:text-base">
          <span className="capitalize">{formatDayHeading(today)}</span>
          <span className="text-[color:var(--text-subtle)]">·</span>
          <span className="text-[color:var(--text-muted)]">
            {daySummary}
          </span>
          {stats.total > 0 ? (
            <>
              <span className="text-[color:var(--text-subtle)]">·</span>
              <span className="inline-flex items-center gap-1 text-[color:var(--text-muted)]">
                <Clock3
                  className="size-3.5 text-[color:var(--text-subtle)]"
                  aria-hidden="true"
                />
                Cierre {baseClosingStr}
              </span>
            </>
          ) : null}
        </div>
      </header>

      {isLoading ? <DashboardSkeleton /> : null}

      {!isLoading && errorMessage ? (
        <div
          role="alert"
          className="rounded-[var(--radius-sm)] border border-[color:var(--danger)]/30 bg-[color:var(--danger-soft)] p-4 text-sm font-semibold text-[color:var(--danger)]"
        >
          {errorMessage}
        </div>
      ) : null}

      {!isLoading && !errorMessage ? (
        <>
          {/* ─────────────── ALERTAS operativas (solo si hay) ─────────────── */}
          {operationalAlerts.length > 0 ? (
            <section className="grid gap-2 sm:grid-cols-2">
              {operationalAlerts.map((alert) => (
                <div
                  key={alert.key}
                  className={cn(
                    "flex items-start gap-2.5 rounded-[var(--radius-sm)] border p-3",
                    alert.tone === "danger"
                      ? "border-[color:var(--danger)]/30 bg-[color:var(--danger-soft)]"
                      : alert.tone === "warning"
                        ? "border-amber-400/30 bg-amber-400/[0.06]"
                        : "border-sky-400/30 bg-sky-400/[0.06]",
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      alert.tone === "danger"
                        ? "text-[color:var(--danger)]"
                        : alert.tone === "warning"
                          ? "text-amber-300"
                          : "text-sky-300",
                    )}
                    aria-hidden="true"
                  />
                  <p
                    className={cn(
                      "text-[12px] font-semibold leading-relaxed sm:text-sm",
                      alert.tone === "danger"
                        ? "text-[color:var(--danger)]"
                        : alert.tone === "warning"
                          ? "text-amber-200"
                          : "text-sky-200",
                    )}
                  >
                    {alert.text}
                  </p>
                </div>
              ))}
            </section>
          ) : null}

          {/* ─────────────── PRÓXIMO TURNO + KPIs ─────────────── */}
          <section className="grid gap-4 sm:gap-6 lg:grid-cols-[1.2fr_1fr]">
            {/* Próximo turno HERO */}
            <NextAppointmentHero
              appointment={upcomingAppointment}
              currentMinutes={currentMinutes}
              barbershopSlug={barbershop.slug}
            />

            {/* KPIs grid */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--text-muted)]">
                KPIs del día
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2">
                <KpiCell
                  label="Turnos"
                  value={String(stats.total)}
                  accent="gold"
                />
                <KpiCell
                  label="Ingresos est."
                  value={formatPrice(stats.estimatedRevenue)}
                  hint="Pendiente + confirmado"
                  icon={<Wallet className="size-3.5" aria-hidden="true" />}
                />
                <KpiCell
                  label="Pendientes"
                  value={String(stats.pending)}
                  accent={stats.pending > 0 ? "warning" : undefined}
                />
                <KpiCell
                  label="Confirmados"
                  value={String(stats.confirmed)}
                  accent={stats.confirmed > 0 ? "success" : undefined}
                />
                <KpiCell
                  label="Ocupación"
                  value={`${stats.occupancyPct}%`}
                  icon={<TrendingUp className="size-3.5" aria-hidden="true" />}
                />
                <KpiCell
                  label="Cierre est."
                  value={formatMinutesToTime(stats.effectiveClosingMin)}
                  hint={
                    stats.hasOvertime
                      ? `Base ${baseClosingStr}`
                      : "Sin extensión"
                  }
                  accent={stats.hasOvertime ? "warning" : undefined}
                />
              </div>
            </div>
          </section>

          {/* ─────────────── AGENDA DEL DÍA enriquecida ─────────────── */}
          <section>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-gold)]">
                  Agenda del día
                </p>
                <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                  {nextFewAppointments.length === 0
                    ? "No quedan más turnos hoy"
                    : `Próximos ${nextFewAppointments.length}`}
                </p>
              </div>
              <Link
                href={`/${barbershop.slug}/admin/turnero`}
                className="inline-flex min-h-9 items-center gap-1 rounded-[var(--radius-xs)] border border-[color:var(--border-default)] bg-[color:var(--surface-1)] px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--text-secondary)] transition-colors duration-[var(--duration-fast)] press-shrink hover:border-[color:var(--brand-gold)] hover:text-[color:var(--brand-gold)]"
              >
                Ver todo
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>

            {nextFewAppointments.length === 0 ? (
              <div className="mt-4 rounded-[var(--radius-sm)] border border-dashed border-white/[0.06] p-6 text-center">
                <p className="text-sm text-[color:var(--text-subtle)]">
                  Día tranquilo. Sin más turnos cargados.
                </p>
              </div>
            ) : (
              <ul className="mt-4 grid gap-2 animate-stagger">
                {nextFewAppointments.map((appointment) => {
                  const startMin = timeValueToMinutes(
                    appointment.appointment_time,
                  );
                  const endMin =
                    startMin + (appointment.service_duration_minutes ?? 0);
                  const rel = getRelativeTimeForAppointment(
                    startMin,
                    endMin,
                    currentMinutes,
                  );
                  const statusMeta =
                    STATUS_META[appointment.status ?? "pending"];
                  return (
                    <li key={appointment.id}>
                      <Link
                        href={`/${barbershop.slug}/admin/turnero`}
                        className="hover-lift block rounded-[var(--radius-sm)] border border-white/[0.04] bg-[color:var(--surface-1)] p-3"
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          {/* Hora */}
                          <div className="w-14 shrink-0">
                            <p className="font-mono text-base font-black tabular-nums leading-none text-white sm:text-lg">
                              {normalizeTimeValue(appointment.appointment_time)}
                            </p>
                            <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--text-subtle)]">
                              {appointment.service_duration_minutes} min
                            </p>
                          </div>

                          {/* Bar de estado */}
                          <div
                            aria-hidden="true"
                            className={cn(
                              "w-[2px] shrink-0 self-stretch rounded-full",
                              statusMeta?.dotColor ??
                                "bg-[color:var(--text-subtle)]",
                            )}
                          />

                          {/* Contenido */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-white sm:text-base">
                              {appointment.customer_name}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-[color:var(--text-muted)] sm:text-sm">
                              {appointment.service_name} ·{" "}
                              {appointment.barber_name}
                            </p>
                          </div>

                          {/* Status + relative */}
                          <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                            {statusMeta ? (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]",
                                  statusMeta.pillClasses,
                                )}
                              >
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    "inline-block size-1.5 rounded-full",
                                    statusMeta.dotColor,
                                  )}
                                />
                                {statusMeta.label}
                              </span>
                            ) : null}
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]",
                                TONE_CHIP[rel.tone],
                              )}
                            >
                              {rel.text}
                            </span>
                          </div>
                        </div>

                        {/* En mobile, status+relative van debajo en row separada */}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:hidden">
                          {statusMeta ? (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]",
                                statusMeta.pillClasses,
                              )}
                            >
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "inline-block size-1.5 rounded-full",
                                  statusMeta.dotColor,
                                )}
                              />
                              {statusMeta.label}
                            </span>
                          ) : null}
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]",
                              TONE_CHIP[rel.tone],
                            )}
                          >
                            {rel.text}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* ─────────────── ACCIONES RÁPIDAS ─────────────── */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--text-muted)]">
              Acciones rápidas
            </p>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
              <Link
                href={`/${barbershop.slug}/reservar`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[color:var(--brand-gold)] px-4 text-[12px] font-bold uppercase tracking-[0.16em] text-black transition-all duration-[var(--duration-fast)] press-shrink hover:bg-[color:var(--brand-gold-hi)] hover:shadow-[0_0_0_3px_var(--brand-gold-ring)]"
              >
                <Plus className="size-4" aria-hidden="true" />
                Nuevo turno
              </Link>
              <QuickAction
                href={`/${barbershop.slug}/admin/turnero`}
                icon={<CalendarDays className="size-4" aria-hidden="true" />}
                label="Turnero"
              />
              <QuickAction
                href={`/${barbershop.slug}/admin/reportes`}
                icon={<LineChart className="size-4" aria-hidden="true" />}
                label="Reportes"
              />
              <QuickAction
                href={`/${barbershop.slug}/admin/settings`}
                icon={<Settings className="size-4" aria-hidden="true" />}
                label="Configuración"
              />
            </div>
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
              <QuickAction
                href={`/${barbershop.slug}/admin/clientes`}
                icon={<User className="size-4" aria-hidden="true" />}
                label="Clientes"
              />
              <QuickAction
                href={`/${barbershop.slug}/admin/barbers`}
                icon={<Users className="size-4" aria-hidden="true" />}
                label="Barberos"
              />
              <QuickAction
                href={`/${barbershop.slug}/admin/resenas`}
                icon={<Star className="size-4" aria-hidden="true" />}
                label="Reseñas"
              />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */

function NextAppointmentHero({
  appointment,
  currentMinutes,
  barbershopSlug,
}: {
  appointment: AppointmentRow | undefined;
  currentMinutes: number;
  barbershopSlug: string;
}) {
  if (!appointment) {
    return (
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-gold)]">
          Próximo turno
        </p>
        <div className="mt-3 rounded-[var(--radius-md)] border border-dashed border-white/[0.06] p-6 text-center">
          <Clock3
            className="mx-auto size-7 text-[color:var(--text-subtle)]"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-bold text-white">
            No hay próximos turnos
          </p>
          <p className="mt-1 text-xs text-[color:var(--text-muted)]">
            Día tranquilo. Aprovechá para ordenar otras cosas.
          </p>
        </div>
      </div>
    );
  }

  const startMin = timeValueToMinutes(appointment.appointment_time);
  const endMin = startMin + (appointment.service_duration_minutes ?? 0);
  const rel = getRelativeTimeForAppointment(startMin, endMin, currentMinutes);
  const statusMeta = STATUS_META[appointment.status ?? "pending"];
  const phoneDigits = appointment.customer_phone?.replace(/\D+/g, "") ?? "";
  const phoneWaHref = phoneDigits ? `https://wa.me/${phoneDigits}` : null;

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-gold)]">
        Próximo turno
      </p>
      <div className="mt-3 rounded-[var(--radius-md)] border border-[color:var(--brand-gold)]/30 bg-[color:var(--brand-gold-soft)] p-5 ring-1 ring-[color:var(--brand-gold)]/20 sm:p-6">
        {/* Top row: hora + status pill */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-5xl font-black tabular-nums leading-none text-[color:var(--brand-gold)] sm:text-6xl">
              {normalizeTimeValue(appointment.appointment_time)}
            </p>
            <p
              className={cn(
                "mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]",
                TONE_CHIP[rel.tone],
              )}
            >
              {rel.text}
            </p>
          </div>
          {statusMeta ? (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
                statusMeta.pillClasses,
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "inline-block size-1.5 rounded-full",
                  statusMeta.dotColor,
                )}
              />
              {statusMeta.label}
            </span>
          ) : null}
        </div>

        {/* Cliente — HERO secundario */}
        <h2 className="mt-5 truncate text-2xl font-black tracking-tight text-white sm:text-3xl">
          {appointment.customer_name}
        </h2>

        {/* Servicio + duración + precio */}
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-white sm:text-base">
            <Scissors
              className="size-4 text-[color:var(--text-subtle)]"
              aria-hidden="true"
            />
            {appointment.service_name}
            <span className="text-[color:var(--text-subtle)]">·</span>
            <span className="font-medium text-[color:var(--text-muted)]">
              {appointment.service_duration_minutes} min
            </span>
          </span>
          <span className="font-mono text-lg font-black tabular-nums text-[color:var(--brand-gold)] sm:text-xl">
            {formatPrice(appointment.service_price)}
          </span>
        </div>

        {/* Barbero + tel */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 text-[13px] text-[color:var(--text-muted)] sm:text-sm">
          <span className="inline-flex items-center gap-1.5">
            <User
              className="size-4 text-[color:var(--text-subtle)]"
              aria-hidden="true"
            />
            {appointment.barber_name}
          </span>
          {appointment.customer_phone ? (
            <>
              <span className="text-[color:var(--text-subtle)]">•</span>
              {phoneWaHref ? (
                <a
                  href={phoneWaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--brand-gold)]"
                  title="Abrir en WhatsApp"
                >
                  <Phone
                    className="size-4 text-[color:var(--text-subtle)]"
                    aria-hidden="true"
                  />
                  {appointment.customer_phone}
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <Phone
                    className="size-4 text-[color:var(--text-subtle)]"
                    aria-hidden="true"
                  />
                  {appointment.customer_phone}
                </span>
              )}
            </>
          ) : null}
        </div>

        {/* Acciones rápidas del próximo turno */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Link
            href={`/${barbershopSlug}/admin/turnero`}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[color:var(--brand-gold)]/40 bg-[color:var(--surface-1)] px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--brand-gold)] transition-all duration-[var(--duration-fast)] press-shrink hover:border-[color:var(--brand-gold)] hover:bg-[color:var(--brand-gold-soft)]"
          >
            Abrir en turnero
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
          {phoneWaHref ? (
            <a
              href={phoneWaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[color:var(--success)]/40 bg-[color:var(--success-soft)] px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--success)] transition-all duration-[var(--duration-fast)] press-shrink hover:bg-[color:var(--success)]/20"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function KpiCell({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  accent?: "gold" | "warning" | "success" | "danger";
}) {
  const accentValueClass =
    accent === "gold"
      ? "text-[color:var(--brand-gold)]"
      : accent === "warning"
        ? "text-amber-300"
        : accent === "success"
          ? "text-[color:var(--success)]"
          : accent === "danger"
            ? "text-[color:var(--danger)]"
            : "text-white";
  const borderClass =
    accent === "gold"
      ? "border-[color:var(--brand-gold)]/20 bg-[color:var(--brand-gold-soft)]"
      : accent === "warning"
        ? "border-amber-400/20 bg-amber-400/[0.04]"
        : "border-white/[0.04] bg-[color:var(--surface-1)]";

  return (
    <div
      className={cn(
        "rounded-[var(--radius-sm)] border px-3 py-2.5 transition-colors duration-[var(--duration-fast)]",
        borderClass,
      )}
    >
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
        {icon ? (
          <span className="text-[color:var(--text-subtle)]">{icon}</span>
        ) : null}
        {label}
      </div>
      <p
        className={cn(
          "mt-1 font-mono text-xl font-black tabular-nums leading-none sm:text-2xl",
          accentValueClass,
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[10px] text-[color:var(--text-subtle)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-white/[0.06] bg-[color:var(--surface-1)] px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--text-secondary)] transition-all duration-[var(--duration-fast)] press-shrink hover:border-[color:var(--brand-gold)]/40 hover:bg-[color:var(--brand-gold-soft)] hover:text-[color:var(--brand-gold)]"
    >
      {icon}
      {label}
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPIs skeleton */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="rounded-[var(--radius-sm)] border border-white/[0.04] bg-[color:var(--surface-1)] p-3"
          >
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton mt-2 h-7 w-12 rounded" />
          </div>
        ))}
      </div>
      {/* Hero skeleton */}
      <div className="rounded-[var(--radius-md)] border border-white/[0.04] bg-[color:var(--surface-1)] p-6">
        <div className="skeleton h-12 w-32 rounded" />
        <div className="skeleton mt-4 h-6 w-48 rounded" />
        <div className="skeleton mt-2 h-4 w-40 rounded" />
      </div>
      {/* List skeleton */}
      <div className="grid gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-white/[0.04] bg-[color:var(--surface-1)] p-3"
          >
            <div className="skeleton h-10 w-12 rounded" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-48 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}
