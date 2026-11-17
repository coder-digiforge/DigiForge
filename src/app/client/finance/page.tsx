import { FinancePanel, type FinanceTab } from "@/components/FinancePanel";
import { requireUser } from "@/lib/auth";
import { getBalances, listLedger } from "@/lib/store";

const TABS = new Set<FinanceTab>(["balance", "safe", "archive", "stats"]);

export default async function ClientFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; tab?: string }>;
}) {
  const user = await requireUser(["client"]);
  const { error, tab: tabRaw } = await searchParams;
  const tab = TABS.has(tabRaw as FinanceTab) ? (tabRaw as FinanceTab) : "balance";
  const balances = await getBalances(user.id);
  const ledger = await listLedger(user.id);

  return (
    <FinancePanel
      balances={balances}
      ledger={ledger}
      error={error}
      role="client"
      walletAddress={user.walletAddress}
      tab={tab}
      basePath="/client/finance"
    />
  );
}
