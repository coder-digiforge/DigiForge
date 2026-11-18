import { neon } from "@neondatabase/serverless";
import {
  DEFAULT_FEE_PERCENT,
  DEPOSIT_TTL_HOURS,
  DIGI_PRIME_DAYS,
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
import { hashPassword, verifyPassword } from "./password";
import { seedDb } from "./seed";
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
  PortfolioCase,
  Project,
  Review,
  Thread,
  User,
  UserSettings,
  WalletBalances,
  WithdrawalRequest,
} from "./types";

const STORE_ID = "main";

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

  const fresh = ensureFinanceShape(structuredClone(seedDb));
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
  return rows.length > 0;
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
    createdAt: new Date().toISOString(),
  };

  await updateDb((db) => {
    db.users.push(user);
  });
  return user;
}

export function publicUser(user: User) {
  const { password: _password, ...rest } = user;
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
    id: `p-${crypto.randomUUID().slice(0, 8)}`,
    currency: "USDT",
    status: input.status ?? "open",
    createdAt: new Date().toISOString(),
  };
  await updateDb((db) => db.projects.push(project));
  return project;
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
  const bid: Bid = {
    ...input,
    id: `b-${crypto.randomUUID().slice(0, 8)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await updateDb((db) => {
    db.bids.push(bid);
    const project = db.projects.find((p) => p.id === input.projectId);
    if (project) {
      db.notifications.push({
        id: `n-${crypto.randomUUID().slice(0, 8)}`,
        userId: project.clientId,
        title: "Новая ставка",
        body: `Новый отклик на «${project.title}»`,
        read: false,
        href: `/client/projects/${project.id}`,
        createdAt: new Date().toISOString(),
      });
    }
  });
  return bid;
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
  const deposit: DepositRequest = {
    id: newId("dep"),
    userId: input.userId,
    amount,
    asset: input.asset,
    network: input.network,
    address: depositAddress(input.network),
    status: "awaiting",
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
      meta: { amount, network: input.network },
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

    if (amount >= WITHDRAW_REQUIRES_2FA_USDT && !user.twoFaEnabled) {
      throw new Error(
        `Для вывода от ${WITHDRAW_REQUIRES_2FA_USDT} USDT включите 2FA в настройках`,
      );
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

function fundDealInDb(db: DbShape, dealId: string, clientId: string) {
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

export async function acceptBid(projectId: string, bidId: string, clientId: string) {
  let result: Deal | null = null;
  await updateDb((d) => {
    const project = d.projects.find((p) => p.id === projectId);
    const bid = d.bids.find((b) => b.id === bidId);
    if (!project || !bid) throw new Error("Не найдено");
    if (project.clientId !== clientId) throw new Error("Нет доступа");
    if (project.status !== "open") throw new Error("Проект уже в работе");
    if (bid.projectId !== projectId) throw new Error("Ставка не от этого проекта");
    if (bid.status !== "pending") throw new Error("Ставка недоступна");

    const amount = normalizeUsdt(bid.amount);
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
    d.threads.push({
      id: newId("t"),
      dealId: deal.id,
      projectId,
      participantIds: [clientId, bid.freelancerId],
      title: project.title,
      updatedAt: now.toISOString(),
    });

    pushAudit(d, {
      actorUserId: clientId,
      action: "escrow.accept_bid",
      entityType: "deal",
      entityId: deal.id,
      meta: { amount, bidId },
    });

    const bal = calcBalances(d, clientId);
    if (bal.available >= amount) {
      fundDealInDb(d, deal.id, clientId);
      d.notifications.push({
        id: newId("n"),
        userId: bid.freelancerId,
        title: "Ставка принята",
        body: `Эскроу ${amount} USDT открыт по «${project.title}»`,
        read: false,
        href: "/freelancer/work",
        createdAt: now.toISOString(),
      });
    } else {
      d.notifications.push({
        id: newId("n"),
        userId: clientId,
        title: "Нужно пополнить эскроу",
        body: `Примите оплату ${amount} USDT для «${project.title}»`,
        read: false,
        href: "/client/work",
        createdAt: now.toISOString(),
      });
      d.notifications.push({
        id: newId("n"),
        userId: bid.freelancerId,
        title: "Ставка принята",
        body: `Ожидаем пополнение эскроу по «${project.title}»`,
        read: false,
        href: "/freelancer/work",
        createdAt: now.toISOString(),
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
    deal.status = "delivered";
    deal.deliveredAt = new Date().toISOString();
    const project = db.projects.find((p) => p.id === deal.projectId);
    if (project) project.status = "delivered";
    db.notifications.push({
      id: newId("n"),
      userId: deal.clientId,
      title: "Работа сдана",
      body: "Проверьте результат и примите работу",
      read: false,
      href: "/client/work",
      createdAt: new Date().toISOString(),
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
  resolution: "release" | "refund",
  adminUserId?: string,
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
      (e) => e.dealId === deal.id && e.kind === "escrow_refund",
    );
    if (duplicate) throw new Error("Возврат уже выполнен");

    assertDealTransition(deal.status, "refunded");
    deal.status = "refunded";
    const project = db.projects.find((p) => p.id === deal.projectId);
    if (project) project.status = "cancelled";
    const now = new Date().toISOString();
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
    id: `m-${crypto.randomUUID().slice(0, 8)}`,
    threadId,
    senderId,
    body,
    attachment,
    createdAt: new Date().toISOString(),
  };
  await updateDb((db) => {
    const thread = db.threads.find((t) => t.id === threadId);
    if (!thread || !thread.participantIds.includes(senderId)) {
      throw new Error("Нет доступа к чату");
    }
    db.messages.push(message);
    thread.updatedAt = message.createdAt;
    const preview = body || (attachment ? `Файл: ${attachment.name}` : "");
    for (const pid of thread.participantIds) {
      if (pid === senderId) continue;
      db.notifications.push({
        id: `n-${crypto.randomUUID().slice(0, 8)}`,
        userId: pid,
        title: "Новое сообщение",
        body: preview.slice(0, 80),
        read: false,
        href: undefined,
        createdAt: message.createdAt,
      });
    }
  });
  return message;
}

export async function listNotifications(userId: string) {
  const db = await readDb();
  return db.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markNotificationsRead(userId: string) {
  await updateDb((db) => {
    db.notifications.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
  });
}

export async function listReviewsForUser(userId: string) {
  const db = await readDb();
  return db.reviews.filter((r) => r.toUserId === userId);
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
    const log = user.loginLog?.length ? user.loginLog : defaultLoginLog();
    user.loginLog = log
      .filter((s) => s.current)
      .map((s) => ({ ...s, createdAt: new Date().toISOString() }));
  });
}

export async function deactivateUser(userId: string) {
  await adminSetUserActive(userId, false);
}

function applyReviewStats(db: DbShape, userId: string) {
  const user = db.users.find((u) => u.id === userId);
  if (!user) return;
  const reviews = db.reviews.filter((r) => r.toUserId === userId);
  user.reviewCount = reviews.length;
  user.rating =
    reviews.length === 0
      ? 0
      : Number(
          (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1),
        );
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
  await updateDb((db) => {
    const wd = db.withdrawals.find((w) => w.id === withdrawalId);
    if (!wd) throw new Error("Заявка не найдена");
    if (wd.status !== "pending" && wd.status !== "processing") {
      throw new Error("Заявка уже обработана");
    }

    const now = new Date().toISOString();
    wd.reviewedBy = adminUserId;
    wd.reviewedAt = now;

    if (decision === "approve") {
      assertUniqueTxHash(
        db.ledger.filter((e) => e.kind === "withdraw"),
        opts?.txHash,
      );
      wd.status = "completed";
      wd.txHash =
        opts?.txHash ?? `payout-${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
      // Hold remains (funds left the platform). Audit row for payout tx.
      db.ledger.push({
        id: newId("l"),
        userId: wd.userId,
        kind: "withdraw",
        amount: 0,
        asset: wd.asset,
        network: wd.network,
        note: `Вывод подтверждён · ${wd.txHash}`,
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
        meta: { amount: wd.amount, txHash: wd.txHash },
      });
      return;
    }

    wd.status = "rejected";
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
    applyReviewStats(db, removed.toUserId);
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
  const review: Review = {
    ...input,
    id: `r-${crypto.randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
  };
  await updateDb((db) => {
    db.reviews.push(review);
    applyReviewStats(db, input.toUserId);
  });
  return review;
}

export type { NotificationItem };
