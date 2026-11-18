import Link from "next/link";
import { ButtonLink, Logo } from "./ui";

export function GuestHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 md:h-[72px] md:gap-6 md:px-12">
        <Logo />

        <nav className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <span className="df-lang-chip hidden sm:inline-flex">RU</span>
          <Link
            href="/login"
            className="df-nav-link !px-2.5 !text-[13px] text-[#f5e6c8] sm:!px-3 sm:!text-sm"
          >
            Войти
          </Link>
          <ButtonLink
            href="/register"
            className="!px-3.5 !py-2 !text-[13px] sm:!px-4 sm:!text-sm"
          >
            Регистрация
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
