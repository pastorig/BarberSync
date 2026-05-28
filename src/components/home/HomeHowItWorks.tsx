const STEPS = [
  {
    number: "01",
    title: "Configurás tu barbería",
    body: "Cargás tus barberos, sus servicios y sus horarios. En 10 minutos estás listo para recibir reservas.",
  },
  {
    number: "02",
    title: "Tus clientes reservan",
    body: "Compartís el link de tu barbería. Eligen barbero, servicio y horario libre. Sin crear cuenta.",
  },
  {
    number: "03",
    title: "Vos confirmás y gestionás",
    body: "Desde el panel admin ves todos los turnos del día, confirmás con un toque y mandás WhatsApp si querés.",
  },
];

export function HomeHowItWorks() {
  return (
    <section className="border-t border-[color:var(--border-subtle)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <header className="text-center sm:text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[color:var(--brand-gold)]">
            Cómo funciona
          </p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-balance text-white sm:mt-4 sm:text-4xl lg:text-5xl">
            Tres pasos y tu barbería online
          </h2>
        </header>

        <ol className="mt-10 grid gap-6 sm:grid-cols-3 sm:gap-4 lg:gap-6">
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="relative rounded-[var(--radius-md)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] p-6"
            >
              <p className="font-mono text-2xl font-black tabular-nums leading-none text-[color:var(--brand-gold)]">
                {step.number}
              </p>
              <h3 className="mt-4 text-lg font-bold uppercase tracking-tight text-white sm:text-xl">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[color:var(--text-muted)]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
