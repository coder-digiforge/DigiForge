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

## Крипто-поток

1. Пополнение баланса (депозит → webhook `/api/crypto/webhook`)
2. Выбор ставки → lock в эскроу (сейф)
3. Сдача работы → приёмка → release (−10% комиссия)
4. Вывод на кошелёк / диспут через admin
