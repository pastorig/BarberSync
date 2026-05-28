import { OwnerAuthGuard } from "@/components/OwnerAuthGuard";
import { OwnerMessagesList } from "@/components/owner/OwnerMessagesList";
import { OwnerShell } from "@/components/owner/OwnerShell";

export default function OwnerMessagesPage() {
  return (
    <OwnerAuthGuard>
      <OwnerShell>
        <OwnerMessagesList />
      </OwnerShell>
    </OwnerAuthGuard>
  );
}
