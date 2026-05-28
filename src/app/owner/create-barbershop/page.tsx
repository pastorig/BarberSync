import { OwnerAuthGuard } from "@/components/OwnerAuthGuard";
import { OwnerCreateBarbershopForm } from "@/components/OwnerCreateBarbershopForm";
import { OwnerShell } from "@/components/owner/OwnerShell";

export default function OwnerCreateBarbershopPage() {
  return (
    <OwnerAuthGuard>
      <OwnerShell>
        <OwnerCreateBarbershopForm />
      </OwnerShell>
    </OwnerAuthGuard>
  );
}
