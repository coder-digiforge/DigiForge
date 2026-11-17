import Link from "next/link";
import { Logo } from "./ui";

export function GuestFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-bg-deep">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-12 md:grid-cols-4 md:px-12">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Фриланс-биржа с эскроу-сделками, оплатой в USDT и PRO-продвижением.
          </p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-text">Платформа</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/projects" className="df-footer-link">
                Проекты
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="df-footer-link">
                Тарифы
              </Link>
            </li>
            <li>
              <Link href="/freelancers" className="df-footer-link">
                Исполнители
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-text">О нас</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/about" className="df-footer-link">
                Компания
              </Link>
            </li>
            <li>
              <Link href="/whats-new" className="df-footer-link">
                Что нового?
              </Link>
            </li>
            <li>
              <Link href="/faq" className="df-footer-link">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/contact" className="df-footer-link">
                Контакты
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-text">Правовая информация</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/support" className="df-footer-link">
                Поддержка
              </Link>
            </li>
            <li>
              <span className="text-muted">Условия</span>
            </li>
            <li>
              <span className="text-muted">Конфиденциальность</span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
