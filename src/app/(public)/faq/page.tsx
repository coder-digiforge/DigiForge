import { FaqPanel } from "@/components/FaqPanel";
import { keepCabinetShell } from "@/lib/auth";

export default async function FaqPage() {
  await keepCabinetShell({
    client: "/client/faq",
    freelancer: "/freelancer/faq",
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:px-12">
      <FaqPanel variant="public" />
    </div>
  );
}
