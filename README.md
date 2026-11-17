# DigiForge

Фриланс-биржа с крипто-эскроу (USDT) по дизайну из Figma.

## Стек

- Next.js App Router + TypeScript + Tailwind
- Локальный JSON store (`.data/db.json`) для MVP
- Схема Neon Postgres в `db/schema.sql`
- Cookie-сессии (готово к замене на Neon Auth)

## Запуск

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

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
