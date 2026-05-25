export type BarbershopService = {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
};

export type WorkingHours = {
  start: string;
  end: string;
  intervalMinutes: number;
};

export type DemoBarbershop = {
  id: string;
  slug: string;
  name: string;
  description: string;
  instagram: string;
  whatsapp: string;
  services: BarbershopService[];
  workingHours: WorkingHours;
};

export const demoBarbershops: DemoBarbershop[] = [
  {
    id: "barbershop_sv_barber",
    slug: "sv-barber",
    name: "SV Barber",
    description: "Reservá tu turno online",
    instagram: "https://instagram.com/svbarber",
    whatsapp: "+54 9 11 0000-0000",
    services: [
      {
        id: "service_haircut",
        name: "Corte",
        price: 8500,
        durationMinutes: 30,
      },
      {
        id: "service_haircut_beard",
        name: "Corte + barba",
        price: 10000,
        durationMinutes: 30,
      },
    ],
    workingHours: {
      start: "16:00",
      end: "21:00",
      intervalMinutes: 30,
    },
  },
];

export function getDemoBarbershopBySlug(slug: string) {
  return demoBarbershops.find((barbershop) => barbershop.slug === slug);
}

export function getFeaturedDemoBarbershop() {
  return demoBarbershops[0];
}
