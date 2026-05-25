import type { DemoBarbershop } from "@/data/demo-barbershops";
import { HeroSection } from "./HeroSection";
import { ServicesSection } from "./ServicesSection";

type PublicBarbershopLandingProps = {
  barbershop: DemoBarbershop;
};

export function PublicBarbershopLanding({
  barbershop,
}: PublicBarbershopLandingProps) {
  return (
    <main className="min-h-screen bg-stone-950 text-stone-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-12 sm:px-10 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <HeroSection barbershop={barbershop} />
          <ServicesSection
            services={barbershop.services}
            workingHours={barbershop.workingHours}
          />
        </div>
      </div>
    </main>
  );
}
