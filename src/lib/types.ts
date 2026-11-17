export type Role = "client" | "freelancer" | "admin";

export type CryptoNetwork = "TRC20" | "ERC20";
export type CryptoAsset = "USDT";

export type ProjectStatus =
  | "open"
  | "in_progress"
  | "delivered"
  | "completed"
  | "disputed"
  | "cancelled";

export type EscrowStatus =
  | "pending_funding"
  | "funded"
  | "in_progress"
  | "delivered"
  | "released"
  | "disputed"
  | "refunded";

export type LedgerKind =
  | "deposit"
  | "withdraw"
  | "escrow_lock"
  | "escrow_release"
  | "escrow_refund"
  | "fee"
  | "prime";

export type UiLanguage = "en" | "uk" | "ru" | "pl" | "de";
export type VisibilityLevel = "nobody" | "contacts" | "everyone";
export type DisplayTheme = "standard" | "dark";

export interface UserSettings {
  emailDigest: boolean;
  emailMessages: boolean;
  emailService: boolean;
  emailOffers: boolean;
  emailNews: boolean;
  emailBlog: boolean;
  telegramConnected: boolean;
  pushBrowser: boolean;
  pushSound: boolean;
  soundName: string;
  language: UiLanguage;
  autoTranslate: boolean;
  excludeLanguages: UiLanguage[];
  theme: DisplayTheme;
  visibilityLastName: VisibilityLevel;
  visibilityPhone: VisibilityLevel;
  visibilityBirthdate: VisibilityLevel;
  searchIndexing: boolean;
}

export interface LoginSession {
  id: string;
  browser: string;
  ip: string;
  location: string;
  createdAt: string;
  current?: boolean;
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  title?: string;
  bio?: string;
  skills: string[];
  rating: number;
  reviewCount: number;
  walletAddress?: string;
  walletNetwork?: CryptoNetwork;
  walletAsset?: CryptoAsset;
  twoFaEnabled: boolean;
  digiPrimeUntil?: string | null;
  /** Сейчас идёт бесплатный триал */
  digiPrimeTrial?: boolean;
  /** Триал уже использовался */
  digiPrimeTrialUsed?: boolean;
  digiPrimeAutoRenew?: boolean;
  settings?: UserSettings;
  loginLog?: LoginSession[];
  deactivatedAt?: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  currency: "USDT";
  deadlineDays: number;
  status: ProjectStatus;
  bidsHidden: boolean;
  createdAt: string;
}

export interface Bid {
  id: string;
  projectId: string;
  freelancerId: string;
  amount: number;
  days: number;
  comment: string;
  transferCopyright: boolean;
  hideFromOthers: boolean;
  portfolioCaseId?: string;
  status: "pending" | "accepted" | "rejected" | "won";
  createdAt: string;
}

export interface Deal {
  id: string;
  projectId: string;
  clientId: string;
  freelancerId: string;
  bidId: string;
  amount: number;
  feePercent: number;
  status: EscrowStatus;
  fundedAt?: string;
  deliveredAt?: string;
  releasedAt?: string;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  kind: LedgerKind;
  amount: number;
  asset: CryptoAsset;
  network?: CryptoNetwork;
  note: string;
  txHash?: string;
  dealId?: string;
  createdAt: string;
  settledAt?: string;
}

export interface WalletBalances {
  available: number;
  escrow: number;
}

export interface MessageAttachment {
  name: string;
  url: string;
  mime?: string;
  size?: number;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  attachment?: MessageAttachment;
  createdAt: string;
}

export interface Thread {
  id: string;
  dealId?: string;
  projectId?: string;
  participantIds: string[];
  title: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  fromUserId: string;
  toUserId: string;
  dealId: string;
  rating: number;
  text: string;
  createdAt: string;
}

export interface PortfolioCase {
  id: string;
  freelancerId: string;
  title: string;
  summary: string;
  tags: string[];
  priceUsdt?: number;
  projectUrl?: string;
  coverUrl?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  href?: string;
  initials?: string;
  createdAt: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  amount: number;
  asset: CryptoAsset;
  network: CryptoNetwork;
  address: string;
  status: "awaiting" | "confirming" | "completed" | "expired";
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  asset: CryptoAsset;
  network: CryptoNetwork;
  address: string;
  status: "pending" | "processing" | "completed" | "rejected";
  createdAt: string;
}

export interface DbShape {
  users: User[];
  projects: Project[];
  bids: Bid[];
  deals: Deal[];
  ledger: LedgerEntry[];
  threads: Thread[];
  messages: Message[];
  reviews: Review[];
  portfolio: PortfolioCase[];
  notifications: NotificationItem[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
}
