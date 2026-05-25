import type {
  BarbershopService,
  WorkingHours,
} from "@/data/demo-barbershops";
import { ServiceCard } from "./ServiceCard";

type ServicesSectionProps = {
  services: BarbershopService[];
  workingHours: WorkingHours;
};

export function ServicesSection({
  services,
  workingHours,
}: ServicesSectionProps) {
  return (
    <section
      id="servicios"
      className="border border-stone-800 bg-stone-900/70 p-6 shadow-2xl shadow-black/30"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-amber-300">
            Servicios
          </p>
          <h2 className="mt-2 text-2xl font-black text-stone-100">
            Elegí tu turno
          </h2>
        </div>
        <p className="text-sm text-stone-400">
          {workingHours.start} a {workingHours.end} - cada{" "}
          {workingHours.intervalMinutes} min
        </p>
      </div>

      <div className="mt-5">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </section>
  );
}
