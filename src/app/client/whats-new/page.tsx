import { WhatsNewPanel } from "@/components/WhatsNewPanel";
import { requireUser } from "@/lib/auth";

export default async function ClientWhatsNewPage() {
  await requireUser(["client"]);
  return <WhatsNewPanel role="client" />;
}
