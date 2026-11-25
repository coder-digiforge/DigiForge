# DigiForge — smoke checklist (closed beta)

Прогоните перед показом preview URL. Демо-депозит допустим только если `ALLOW_DEMO_DEPOSIT_AUTOCONFIRM=true` (не production).

## Подготовка

- [ ] `DATABASE_URL` задан (Neon pooled)
- [ ] Production: `ALLOW_DEMO_DEPOSIT_AUTOCONFIRM=false`
- [ ] Production: `CRYPTOPAY_IPN_SECRET` и `NEON_AUTH_COOKIE_SECRET` заданы
- [ ] Открыты `/terms` и `/privacy`

## Поток сделки

- [ ] Регистрация клиента и фрилансера (или демо-аккаунты только в non-prod)
- [ ] Клиент создаёт проект
- [ ] Фрилансер делает ставку
- [ ] Клиент принимает ставку → deal `pending_funding`
- [ ] Клиент пополняет баланс (демо или invoice) и жмёт «Оплатить эскроу»
- [ ] Фрилансер сдаёт работу (`deliver`)
- [ ] Клиент принимает (`release`) — комиссия и выплата на баланс
- [ ] Фрилансер создаёт заявку на вывод
- [ ] Админ reject → средства вернулись; или approve → статус completed

## Безопасность

- [ ] Неверный пароль не пускает
- [ ] Выход / «завершить сессии» инвалидирует доступ с другого браузера
- [ ] Вывод ≥ порога 2FA требует TOTP-код
- [ ] Неверифицированный email блокирует первый вывод (если включено)

## Админка

- [ ] KPI / алерты на обзоре
- [ ] Resolve диспута release и refund
- [ ] Audit log отображается
