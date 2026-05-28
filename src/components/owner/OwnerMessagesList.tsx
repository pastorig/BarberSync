"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MessageCircle, RotateCcw } from "lucide-react";
import { getCurrentSession } from "@/lib/auth";
import { cn } from "@/lib/cn";
import {
  listContactRequests,
  markContactRequestHandled,
  unmarkContactRequestHandled,
} from "@/lib/contact-requests";
import type { ContactRequestRow } from "@/lib/supabase";

type Filter = "pending" | "handled" | "all";

const FILTER_OPTIONS: Array<{ value: Filter; label: string }> = [
  { value: "pending", label: "Pendientes" },
  { value: "handled", label: "Atendidos" },
  { value: "all", label: "Todos" },
];

function formatDate(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function OwnerMessagesList() {
  const [requests, setRequests] = useState<ContactRequestRow[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const { data, error } = await listContactRequests();
        if (!isMounted) return;
        if (error) {
          setErrorMessage("No pudimos cargar los mensajes.");
          setRequests([]);
          return;
        }
        setRequests(data ?? []);
      } catch {
        if (isMounted) setErrorMessage("No pudimos cargar los mensajes.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleMarkHandled(request: ContactRequestRow) {
    setUpdatingId(request.id);
    setErrorMessage("");
    try {
      const { data: sessionData } = await getCurrentSession();
      const userId = sessionData.session?.user.id ?? null;
      const { data, error } = await markContactRequestHandled({
        requestId: request.id,
        handledByUserId: userId,
      });
      if (error || !data) {
        setErrorMessage("No pudimos marcar el mensaje como atendido.");
        return;
      }
      setRequests((current) =>
        current.map((r) => (r.id === request.id ? data : r)),
      );
    } catch {
      setErrorMessage("No pudimos marcar el mensaje como atendido.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleUnmark(request: ContactRequestRow) {
    setUpdatingId(request.id);
    setErrorMessage("");
    try {
      const { data, error } = await unmarkContactRequestHandled(request.id);
      if (error || !data) {
        setErrorMessage("No pudimos reabrir el mensaje.");
        return;
      }
      setRequests((current) =>
        current.map((r) => (r.id === request.id ? data : r)),
      );
    } catch {
      setErrorMessage("No pudimos reabrir el mensaje.");
    } finally {
      setUpdatingId(null);
    }
  }

  const visibleRequests = requests.filter((request) => {
    if (filter === "all") return true;
    if (filter === "pending") return request.handled_at === null;
    return request.handled_at !== null;
  });

  const pendingCount = requests.filter((r) => r.handled_at === null).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="animate-fade-up">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-gold)] sm:tracking-[0.32em]">
          Mensajes
        </p>
        <h1 className="mt-4 text-3xl font-black uppercase tracking-tight text-balance text-white sm:text-4xl lg:text-5xl">
          Bandeja de entrada
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)] sm:text-base">
          Mensajes que llegan desde el formulario de contacto público de la
          home. Marcalos como atendidos cuando termines de responder.
        </p>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = filter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilter(opt.value)}
                className={cn(
                  "inline-flex min-h-9 shrink-0 items-center rounded-[var(--radius-sm)] border px-3 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors duration-[var(--duration-fast)]",
                  isActive
                    ? "border-[color:var(--brand-gold)] bg-[color:var(--brand-gold)] text-black"
                    : "border-[color:var(--border-default)] text-[color:var(--text-secondary)] hover:border-[color:var(--brand-gold)] hover:text-[color:var(--brand-gold)]",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
          {pendingCount} sin responder
        </p>
      </section>

      {errorMessage ? (
        <p
          role="alert"
          className="border-l-2 border-[color:var(--danger)] pl-4 text-sm font-semibold text-[color:var(--danger)]"
        >
          {errorMessage}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-[color:var(--text-muted)]">
          Cargando mensajes…
        </p>
      ) : visibleRequests.length === 0 ? (
        <div className="rounded-[var(--radius-sm)] border border-dashed border-[color:var(--border-subtle)] p-10 text-center">
          <p className="text-sm font-bold text-white">No hay mensajes acá</p>
          <p className="mt-2 text-xs text-[color:var(--text-muted)]">
            {filter === "pending"
              ? "Cuando llegue un mensaje nuevo del formulario público, aparece acá."
              : "Cambiá el filtro para ver otros mensajes."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {visibleRequests.map((request) => {
            const isHandled = request.handled_at !== null;
            const isBusy = updatingId === request.id;
            return (
              <li
                key={request.id}
                className={cn(
                  "rounded-[var(--radius-md)] border bg-[color:var(--surface-1)] p-5",
                  isHandled
                    ? "border-[color:var(--border-subtle)] opacity-60"
                    : "border-[color:var(--brand-gold)]/30",
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-bold text-white">
                      {request.name}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-[color:var(--text-muted)]">
                      {formatDate(request.created_at)}
                    </p>
                  </div>
                  {isHandled ? (
                    <span className="inline-flex items-center gap-1 rounded-[var(--radius-xs)] border border-[color:var(--success)]/40 bg-[color:var(--success-soft)] px-2 py-1 text-[10px] font-bold uppercase text-[color:var(--success)]">
                      <CheckCircle2 className="size-3" />
                      Atendido
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-[var(--radius-xs)] border border-[color:var(--brand-gold)]/40 bg-[color:var(--brand-gold-soft)] px-2 py-1 text-[10px] font-bold uppercase text-[color:var(--brand-gold)]">
                      Pendiente
                    </span>
                  )}
                </div>

                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[color:var(--text-secondary)]">
                  {request.message}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[color:var(--border-subtle)] pt-3 text-xs">
                  {request.email ? (
                    <a
                      href={`mailto:${request.email}`}
                      className="font-mono text-[color:var(--brand-gold)] transition-colors duration-[var(--duration-fast)] hover:text-[color:var(--brand-gold-hi)]"
                    >
                      {request.email}
                    </a>
                  ) : null}
                  {request.phone ? (
                    <a
                      href={`https://wa.me/${request.phone.replace(/\D+/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[color:var(--success)] transition-colors duration-[var(--duration-fast)] hover:opacity-80"
                    >
                      <MessageCircle className="size-3" />
                      {request.phone}
                    </a>
                  ) : null}
                  <span className="ml-auto">
                    {isHandled ? (
                      <button
                        type="button"
                        onClick={() => handleUnmark(request)}
                        disabled={isBusy}
                        className="inline-flex min-h-8 items-center gap-1 rounded-[var(--radius-xs)] border border-[color:var(--border-default)] px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--text-secondary)] transition-colors duration-[var(--duration-fast)] hover:border-[color:var(--brand-gold)] hover:text-[color:var(--brand-gold)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <RotateCcw className="size-3" />
                        Reabrir
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMarkHandled(request)}
                        disabled={isBusy}
                        className="inline-flex min-h-8 items-center gap-1 rounded-[var(--radius-xs)] border border-[color:var(--success)]/40 bg-[color:var(--success-soft)] px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--success)] transition-colors duration-[var(--duration-fast)] hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2 className="size-3" />
                        Marcar atendido
                      </button>
                    )}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
