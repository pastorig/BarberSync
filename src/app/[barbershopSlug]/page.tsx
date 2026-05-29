import { notFound } from "next/navigation";
import { PublicBarbershopLanding } from "@/components/PublicBarbershopLanding";
import { listPublicReviewsByBarbershop } from "@/lib/appointment-reviews";
import { resolveBarbershopBySlug } from "@/lib/barbershops";

type BarbershopPageProps = {
  params: Promise<{
    barbershopSlug: string;
  }>;
};

// Dinámica: la landing tiene que reflejar cambios en barberos, servicios
// y configuración apenas se hacen vía admin, no esperar al próximo build.
export const dynamic = "force-dynamic";

export default async function BarbershopPage({
  params,
}: BarbershopPageProps) {
  const { barbershopSlug } = await params;
  const { data: barbershop } = await resolveBarbershopBySlug(barbershopSlug);

  if (!barbershop) {
    notFound();
  }

  const { data: reviews } = await listPublicReviewsByBarbershop(
    barbershopSlug,
    6,
  );

  return (
    <PublicBarbershopLanding barbershop={barbershop} reviews={reviews} />
  );
}
