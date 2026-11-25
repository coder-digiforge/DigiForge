import { readFileSync } from "fs";
import { neon } from "@neondatabase/serverless";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      const key = l.slice(0, i);
      const val = l.slice(i + 1).replace(/^["']|["']$/g, "");
      return [key, val];
    }),
);

const sql = neon(env.DATABASE_URL);
const STORE_ID = "main";
const rows = await sql`
  SELECT payload FROM app_store WHERE id = ${STORE_ID} LIMIT 1
`;
const db = rows[0]?.payload;
if (!db) {
  console.error("no store row");
  process.exit(1);
}

const extras = [
  {
    id: "p-4",
    clientId: "u-anna",
    title: "MVP маркетплейса на Next.js",
    description:
      "Каталог, корзина, кабинет продавца и оплата в USDT. Нужен аккуратный UI и деплой.",
    category: "Сайты и лендинги",
    budget: 2500,
    currency: "USDT",
    deadlineDays: 30,
    status: "open",
    bidsHidden: false,
    createdAt: new Date(Date.now() - 5 * 3600e3).toISOString(),
  },
  {
    id: "p-5",
    clientId: "u-anna",
    title: "Дизайн лендинга Digi-сервиса",
    description:
      "Figma: hero, тарифы, FAQ и мобильные состояния. Нужен сильный визуальный якорь.",
    category: "UI/UX дизайн",
    budget: 600,
    currency: "USDT",
    deadlineDays: 10,
    status: "open",
    bidsHidden: false,
    createdAt: new Date(Date.now() - 12 * 3600e3).toISOString(),
  },
  {
    id: "p-6",
    clientId: "u-anna",
    title: "React Native приложение доставки",
    description:
      "Клиентское приложение: карта, статус заказа, push. Backend уже есть — нужен фронт.",
    category: "Мобильные приложения",
    budget: 1800,
    currency: "USDT",
    deadlineDays: 28,
    status: "open",
    bidsHidden: true,
    createdAt: new Date(Date.now() - 30 * 3600e3).toISOString(),
  },
  {
    id: "p-7",
    clientId: "u-anna",
    title: "Автоматизация отчётов в Telegram",
    description:
      "Ежедневный дайджест метрик из Google Sheets в Telegram-канал + алерты по порогам.",
    category: "AI и автоматизация",
    budget: 500,
    currency: "USDT",
    deadlineDays: 7,
    status: "open",
    bidsHidden: false,
    createdAt: new Date(Date.now() - 90 * 60e3).toISOString(),
  },
  {
    id: "p-8",
    clientId: "u-anna",
    title: "Контент-план и лендинг для запуска",
    description:
      "Позиционирование, 12 постов и одностраничник под waitlist. Крипто-аудитория EU.",
    category: "Маркетинг и рост",
    budget: 700,
    currency: "USDT",
    deadlineDays: 12,
    status: "open",
    bidsHidden: false,
    createdAt: new Date(Date.now() - 48 * 3600e3).toISOString(),
  },
  {
    id: "p-9",
    clientId: "u-anna",
    title: "Продуктовая стратегия MVP",
    description:
      "Карта гипотез, JTBD-интервью гайд и приоритизация бэклога на 6 недель.",
    category: "Стратегия продукта",
    budget: 1100,
    currency: "USDT",
    deadlineDays: 16,
    status: "open",
    bidsHidden: false,
    createdAt: new Date(Date.now() - 8 * 3600e3).toISOString(),
  },
];

let added = 0;
for (const p of extras) {
  if (!db.projects.some((x) => x.id === p.id)) {
    db.projects.push(p);
    added += 1;
  }
}

await sql`
  INSERT INTO app_store (id, payload, updated_at)
  VALUES (${STORE_ID}, ${JSON.stringify(db)}::jsonb, now())
  ON CONFLICT (id) DO UPDATE
  SET payload = EXCLUDED.payload,
      updated_at = now()
`;

console.log(
  "added",
  added,
  "open",
  db.projects.filter((p) => p.status === "open").length,
);
