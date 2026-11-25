import Link from "next/link";
import { Logo } from "./ui";

const platformLinks = [
  { href: "/projects", label: "Проекты" },
  { href: "/pricing", label: "Тарифы" },
  { href: "/freelancers", label: "Исполнители" },
] as const;

const aboutLinks = [
  { href: "/about", label: "Компания" },
  { href: "/whats-new", label: "Что нового?" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Контакты" },
] as const;

const legalLinks = [
  { href: "/support", label: "Поддержка" },
  { href: "/terms", label: "Условия" },
  { href: "/privacy", label: "Конфиденциальность" },
] as const;

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string | null; label: string }[];
}) {
  return (
    <div>
      <h3 className="mb-3 text-[13px] font-semibold tracking-wide text-text sm:text-sm">{title}</h3>
      <ul className="space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={link.label}>
            {link.href ? (
              <Link href={link.href} className="df-footer-link">
                {link.label}
              </Link>
            ) : (
              <span className="text-muted">{link.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GuestFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-bg-deep">
      <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-6 md:px-12 md:py-12">
        <div className="grid gap-8 md:grid-cols-4 md:gap-10">
          <div className="text-center md:text-left">
            <div className="inline-flex md:block">
              <Logo />
            </div>
            <p className="mx-auto mt-3 max-w-[280px] text-sm leading-relaxed text-muted md:mx-0 md:mt-4 md:max-w-xs">
              Фриланс-биржа с эскроу-сделками, оплатой в USDT и PRO-продвижением.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-border/50 pt-7 sm:grid-cols-3 md:col-span-3 md:grid-cols-3 md:gap-10 md:border-t-0 md:pt-0">
            <FooterColumn title="Платформа" links={platformLinks} />
            <FooterColumn title="О нас" links={aboutLinks} />
            <FooterColumn title="Правовая информация" links={legalLinks} />
          </div>
        </div>

        <div className="mt-8 border-t border-border/50 pt-5 text-center text-[11px] text-muted sm:mt-10 sm:pt-6 sm:text-left sm:text-xs">
          © {new Date().getFullYear()} DigiForge
        </div>
      </div>
    </footer>
  );
}
