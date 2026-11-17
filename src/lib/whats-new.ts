export type WhatsNewTag = "product" | "prime" | "cabinet" | "security" | "support";

export type WhatsNewEntry = {
  id: string;
  date: string;
  title: string;
  summary: string;
  points: string[];
  tag: WhatsNewTag;
  fresh?: boolean;
};

export const WHATS_NEW_TAG_LABEL: Record<WhatsNewTag, string> = {
  product: "Платформа",
  prime: "Digi Prime",
  cabinet: "Кабинет",
  security: "Безопасность",
  support: "Поддержка",
};

export const WHATS_NEW: WhatsNewEntry[] = [
  {
    id: "wn-care",
    date: "2026-11-17",
    title: "Команда заботы",
    summary:
      "Отдельный экран поддержки: контакты, часы CET, FAQ и форма запроса прямо из кабинета.",
    points: [
      "Запрос по эскроу, депозиту, диспуту или Digi Prime",
      "Среднее время ответа до 2 часов в рабочие часы",
      "Ссылки из сайдбара, меню профиля и настроек",
    ],
    tag: "support",
    fresh: true,
  },
  {
    id: "wn-prime",
    date: "2026-11-16",
    title: "Digi Prime на USDT",
    summary: "Подписка фрилансера: триал, оплата с баланса и управление автопродлением.",
    points: [
      "Бесплатный триал на 2 месяца для новых аккаунтов",
      "29 USDT / 30 дней с доступного баланса",
      "Включение и отключение автопродления в один клик",
    ],
    tag: "prime",
  },
  {
    id: "wn-settings",
    date: "2026-11-15",
    title: "Настройки сервиса и безопасности",
    summary: "Уведомления, язык, тема, видимость профиля, пароль, 2FA и журнал входов.",
    points: [
      "Вкладки «Сервис» и «Безопасность»",
      "Светлая и тёмная тема кабинета",
      "Сессии и деактивация аккаунта",
    ],
    tag: "security",
  },
  {
    id: "wn-cabinet",
    date: "2026-11-10",
    title: "Кабинет стал ближе к макету",
    summary: "Аватары в шапке, меню профиля, уведомления и единый стиль заголовков вкладок.",
    points: [
      "PageTitle 28px Syne на всех экранах кабинета",
      "Меню аватара с Digi Prime / Basic",
      "Колокольчик с лентой уведомлений",
    ],
    tag: "cabinet",
  },
  {
    id: "wn-escrow",
    date: "2026-09-07",
    title: "Крипто-эскроу DigiForge",
    summary: "Старт платформы: сделки с сейфом, комиссия 10% и выплаты в USDT.",
    points: [
      "Депозит → сейф → релиз / диспут / вывод",
      "Сети TRC20 и ERC20",
      "Кабинеты заказчика и фрилансера",
    ],
    tag: "product",
  },
];

export function whatsNewFreshCount() {
  return WHATS_NEW.filter((e) => e.fresh).length;
}

export function formatWhatsNewDate(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
