import type { DemoBarbershop } from "@/data/demo-barbershops";
import { BookingCTA } from "./BookingCTA";

type HeroSectionProps = {
  barbershop: Pick<DemoBarbershop, "name" | "description" | "slug">;
};

export function HeroSection({ barbershop }: HeroSectionProps) {
  return (
    <section className="flex min-h-[55vh] flex-col justify-center py-12 sm:py-16 lg:min-h-[70vh]">
      <p className="mb-5 text-sm font-semibold uppercase text-amber-300">
        Turnos online
      </p>
      <h1 className="max-w-3xl text-5xl font-black text-balance sm:text-7xl">
        {barbershop.name}
      </h1>
      <p className="mt-6 max-w-xl text-xl leading-8 text-stone-300 sm:text-2xl">
        {barbershop.description}
      </p>
      <div className="mt-9">
        <BookingCTA barbershopSlug={barbershop.slug} />
      </div>
    </section>
  );
}
