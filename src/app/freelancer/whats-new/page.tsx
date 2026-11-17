import { WhatsNewPanel } from "@/components/WhatsNewPanel";
import { requireUser } from "@/lib/auth";

export default async function FreelancerWhatsNewPage() {
  await requireUser(["freelancer"]);
  return <WhatsNewPanel role="freelancer" />;
}
