"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { DemoBarbershop } from "@/data/demo-barbershops";
import { signInWithEmailAndPassword } from "@/lib/auth";

type AdminLoginFormProps = {
  barbershop: DemoBarbershop;
};

export function AdminLoginForm({ barbershop }: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setErrorMessage("Ingresá email y contraseña.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const { error } = await signInWithEmailAndPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage("Email o contraseña incorrectos.");
        return;
      }

      router.replace(`/${barbershop.slug}/admin`);
    } catch {
      setErrorMessage("No pudimos iniciar sesión. Intentá nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-950 text-stone-50">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="border border-stone-800 bg-stone-900/70 p-6 shadow-2xl shadow-black/30">
          <p className="text-sm font-semibold uppercase text-amber-300">
            Panel admin
          </p>
          <h1 className="mt-3 text-4xl font-black text-stone-50">
            {barbershop.name}
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-300">
            Iniciá sesión para gestionar turnos, confirmaciones y cancelaciones.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="text-sm font-bold uppercase text-stone-300"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                disabled={isSubmitting}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrorMessage("");
                }}
                className="mt-2 min-h-12 w-full rounded-md border border-stone-700 bg-stone-950 px-4 text-base text-stone-50 outline-none transition placeholder:text-stone-500 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20"
                placeholder="admin@barberia.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm font-bold uppercase text-stone-300"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                disabled={isSubmitting}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrorMessage("");
                }}
                className="mt-2 min-h-12 w-full rounded-md border border-stone-700 bg-stone-950 px-4 text-base text-stone-50 outline-none transition placeholder:text-stone-500 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20"
                placeholder="Tu contraseña"
                required
              />
            </div>

            {errorMessage ? (
              <p
                role="alert"
                className="rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200"
              >
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-amber-300 px-6 py-3 text-sm font-bold uppercase text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
