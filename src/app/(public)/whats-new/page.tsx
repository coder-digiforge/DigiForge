import { WhatsNewPanel } from "@/components/WhatsNewPanel";
import { keepCabinetShell } from "@/lib/auth";

export default async function WhatsNewPage() {
  await keepCabinetShell({
    client: "/client/whats-new",
    freelancer: "/freelancer/whats-new",
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:px-12 md:py-16">
      <WhatsNewPanel role="guest" />
    </div>
  );
}
