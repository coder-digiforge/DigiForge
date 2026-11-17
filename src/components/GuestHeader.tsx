import Link from "next/link";
import { ButtonLink, Logo } from "./ui";

export function GuestHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[color-mix(in_srgb,var(--bg)_95%,transparent)] backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-6 px-6 md:px-12">
        <Logo />
        <nav className="flex items-center gap-2">
          <span className="df-lang-chip">RU</span>
          <Link href="/login" className="df-nav-link">
            Войти
          </Link>
          <ButtonLink href="/register" className="!py-2 !text-sm">
            Регистрация
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
