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
  | "withdraw_hold"
  | "withdraw_release"
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
  /** ISO timestamp of last password/email/wallet change — gates withdrawals. */
  sensitiveChangedAt?: string | null;
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
  /** Snapshot at deal creation — never re-read from live settings on release. */
  feePercent: number;
  feeAmount: number;
  status: EscrowStatus;
  fundedAt?: string;
  deliveredAt?: string;
  releasedAt?: string;
  disputedAt?: string;
  fundingDeadlineAt?: string;
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
  depositId?: string;
  withdrawalId?: string;
  createdAt: string;
  settledAt?: string;
}

export interface WalletBalances {
  available: number;
  escrow: number;
  pendingWithdraw: number;
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
  txHash?: string;
  providerRef?: string;
  expiresAt: string;
  completedAt?: string;
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
  txHash?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectReason?: string;
  createdAt: string;
}

export type AuditAction =
  | "deposit.create"
  | "deposit.confirm"
  | "withdraw.request"
  | "withdraw.approve"
  | "withdraw.reject"
  | "escrow.accept_bid"
  | "escrow.fund"
  | "escrow.deliver"
  | "escrow.release"
  | "escrow.dispute"
  | "escrow.refund"
  | "prime.buy"
  | "auth.login"
  | "auth.login_failed"
  | "security.sensitive_change";

export interface AuditLogEntry {
  id: string;
  at: string;
  actorUserId?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  ip?: string;
  meta?: Record<string, string | number | boolean | null>;
}

export interface WebhookEvent {
  id: string;
  provider: string;
  eventKey: string;
  depositId?: string;
  payloadHash: string;
  status: "processed" | "ignored" | "rejected";
  createdAt: string;
}

export interface DbMeta {
  version: number;
  financePolicyVersion: number;
}

export interface DbShape {
  meta: DbMeta;
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
  auditLog: AuditLogEntry[];
  webhookEvents: WebhookEvent[];
}
