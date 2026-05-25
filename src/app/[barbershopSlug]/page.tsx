import { notFound } from "next/navigation";
import { PublicBarbershopLanding } from "@/components/PublicBarbershopLanding";
import {
  demoBarbershops,
  getDemoBarbershopBySlug,
} from "@/data/demo-barbershops";

type BarbershopPageProps = {
  params: Promise<{
    barbershopSlug: string;
  }>;
};

export function generateStaticParams() {
  return demoBarbershops.map((barbershop) => ({
    barbershopSlug: barbershop.slug,
  }));
}

export default async function BarbershopPage({
  params,
}: BarbershopPageProps) {
  const { barbershopSlug } = await params;
  const barbershop = getDemoBarbershopBySlug(barbershopSlug);

  if (!barbershop) {
    notFound();
  }

  return <PublicBarbershopLanding barbershop={barbershop} />;
}
