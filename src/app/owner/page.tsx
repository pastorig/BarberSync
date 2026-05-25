import { OwnerAuthGuard } from "@/components/OwnerAuthGuard";
import { OwnerDashboard } from "@/components/OwnerDashboard";

export default function OwnerPage() {
  return (
    <OwnerAuthGuard>
      <OwnerDashboard />
    </OwnerAuthGuard>
  );
}
