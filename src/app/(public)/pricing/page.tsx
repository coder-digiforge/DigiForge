import { PricingPanel } from "@/components/PricingPanel";
import { keepCabinetShell } from "@/lib/auth";

export default async function PricingPage() {
  await keepCabinetShell({
    client: "/client/pricing",
    freelancer: "/freelancer/prime",
  });

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-14 md:px-12">
      <PricingPanel variant="public" />
    </div>
  );
}
