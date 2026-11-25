import { FinancePanel, type FinanceTab } from "@/components/FinancePanel";
import { requireUser } from "@/lib/auth";
import { getBalances, listLedger, listPendingDeposits } from "@/lib/store";

const TABS = new Set<FinanceTab>(["balance", "safe", "services", "archive", "stats"]);

export default async function FreelancerFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; tab?: string }>;
}) {
  const user = await requireUser(["freelancer"]);
  const { error, tab: tabRaw } = await searchParams;
  const tab = TABS.has(tabRaw as FinanceTab) ? (tabRaw as FinanceTab) : "balance";
  const balances = await getBalances(user.id);
  const ledger = await listLedger(user.id);
  const pendingDeposits = await listPendingDeposits(user.id);

  return (
    <FinancePanel
      balances={balances}
      ledger={ledger}
      pendingDeposits={pendingDeposits}
      error={error}
      role="freelancer"
      walletAddress={user.walletAddress}
      digiPrimeUntil={user.digiPrimeUntil}
      tab={tab}
      basePath="/freelancer/finance"
    />
  );
}
