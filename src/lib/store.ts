import { neon } from "@neondatabase/serverless";
import {
  AUTO_RELEASE_AFTER_DELIVER_HOURS,
  DEFAULT_FEE_PERCENT,
  DEPOSIT_TTL_HOURS,
  DIGI_PRIME_DAYS,
  DIGI_PRIME_LAUNCH_DAYS,
  DIGI_PRIME_PRICE_USDT,
  MAX_WITHDRAW_PER_DAY_USDT,
  PENDING_FUNDING_TTL_HOURS,
  PLATFORM_FEE_USER_ID,
  RATE_LIMITS,
  SENSITIVE_CHANGE_WITHDRAW_COOLDOWN_MS,
  STORE_CAS_RETRIES,
  WITHDRAW_REQUIRES_2FA_USDT,
  assertDealTransition,
  assertDepositAmount,
  assertNonNegativeAvailable,
  assertRateLimit,
  assertUniqueTxHash,
  assertWalletAddress,
  assertWithdrawAmount,
  calcBalances as calcBalancesCore,
  canClientRelease,
  canDispute,
  canFund,
  ensureFinanceShape,
  isTerminalDeal,
  normalizeUsdt,
  pushAudit,
} from "./finance";
import { isRelationalStore } from "./db/mode";
import { syncFinanceTables } from "./db/sync-finance";
import { createNowPaymentsInvoice, createNowPaymentsPayout } from "./crypto/nowpayments";
import {
  createEmailVerifyToken,
  deliverVerificationLink,
  hashEmailToken,
} from "./email-verify";
import { hashPassword, verifyPassword } from "./password";
import { getBootstrapDb } from "./seed";
import { generateTotpSecret, otpauthUri, verifyTotpCode } from "./totp";
import { DEFAULT_SETTINGS, defaultLoginLog } from "./settings";
import type {
  Bid,
  CryptoAsset,
  CryptoNetwork,
  DbShape,
  Deal,
  DepositRequest,
  LedgerEntry,
  Message,
  NotificationItem,
  Favorite,
  PortfolioCase,
  Project,
  ProjectAttachment,
  ProjectComment,
  Review,
  SystemMessageCode,
  Thread,
  User,
  UserSettings,
  WalletBalances,
  WithdrawalRequest,
} from "./types";

const STORE_ID = "main";
export const SYSTEM_SENDER_ID = "system";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL не задан. Добавьте Neon connection string в переменные окружения.",
    );
  }
  return neon(url);
}

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function pushSystemMessageInDb(
  db: DbShape,
  threadId: string,
  body: string,
  systemCode: SystemMessageCode,
  createdAt = new Date().toISOString(),
): Message {
  const thread = db.threads.find((t) => t.id === threadId);
  if (!thread) throw new Error("Чат не найден");

  const message: Message = {
    id: newId("m"),
    threadId,
    senderId: SYSTEM_SENDER_ID,
    body,
    createdAt,
    kind: "system",
    systemCode,
  };
  db.messages.push(message);
  thread.updatedAt = createdAt;
  return message;
}

function formatUsdtAmount(amount: number) {
  return `${normalizeUsdt(amount)} USDT`;
}

function depositAddress(network: CryptoNetwork) {
  return network === "TRC20"
    ? "TDigiForgeEscrowDeposit111111111"
    : "0xDigiForgeEscrowDeposit111111111111";
}

async function readDb(): Promise<DbShape> {
  const sql = getSql();
  const rows = await sql`
    SELECT payload
    FROM app_store
    WHERE id = ${STORE_ID}
    LIMIT 1
  `;

  if (rows[0]?.payload) {
    return ensureFinanceShape(structuredClone(rows[0].payload as DbShape));
  }

  const fresh = ensureFinanceShape(getBootstrapDb());
  await writeDbForce(fresh);
  return fresh;
}

async function writeDbForce(db: DbShape) {
  const sql = getSql();
  ensureFinanceShape(db);
  await sql`
    INSERT INTO app_store (id, payload, updated_at)
    VALUES (${STORE_ID}, ${JSON.stringify(db)}::jsonb, now())
    ON CONFLICT (id) DO UPDATE
    SET payload = EXCLUDED.payload,
        updated_at = now()
  `;
  if (isRelationalStore()) {
    try {
      await syncFinanceTables(sql, db);
    } catch (e) {
      console.error("[store] relational sync failed", e);
      throw e;
    }
  }
}

/** Compare-and-swap on meta.version to reduce lost-update races. */
async function writeDbCas(db: DbShape, expectedVersion: number): Promise<boolean> {
  const sql = getSql();
  ensureFinanceShape(db);
  db.meta.version = expectedVersion + 1;
  const rows = await sql`
    UPDATE app_store
    SET payload = ${JSON.stringify(db)}::jsonb,
        updated_at = now()
    WHERE id = ${STORE_ID}
      AND COALESCE((payload->'meta'->>'version')::int, 0) = ${expectedVersion}
    RETURNING id
  `;
  if (rows.length === 0) return false;
  if (isRelationalStore()) {
    try {
      await syncFinanceTables(sql, db);
    } catch (e) {
      console.error("[store] relational sync failed", e);
      throw e;
    }
  }
  return true;
}

export async function getDb() {
  return readDb();
}

export async function updateDb(mutator: (db: DbShape) => void) {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < STORE_CAS_RETRIES; attempt++) {
    const db = await readDb();
    const expected = db.meta.version;
    mutator(db);
    const ok = await writeDbCas(db, expected);
    if (ok) return db;
    lastError = new Error("Конфликт параллельной записи, повторите операцию");
  }
  throw lastError ?? new Error("Не удалось сохранить данные");
}

export function calcBalances(db: DbShape, userId: string): WalletBalances {
  return calcBalancesCore(db, userId);
}

export async function findUserByEmail(email: string) {
  const db = await readDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findUserById(id: string) {
  const db = await readDb();
  return db.users.find((u) => u.id === id) ?? null;
}

export async function createUser(input: {
  email: string;
  password: string;
  name: string;
  role: "client" | "freelancer";
}) {
  const existing = await findUserByEmail(input.email);
  if (existing) throw new Error("Email уже зарегистрирован");

  const user: User = {
    id: newId("u"),
    email: input.email.trim().toLowerCase(),
    password: hashPassword(input.password),
    name: input.name,
    role: input.role,
    skills: [],
    rating: 0,
    reviewCount: 0,
    twoFaEnabled: false,
    sessionVersion: 0,
    emailVerifiedAt: null,
    createdAt: new Date().toISOString(),
  };

  if (input.role === "freelancer") {
    user.digiPrimeUntil = new Date(
      Date.now() + DIGI_PRIME_LAUNCH_DAYS * 86400000,
    ).toISOString();
    user.digiPrimeTrial = true;
    user.digiPrimeTrialUsed = true;
    user.digiPrimeAutoRenew = false;
  }

  await updateDb((db) => {
    db.users.push(user);
  });
  return user;
}

export function publicUser(user: User) {
  const {
    password: _password,
    twoFaSecret: _twoFaSecret,
    twoFaPendingSecret: _twoFaPendingSecret,
    emailVerifyTokenHash: _emailVerifyTokenHash,
    ...rest
  } = user;
  return rest;
}

export async function listProjects(status?: Project["status"]) {
  const db = await readDb();
  return db.projects
    .filter((p) => (status ? p.status === status : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getProject(id: string) {
  const db = await readDb();
  return db.projects.find((p) => p.id === id) ?? null;
}

export async function createProject(
  input: Omit<Project, "id" | "createdAt" | "status" | "currency"> & {
    status?: Project["status"];
  },
) {
  const project: Project = {
    ...input,
    skills: input.skills ?? [],
    attachments: input.attachments ?? [],
    id: `p-${crypto.randomUUID().slice(0, 8)}`,
    currency: "USDT",
    status: input.status ?? "open",
    createdAt: new Date().toISOString(),
  };
  await updateDb((db) => db.projects.push(project));
  return project;
}

export async function updateProject(
  projectId: string,
  clientId: string,
  patch: Partial<
    Pick<
      Project,
      | "title"
      | "description"
      | "category"
      | "budget"
      | "deadlineDays"
      | "bidsHidden"
      | "skills"
      | "attachments"
    >
  >,
) {
  let updated: Project | null = null;
  await updateDb((db) => {
    const project = db.projects.find((p) => p.id === projectId);
    if (!project) throw new Error("Проект не найден");
    if (project.clientId !== clientId) throw new Error("Нет доступа");
    if (project.status !== "open") throw new Error("Редактировать можно только открытый проект");
    if (patch.title !== undefined) project.title = patch.title;
    if (patch.description !== undefined) project.description = patch.description;
    if (patch.category !== undefined) project.category = patch.category;
    if (patch.budget !== undefined) project.budget = patch.budget;
    if (patch.deadlineDays !== undefined) project.deadlineDays = patch.deadlineDays;
    if (patch.bidsHidden !== undefined) project.bidsHidden = patch.bidsHidden;
    if (patch.skills !== undefined) project.skills = patch.skills;
    if (patch.attachments !== undefined) project.attachments = patch.attachments;
    updated = project;
  });
  return updated!;
}

export async function closeProject(projectId: string, clientId: string) {
  await updateDb((db) => {
    const project = db.projects.find((p) => p.id === projectId);
    if (!project) throw new Error("Проект не найден");
    if (project.clientId !== clientId) throw new Error("Нет доступа");
    if (project.status !== "open") throw new Error("Закрыть можно только открытый проект");
    project.status = "cancelled";
    const now = new Date().toISOString();
    for (const bid of db.bids.filter((b) => b.projectId === projectId && b.status === "pending")) {
      bid.status = "rejected";
      db.notifications.push({
        id: newId("n"),
        userId: bid.freelancerId,
        title: "Проект закрыт",
        body: `Заказчик закрыл «${project.title}»`,
        read: false,
        href: "/freelancer/projects",
        createdAt: now,
      });
    }
  });
}

export async function listFreelancers() {
  const db = await readDb();
  return db.users.filter((u) => u.role === "freelancer").map(publicUser);
}

export async function listBidsForProject(projectId: string) {
  const db = await readDb();
  return db.bids.filter((b) => b.projectId === projectId);
}

export async function listBidsForFreelancer(freelancerId: string) {
  const db = await readDb();
  return db.bids.filter((b) => b.freelancerId === freelancerId);
}

export async function createBid(
  input: Omit<Bid, "id" | "createdAt" | "status">,
) {
  let created: Bid | null = null;
  await updateDb((db) => {
    const project = db.projects.find((p) => p.id === input.projectId);
    if (!project) throw new Error("Проект не найден");
    if (project.status !== "open") throw new Error("Проект закрыт для ставок");
    if (!(input.amount > 0)) throw new Error("Укажите стоимость ставки");
    if (!(input.days > 0)) throw new Error("Укажите срок");

    const duplicate = db.bids.find(
      (b) =>
        b.projectId === input.projectId &&
        b.freelancerId === input.freelancerId &&
        b.status === "pending",
    );
    if (duplicate) throw new Error("У вас уже есть активная ставка на этот проект");

    const freelancer = db.users.find((u) => u.id === input.freelancerId);
    let comment = input.comment.trim();
    if (freelancer?.autoAddBidSignature && freelancer.bidSignature?.trim()) {
      const sig = freelancer.bidSignature.trim();
      if (!comment.includes(sig)) {
        comment = comment ? `${comment}\n\n—\n${sig}` : sig;
      }
    }

    const bid: Bid = {
      ...input,
      comment,
      id: newId("b"),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    db.bids.push(bid);
    created = bid;
    db.notifications.push({
      id: newId("n"),
      userId: project.clientId,
      title: "Новая ставка",
      body: `Новый отклик на «${project.title}»`,
      read: false,
      href: `/client/projects/${project.id}`,
      createdAt: new Date().toISOString(),
    });
  });
  return created!;
}

export async function updateBid(
  bidId: string,
  freelancerId: string,
  patch: Partial<Pick<Bid, "amount" | "days" | "comment" | "transferCopyright" | "hideFromOthers">>,
) {
  let updated: Bid | null = null;
  await updateDb((db) => {
    const bid = db.bids.find((b) => b.id === bidId);
    if (!bid) throw new Error("Ставка не найдена");
    if (bid.freelancerId !== freelancerId) throw new Error("Нет доступа");
    if (bid.status !== "pending") throw new Error("Редактировать можно только активную ставку");
    const project = db.projects.find((p) => p.id === bid.projectId);
    if (!project || project.status !== "open") throw new Error("Проект недоступен");
    if (patch.amount !== undefined) {
      if (!(patch.amount > 0)) throw new Error("Укажите стоимость ставки");
      bid.amount = patch.amount;
    }
    if (patch.days !== undefined) {
      if (!(patch.days > 0)) throw new Error("Укажите срок");
      bid.days = patch.days;
    }
    if (patch.comment !== undefined) bid.comment = patch.comment;
    if (patch.transferCopyright !== undefined) bid.transferCopyright = patch.transferCopyright;
    if (patch.hideFromOthers !== undefined) bid.hideFromOthers = patch.hideFromOthers;
    updated = bid;
  });
  return updated!;
}

export async function withdrawBid(bidId: string, freelancerId: string) {
  await updateDb((db) => {
    const bid = db.bids.find((b) => b.id === bidId);
    if (!bid) throw new Error("Ставка не найдена");
    if (bid.freelancerId !== freelancerId) throw new Error("Нет доступа");
    if (bid.status !== "pending") throw new Error("Отозвать можно только активную ставку");
    bid.status = "rejected";
    const project = db.projects.find((p) => p.id === bid.projectId);
    if (project) {
      db.notifications.push({
        id: newId("n"),
        userId: project.clientId,
        title: "Ставка отозвана",
        body: `Исполнитель отозвал ставку по «${project.title}»`,
        read: false,
        href: `/client/projects/${project.id}`,
        createdAt: new Date().toISOString(),
      });
    }
  });
}

export async function rejectBid(projectId: string, bidId: string, clientId: string) {
  await updateDb((db) => {
    const project = db.projects.find((p) => p.id === projectId);
    const bid = db.bids.find((b) => b.id === bidId);
    if (!project || !bid) throw new Error("Не найдено");
    if (project.clientId !== clientId) throw new Error("Нет доступа");
    if (project.status !== "open") throw new Error("Проект уже закрыт");
    if (bid.projectId !== projectId) throw new Error("Ставка не от этого проекта");
    if (bid.status !== "pending") throw new Error("Ставка недоступна");
    bid.status = "rejected";
    db.notifications.push({
      id: newId("n"),
      userId: bid.freelancerId,
      title: "Ставка отклонена",
      body: `Заказчик отклонил ставку по «${project.title}»`,
      read: false,
      href: "/freelancer/bids",
      createdAt: new Date().toISOString(),
    });
  });
}

export async function getBalances(userId: string) {
  const db = await readDb();
  return calcBalances(db, userId);
}

export async function listLedger(userId: string) {
  const db = await readDb();
  return db.ledger
    .filter((e) => e.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listPendingDeposits(userId: string) {
  const db = await readDb();
  return db.deposits
    .filter(
      (d) =>
        d.userId === userId &&
        (d.status === "awaiting" || d.status === "confirming"),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAuditLog(limit = 100) {
  const db = await readDb();
  return [...db.auditLog].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

export async function createDeposit(input: {
  userId: string;
  amount: number;
  asset: CryptoAsset;
  network: CryptoNetwork;
}) {
  assertRateLimit(
    `deposit:${input.userId}`,
    RATE_LIMITS.deposit.limit,
    RATE_LIMITS.deposit.windowMs,
  );
  const amount = assertDepositAmount(input.amount);
  const now = new Date();
  const depositId = newId("dep");
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const invoice = await createNowPaymentsInvoice({
    depositId,
    amountUsdt: amount,
    network: input.network,
    ipnCallbackUrl: `${appUrl}/api/crypto/webhook`,
  });

  const deposit: DepositRequest = {
    id: depositId,
    userId: input.userId,
    amount,
    asset: input.asset,
    network: input.network,
    address: invoice.payAddress || depositAddress(input.network),
    status: "awaiting",
    providerRef: invoice.paymentId,
    invoiceUrl: invoice.invoiceUrl,
    payAmount: invoice.payAmount,
    payCurrency: invoice.payCurrency,
    providerSimulated: invoice.simulated,
    expiresAt: new Date(now.getTime() + DEPOSIT_TTL_HOURS * 3600_000).toISOString(),
    createdAt: now.toISOString(),
  };

  await updateDb((db) => {
    const user = db.users.find((u) => u.id === input.userId);
    if (!user || user.deactivatedAt) throw new Error("Аккаунт недоступен");
    db.deposits.push(deposit);
    pushAudit(db, {
      actorUserId: input.userId,
      action: "deposit.create",
      entityType: "deposit",
      entityId: deposit.id,
      meta: {
        amount,
        network: input.network,
        providerRef: invoice.paymentId,
        simulated: invoice.simulated,
      },
    });
  });
  return deposit;
}

/**
 * Confirm deposit after provider webhook / trusted server path.
 * Idempotent on depositId and txHash.
 */
export async function confirmDeposit(
  depositId: string,
  opts?: {
    txHash?: string;
    actorUserId?: string;
    eventKey?: string;
    provider?: string;
    rawPayloadHash?: string;
  },
): Promise<DepositRequest | null> {
  let result: DepositRequest | null = null;
  await updateDb((db) => {
    if (opts?.eventKey) {
      const dup = db.webhookEvents.find(
        (e) => e.eventKey === opts.eventKey && e.status === "processed",
      );
      if (dup) {
        result = db.deposits.find((d) => d.id === depositId) ?? null;
        return;
      }
    }

    const dep = db.deposits.find((d) => d.id === depositId);
    if (!dep) throw new Error("Депозит не найден");
    if (dep.status === "completed") {
      result = dep;
      return;
    }
    if (dep.status === "expired") throw new Error("Депозит истёк");
    if (new Date(dep.expiresAt).getTime() < Date.now() && dep.status === "awaiting") {
      dep.status = "expired";
      throw new Error("Депозит истёк");
    }

    assertUniqueTxHash(db.ledger, opts?.txHash);
    if (opts?.txHash && db.deposits.some((d) => d.txHash === opts.txHash && d.id !== dep.id)) {
      throw new Error("Транзакция уже учтена");
    }

    const alreadyCredited = db.ledger.some(
      (e) => e.kind === "deposit" && e.depositId === dep.id,
    );
    if (alreadyCredited) {
      dep.status = "completed";
      result = dep;
      return;
    }

    const now = new Date().toISOString();
    dep.status = "completed";
    dep.txHash = opts?.txHash ?? `sim-${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    dep.completedAt = now;

    db.ledger.push({
      id: newId("l"),
      userId: dep.userId,
      kind: "deposit",
      amount: dep.amount,
      asset: dep.asset,
      network: dep.network,
      note: `Депозит ${dep.asset} (${dep.network})`,
      txHash: dep.txHash,
      depositId: dep.id,
      createdAt: now,
      settledAt: now,
    });
    db.notifications.push({
      id: newId("n"),
      userId: dep.userId,
      title: "Баланс пополнен",
      body: `+${dep.amount} ${dep.asset}`,
      read: false,
      href: "/client/finance",
      createdAt: now,
    });
    if (opts?.eventKey) {
      db.webhookEvents.push({
        id: newId("wh"),
        provider: opts.provider ?? "cryptopay",
        eventKey: opts.eventKey,
        depositId: dep.id,
        payloadHash: opts.rawPayloadHash ?? "",
        status: "processed",
        createdAt: now,
      });
    }
    pushAudit(db, {
      actorUserId: opts?.actorUserId,
      action: "deposit.confirm",
      entityType: "deposit",
      entityId: dep.id,
      meta: { amount: dep.amount, txHash: dep.txHash },
    });
    assertNonNegativeAvailable(db, dep.userId);
    result = dep;
  });
  return result;
}

export async function requestWithdraw(input: {
  userId: string;
  amount: number;
  asset: CryptoAsset;
  network: CryptoNetwork;
  address: string;
  totpCode?: string;
}) {
  assertRateLimit(
    `withdraw:${input.userId}`,
    RATE_LIMITS.withdraw.limit,
    RATE_LIMITS.withdraw.windowMs,
  );
  const amount = assertWithdrawAmount(input.amount);
  const address = assertWalletAddress(input.address, input.network);
  let withdrawal: WithdrawalRequest | null = null;

  await updateDb((d) => {
    const user = d.users.find((u) => u.id === input.userId);
    if (!user || user.deactivatedAt) throw new Error("Аккаунт недоступен");

    if (!user.emailVerifiedAt) {
      throw new Error("Подтвердите email перед первым выводом (Настройки → Безопасность)");
    }

    if (amount >= WITHDRAW_REQUIRES_2FA_USDT) {
      if (!user.twoFaEnabled || !user.twoFaSecret) {
        throw new Error(
          `Для вывода от ${WITHDRAW_REQUIRES_2FA_USDT} USDT включите TOTP 2FA в настройках`,
        );
      }
      if (!input.totpCode) {
        throw new Error("Введите код 2FA для вывода");
      }
      if (!verifyTotpCode(user.twoFaSecret, input.totpCode)) {
        throw new Error("Неверный код 2FA");
      }
    }

    if (user.sensitiveChangedAt) {
      const elapsed = Date.now() - new Date(user.sensitiveChangedAt).getTime();
      if (elapsed < SENSITIVE_CHANGE_WITHDRAW_COOLDOWN_MS) {
        const hours = Math.ceil(
          (SENSITIVE_CHANGE_WITHDRAW_COOLDOWN_MS - elapsed) / 3600_000,
        );
        throw new Error(
          `После смены пароля/email/кошелька вывод временно недоступен (~${hours} ч.)`,
        );
      }
    }

    const bal = calcBalances(d, input.userId);
    if (bal.available < amount) throw new Error("Недостаточно средств");

    const dayAgo = Date.now() - 24 * 3600_000;
    const dayTotal = d.withdrawals
      .filter(
        (w) =>
          w.userId === input.userId &&
          w.status !== "rejected" &&
          new Date(w.createdAt).getTime() >= dayAgo,
      )
      .reduce((s, w) => s + w.amount, 0);
    if (dayTotal + amount > MAX_WITHDRAW_PER_DAY_USDT) {
      throw new Error(`Дневной лимит вывода ${MAX_WITHDRAW_PER_DAY_USDT} USDT`);
    }

    const now = new Date().toISOString();
    withdrawal = {
      id: newId("wd"),
      userId: input.userId,
      amount,
      asset: input.asset,
      network: input.network,
      address,
      status: "pending",
      createdAt: now,
    };
    d.withdrawals.push(withdrawal);
    d.ledger.push({
      id: newId("l"),
      userId: input.userId,
      kind: "withdraw_hold",
      amount: -amount,
      asset: input.asset,
      network: input.network,
      note: `Холд вывода · ${address.slice(0, 6)}…${address.slice(-4)}`,
      withdrawalId: withdrawal.id,
      createdAt: now,
    });
    pushAudit(d, {
      actorUserId: input.userId,
      action: "withdraw.request",
      entityType: "withdrawal",
      entityId: withdrawal.id,
      meta: { amount, network: input.network },
    });
    assertNonNegativeAvailable(d, input.userId);
  });

  return withdrawal!;
}

function fundDealInDb(
  db: DbShape,
  dealId: string,
  clientId: string,
  opts?: { skipChatNotice?: boolean },
) {
  const deal = db.deals.find((d) => d.id === dealId);
  if (!deal) throw new Error("Сделка не найдена");
  if (deal.clientId !== clientId) throw new Error("Нет доступа");
  if (!canFund(deal.status)) throw new Error("Сделка уже оплачена или закрыта");

  if (deal.fundingDeadlineAt && new Date(deal.fundingDeadlineAt).getTime() < Date.now()) {
    throw new Error("Срок оплаты эскроу истёк");
  }

  const alreadyLocked = db.ledger.some(
    (e) => e.kind === "escrow_lock" && e.dealId === deal.id,
  );
  if (alreadyLocked) throw new Error("Эскроу уже залочен");

  const bal = calcBalances(db, clientId);
  if (bal.available < deal.amount) {
    throw new Error("Недостаточно USDT на балансе для эскроу");
  }

  const project = db.projects.find((p) => p.id === deal.projectId);
  const now = new Date().toISOString();
  assertDealTransition(deal.status, "in_progress");
  deal.status = "in_progress";
  deal.fundedAt = now;
  if (project && project.status === "open") project.status = "in_progress";

  db.ledger.push({
    id: newId("l"),
    userId: clientId,
    kind: "escrow_lock",
    amount: -deal.amount,
    asset: "USDT",
    note: `Эскроу · ${project?.title ?? deal.projectId}`,
    dealId: deal.id,
    createdAt: now,
    settledAt: now,
  });
  db.notifications.push({
    id: newId("n"),
    userId: deal.freelancerId,
    title: "Эскроу пополнен",
    body: `В сейфе ${deal.amount} USDT · можно начинать работу`,
    read: false,
    href: "/freelancer/work",
    createdAt: now,
  });

  if (!opts?.skipChatNotice) {
    const thread = db.threads.find((t) => t.dealId === deal.id);
    if (thread) {
      const notice = pushSystemMessageInDb(
        db,
        thread.id,
        `Эскроу пополнен · ${formatUsdtAmount(deal.amount)} в сейфе · можно начинать работу`,
        "escrow_funded",
        now,
      );
      if (!thread.lastReadAt) thread.lastReadAt = {};
      // Funder already knows — don't badge their own escrow notice.
      thread.lastReadAt[clientId] = notice.createdAt;
    }
  }

  pushAudit(db, {
    actorUserId: clientId,
    action: "escrow.fund",
    entityType: "deal",
    entityId: deal.id,
    meta: { amount: deal.amount },
  });
  assertNonNegativeAvailable(db, clientId);
  return deal;
}

export async function fundDeal(dealId: string, clientId: string) {
  assertRateLimit(`fund:${clientId}`, RATE_LIMITS.fund.limit, RATE_LIMITS.fund.windowMs);
  let deal: Deal | null = null;
  await updateDb((db) => {
    deal = fundDealInDb(db, dealId, clientId);
  });
  return deal!;
}

export async function acceptBid(
  projectId: string,
  bidId: string,
  clientId: string,
  amountOverride?: number,
) {
  let result: Deal | null = null;
  await updateDb((d) => {
    const project = d.projects.find((p) => p.id === projectId);
    const bid = d.bids.find((b) => b.id === bidId);
    if (!project || !bid) throw new Error("Не найдено");
    if (project.clientId !== clientId) throw new Error("Нет доступа");
    if (project.status !== "open") throw new Error("Проект уже в работе");
    if (bid.projectId !== projectId) throw new Error("Ставка не от этого проекта");
    if (bid.status !== "pending") throw new Error("Ставка недоступна");

    const agreed =
      amountOverride != null && amountOverride > 0 ? amountOverride : bid.amount;
    const amount = normalizeUsdt(agreed);
    if (!(amount > 0)) throw new Error("Укажите стоимость сделки");
    bid.amount = amount;
    const feePercent = DEFAULT_FEE_PERCENT;
    const feeAmount = normalizeUsdt((amount * feePercent) / 100);
    const now = new Date();
    const deal: Deal = {
      id: newId("d"),
      projectId,
      clientId,
      freelancerId: bid.freelancerId,
      bidId: bid.id,
      amount,
      feePercent,
      feeAmount,
      status: "pending_funding",
      fundingDeadlineAt: new Date(
        now.getTime() + PENDING_FUNDING_TTL_HOURS * 3600_000,
      ).toISOString(),
      createdAt: now.toISOString(),
    };

    d.bids.forEach((b) => {
      if (b.projectId === projectId) {
        b.status = b.id === bidId ? "accepted" : "rejected";
      }
    });

    // Keep project open until funded? Safer: mark in_progress only after fund.
    // Award reserved: still block other accepts via status check — use a soft lock.
    project.status = "in_progress";

    d.deals.push(deal);
    const threadId = newId("t");
    const openedAt = now.toISOString();
    d.threads.push({
      id: threadId,
      dealId: deal.id,
      projectId,
      participantIds: [clientId, bid.freelancerId],
      title: project.title,
      updatedAt: openedAt,
    });

    pushAudit(d, {
      actorUserId: clientId,
      action: "escrow.accept_bid",
      entityType: "deal",
      entityId: deal.id,
      meta: { amount, bidId },
    });

    const bal = calcBalances(d, clientId);
    const thread = d.threads.find((t) => t.id === threadId)!;
    if (!thread.lastReadAt) thread.lastReadAt = {};

    if (bal.available >= amount) {
      const opened = pushSystemMessageInDb(
        d,
        threadId,
        `Эскроу открыт и оплачен · ${formatUsdtAmount(amount)} в сейфе по «${project.title}»`,
        "escrow_opened_funded",
        openedAt,
      );
      thread.lastReadAt[clientId] = opened.createdAt;
      fundDealInDb(d, deal.id, clientId, { skipChatNotice: true });
      d.notifications.push({
        id: newId("n"),
        userId: bid.freelancerId,
        title: "Ставка принята",
        body: `Эскроу ${amount} USDT открыт по «${project.title}»`,
        read: false,
        href: "/freelancer/work",
        createdAt: openedAt,
      });
    } else {
      pushSystemMessageInDb(
        d,
        threadId,
        `Эскроу открыт · ${formatUsdtAmount(amount)} по «${project.title}»`,
        "escrow_opened",
        openedAt,
      );
      const awaiting = pushSystemMessageInDb(
        d,
        threadId,
        "Ожидается оплата заказчиком · не приступайте к работе, пока средства не в сейфе",
        "escrow_awaiting_payment",
        new Date(now.getTime() + 1).toISOString(),
      );
      thread.lastReadAt[clientId] = awaiting.createdAt;
      d.notifications.push({
        id: newId("n"),
        userId: clientId,
        title: "Нужно пополнить эскроу",
        body: `Примите оплату ${amount} USDT для «${project.title}»`,
        read: false,
        href: "/client/work",
        createdAt: openedAt,
      });
      d.notifications.push({
        id: newId("n"),
        userId: bid.freelancerId,
        title: "Ставка принята",
        body: `Ожидаем пополнение эскроу по «${project.title}»`,
        read: false,
        href: "/freelancer/work",
        createdAt: openedAt,
      });
    }

    result = d.deals.find((x) => x.id === deal.id) ?? deal;
  });
  return result!;
}

export async function deliverDeal(dealId: string, freelancerId: string) {
  await updateDb((db) => {
    const deal = db.deals.find((d) => d.id === dealId);
    if (!deal || deal.freelancerId !== freelancerId) throw new Error("Нет доступа");
    if (deal.status !== "in_progress" && deal.status !== "funded") {
      throw new Error("Сдать работу можно только из статуса «в работе»");
    }
    assertDealTransition(deal.status, "delivered");
    const now = new Date();
    deal.status = "delivered";
    deal.deliveredAt = now.toISOString();
    deal.autoReleaseAt = new Date(
      now.getTime() + AUTO_RELEASE_AFTER_DELIVER_HOURS * 3600_000,
    ).toISOString();
    const project = db.projects.find((p) => p.id === deal.projectId);
    if (project) project.status = "delivered";
    db.notifications.push({
      id: newId("n"),
      userId: deal.clientId,
      title: "Работа сдана",
      body: `Проверьте результат. Авто-релиз через ${AUTO_RELEASE_AFTER_DELIVER_HOURS} ч., если нет ответа.`,
      read: false,
      href: "/client/work",
      createdAt: now.toISOString(),
    });
    pushAudit(db, {
      actorUserId: freelancerId,
      action: "escrow.deliver",
      entityType: "deal",
      entityId: deal.id,
    });
  });
}

function releaseDealInDb(
  db: DbShape,
  dealId: string,
  actorUserId: string,
  asAdmin = false,
) {
  const deal = db.deals.find((d) => d.id === dealId);
  if (!deal) throw new Error("Нет доступа");
  if (!asAdmin && deal.clientId !== actorUserId) throw new Error("Нет доступа");
  if (isTerminalDeal(deal.status)) throw new Error("Сделка уже закрыта");

  if (!asAdmin && !canClientRelease(deal.status)) {
    throw new Error("Сначала дождитесь сдачи работы");
  }
  if (asAdmin && deal.status !== "disputed" && deal.status !== "delivered") {
    throw new Error("Админ-релиз только для диспута или сдачи");
  }

  const duplicate = db.ledger.some(
    (e) => e.dealId === deal.id && (e.kind === "escrow_release" || e.kind === "fee"),
  );
  if (duplicate) throw new Error("Выплата по сделке уже проведена");

  assertDealTransition(deal.status, "released");
  const fee = deal.feeAmount ?? normalizeUsdt((deal.amount * deal.feePercent) / 100);
  const payout = normalizeUsdt(deal.amount - fee);
  if (normalizeUsdt(payout + fee) !== normalizeUsdt(deal.amount)) {
    throw new Error("Инвариант комиссии нарушен");
  }

  const now = new Date().toISOString();
  deal.status = "released";
  deal.releasedAt = now;
  const project = db.projects.find((p) => p.id === deal.projectId);
  if (project) project.status = "completed";

  db.ledger.push({
    id: newId("l"),
    userId: deal.freelancerId,
    kind: "escrow_release",
    amount: payout,
    asset: "USDT",
    note: `Выплата по эскроу (−${deal.feePercent}% комиссия)`,
    dealId: deal.id,
    createdAt: now,
    settledAt: now,
  });
  db.ledger.push({
    id: newId("l"),
    userId: PLATFORM_FEE_USER_ID,
    kind: "fee",
    amount: fee,
    asset: "USDT",
    note: `Комиссия DigiForge ${deal.feePercent}%`,
    dealId: deal.id,
    createdAt: now,
    settledAt: now,
  });
  db.notifications.push({
    id: newId("n"),
    userId: deal.freelancerId,
    title: "Эскроу закрыт",
    body: `+${payout} USDT на баланс`,
    read: false,
    href: "/freelancer/finance",
    createdAt: now,
  });
  // Client first — leave a review right after close.
  db.notifications.push({
    id: newId("n"),
    userId: deal.clientId,
    title: "Оставьте отзыв",
    body: "Сделка закрыта · расскажите, как прошла работа. Отзывы станут видны, когда оба оставят ответ.",
    read: false,
    href: "/client/reviews",
    initials: "★",
    createdAt: now,
  });
  db.notifications.push({
    id: newId("n"),
    userId: deal.freelancerId,
    title: "Оставьте отзыв",
    body: "Сделка закрыта · оставьте отзыв о заказчике. Отзывы станут видны после взаимного обмена.",
    read: false,
    href: "/freelancer/reviews",
    initials: "★",
    createdAt: now,
  });
  pushAudit(db, {
    actorUserId,
    action: "escrow.release",
    entityType: "deal",
    entityId: deal.id,
    meta: { payout, fee, asAdmin },
  });
}

export async function releaseDeal(dealId: string, clientId: string) {
  await updateDb((db) => releaseDealInDb(db, dealId, clientId, false));
}

export async function disputeDeal(dealId: string, userId: string) {
  await updateDb((db) => {
    const deal = db.deals.find((d) => d.id === dealId);
    if (!deal) throw new Error("Сделка не найдена");
    if (deal.clientId !== userId && deal.freelancerId !== userId) {
      throw new Error("Нет доступа");
    }
    if (!canDispute(deal.status)) {
      throw new Error("Диспут недоступен для текущего статуса");
    }
    assertDealTransition(deal.status, "disputed");
    deal.status = "disputed";
    deal.disputedAt = new Date().toISOString();
    const project = db.projects.find((p) => p.id === deal.projectId);
    if (project) project.status = "disputed";
    db.notifications.push({
      id: newId("n"),
      userId: PLATFORM_FEE_USER_ID,
      title: "Диспут",
      body: `Сделка ${deal.id} открыта на спор`,
      read: false,
      href: "/admin/deals",
      createdAt: new Date().toISOString(),
    });
    pushAudit(db, {
      actorUserId: userId,
      action: "escrow.dispute",
      entityType: "deal",
      entityId: deal.id,
    });
  });
}

export async function adminResolveDeal(
  dealId: string,
  resolution: "release" | "refund" | "partial_refund",
  adminUserId?: string,
  opts?: { refundAmount?: number },
) {
  if (resolution === "release") {
    await updateDb((db) => {
      const deal = db.deals.find((d) => d.id === dealId);
      if (!deal) throw new Error("Не найдено");
      releaseDealInDb(db, dealId, adminUserId ?? PLATFORM_FEE_USER_ID, true);
    });
    return;
  }

  await updateDb((db) => {
    const deal = db.deals.find((d) => d.id === dealId);
    if (!deal) throw new Error("Не найдено");
    if (isTerminalDeal(deal.status)) throw new Error("Сделка уже закрыта");
    if (deal.status !== "disputed") throw new Error("Возврат только из диспута");

    const duplicate = db.ledger.some(
      (e) =>
        e.dealId === deal.id &&
        (e.kind === "escrow_refund" || e.kind === "escrow_release" || e.kind === "fee"),
    );
    if (duplicate) throw new Error("Сделка уже рассчитана");

    const now = new Date().toISOString();
    let refundAmount = deal.amount;
    if (resolution === "partial_refund") {
      refundAmount = normalizeUsdt(Number(opts?.refundAmount ?? 0));
      if (refundAmount <= 0 || refundAmount >= deal.amount) {
        throw new Error("Частичный возврат: укажите сумму больше 0 и меньше суммы сделки");
      }
      const toFreelancer = normalizeUsdt(deal.amount - refundAmount);
      const fee = normalizeUsdt((toFreelancer * deal.feePercent) / 100);
      const payout = normalizeUsdt(toFreelancer - fee);

      assertDealTransition(deal.status, "released");
      deal.status = "released";
      deal.releasedAt = now;
      deal.autoReleaseAt = undefined;
      const project = db.projects.find((p) => p.id === deal.projectId);
      if (project) project.status = "completed";

      db.ledger.push({
        id: newId("l"),
        userId: deal.clientId,
        kind: "escrow_refund",
        amount: refundAmount,
        asset: "USDT",
        note: `Частичный возврат заказчику ${refundAmount} USDT`,
        dealId: deal.id,
        createdAt: now,
        settledAt: now,
      });
      if (payout > 0) {
        db.ledger.push({
          id: newId("l"),
          userId: deal.freelancerId,
          kind: "escrow_release",
          amount: payout,
          asset: "USDT",
          note: `Частичная выплата (−${deal.feePercent}% с доли)`,
          dealId: deal.id,
          createdAt: now,
          settledAt: now,
        });
      }
      if (fee > 0) {
        db.ledger.push({
          id: newId("l"),
          userId: PLATFORM_FEE_USER_ID,
          kind: "fee",
          amount: fee,
          asset: "USDT",
          note: `Комиссия с частичной выплаты`,
          dealId: deal.id,
          createdAt: now,
          settledAt: now,
        });
      }
      pushAudit(db, {
        actorUserId: adminUserId,
        action: "escrow.refund",
        entityType: "deal",
        entityId: deal.id,
        meta: { amount: refundAmount, partial: true, payout, fee },
      });
      return;
    }

    assertDealTransition(deal.status, "refunded");
    deal.status = "refunded";
    deal.autoReleaseAt = undefined;
    const project = db.projects.find((p) => p.id === deal.projectId);
    if (project) project.status = "cancelled";
    db.ledger.push({
      id: newId("l"),
      userId: deal.clientId,
      kind: "escrow_refund",
      amount: deal.amount,
      asset: "USDT",
      note: "Возврат эскроу по решению админа",
      dealId: deal.id,
      createdAt: now,
      settledAt: now,
    });
    pushAudit(db, {
      actorUserId: adminUserId,
      action: "escrow.refund",
      entityType: "deal",
      entityId: deal.id,
      meta: { amount: deal.amount },
    });
  });
}

/** Cron: expire deposits, cancel unfunded deals, auto-release delivered. */
export async function runFinanceMaintenanceJobs() {
  const summary = { expiredDeposits: 0, cancelledDeals: 0, autoReleased: 0 };
  await updateDb((db) => {
    const now = Date.now();
    for (const dep of db.deposits) {
      if (
        (dep.status === "awaiting" || dep.status === "confirming") &&
        new Date(dep.expiresAt).getTime() < now
      ) {
        dep.status = "expired";
        summary.expiredDeposits += 1;
      }
    }

    for (const deal of db.deals) {
      if (
        deal.status === "pending_funding" &&
        deal.fundingDeadlineAt &&
        new Date(deal.fundingDeadlineAt).getTime() < now
      ) {
        deal.status = "refunded";
        const project = db.projects.find((p) => p.id === deal.projectId);
        if (project && project.status !== "completed") project.status = "cancelled";
        summary.cancelledDeals += 1;
        pushAudit(db, {
          action: "escrow.refund",
          entityType: "deal",
          entityId: deal.id,
          meta: { reason: "funding_ttl", hours: PENDING_FUNDING_TTL_HOURS },
        });
      }
    }

    for (const deal of [...db.deals]) {
      if (
        deal.status === "delivered" &&
        deal.autoReleaseAt &&
        new Date(deal.autoReleaseAt).getTime() < now
      ) {
        try {
          releaseDealInDb(db, deal.id, PLATFORM_FEE_USER_ID, true);
          deal.autoReleaseAt = undefined;
          summary.autoReleased += 1;
        } catch {
          // skip if already released / invariant fail
        }
      }
    }
  });
  return summary;
}

export async function buyDigiPrime(
  userId: string,
  days = DIGI_PRIME_DAYS,
  price = DIGI_PRIME_PRICE_USDT,
  opts?: { trial?: boolean },
) {
  await updateDb((d) => {
    const user = d.users.find((u) => u.id === userId);
    if (!user || user.role !== "freelancer") throw new Error("Пользователь не найден");
    if (user.deactivatedAt) throw new Error("Аккаунт недоступен");

    if (opts?.trial) {
      if (user.digiPrimeUntil && new Date(user.digiPrimeUntil).getTime() > Date.now()) {
        throw new Error("Prime уже активен");
      }
      if (user.digiPrimeTrialUsed) throw new Error("Триал уже использован");
      user.digiPrimeTrial = true;
      user.digiPrimeTrialUsed = true;
      user.digiPrimeAutoRenew = true;
      user.digiPrimeUntil = new Date(Date.now() + days * 86400000).toISOString();
      pushAudit(d, {
        actorUserId: userId,
        action: "prime.buy",
        entityType: "user",
        entityId: userId,
        meta: { trial: true, days },
      });
      return;
    }

    const bal = calcBalances(d, userId);
    if (price > 0 && bal.available < price) throw new Error("Недостаточно USDT");

    const base = user.digiPrimeUntil
      ? Math.max(Date.now(), new Date(user.digiPrimeUntil).getTime())
      : Date.now();
    user.digiPrimeUntil = new Date(base + days * 86400000).toISOString();
    user.digiPrimeTrial = false;
    user.digiPrimeAutoRenew = true;
    if (price > 0) {
      const now = new Date().toISOString();
      d.ledger.push({
        id: newId("l"),
        userId,
        kind: "prime",
        amount: -normalizeUsdt(price),
        asset: "USDT",
        note: `Digi Prime · ${days} дней`,
        createdAt: now,
        settledAt: now,
      });
    }
    pushAudit(d, {
      actorUserId: userId,
      action: "prime.buy",
      entityType: "user",
      entityId: userId,
      meta: { price, days },
    });
    assertNonNegativeAvailable(d, userId);
  });
}

export async function setDigiPrimeAutoRenew(userId: string, enabled: boolean) {
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error("Пользователь не найден");
    user.digiPrimeAutoRenew = enabled;
  });
}

export async function getThreadsForUser(userId: string) {
  const db = await readDb();
  return db.threads
    .filter((t) => t.participantIds.includes(userId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getMessages(threadId: string) {
  const db = await readDb();
  return db.messages
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function sendMessage(
  threadId: string,
  senderId: string,
  body: string,
  attachment?: Message["attachment"],
) {
  const message: Message = {
    id: newId("m"),
    threadId,
    senderId,
    body,
    attachment,
    createdAt: new Date().toISOString(),
    kind: "user",
  };
  await updateDb((db) => {
    const thread = db.threads.find((t) => t.id === threadId);
    if (!thread || !thread.participantIds.includes(senderId)) {
      throw new Error("Нет доступа к чату");
    }
    if (!thread.lastReadAt) thread.lastReadAt = {};
    db.messages.push(message);
    thread.updatedAt = message.createdAt;
    // Sender has read up to this message; peer gets unread badge in Messages UI.
    thread.lastReadAt[senderId] = message.createdAt;

    // Client wrote while escrow is still unpaid — remind both sides not to start work.
    if (thread.dealId) {
      const deal = db.deals.find((d) => d.id === thread.dealId);
      if (
        deal &&
        deal.status === "pending_funding" &&
        senderId === deal.clientId
      ) {
        const recentHold = db.messages.some(
          (m) =>
            m.threadId === threadId &&
            m.kind === "system" &&
            m.systemCode === "work_hold_until_funded" &&
            new Date(message.createdAt).getTime() - new Date(m.createdAt).getTime() <
              30 * 60_000,
        );
        if (!recentHold) {
          const hold = pushSystemMessageInDb(
            db,
            threadId,
            "Заказчик написал до оплаты эскроу · не начинайте работу, пока средства не в сейфе",
            "work_hold_until_funded",
            new Date(new Date(message.createdAt).getTime() + 1).toISOString(),
          );
          thread.lastReadAt[senderId] = hold.createdAt;
        }
      }
    }
  });
  return message;
}

export async function markThreadRead(userId: string, threadId: string) {
  await updateDb((db) => {
    const thread = db.threads.find((t) => t.id === threadId);
    if (!thread || !thread.participantIds.includes(userId)) {
      throw new Error("Нет доступа к чату");
    }
    if (!thread.lastReadAt) thread.lastReadAt = {};
    thread.lastReadAt[userId] = new Date().toISOString();
  });
}

export function countUnreadInThread(
  db: DbShape,
  threadId: string,
  userId: string,
): number {
  const thread = db.threads.find((t) => t.id === threadId);
  if (!thread || !thread.participantIds.includes(userId)) return 0;
  const lastRead = thread.lastReadAt?.[userId] ?? "";
  return db.messages.filter(
    (m) =>
      m.threadId === threadId &&
      m.senderId !== userId &&
      m.createdAt > lastRead,
  ).length;
}

export async function getUnreadMessageSummary(userId: string) {
  const db = await readDb();
  const byThread: Record<string, number> = {};
  let total = 0;
  for (const thread of db.threads) {
    if (!thread.participantIds.includes(userId)) continue;
    const count = countUnreadInThread(db, thread.id, userId);
    if (count > 0) {
      byThread[thread.id] = count;
      total += count;
    }
  }
  return { total, byThread };
}

export async function listNotifications(userId: string) {
  const db = await readDb();
  return db.notifications
    .filter((n) => n.userId === userId && n.title !== "Новое сообщение")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markNotificationsRead(userId: string) {
  await updateDb((db) => {
    db.notifications.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
  });
}

/** Both sides must leave a review before either becomes public. */
export function isDealReviewPairComplete(db: DbShape, dealId: string): boolean {
  const forDeal = db.reviews.filter((r) => r.dealId === dealId);
  if (forDeal.length < 2) return false;
  const deal = db.deals.find((d) => d.id === dealId);
  if (deal) {
    return (
      forDeal.some((r) => r.fromUserId === deal.clientId) &&
      forDeal.some((r) => r.fromUserId === deal.freelancerId)
    );
  }
  // Legacy / seed rows without a deal record: any two distinct authors.
  return new Set(forDeal.map((r) => r.fromUserId)).size >= 2;
}

export function listPublishedReviewsForUser(db: DbShape, userId: string) {
  return db.reviews.filter(
    (r) => r.toUserId === userId && isDealReviewPairComplete(db, r.dealId),
  );
}

export async function listReviewsForUser(userId: string) {
  const db = await readDb();
  return listPublishedReviewsForUser(db, userId);
}

export async function listPortfolio(freelancerId: string) {
  const db = await readDb();
  return db.portfolio.filter((c) => c.freelancerId === freelancerId);
}

export async function addPortfolioCase(
  input: Omit<PortfolioCase, "id" | "createdAt">,
) {
  const item: PortfolioCase = {
    ...input,
    id: `c-${crypto.randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
  };
  await updateDb((db) => db.portfolio.push(item));
  return item;
}

export async function updatePortfolioCase(
  caseId: string,
  freelancerId: string,
  patch: Partial<
    Pick<
      PortfolioCase,
      "title" | "summary" | "tags" | "priceUsdt" | "projectUrl" | "coverUrl"
    >
  >,
) {
  let updated: PortfolioCase | null = null;
  await updateDb((db) => {
    const item = db.portfolio.find(
      (c) => c.id === caseId && c.freelancerId === freelancerId,
    );
    if (!item) return;
    Object.assign(item, patch);
    updated = item;
  });
  return updated;
}

export async function deletePortfolioCase(caseId: string, freelancerId: string) {
  let removed = false;
  await updateDb((db) => {
    const idx = db.portfolio.findIndex(
      (c) => c.id === caseId && c.freelancerId === freelancerId,
    );
    if (idx === -1) return;
    db.portfolio.splice(idx, 1);
    removed = true;
  });
  return removed;
}

export async function updateUserProfile(
  userId: string,
  patch: Partial<
    Pick<
      User,
      | "name"
      | "title"
      | "bio"
      | "skills"
      | "walletAddress"
      | "walletNetwork"
      | "walletAsset"
      | "twoFaEnabled"
      | "avatarUrl"
      | "email"
      | "password"
      | "settings"
      | "loginLog"
      | "deactivatedAt"
      | "digiPrimeUntil"
      | "digiPrimeTrial"
      | "digiPrimeTrialUsed"
      | "digiPrimeAutoRenew"
      | "workStatus"
      | "legalForm"
      | "motto"
      | "bidSignature"
      | "autoAddBidSignature"
      | "profileI18n"
    >
  >,
) {
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error("Не найден");
    const walletChanged =
      (patch.walletAddress !== undefined && patch.walletAddress !== user.walletAddress) ||
      (patch.walletNetwork !== undefined && patch.walletNetwork !== user.walletNetwork);
    if (patch.password) {
      patch = { ...patch, password: hashPassword(patch.password) };
    }
    Object.assign(user, patch);
    if (walletChanged || patch.password || patch.email) {
      user.sensitiveChangedAt = new Date().toISOString();
      pushAudit(db, {
        actorUserId: userId,
        action: "security.sensitive_change",
        entityType: "user",
        entityId: userId,
      });
    }
  });
  return findUserById(userId);
}

export async function updateUserSettings(userId: string, patch: Partial<UserSettings>) {
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error("Не найден");
    user.settings = { ...DEFAULT_SETTINGS, ...(user.settings ?? {}), ...patch };
  });
  return findUserById(userId);
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  nextPassword: string,
) {
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error("Не найден");
    if (!verifyPassword(currentPassword, user.password)) {
      throw new Error("Неверный текущий пароль");
    }
    if (nextPassword.length < 8) throw new Error("Новый пароль — минимум 8 символов");
    user.password = hashPassword(nextPassword);
    user.sensitiveChangedAt = new Date().toISOString();
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    pushAudit(db, {
      actorUserId: userId,
      action: "security.sensitive_change",
      entityType: "user",
      entityId: userId,
      meta: { field: "password" },
    });
  });
}

export async function changeUserEmail(userId: string, email: string, password: string) {
  const next = email.trim().toLowerCase();
  if (!next.includes("@")) throw new Error("Укажите корректный email");
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error("Не найден");
    if (!verifyPassword(password, user.password)) throw new Error("Неверный пароль");
    if (db.users.some((u) => u.id !== userId && u.email.toLowerCase() === next)) {
      throw new Error("Этот email уже занят");
    }
    user.email = next;
    user.sensitiveChangedAt = new Date().toISOString();
    user.emailVerifiedAt = null;
    user.emailVerifyTokenHash = null;
    user.emailVerifyExpiresAt = null;
    pushAudit(db, {
      actorUserId: userId,
      action: "security.sensitive_change",
      entityType: "user",
      entityId: userId,
      meta: { field: "email" },
    });
  });
}

export async function clearUserSessions(userId: string) {
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error("Не найден");
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    const log = user.loginLog?.length ? user.loginLog : defaultLoginLog();
    user.loginLog = log
      .filter((s) => s.current)
      .map((s) => ({ ...s, createdAt: new Date().toISOString() }));
    pushAudit(db, {
      actorUserId: userId,
      action: "auth.sessions_cleared",
      entityType: "user",
      entityId: userId,
      meta: { sessionVersion: user.sessionVersion },
    });
  });
}

export async function beginTwoFaSetup(userId: string) {
  let uri = "";
  let secret = "";
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error("Не найден");
    secret = generateTotpSecret();
    user.twoFaPendingSecret = secret;
    uri = otpauthUri({ secret, email: user.email });
  });
  return { secret, otpauthUrl: uri };
}

export async function confirmTwoFaSetup(userId: string, code: string) {
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error("Не найден");
    const pending = user.twoFaPendingSecret;
    if (!pending) throw new Error("Сначала начните настройку 2FA");
    if (!verifyTotpCode(pending, code)) throw new Error("Неверный код 2FA");
    user.twoFaSecret = pending;
    user.twoFaPendingSecret = null;
    user.twoFaEnabled = true;
    pushAudit(db, {
      actorUserId: userId,
      action: "auth.2fa_enabled",
      entityType: "user",
      entityId: userId,
    });
  });
}

export async function disableTwoFa(userId: string, code: string) {
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error("Не найден");
    if (!user.twoFaSecret || !verifyTotpCode(user.twoFaSecret, code)) {
      throw new Error("Неверный код 2FA");
    }
    user.twoFaEnabled = false;
    user.twoFaSecret = null;
    user.twoFaPendingSecret = null;
    pushAudit(db, {
      actorUserId: userId,
      action: "auth.2fa_disabled",
      entityType: "user",
      entityId: userId,
    });
  });
}

export async function requestEmailVerification(userId: string) {
  const { raw, hash } = createEmailVerifyToken();
  let email = "";
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error("Не найден");
    if (user.emailVerifiedAt) throw new Error("Email уже подтверждён");
    email = user.email;
    user.emailVerifyTokenHash = hash;
    user.emailVerifyExpiresAt = new Date(Date.now() + 24 * 3600_000).toISOString();
  });
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${base.replace(/\/$/, "")}/api/verify-email?token=${raw}`;
  const delivery = await deliverVerificationLink(email, url);
  return {
    sent: true,
    previewUrl: delivery.channel === "console" ? url : undefined,
  };
}

export async function confirmEmailVerification(rawToken: string) {
  const hash = hashEmailToken(rawToken);
  let ok = false;
  await updateDb((db) => {
    const user = db.users.find((u) => u.emailVerifyTokenHash === hash);
    if (!user) throw new Error("Ссылка недействительна");
    if (
      user.emailVerifyExpiresAt &&
      new Date(user.emailVerifyExpiresAt).getTime() < Date.now()
    ) {
      throw new Error("Ссылка истекла");
    }
    user.emailVerifiedAt = new Date().toISOString();
    user.emailVerifyTokenHash = null;
    user.emailVerifyExpiresAt = null;
    ok = true;
    pushAudit(db, {
      actorUserId: user.id,
      action: "auth.email_verified",
      entityType: "user",
      entityId: user.id,
    });
  });
  return ok;
}

export async function deactivateUser(userId: string) {
  await adminSetUserActive(userId, false);
}

function applyReviewStats(db: DbShape, userId: string) {
  const user = db.users.find((u) => u.id === userId);
  if (!user) return;
  const reviews = listPublishedReviewsForUser(db, userId);
  user.reviewCount = reviews.length;
  user.rating =
    reviews.length === 0
      ? 0
      : Number(
          (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1),
        );
}

/** Recompute public rating for every user (e.g. after mutual-review policy). */
export function recomputeAllReviewStats(db: DbShape) {
  for (const user of db.users) {
    if (user.role === "admin") continue;
    applyReviewStats(db, user.id);
  }
}

export async function adminSetUserActive(userId: string, active: boolean) {
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error("Не найден");
    if (user.role === "admin") throw new Error("Нельзя деактивировать админа");
    user.deactivatedAt = active ? null : new Date().toISOString();
  });
}

export async function adminCancelProject(projectId: string) {
  await updateDb((db) => {
    const project = db.projects.find((p) => p.id === projectId);
    if (!project) throw new Error("Проект не найден");
    if (project.status !== "open") {
      throw new Error("Отменить можно только открытый проект");
    }
    project.status = "cancelled";
    for (const bid of db.bids.filter((b) => b.projectId === projectId && b.status === "pending")) {
      bid.status = "rejected";
    }
  });
}

export async function adminProcessWithdrawal(
  withdrawalId: string,
  decision: "approve" | "reject",
  adminUserId?: string,
  opts?: { txHash?: string; rejectReason?: string },
) {
  if (decision === "reject") {
    await updateDb((db) => {
      const wd = db.withdrawals.find((w) => w.id === withdrawalId);
      if (!wd) throw new Error("Заявка не найдена");
      if (wd.status !== "pending" && wd.status !== "processing") {
        throw new Error("Заявка уже обработана");
      }
      const now = new Date().toISOString();
      wd.status = "rejected";
      wd.reviewedBy = adminUserId;
      wd.reviewedAt = now;
      wd.rejectReason = opts?.rejectReason ?? "Отклонено администратором";
      db.ledger.push({
        id: newId("l"),
        userId: wd.userId,
        kind: "withdraw_release",
        amount: wd.amount,
        asset: wd.asset,
        network: wd.network,
        note: `Отмена вывода · возврат ${wd.amount} ${wd.asset}`,
        withdrawalId: wd.id,
        createdAt: now,
        settledAt: now,
      });
      db.notifications.push({
        id: newId("n"),
        userId: wd.userId,
        title: "Вывод отклонён",
        body: `Заявка на ${wd.amount} ${wd.asset} отклонена, средства возвращены`,
        read: false,
        createdAt: now,
      });
      pushAudit(db, {
        actorUserId: adminUserId,
        action: "withdraw.reject",
        entityType: "withdrawal",
        entityId: wd.id,
        meta: { amount: wd.amount, reason: wd.rejectReason },
      });
      assertNonNegativeAvailable(db, wd.userId);
    });
    return;
  }

  // approve → processing → provider payout → completed (or release on failure)
  let snapshot: WithdrawalRequest | null = null;
  await updateDb((db) => {
    const wd = db.withdrawals.find((w) => w.id === withdrawalId);
    if (!wd) throw new Error("Заявка не найдена");
    if (wd.status !== "pending" && wd.status !== "processing") {
      throw new Error("Заявка уже обработана");
    }
    wd.status = "processing";
    wd.reviewedBy = adminUserId;
    wd.reviewedAt = new Date().toISOString();
    snapshot = { ...wd };
  });
  const wdSnap = snapshot as WithdrawalRequest | null;
  if (!wdSnap) throw new Error("Заявка не найдена");

  let payout: Awaited<ReturnType<typeof createNowPaymentsPayout>>;
  try {
    payout = await createNowPaymentsPayout({
      withdrawalId,
      amountUsdt: wdSnap.amount,
      address: wdSnap.address,
      network: wdSnap.network,
    });
  } catch (e) {
    await updateDb((db) => {
      const wd = db.withdrawals.find((w) => w.id === withdrawalId);
      if (!wd || wd.status === "completed" || wd.status === "rejected") return;
      const now = new Date().toISOString();
      wd.status = "rejected";
      wd.rejectReason = e instanceof Error ? e.message : "Payout failed";
      db.ledger.push({
        id: newId("l"),
        userId: wd.userId,
        kind: "withdraw_release",
        amount: wd.amount,
        asset: wd.asset,
        network: wd.network,
        note: `Ошибка payout · возврат ${wd.amount} ${wd.asset}`,
        withdrawalId: wd.id,
        createdAt: now,
        settledAt: now,
      });
      pushAudit(db, {
        actorUserId: adminUserId,
        action: "withdraw.reject",
        entityType: "withdrawal",
        entityId: wd.id,
        meta: { amount: wd.amount, reason: wd.rejectReason },
      });
      assertNonNegativeAvailable(db, wd.userId);
    });
    throw e;
  }

  const txHash = opts?.txHash ?? payout.txHash;
  await updateDb((db) => {
    const wd = db.withdrawals.find((w) => w.id === withdrawalId);
    if (!wd) throw new Error("Заявка не найдена");
    if (wd.status === "completed") return;
    assertUniqueTxHash(
      db.ledger.filter((e) => e.kind === "withdraw"),
      txHash,
    );
    const now = new Date().toISOString();
    wd.status = "completed";
    wd.txHash = txHash ?? `payout-${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    wd.providerRef = payout.id;
    wd.providerSimulated = payout.simulated;
    db.ledger.push({
      id: newId("l"),
      userId: wd.userId,
      kind: "withdraw",
      amount: 0,
      asset: wd.asset,
      network: wd.network,
      note: `Вывод подтверждён · ${wd.txHash}${payout.simulated ? " (sim)" : ""}`,
      txHash: wd.txHash,
      withdrawalId: wd.id,
      createdAt: now,
      settledAt: now,
    });
    db.notifications.push({
      id: newId("n"),
      userId: wd.userId,
      title: "Вывод выполнен",
      body: `${wd.amount} ${wd.asset} отправлены на кошелёк`,
      read: false,
      createdAt: now,
    });
    pushAudit(db, {
      actorUserId: adminUserId,
      action: "withdraw.approve",
      entityType: "withdrawal",
      entityId: wd.id,
      meta: {
        amount: wd.amount,
        txHash: wd.txHash ?? null,
        simulated: payout.simulated,
      },
    });
  });
}

export async function markSensitiveChange(userId: string) {
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return;
    user.sensitiveChangedAt = new Date().toISOString();
    pushAudit(db, {
      actorUserId: userId,
      action: "security.sensitive_change",
      entityType: "user",
      entityId: userId,
    });
  });
}

export async function adminDeleteReview(reviewId: string) {
  await updateDb((db) => {
    const idx = db.reviews.findIndex((r) => r.id === reviewId);
    if (idx < 0) throw new Error("Отзыв не найден");
    const [removed] = db.reviews.splice(idx, 1);
    const deal = db.deals.find((d) => d.id === removed.dealId);
    applyReviewStats(db, removed.toUserId);
    if (deal) {
      applyReviewStats(db, deal.clientId);
      applyReviewStats(db, deal.freelancerId);
    }
  });
}

export async function listDealsForUser(userId: string) {
  const db = await readDb();
  return db.deals.filter((d) => d.clientId === userId || d.freelancerId === userId);
}

export async function listAllForAdmin() {
  return readDb();
}

export async function addReview(input: Omit<Review, "id" | "createdAt">) {
  let created: Review | null = null;
  await updateDb((db) => {
    const deal = db.deals.find((d) => d.id === input.dealId);
    if (!deal) throw new Error("Сделка не найдена");
    if (deal.status !== "released") throw new Error("Отзыв доступен после выплаты");
    if (input.fromUserId !== deal.clientId && input.fromUserId !== deal.freelancerId) {
      throw new Error("Нет доступа");
    }
    const expectedTo =
      input.fromUserId === deal.clientId ? deal.freelancerId : deal.clientId;
    if (input.toUserId !== expectedTo) throw new Error("Неверный получатель отзыва");
    if (db.reviews.some((r) => r.dealId === input.dealId && r.fromUserId === input.fromUserId)) {
      throw new Error("Вы уже оставили отзыв по этой сделке");
    }
    const rating = Math.min(5, Math.max(1, Math.round(input.rating)));
    const now = new Date().toISOString();
    const review: Review = {
      ...input,
      rating,
      text: input.text.trim(),
      id: newId("r"),
      createdAt: now,
    };
    db.reviews.push(review);
    created = review;

    const pairComplete = isDealReviewPairComplete(db, deal.id);
    const counterpartHref =
      expectedTo === deal.clientId ? "/client/reviews" : "/freelancer/reviews";
    const authorHref =
      input.fromUserId === deal.clientId ? "/client/reviews" : "/freelancer/reviews";

    if (pairComplete) {
      applyReviewStats(db, deal.clientId);
      applyReviewStats(db, deal.freelancerId);
      const counterpartReview = db.reviews.find(
        (r) => r.dealId === deal.id && r.fromUserId === expectedTo,
      );
      db.notifications.push({
        id: newId("n"),
        userId: expectedTo,
        title: "Отзывы опубликованы",
        body: `Вам поставили ${rating}/5 · оба отзыва по сделке теперь видны`,
        read: false,
        href: counterpartHref,
        initials: "★",
        createdAt: now,
      });
      if (counterpartReview) {
        db.notifications.push({
          id: newId("n"),
          userId: input.fromUserId,
          title: "Отзывы опубликованы",
          body: `Вам поставили ${counterpartReview.rating}/5 · оба отзыва по сделке теперь видны`,
          read: false,
          href: authorHref,
          initials: "★",
          createdAt: now,
        });
      }
    } else {
      db.notifications.push({
        id: newId("n"),
        userId: expectedTo,
        title: "Оставьте ответный отзыв",
        body: "Вам оставили отзыв · он станет виден, когда вы ответите своим",
        read: false,
        href: counterpartHref,
        initials: "★",
        createdAt: now,
      });
    }
  });
  return created!;
}

export async function listFavorites(userId: string) {
  const db = await readDb();
  return db.favorites
    .filter((f) => f.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function isFavorite(
  userId: string,
  targetType: Favorite["targetType"],
  targetId: string,
) {
  const db = await readDb();
  return db.favorites.some(
    (f) => f.userId === userId && f.targetType === targetType && f.targetId === targetId,
  );
}

export async function toggleFavorite(
  userId: string,
  targetType: Favorite["targetType"],
  targetId: string,
) {
  let favorited = false;
  await updateDb((db) => {
    const idx = db.favorites.findIndex(
      (f) => f.userId === userId && f.targetType === targetType && f.targetId === targetId,
    );
    if (idx >= 0) {
      db.favorites.splice(idx, 1);
      favorited = false;
      return;
    }
    if (targetType === "project") {
      const project = db.projects.find((p) => p.id === targetId);
      if (!project) throw new Error("Проект не найден");
    } else {
      const user = db.users.find((u) => u.id === targetId && u.role === "freelancer");
      if (!user) throw new Error("Фрилансер не найден");
    }
    db.favorites.push({
      id: newId("fav"),
      userId,
      targetType,
      targetId,
      createdAt: new Date().toISOString(),
    });
    favorited = true;
  });
  return favorited;
}

export async function listProjectComments(projectId: string) {
  const db = await readDb();
  return db.projectComments
    .filter((c) => c.projectId === projectId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function addProjectComment(input: {
  projectId: string;
  authorId: string;
  body: string;
  parentId?: string | null;
}) {
  const body = input.body.trim();
  if (!body) throw new Error("Напишите комментарий");
  if (body.length > 4000) throw new Error("Слишком длинный комментарий");

  let created: ProjectComment | null = null;
  await updateDb((db) => {
    const project = db.projects.find((p) => p.id === input.projectId);
    if (!project) throw new Error("Проект не найден");
    if (project.status === "cancelled") throw new Error("Проект закрыт");
    const author = db.users.find((u) => u.id === input.authorId);
    if (!author || author.role === "admin") throw new Error("Нет доступа");

    let parentId: string | null = input.parentId ?? null;
    if (parentId) {
      const parent = db.projectComments.find((c) => c.id === parentId);
      if (!parent || parent.projectId !== input.projectId) {
        throw new Error("Комментарий для ответа не найден");
      }
      // one-level nest: reply to reply sticks under root
      if (parent.parentId) parentId = parent.parentId;
    }

    const comment: ProjectComment = {
      id: newId("pc"),
      projectId: input.projectId,
      authorId: input.authorId,
      parentId,
      body,
      thanksCount: 0,
      thankedBy: [],
      createdAt: new Date().toISOString(),
    };
    db.projectComments.push(comment);
    created = comment;

    const notifyId =
      parentId != null
        ? db.projectComments.find((c) => c.id === parentId)?.authorId
        : project.clientId;
    if (notifyId && notifyId !== input.authorId) {
      const notifyUser = db.users.find((u) => u.id === notifyId);
      const href =
        notifyUser?.role === "freelancer"
          ? `/freelancer/projects?project=${encodeURIComponent(project.id)}`
          : notifyUser?.role === "client"
            ? `/client/projects/${project.id}`
            : `/projects/${project.id}`;
      db.notifications.push({
        id: newId("n"),
        userId: notifyId,
        title: parentId ? "Ответ в обсуждении" : "Новый комментарий",
        body: `«${project.title}»: ${body.slice(0, 80)}`,
        read: false,
        href,
        createdAt: comment.createdAt,
      });
    }
  });
  return created!;
}

export async function thankProjectComment(commentId: string, userId: string) {
  await updateDb((db) => {
    const comment = db.projectComments.find((c) => c.id === commentId);
    if (!comment) throw new Error("Комментарий не найден");
    if (comment.authorId === userId) throw new Error("Нельзя благодарить свой комментарий");
    if (comment.thankedBy.includes(userId)) {
      comment.thankedBy = comment.thankedBy.filter((id) => id !== userId);
      comment.thanksCount = Math.max(0, comment.thanksCount - 1);
      return;
    }
    comment.thankedBy.push(userId);
    comment.thanksCount += 1;
  });
}

/** Open or reuse a project chat after a freelancer placed a bid. */
export async function startChatWithBidder(input: {
  clientId: string;
  projectId: string;
  freelancerId: string;
  body?: string;
}) {
  let threadId = "";
  await updateDb((db) => {
    const project = db.projects.find((p) => p.id === input.projectId);
    if (!project) throw new Error("Проект не найден");
    if (project.clientId !== input.clientId) throw new Error("Нет доступа");
    const bid = db.bids.find(
      (b) =>
        b.projectId === input.projectId &&
        b.freelancerId === input.freelancerId,
    );
    if (!bid) throw new Error("Сначала нужен отклик фрилансера");
    const freelancer = db.users.find(
      (u) => u.id === input.freelancerId && u.role === "freelancer",
    );
    if (!freelancer) throw new Error("Фрилансер не найден");

    const candidates = db.threads.filter(
      (t) =>
        t.projectId === project.id &&
        t.participantIds.includes(input.clientId) &&
        t.participantIds.includes(input.freelancerId),
    );
    let thread =
      candidates.find((t) => t.dealId) ??
      candidates.find((t) => !t.dealId) ??
      null;
    const now = new Date().toISOString();
    if (!thread) {
      thread = {
        id: newId("t"),
        projectId: project.id,
        participantIds: [input.clientId, input.freelancerId],
        title: project.title,
        updatedAt: now,
      };
      db.threads.push(thread);
    } else {
      thread.updatedAt = now;
    }
    threadId = thread.id;

    const note = (input.body ?? "").trim();
    if (note) {
      db.messages.push({
        id: newId("m"),
        threadId: thread.id,
        senderId: input.clientId,
        body: note,
        createdAt: now,
      });
      db.notifications.push({
        id: newId("n"),
        userId: input.freelancerId,
        title: "Сообщение по отклику",
        body: note.slice(0, 80),
        read: false,
        href: `/freelancer/messages/${thread.id}`,
        createdAt: now,
      });
    }
  });
  return threadId;
}

export async function inviteFreelancerToProject(input: {
  clientId: string;
  freelancerId: string;
  projectId: string;
  message?: string;
}) {
  await updateDb((db) => {
    const project = db.projects.find((p) => p.id === input.projectId);
    if (!project) throw new Error("Проект не найден");
    if (project.clientId !== input.clientId) throw new Error("Нет доступа");
    if (project.status !== "open") throw new Error("Проект закрыт");
    const freelancer = db.users.find(
      (u) => u.id === input.freelancerId && u.role === "freelancer",
    );
    if (!freelancer) throw new Error("Фрилансер не найден");

    const note = (input.message ?? "").trim();
    db.notifications.push({
      id: newId("n"),
      userId: freelancer.id,
      title: "Приглашение на проект",
      body: note
        ? `«${project.title}»: ${note}`
        : `Заказчик пригласил вас на «${project.title}»`,
      read: false,
      href: `/freelancer/projects?project=${encodeURIComponent(project.id)}`,
      createdAt: new Date().toISOString(),
    });

    let thread = db.threads.find(
      (t) =>
        t.projectId === project.id &&
        t.participantIds.includes(input.clientId) &&
        t.participantIds.includes(freelancer.id) &&
        !t.dealId,
    );
    const now = new Date().toISOString();
    if (!thread) {
      thread = {
        id: newId("t"),
        projectId: project.id,
        participantIds: [input.clientId, freelancer.id],
        title: project.title,
        updatedAt: now,
      };
      db.threads.push(thread);
    } else {
      thread.updatedAt = now;
    }
    db.messages.push({
      id: newId("m"),
      threadId: thread.id,
      senderId: input.clientId,
      body:
        note ||
        `Здравствуйте! Приглашаю вас откликнуться на проект «${project.title}».`,
      createdAt: now,
    });
  });
}

export type { NotificationItem };
