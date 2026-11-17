import { DigiPrimePanel } from "@/components/DigiPrimePanel";
import { requireUser } from "@/lib/auth";
import { getBalances } from "@/lib/store";

export default async function DigiPrimePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const user = await requireUser(["freelancer"]);
  const { error, saved } = await searchParams;
  const until = user.digiPrimeUntil ?? null;
  const active = Boolean(until && new Date(until).getTime() > Date.now());
  const trial = Boolean(active && user.digiPrimeTrial);
  const balances = await getBalances(user.id);

  return (
    <DigiPrimePanel
      active={active}
      trial={trial}
      autoRenew={Boolean(active && user.digiPrimeAutoRenew !== false)}
      until={until}
      trialUsed={Boolean(user.digiPrimeTrialUsed || user.digiPrimeTrial)}
      walletAddress={user.walletAddress}
      balanceUsdt={balances.available}
      error={error}
      notice={saved ? "Изменения сохранены" : undefined}
    />
  );
}
