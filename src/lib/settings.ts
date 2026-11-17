import type { LoginSession, User, UserSettings } from "./types";

export const DEFAULT_SETTINGS: UserSettings = {
  emailDigest: true,
  emailMessages: true,
  emailService: true,
  emailOffers: true,
  emailNews: true,
  emailBlog: true,
  telegramConnected: true,
  pushBrowser: true,
  pushSound: true,
  soundName: "long-trill",
  language: "ru",
  autoTranslate: true,
  excludeLanguages: ["en", "uk", "de", "pl"],
  theme: "dark",
  visibilityLastName: "nobody",
  visibilityPhone: "nobody",
  visibilityBirthdate: "nobody",
  searchIndexing: true,
};

export function getUserSettings(user: User): UserSettings {
  return { ...DEFAULT_SETTINGS, ...(user.settings ?? {}) };
}

export function defaultLoginLog(): LoginSession[] {
  const now = Date.now();
  return [
    {
      id: "ls-1",
      browser: "Chrome 129.0",
      ip: "91.124.18.42",
      location: "Киев",
      createdAt: new Date(now - 2 * 3600_000).toISOString(),
      current: true,
    },
    {
      id: "ls-2",
      browser: "Chrome Mobile iOS 129.0",
      ip: "91.124.18.42",
      location: "Киев",
      createdAt: new Date(now - 26 * 3600_000).toISOString(),
    },
    {
      id: "ls-3",
      browser: "Chrome 129.0",
      ip: "176.37.54.12",
      location: "Киев",
      createdAt: new Date(now - 3 * 86400_000).toISOString(),
    },
    {
      id: "ls-4",
      browser: "Safari 17.6",
      ip: "91.124.18.42",
      location: "Киев",
      createdAt: new Date(now - 7 * 86400_000).toISOString(),
    },
  ];
}

export function getLoginLog(user: User): LoginSession[] {
  if (user.loginLog && user.loginLog.length > 0) return user.loginLog;
  return defaultLoginLog();
}
