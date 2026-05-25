"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getOwnerDashboardMetrics,
  type OwnerDashboardMetrics,
} from "@/lib/owner-metrics";

const emptyMetrics: OwnerDashboardMetrics = {
  knownBarbershopsCount: 0,
  totalBarbersCount: 0,
  totalAppointmentsCount: 0,
  todayAppointmentsCount: 0,
  activeServicesCount: 0,
  barbershops: [],
};

export function OwnerDashboard() {
  const [metrics, setMetrics] = useState<OwnerDashboardMetrics>(emptyMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadMetrics() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const { data, error } = await getOwnerDashboardMetrics();

        if (!isMounted) {
          return;
        }

        if (error) {
          setErrorMessage("No pudimos cargar las metricas owner.");
          setMetrics(data);
          return;
        }

        setMetrics(data);
      } catch {
        if (isMounted) {
          setErrorMessage("No pudimos cargar las metricas owner.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMetrics();

    return () => {
      isMounted = false;
    };
  }, []);

  const summaryCards = [
    {
      label: "Barberias",
      value: metrics.knownBarbershopsCount,
    },
    {
      label: "Barberos",
      value: metrics.totalBarbersCount,
    },
    {
      label: "Reservas totales",
      value: metrics.totalAppointmentsCount,
    },
    {
      label: "Reservas de hoy",
      value: metrics.todayAppointmentsCount,
    },
    {
      label: "Servicios activos",
      value: metrics.activeServicesCount,
    },
  ];

  return (
    <main className="min-h-screen bg-stone-950 text-stone-50">
      <section className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-8 lg:px-12 lg:py-12">
        <div className="rounded-lg border border-stone-800 bg-stone-900/70 p-4 shadow-2xl shadow-black/25 sm:p-6">
          <p className="text-xs font-semibold uppercase text-amber-300 sm:text-sm">
            BarberSync
          </p>
          <h1 className="mt-2 text-3xl font-black text-stone-50 sm:text-5xl">
            Owner
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-300 sm:text-base sm:leading-7">
            Vista central de barberias conocidas, operacion general y accesos
            rapidos a cada demo.
          </p>
        </div>

        {isLoading ? (
          <div className="mt-4 rounded-lg border border-stone-800 bg-stone-900/70 p-5 text-stone-300 sm:mt-6">
            Cargando dashboard owner...
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 p-5 text-sm font-semibold text-red-200 sm:mt-6">
            {errorMessage}
          </div>
        ) : null}

        {!isLoading ? (
          <>
            <section className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:grid-cols-3 lg:grid-cols-5">
              {summaryCards.map((card) => (
                <article
                  key={card.label}
                  className="rounded-lg border border-stone-800 bg-stone-900/70 p-3 shadow-lg shadow-black/20 sm:p-4"
                >
                  <p className="text-[11px] font-bold uppercase text-stone-500">
                    {card.label}
                  </p>
                  <p className="mt-2 font-mono text-2xl font-black text-amber-300 sm:text-3xl">
                    {card.value}
                  </p>
                </article>
              ))}
            </section>

            <section className="mt-5 rounded-lg border border-stone-800 bg-stone-900/70 p-3 shadow-xl shadow-black/20 sm:mt-8 sm:p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-amber-300">
                    Barberias
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-stone-100">
                    Listado general
                  </h2>
                </div>
                <div className="rounded-md border border-stone-800 bg-stone-950 px-3 py-2 text-xs text-stone-400">
                  {metrics.barbershops.length} conocidas
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {metrics.barbershops.map((barbershop) => (
                  <article
                    key={barbershop.slug}
                    className="rounded-lg border border-stone-800 bg-stone-950/80 p-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
                      <div>
                        <h3 className="text-lg font-black text-stone-100 sm:text-xl">
                          {barbershop.name}
                        </h3>
                        <p className="mt-1 text-xs font-semibold uppercase text-stone-500">
                          /{barbershop.slug}
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-md">
                          <div className="rounded-md border border-stone-800 bg-stone-900 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase text-stone-500">
                              Barberos
                            </p>
                            <p className="mt-1 font-mono text-lg font-black text-amber-300">
                              {barbershop.barberCount}
                            </p>
                          </div>
                          <div className="rounded-md border border-stone-800 bg-stone-900 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase text-stone-500">
                              Reservas
                            </p>
                            <p className="mt-1 font-mono text-lg font-black text-amber-300">
                              {barbershop.appointmentCount}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:w-56">
                        <Link
                          href={`/${barbershop.slug}`}
                          className="inline-flex min-h-10 items-center justify-center rounded-md border border-stone-700 px-3 py-2 text-center text-xs font-bold uppercase text-stone-100 transition hover:border-amber-300 hover:text-amber-200"
                        >
                          Pagina publica
                        </Link>
                        <Link
                          href={`/${barbershop.slug}/admin`}
                          className="inline-flex min-h-10 items-center justify-center rounded-md bg-amber-300 px-3 py-2 text-center text-xs font-bold uppercase text-stone-950 transition hover:bg-amber-200"
                        >
                          Ver admin
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
