import { SettingsPanel } from "@/components/SettingsPanel";
import { requireUser } from "@/lib/auth";
import { getLoginLog, getUserSettings } from "@/lib/settings";

export default async function FreelancerSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; saved?: string; error?: string }>;
}) {
  const user = await requireUser(["freelancer"]);
  const { tab, saved, error } = await searchParams;
  const initialTab = tab === "security" ? "security" : "service";

  return (
    <SettingsPanel
      role="freelancer"
      email={user.email}
      twoFaEnabled={user.twoFaEnabled}
      settings={getUserSettings(user)}
      loginLog={getLoginLog(user)}
      initialTab={initialTab}
      notice={saved ? "Настройки сохранены" : undefined}
      error={error}
    />
  );
}
