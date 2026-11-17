import { promises as fs } from "fs";
import path from "path";
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

const DATA_PATH = path.join(process.cwd(), ".data", "db.json");

async function ensureDir() {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
}

async function readDb(): Promise<DbShape> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    return JSON.parse(raw) as DbShape;
  } catch {
    await ensureDir();
    await fs.writeFile(DATA_PATH, JSON.stringify(seedDb, null, 2), "utf8");
    return structuredClone(seedDb);
  }
}

async function writeDb(db: DbShape) {
  await ensureDir();
  await fs.writeFile(DATA_PATH, JSON.stringify(db, null, 2), "utf8");
}

export async function getDb() {
  return readDb();
}

export async function updateDb(mutator: (db: DbShape) => void) {
  const db = await readDb();
  mutator(db);
  await writeDb(db);
  return db;
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
    id: `u-${crypto.randomUUID().slice(0, 8)}`,
    email: input.email,
    password: input.password,
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

export function calcBalances(db: DbShape, userId: string): WalletBalances {
  const entries = db.ledger.filter((e) => e.userId === userId);
  let available = 0;
  let escrow = 0;
  for (const e of entries) {
    if (e.kind === "escrow_lock") {
      escrow += Math.abs(e.amount);
      available += e.amount;
    } else if (e.kind === "escrow_release" || e.kind === "escrow_refund") {
      if (e.amount > 0) available += e.amount;
      else {
        available += e.amount;
        escrow -= Math.abs(e.amount);
      }
    } else {
      available += e.amount;
    }
  }
  // Recalculate escrow from open deals for accuracy
  const openEscrow = db.deals
    .filter(
      (d) =>
        (d.clientId === userId || d.freelancerId === userId) &&
        ["funded", "in_progress", "delivered", "disputed"].includes(d.status),
    )
    .reduce((sum, d) => (d.clientId === userId ? sum + d.amount : sum), 0);

  return {
    available: Math.max(0, Number(available.toFixed(2))),
    escrow: openEscrow,
  };
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
  const address =
    input.network === "TRC20"
      ? "TDigiForgeEscrowDeposit111111111"
      : "0xDigiForgeEscrowDeposit111111111111";

  const deposit: DepositRequest = {
    id: `dep-${crypto.randomUUID().slice(0, 8)}`,
    userId: input.userId,
    amount: input.amount,
    asset: input.asset,
    network: input.network,
    address,
    status: "awaiting",
    createdAt: new Date().toISOString(),
  };

  await updateDb((db) => db.deposits.push(deposit));
  return deposit;
}

/** Simulate provider webhook confirming deposit */
export async function confirmDeposit(depositId: string) {
  let result: DepositRequest | null = null;
  await updateDb((db) => {
    const dep = db.deposits.find((d) => d.id === depositId);
    if (!dep || dep.status === "completed") return;
    dep.status = "completed";
    const entry: LedgerEntry = {
      id: `l-${crypto.randomUUID().slice(0, 8)}`,
      userId: dep.userId,
      kind: "deposit",
      amount: dep.amount,
      asset: dep.asset,
      network: dep.network,
      note: `Депозит ${dep.asset} (${dep.network})`,
      txHash: `0x${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
      createdAt: new Date().toISOString(),
      settledAt: new Date().toISOString(),
    };
    db.ledger.push(entry);
    db.notifications.push({
      id: `n-${crypto.randomUUID().slice(0, 8)}`,
      userId: dep.userId,
      title: "Баланс пополнен",
      body: `+${dep.amount} ${dep.asset}`,
      read: false,
      href: "/client/finance",
      createdAt: new Date().toISOString(),
    });
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
  const db = await readDb();
  const bal = calcBalances(db, input.userId);
  if (input.amount <= 0) throw new Error("Некорректная сумма");
  if (bal.available < input.amount) throw new Error("Недостаточно средств");

  const withdrawal: WithdrawalRequest = {
    id: `wd-${crypto.randomUUID().slice(0, 8)}`,
    ...input,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  await updateDb((d) => {
    d.withdrawals.push(withdrawal);
    d.ledger.push({
      id: `l-${crypto.randomUUID().slice(0, 8)}`,
      userId: input.userId,
      kind: "withdraw",
      amount: -input.amount,
      asset: input.asset,
      network: input.network,
      note: `Вывод на ${input.address.slice(0, 8)}…`,
      createdAt: new Date().toISOString(),
      settledAt: new Date().toISOString(),
    });
  });
  return withdrawal;
}

export async function acceptBid(projectId: string, bidId: string, clientId: string) {
  const db = await readDb();
  const project = db.projects.find((p) => p.id === projectId);
  const bid = db.bids.find((b) => b.id === bidId);
  if (!project || !bid) throw new Error("Не найдено");
  if (project.clientId !== clientId) throw new Error("Нет доступа");
  if (project.status !== "open") throw new Error("Проект уже в работе");

  const bal = calcBalances(db, clientId);
  if (bal.available < bid.amount) {
    throw new Error("Недостаточно USDT на балансе для эскроу");
  }

  const deal: Deal = {
    id: `d-${crypto.randomUUID().slice(0, 8)}`,
    projectId,
    clientId,
    freelancerId: bid.freelancerId,
    bidId: bid.id,
    amount: bid.amount,
    feePercent: 10,
    status: "funded",
    fundedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const thread: Thread = {
    id: `t-${crypto.randomUUID().slice(0, 8)}`,
    dealId: deal.id,
    projectId,
    participantIds: [clientId, bid.freelancerId],
    title: project.title,
    updatedAt: new Date().toISOString(),
  };

  await updateDb((d) => {
    const p = d.projects.find((x) => x.id === projectId)!;
    p.status = "in_progress";
    d.bids.forEach((b) => {
      if (b.projectId === projectId) {
        b.status = b.id === bidId ? "accepted" : "rejected";
      }
    });
    deal.status = "in_progress";
    d.deals.push(deal);
    d.threads.push(thread);
    d.ledger.push({
      id: `l-${crypto.randomUUID().slice(0, 8)}`,
      userId: clientId,
      kind: "escrow_lock",
      amount: -bid.amount,
      asset: "USDT",
      note: `Эскроу · ${project.title}`,
      dealId: deal.id,
      createdAt: new Date().toISOString(),
      settledAt: new Date().toISOString(),
    });
    d.notifications.push({
      id: `n-${crypto.randomUUID().slice(0, 8)}`,
      userId: bid.freelancerId,
      title: "Ставка принята",
      body: `Эскроу ${bid.amount} USDT открыт по «${project.title}»`,
      read: false,
      href: `/freelancer/work`,
      createdAt: new Date().toISOString(),
    });
  });

  return deal;
}

export async function deliverDeal(dealId: string, freelancerId: string) {
  await updateDb((db) => {
    const deal = db.deals.find((d) => d.id === dealId);
    if (!deal || deal.freelancerId !== freelancerId) throw new Error("Нет доступа");
    deal.status = "delivered";
    deal.deliveredAt = new Date().toISOString();
    const project = db.projects.find((p) => p.id === deal.projectId);
    if (project) project.status = "delivered";
    db.notifications.push({
      id: `n-${crypto.randomUUID().slice(0, 8)}`,
      userId: deal.clientId,
      title: "Работа сдана",
      body: "Проверьте результат и примите работу",
      read: false,
      href: `/client/work`,
      createdAt: new Date().toISOString(),
    });
  });
}

export async function releaseDeal(dealId: string, clientId: string) {
  await updateDb((db) => {
    const deal = db.deals.find((d) => d.id === dealId);
    if (!deal || deal.clientId !== clientId) throw new Error("Нет доступа");
    if (!["delivered", "in_progress"].includes(deal.status)) {
      throw new Error("Сделка не готова к релизу");
    }
    const fee = Number(((deal.amount * deal.feePercent) / 100).toFixed(2));
    const payout = Number((deal.amount - fee).toFixed(2));
    deal.status = "released";
    deal.releasedAt = new Date().toISOString();
    const project = db.projects.find((p) => p.id === deal.projectId);
    if (project) project.status = "completed";

    db.ledger.push({
      id: `l-${crypto.randomUUID().slice(0, 8)}`,
      userId: deal.freelancerId,
      kind: "escrow_release",
      amount: payout,
      asset: "USDT",
      note: `Выплата по эскроу (−${deal.feePercent}% комиссия)`,
      dealId: deal.id,
      createdAt: new Date().toISOString(),
      settledAt: new Date().toISOString(),
    });
    db.ledger.push({
      id: `l-${crypto.randomUUID().slice(0, 8)}`,
      userId: "u-admin",
      kind: "fee",
      amount: fee,
      asset: "USDT",
      note: `Комиссия DigiForge ${deal.feePercent}%`,
      dealId: deal.id,
      createdAt: new Date().toISOString(),
      settledAt: new Date().toISOString(),
    });
    db.notifications.push({
      id: `n-${crypto.randomUUID().slice(0, 8)}`,
      userId: deal.freelancerId,
      title: "Эскроу закрыт",
      body: `+${payout} USDT на баланс`,
      read: false,
      href: `/freelancer/finance`,
      createdAt: new Date().toISOString(),
    });
  });
}

export async function disputeDeal(dealId: string, userId: string) {
  await updateDb((db) => {
    const deal = db.deals.find((d) => d.id === dealId);
    if (!deal) throw new Error("Сделка не найдена");
    if (deal.clientId !== userId && deal.freelancerId !== userId) {
      throw new Error("Нет доступа");
    }
    deal.status = "disputed";
    const project = db.projects.find((p) => p.id === deal.projectId);
    if (project) project.status = "disputed";
    db.notifications.push({
      id: `n-${crypto.randomUUID().slice(0, 8)}`,
      userId: "u-admin",
      title: "Диспут",
      body: `Сделка ${deal.id} открыта на спор`,
      read: false,
      href: `/admin/deals`,
      createdAt: new Date().toISOString(),
    });
  });
}

export async function adminResolveDeal(
  dealId: string,
  resolution: "release" | "refund",
) {
  if (resolution === "release") {
    const db = await readDb();
    const deal = db.deals.find((d) => d.id === dealId);
    if (!deal) throw new Error("Не найдено");
    await releaseDeal(dealId, deal.clientId);
    return;
  }
  await updateDb((db) => {
    const deal = db.deals.find((d) => d.id === dealId);
    if (!deal) throw new Error("Не найдено");
    deal.status = "refunded";
    const project = db.projects.find((p) => p.id === deal.projectId);
    if (project) project.status = "cancelled";
    db.ledger.push({
      id: `l-${crypto.randomUUID().slice(0, 8)}`,
      userId: deal.clientId,
      kind: "escrow_refund",
      amount: deal.amount,
      asset: "USDT",
      note: `Возврат эскроу по решению админа`,
      dealId: deal.id,
      createdAt: new Date().toISOString(),
      settledAt: new Date().toISOString(),
    });
  });
}

export async function buyDigiPrime(
  userId: string,
  days = 30,
  price = 29,
  opts?: { trial?: boolean },
) {
  const db = await readDb();
  const bal = calcBalances(db, userId);
  if (price > 0 && bal.available < price) throw new Error("Недостаточно USDT");

  await updateDb((d) => {
    const user = d.users.find((u) => u.id === userId);
    if (!user) throw new Error("Пользователь не найден");
    if (opts?.trial) {
      if (user.digiPrimeUntil && new Date(user.digiPrimeUntil).getTime() > Date.now()) {
        throw new Error("Prime уже активен");
      }
      if (user.digiPrimeTrialUsed) throw new Error("Триал уже использован");
      user.digiPrimeTrial = true;
      user.digiPrimeTrialUsed = true;
      user.digiPrimeAutoRenew = true;
      user.digiPrimeUntil = new Date(Date.now() + days * 86400000).toISOString();
      return;
    }
    const base = user.digiPrimeUntil
      ? Math.max(Date.now(), new Date(user.digiPrimeUntil).getTime())
      : Date.now();
    user.digiPrimeUntil = new Date(base + days * 86400000).toISOString();
    user.digiPrimeTrial = false;
    user.digiPrimeAutoRenew = true;
    if (price > 0) {
      d.ledger.push({
        id: `l-${crypto.randomUUID().slice(0, 8)}`,
        userId,
        kind: "prime",
        amount: -price,
        asset: "USDT",
        note: `Digi Prime · ${days} дней`,
        createdAt: new Date().toISOString(),
        settledAt: new Date().toISOString(),
      });
    }
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
    Object.assign(user, patch);
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
    if (user.password !== currentPassword) throw new Error("Неверный текущий пароль");
    if (nextPassword.length < 6) throw new Error("Новый пароль — минимум 6 символов");
    user.password = nextPassword;
  });
}

export async function changeUserEmail(userId: string, email: string, password: string) {
  const next = email.trim().toLowerCase();
  if (!next.includes("@")) throw new Error("Укажите корректный email");
  await updateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error("Не найден");
    if (user.password !== password) throw new Error("Неверный пароль");
    if (db.users.some((u) => u.id !== userId && u.email.toLowerCase() === next)) {
      throw new Error("Этот email уже занят");
    }
    user.email = next;
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
) {
  await updateDb((db) => {
    const wd = db.withdrawals.find((w) => w.id === withdrawalId);
    if (!wd) throw new Error("Заявка не найдена");
    if (wd.status !== "pending") throw new Error("Заявка уже обработана");

    if (decision === "approve") {
      wd.status = "completed";
      db.notifications.push({
        id: `n-${crypto.randomUUID().slice(0, 8)}`,
        userId: wd.userId,
        title: "Вывод выполнен",
        body: `${wd.amount} ${wd.asset} отправлены на кошелёк`,
        read: false,
        createdAt: new Date().toISOString(),
      });
      return;
    }

    wd.status = "rejected";
    db.ledger.push({
      id: `l-${crypto.randomUUID().slice(0, 8)}`,
      userId: wd.userId,
      kind: "withdraw",
      amount: wd.amount,
      asset: wd.asset,
      network: wd.network,
      note: `Отмена вывода · возврат ${wd.amount} ${wd.asset}`,
      createdAt: new Date().toISOString(),
      settledAt: new Date().toISOString(),
    });
    db.notifications.push({
      id: `n-${crypto.randomUUID().slice(0, 8)}`,
      userId: wd.userId,
      title: "Вывод отклонён",
      body: `Заявка на ${wd.amount} ${wd.asset} отклонена, средства возвращены`,
      read: false,
      createdAt: new Date().toISOString(),
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
