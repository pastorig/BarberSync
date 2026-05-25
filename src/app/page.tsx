import { PublicBarbershopLanding } from "@/components/PublicBarbershopLanding";
import { getFeaturedDemoBarbershop } from "@/data/demo-barbershops";

export default function Home() {
  const featuredBarbershop = getFeaturedDemoBarbershop();

  return <PublicBarbershopLanding barbershop={featuredBarbershop} />;
}
