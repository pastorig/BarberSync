import { notFound } from "next/navigation";
import { AdminAuthGuard } from "@/components/AdminAuthGuard";
import { AdminBarbersManager } from "@/components/AdminBarbersManager";
import {
  demoBarbershops,
  getDemoBarbershopBySlug,
} from "@/data/demo-barbershops";

type AdminBarbersPageProps = {
  params: Promise<{
    barbershopSlug: string;
  }>;
};

export function generateStaticParams() {
  return demoBarbershops.map((barbershop) => ({
    barbershopSlug: barbershop.slug,
  }));
}

export default async function AdminBarbersPage({
  params,
}: AdminBarbersPageProps) {
  const { barbershopSlug } = await params;
  const barbershop = getDemoBarbershopBySlug(barbershopSlug);

  if (!barbershop) {
    notFound();
  }

  return (
    <AdminAuthGuard barbershopSlug={barbershop.slug}>
      <AdminBarbersManager barbershop={barbershop} />
    </AdminAuthGuard>
  );
}
