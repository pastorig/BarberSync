"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getCurrentSession } from "@/lib/auth";

type OwnerAuthGuardProps = {
  children: ReactNode;
};

export function OwnerAuthGuard({ children }: OwnerAuthGuardProps) {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const { data } = await getCurrentSession();

      if (!isMounted) {
        return;
      }

      if (!data.session) {
        router.replace("/login");
        return;
      }

      setIsAuthenticated(true);
      setIsCheckingSession(false);
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isCheckingSession || !isAuthenticated) {
    return (
      <main className="min-h-screen bg-stone-950 text-stone-50">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10 sm:px-10 lg:px-12">
          <div className="w-full rounded-lg border border-stone-800 bg-stone-900/70 p-6 text-stone-300">
            Verificando acceso owner...
          </div>
        </div>
      </main>
    );
  }

  return children;
}
