import { Panel } from "@/components/ui";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:px-12">
      <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold">
        Политика конфиденциальности
      </h1>
      <p className="mt-2 text-sm text-muted">Редакция от 19 ноября 2026</p>

      <Panel className="mt-8 space-y-6 p-8 text-sm leading-relaxed text-muted-2">
        <section className="space-y-2">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
            1. Какие данные собираем
          </h2>
          <p>
            Email, имя, профиль, переписка в сделках, платёжные реквизиты кошелька USDT, технические
            логи сессий и audit-события безопасности. Пароли хранятся в виде scrypt-хэша.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
            2. Зачем
          </h2>
          <p>
            Для работы биржи: аутентификация, эскроу, выводы, модерация диспутов, уведомления и
            предотвращение мошенничества.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
            3. Передача третьим лицам
          </h2>
          <p>
            Платёжные данные могут передаваться крипто-провайдеру (NOWPayments) для депозитов и
            выплат. Хостинг и БД — инфраструктурным подрядчикам (например Neon / Vercel) по
            договорам обработки.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
            4. Хранение и безопасность
          </h2>
          <p>
            Используем httpOnly-cookie сессий, rate limits, audit log и 2FA для крупных выводов. Вы
            можете запросить деактивацию аккаунта в настройках.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
            5. Контакты
          </h2>
          <p>
            Запросы по персональным данным — через{" "}
            <a href="/contact" className="text-accent hover:underline">
              контакты
            </a>{" "}
            или поддержку.
          </p>
        </section>
      </Panel>
    </div>
  );
}
