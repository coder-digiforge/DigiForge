"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Briefcase,
  Contact,
  Headphones,
  IdCard,
  LogOut,
  Moon,
  Settings,
  Sparkles,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth";
import { whatsNewFreshCount } from "@/lib/whats-new";
import {
  readCabinetTheme,
  writeCabinetTheme,
  type CabinetTheme,
} from "./ThemeShell";
import { UserAvatar } from "./UserAvatar";

function formatPrimeUntil(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

export function ProfileMenu({
  user,
  variant,
}: {
  user: SessionUser;
  variant: "client" | "freelancer";
}) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<CabinetTheme>("dark");
  const rootRef = useRef<HTMLDivElement>(null);
  const darkTheme = theme === "dark";

  useEffect(() => {
    setTheme(readCabinetTheme());
  }, []);

  const primeActive =
    Boolean(user.digiPrimeUntil) &&
    new Date(user.digiPrimeUntil!).getTime() > Date.now();

  const profileHref = variant === "client" ? "/client/profile" : "/freelancer/profile";
  const settingsHref = variant === "client" ? "/client/settings" : "/freelancer/settings";
  const supportHref = variant === "client" ? "/client/support" : "/freelancer/support";
  const whatsNewHref = variant === "client" ? "/client/whats-new" : "/freelancer/whats-new";
  const freshNews = whatsNewFreshCount();
  const publicHref =
    variant === "freelancer" ? "/freelancer/public" : "/client/profile";
  const roleLabel = variant === "client" ? "заказчик" : "фрилансер";

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemClass =
    "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-text transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] hover:text-accent";

  const toggleTheme = () => {
    const next: CabinetTheme = darkTheme ? "light" : "dark";
    setTheme(next);
    writeCabinetTheme(next);
  };

  return (
    <div className="relative flex h-8 items-center" ref={rootRef}>
      <button
        type="button"
        aria-label="Меню профиля"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full p-0 leading-none transition-all duration-200 ${
          open
            ? "scale-105 ring-2 ring-accent/70 shadow-[0_0_16px_rgba(224,168,107,0.35)]"
            : "hover:scale-105 hover:ring-2 hover:ring-accent/55 hover:shadow-[0_0_14px_rgba(224,168,107,0.28)]"
        }`}
      >
        <UserAvatar name={user.name} url={user.avatarUrl} size={32} />
      </button>

      <div
        className={`absolute right-0 top-full z-50 w-[300px] pt-3 transition-all duration-200 ${
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-1 opacity-0 pointer-events-none"
        }`}
      >
        <div
          role="menu"
          className="rounded-2xl border border-border bg-[var(--menu-bg)] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.45)]"
        >
          <div className="mb-3">
            <div className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
              {user.name}
            </div>
            <div className="mt-1 text-[13px] font-medium text-muted">
              Профиль: {roleLabel}
            </div>
          </div>

          <nav className="space-y-0.5">
            <Link href={profileHref} className={itemClass} onClick={() => setOpen(false)}>
              <IdCard size={16} className="shrink-0 text-muted" />
              Личные данные
            </Link>
            <Link href={publicHref} className={itemClass} onClick={() => setOpen(false)}>
              {variant === "freelancer" ? (
                <Briefcase size={16} className="shrink-0 text-muted" />
              ) : (
                <Contact size={16} className="shrink-0 text-muted" />
              )}
              {variant === "freelancer" ? "Профиль фрилансера" : "Профиль заказчика"}
            </Link>
            <Link href={settingsHref} className={itemClass} onClick={() => setOpen(false)}>
              <Settings size={16} className="shrink-0 text-muted" />
              Настройки
            </Link>
            <Link href={supportHref} className={itemClass} onClick={() => setOpen(false)}>
              <Headphones size={16} className="shrink-0 text-muted" />
              Команда заботы
            </Link>
            <Link
              href={whatsNewHref}
              className={`${itemClass} justify-between`}
              onClick={() => setOpen(false)}
            >
              <span className="flex items-center gap-2.5">
                <Sparkles size={16} className="shrink-0 text-accent" />
                Что нового?
              </span>
              {freshNews > 0 && (
                <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#ff7b86] px-1 text-[11px] font-bold text-[#120d0a]">
                  {freshNews}
                </span>
              )}
            </Link>
            <button
              type="button"
              className={`${itemClass} justify-between`}
              onClick={toggleTheme}
            >
              <span className="flex items-center gap-2.5">
                <Moon size={16} className="shrink-0 text-accent" />
                Темная тема
              </span>
              <span
                className={`relative h-[22px] w-10 rounded-full transition-colors ${
                  darkTheme ? "bg-accent" : "bg-[color-mix(in_srgb,var(--muted)_35%,transparent)]"
                }`}
              >
                <span
                  className={`absolute top-[3px] h-4 w-4 rounded-full bg-[var(--text)] transition-transform ${
                    darkTheme ? "left-[21px]" : "left-[3px]"
                  }`}
                />
              </span>
            </button>
          </nav>

          <div className="my-3 h-px bg-border" />

          {variant === "freelancer" && (
            <div className="mb-3">
              {primeActive ? (
                <div>
                  <div className="text-sm font-semibold text-accent">
                    Ваш тариф: Digi Prime
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[13px]">
                    <span className="font-medium text-muted">Активный до:</span>
                    <span className="font-semibold text-accent">
                      {formatPrimeUntil(user.digiPrimeUntil!)}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-semibold text-accent">
                    Ваш тариф: Базовый
                  </div>
                  <Link
                    href="/freelancer/prime"
                    onClick={() => setOpen(false)}
                    className="mt-2.5 flex w-full items-center justify-center rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-[#120d0a] shadow-[0_0_20px_rgba(224,168,107,0.35)] transition hover:bg-accent-strong"
                  >
                    Купить Digi Prime
                  </Link>
                </div>
              )}
            </div>
          )}

          {variant === "freelancer" && <div className="mb-3 h-px bg-border" />}

          <form action={logoutAction}>
            <button type="submit" className={itemClass}>
              <LogOut size={16} className="shrink-0 text-muted" />
              Выход из системы
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
