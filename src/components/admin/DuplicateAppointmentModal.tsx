"use client";

import { useEffect, useState } from "react";
import { Copy, X } from "lucide-react";
import { createPendingAppointment } from "@/lib/appointments";
import { cn } from "@/lib/cn";
import type { AppointmentRow } from "@/lib/supabase";

type DuplicateAppointmentModalProps = {
  isOpen: boolean;
  appointment: AppointmentRow | null;
  onClose: () => void;
  onCreated: (newAppointmentId: string) => void;
};

function addDays(dateIso: string, days: number): string {
  const d = new Date(`${dateIso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function DuplicateAppointmentModal({
  isOpen,
  appointment,
  onClose,
  onCreated,
}: DuplicateAppointmentModalProps) {
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Pre-fill cuando se abre el modal: misma hora, 14 días después
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen && appointment) {
      setNewDate(addDays(appointment.appointment_date, 14));
      setNewTime(appointment.appointment_time);
      setErrorMessage("");
    }
  }, [isOpen, appointment]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Escape cierra
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !appointment) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!appointment) return;
    if (!newDate || !newTime) {
      setErrorMessage("Completá fecha y horario.");
      return;
    }
    setErrorMessage("");
    setIsSaving(true);
    try {
      const { data, error } = await createPendingAppointment({
        barbershop_slug: appointment.barbershop_slug,
        barber_id: appointment.barber_id,
        barber_name: appointment.barber_name,
        customer_name: appointment.customer_name,
        customer_phone: appointment.customer_phone,
        customer_email: appointment.customer_email ?? null,
        service_name: appointment.service_name,
        service_price: appointment.service_price,
        service_duration_minutes: appointment.service_duration_minutes,
        appointment_date: newDate,
        appointment_time: newTime,
        comment: appointment.comment ?? "",
      });
      if (error || !data?.id) {
        setErrorMessage("No pudimos crear el turno. ¿Está ocupado ese horario?");
        return;
      }
      onCreated(data.id);
      onClose();
    } catch {
      setErrorMessage("No pudimos crear el turno.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Duplicar turno"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-t-[var(--radius-lg)] border border-[color:var(--border-default)] bg-[color:var(--surface-0)] shadow-2xl sm:rounded-[var(--radius-lg)]">
        <div className="flex items-center justify-between border-b border-[color:var(--border-subtle)] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--brand-gold)]">
              Duplicar turno
            </p>
            <p className="mt-0.5 text-[11px] text-[color:var(--text-muted)]">
              Crear un turno nuevo con los mismos datos.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex size-8 items-center justify-center rounded-[var(--radius-xs)] text-[color:var(--text-subtle)] transition-colors hover:bg-[color:var(--surface-1)] hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          {/* Resumen del turno original */}
          <div className="rounded-[var(--radius-xs)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--text-subtle)]">
              Cliente y servicio
            </p>
            <p className="mt-1.5 text-sm font-bold text-white">
              {appointment.customer_name}
            </p>
            <p className="text-xs text-[color:var(--text-secondary)]">
              {appointment.service_name} ·{" "}
              <span className="text-[color:var(--brand-gold)]">
                {appointment.barber_name}
              </span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="dup-date"
                  className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--text-muted)]"
                >
                  Nueva fecha
                </label>
                <input
                  id="dup-date"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  disabled={isSaving}
                  className="mt-1.5 min-h-11 w-full rounded-[var(--radius-sm)] border border-[color:var(--border-default)] bg-black px-3 text-sm text-white outline-none focus:border-[color:var(--brand-gold)]"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="dup-time"
                  className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--text-muted)]"
                >
                  Horario
                </label>
                <input
                  id="dup-time"
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  disabled={isSaving}
                  className="mt-1.5 min-h-11 w-full rounded-[var(--radius-sm)] border border-[color:var(--border-default)] bg-black px-3 text-sm text-white outline-none focus:border-[color:var(--brand-gold)]"
                  required
                />
              </div>
            </div>

            <p className="text-[10px] text-[color:var(--text-subtle)]">
              Por defecto el turno se crea para 2 semanas después, mismo
              horario. Ajustalo si querés.
            </p>

            {errorMessage ? (
              <p
                role="alert"
                className="border-l-2 border-[color:var(--danger)] pl-3 text-sm font-semibold text-[color:var(--danger)]"
              >
                {errorMessage}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className={cn(
                  "inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[color:var(--brand-gold)] px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-black transition-colors duration-[var(--duration-fast)] hover:bg-[color:var(--brand-gold-hi)] disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                <Copy className="size-3.5" />
                {isSaving ? "Creando…" : "Crear turno"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--border-default)] px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--text-secondary)] transition-colors duration-[var(--duration-fast)] hover:border-[color:var(--brand-gold)] hover:text-[color:var(--brand-gold)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
