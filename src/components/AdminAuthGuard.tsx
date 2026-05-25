"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { requireBarbershopAccess } from "@/lib/barbershop-access";

type AdminAuthGuardProps = {
  barbershopSlug: string;
  children: ReactNode;
};

export function AdminAuthGuard({
  barbershopSlug,
  children,
}: AdminAuthGuardProps) {
  const router = useRouter();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [accessError, setAccessError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function checkAccess() {
      const access = await requireBarbershopAccess(barbershopSlug);

      if (!isMounted) {
        return;
      }

      if (!access.isAuthenticated) {
        router.replace(`/${barbershopSlug}/admin/login`);
        return;
      }

      if (!access.hasAccess) {
        setAccessError(
          access.error
            ? "No pudimos validar tus permisos. Intenta nuevamente."
            : "",
        );
        setIsUnauthorized(true);
        setIsCheckingAccess(false);
        return;
      }

      setIsAuthorized(true);
      setIsCheckingAccess(false);
    }

    checkAccess();

    return () => {
      isMounted = false;
    };
  }, [barbershopSlug, router]);

  if (isCheckingAccess) {
    return (
      <main className="min-h-screen bg-stone-950 text-stone-50">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10 sm:px-10 lg:px-12">
          <div className="w-full border border-stone-800 bg-stone-900/70 p-6 text-stone-300">
            Verificando acceso...
          </div>
        </div>
      </main>
    );
  }

  if (isUnauthorized || !isAuthorized) {
    return (
      <main className="min-h-screen bg-stone-950 text-stone-50">
        <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-10 sm:px-10">
          <section className="w-full rounded-lg border border-red-300/30 bg-red-500/10 p-6 shadow-2xl shadow-black/30 sm:p-8">
            <p className="text-xs font-bold uppercase text-red-200">
              Acceso restringido
            </p>
            <h1 className="mt-2 text-3xl font-black text-stone-50">
              No autorizado
            </h1>
            <p className="mt-3 text-sm leading-6 text-stone-300 sm:text-base">
              Tu usuario no tiene permisos para administrar esta barberia en
              BarberSync.
            </p>
            {accessError ? (
              <p className="mt-4 rounded-md border border-red-300/30 bg-stone-950/60 px-3 py-2 text-sm font-semibold text-red-100">
                {accessError}
              </p>
            ) : null}
          </section>
        </div>
      </main>
    );
  }

  return children;
}
