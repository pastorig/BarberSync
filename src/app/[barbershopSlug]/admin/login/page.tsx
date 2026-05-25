import { notFound } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import {
  demoBarbershops,
  getDemoBarbershopBySlug,
} from "@/data/demo-barbershops";

type AdminLoginPageProps = {
  params: Promise<{
    barbershopSlug: string;
  }>;
};

export function generateStaticParams() {
  return demoBarbershops.map((barbershop) => ({
    barbershopSlug: barbershop.slug,
  }));
}

export default async function AdminLoginPage({
  params,
}: AdminLoginPageProps) {
  const { barbershopSlug } = await params;
  const barbershop = getDemoBarbershopBySlug(barbershopSlug);

  if (!barbershop) {
    notFound();
  }

  return <AdminLoginForm barbershop={barbershop} />;
}
