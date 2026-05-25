import { notFound } from "next/navigation";
import { BookingForm } from "@/components/BookingForm";
import {
  demoBarbershops,
  getDemoBarbershopBySlug,
} from "@/data/demo-barbershops";

type BookingPageProps = {
  params: Promise<{
    barbershopSlug: string;
  }>;
};

export function generateStaticParams() {
  return demoBarbershops.map((barbershop) => ({
    barbershopSlug: barbershop.slug,
  }));
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { barbershopSlug } = await params;
  const barbershop = getDemoBarbershopBySlug(barbershopSlug);

  if (!barbershop) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-stone-950 text-stone-50">
      <div className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
        <BookingForm barbershop={barbershop} />
      </div>
    </main>
  );
}
