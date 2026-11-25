# DigiForge

Фриланс-биржа с крипто-эскроу (USDT) по дизайну из Figma.

## Стек

- Next.js App Router + TypeScript + Tailwind
- Neon Postgres (`DATABASE_URL`) — JSON document store в таблице `app_store`
- Реляционная схема на будущее: `db/schema.sql`
- Cookie-сессии (готово к замене на Neon Auth)

## Запуск

1. Скопируйте `.env.example` → `.env` и заполните минимум `DATABASE_URL`.
2. Установите зависимости и поднимите схему:

```bash
npm install
npm run db:setup
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).  
Готовность: `npm run ready` или `GET /api/health`.

### Production

Обязательны: `NEON_AUTH_COOKIE_SECRET`, `CRYPTOPAY_API_KEY`, `CRYPTOPAY_IPN_SECRET`, `RESEND_API_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`, `STORE_MODE=relational`, `ALLOW_DEMO_*=false`, плюс `BOOTSTRAP_ADMIN_*` для первого админа. Без ключей деплой падает на readiness check.

## Демо-аккаунты (только local / `ALLOW_DEMO_SEED=true`)

В production seed без демо-логинов (`ALLOW_DEMO_SEED=false`). Для локалки:

| Роль | Email | Пароль |
|------|-------|--------|
| Заказчик | anna@client.io | demo1234 |
| Фрилансер | sergey@freelancer.io | demo1234 |
| Admin | admin@digiforge.io | admin123 |

Smoke-чеклист: [docs/SMOKE.md](docs/SMOKE.md). Юр. страницы: `/terms`, `/privacy`.

## Крипто-поток (finance-hardened)

1. **Депозит** — invoice `awaiting` → зачисление только через подписанный webhook `POST /api/crypto/webhook` (HMAC). В local demo без `CRYPTOPAY_IPN_SECRET` возможен autoconfirm.
2. **Accept bid** → deal `pending_funding` → **fund** (lock) при достаточном балансе, иначе кнопка «Оплатить эскроу».
3. **Deliver → release** — выплата фрилансеру и `fee` платформе; комиссия зафиксирована в deal (`feeAmount`).
4. **Withdraw** — `withdraw_hold` → admin approve/reject; reject возвращает hold (`withdraw_release`).
5. **Диспут** — только из рабочих статусов; admin release/refund с audit log.

Безопасность: scrypt-пароли, httpOnly/secure cookies, CAS по `meta.version`, rate limits, лимиты вывода, 2FA-порог, cooldown 24ч после смены пароля/email/кошелька, идемпотентность `tx_hash` / webhook `event_key`.

Целевая реляционная схема: `db/schema.sql`.
