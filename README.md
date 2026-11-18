# DigiForge

Фриланс-биржа с крипто-эскроу (USDT) по дизайну из Figma.

## Стек

- Next.js App Router + TypeScript + Tailwind
- Neon Postgres (`DATABASE_URL`) — JSON document store в таблице `app_store`
- Реляционная схема на будущее: `db/schema.sql`
- Cookie-сессии (готово к замене на Neon Auth)

## Запуск

1. Скопируйте `.env.example` → `.env` и вставьте Neon **pooled** connection string в `DATABASE_URL`.
2. В Neon SQL Editor один раз выполните:

```sql
CREATE TABLE IF NOT EXISTS app_store (
  id text PRIMARY KEY,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

3. Установите зависимости и запустите:

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

На Vercel добавьте ту же переменную `DATABASE_URL` (Production + Preview).

## Демо-аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Заказчик | anna@client.io | demo1234 |
| Фрилансер | sergey@freelancer.io | demo1234 |
| Admin | admin@digiforge.io | admin123 |

## Крипто-поток (finance-hardened)

1. **Депозит** — invoice `awaiting` → зачисление только через подписанный webhook `POST /api/crypto/webhook` (HMAC). В local demo без `CRYPTOPAY_IPN_SECRET` возможен autoconfirm.
2. **Accept bid** → deal `pending_funding` → **fund** (lock) при достаточном балансе, иначе кнопка «Оплатить эскроу».
3. **Deliver → release** — выплата фрилансеру и `fee` платформе; комиссия зафиксирована в deal (`feeAmount`).
4. **Withdraw** — `withdraw_hold` → admin approve/reject; reject возвращает hold (`withdraw_release`).
5. **Диспут** — только из рабочих статусов; admin release/refund с audit log.

Безопасность: scrypt-пароли, httpOnly/secure cookies, CAS по `meta.version`, rate limits, лимиты вывода, 2FA-порог, cooldown 24ч после смены пароля/email/кошелька, идемпотентность `tx_hash` / webhook `event_key`.

Целевая реляционная схема: `db/schema.sql`.
