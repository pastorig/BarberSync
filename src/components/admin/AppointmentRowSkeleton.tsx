import { Skeleton } from "@/components/ui";

/**
 * Skeleton loader que mimetiza el layout del AppointmentRow rediseñado.
 * Se usa durante la carga inicial del turnero para evitar el "Cargando..."
 * frio. El shimmer dorado da sensación de actividad.
 */
export function AppointmentRowSkeleton() {
  return (
    <li
      aria-hidden="true"
      className="relative rounded-[var(--radius-sm)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)]"
    >
      <div className="flex items-stretch gap-3 p-3 sm:gap-4 sm:p-4">
        {/* Columna de hora */}
        <div className="flex w-14 shrink-0 flex-col items-start justify-center gap-1.5 sm:w-16">
          <Skeleton className="h-5 w-12 rounded" />
          <Skeleton className="h-2 w-10 rounded" />
        </div>

        {/* Barra de estado */}
        <div className="w-[3px] shrink-0 rounded-full bg-[color:var(--surface-3)]" />

        {/* Cuerpo */}
        <div className="min-w-0 flex-1 space-y-2">
          {/* Línea de nombre + badges */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24 sm:h-5 sm:w-28" />
              <Skeleton className="h-3 w-10 rounded" />
            </div>
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-7 w-8 rounded" />
            </div>
          </div>
          {/* Servicio + precio */}
          <Skeleton className="h-3 w-40 sm:h-3.5 sm:w-52" />
          {/* Barber + tel */}
          <Skeleton className="h-2.5 w-56" />
          {/* Info row consolidada */}
          <div className="mt-3 rounded-[var(--radius-xs)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-0)]/60 px-2.5 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Skeleton className="h-3 w-48" />
              <div className="flex gap-1">
                <Skeleton className="h-7 w-8 rounded" />
                <Skeleton className="h-7 w-8 rounded" />
                <Skeleton className="h-7 w-8 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer con 3 botones de acción */}
      <div className="grid grid-cols-3 border-t border-[color:var(--border-subtle)] divide-x divide-[color:var(--border-subtle)]">
        <div className="flex h-11 items-center justify-center">
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex h-11 items-center justify-center">
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex h-11 items-center justify-center">
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </li>
  );
}

/**
 * Render N skeletons en lista. Default 3.
 */
export function AppointmentRowSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <ul className="grid gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <AppointmentRowSkeleton key={i} />
      ))}
    </ul>
  );
}
