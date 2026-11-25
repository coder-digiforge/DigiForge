import { Panel } from "@/components/ui";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:px-12">
      <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold">
        Условия использования
      </h1>
      <p className="mt-2 text-sm text-muted">Редакция от 19 ноября 2026</p>

      <Panel className="mt-8 space-y-6 p-8 text-sm leading-relaxed text-muted-2">
        <section className="space-y-2">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
            1. Сервис
          </h2>
          <p>
            DigiForge — фриланс-площадка с крипто-эскроу (USDT). Регистрируясь, вы соглашаетесь с
            этими условиями и политикой конфиденциальности.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
            2. Аккаунт
          </h2>
          <p>
            Вы отвечаете за сохранность пароля, сессий и 2FA. Платформа может ограничить доступ при
            подозрении на мошенничество, нарушении правил или компрометации аккаунта.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
            3. Эскроу и платежи
          </h2>
          <p>
            Средства заказчика блокируются в эскроу после оплаты сделки и освобождаются после
            приёмки работы либо по решению модерации в диспуте. Комиссия платформы удерживается при
            релизе эскроу. Депозиты и выводы обрабатываются через крипто-провайдера; сеть (TRC20 /
            ERC20) и адрес указываете вы.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
            4. Диспуты
          </h2>
          <p>
            Любая сторона может открыть диспут по активной сделке. Решение DigiForge (полный или
            частичный релиз / возврат) является финальным в рамках платформы. Подробнее — в FAQ и
            политике диспутов.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
            5. Запрещённое
          </h2>
          <p>
            Запрещены оффплатформенные оплаты по сделкам DigiForge, спам, фишинг, вредоносный код,
            незаконные услуги и манипуляции отзывами.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
            6. Контакты
          </h2>
          <p>
            Вопросы по условиям:{" "}
            <a href="/contact" className="text-accent hover:underline">
              страница контактов
            </a>{" "}
            или поддержка в кабинете.
          </p>
        </section>
      </Panel>
    </div>
  );
}
