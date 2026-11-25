"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { markNotificationsReadAction } from "@/app/actions/marketplace";
import type { NotificationItem } from "@/lib/types";

export type NotificationPreview = Pick<
  NotificationItem,
  "id" | "title" | "body" | "read" | "href" | "initials" | "createdAt"
>;

function relativeRu(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60_000));
  if (mins < 60) {
    if (mins < 1) return "только что";
    const n = mins % 10;
    const nn = mins % 100;
    const word =
      n === 1 && nn !== 11 ? "минута" : n >= 2 && n <= 4 && (nn < 12 || nn > 14) ? "минуты" : "минут";
    return `${mins} ${word}`;
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    const n = hours % 10;
    const nn = hours % 100;
    const word =
      n === 1 && nn !== 11 ? "час" : n >= 2 && n <= 4 && (nn < 12 || nn > 14) ? "часа" : "часов";
    return `${hours} ${word}`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) {
    const remH = hours - 24;
    if (remH > 0) {
      const n = remH % 10;
      const nn = remH % 100;
      const word =
        n === 1 && nn !== 11 ? "час" : n >= 2 && n <= 4 && (nn < 12 || nn > 14) ? "часа" : "часов";
      return `1 день ${remH} ${word}`;
    }
    return "1 день";
  }
  const n = days % 10;
  const nn = days % 100;
  const word =
    n === 1 && nn !== 11 ? "день" : n >= 2 && n <= 4 && (nn < 12 || nn > 14) ? "дня" : "дней";
  return `${days} ${word}`;
}

function initialsOf(n: NotificationPreview) {
  if (n.initials?.trim()) return n.initials.trim().slice(0, 2).toUpperCase();
  const text = n.body || n.title;
  if (/digiforge/i.test(text)) return "DF";
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0] ?? "";
    const b = parts[1].replace(/\./g, "")[0] ?? "";
    return `${a}${b}`.toUpperCase();
  }
  return (text.slice(0, 2) || "?").toUpperCase();
}

export function NotificationsMenu({ items }: { items: NotificationPreview[] }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState(items);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setList(items);
  }, [items]);

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

  const unreadCount = list.filter((n) => !n.read).length;

  const markAll = () => {
    if (!unreadCount || pending) return;
    setList((prev) => prev.map((n) => ({ ...n, read: true })));
    startTransition(async () => {
      await markNotificationsReadAction();
    });
  };

  return (
    <div className="relative flex h-8 items-center" ref={rootRef}>
      <button
        type="button"
        aria-label="Уведомления"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className={`relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-border p-0 text-muted transition hover:border-accent/40 hover:text-accent ${
          open ? "border-accent/40 text-accent" : ""
        }`}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-[#1a120c]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <div
        className={`absolute right-0 top-full z-50 w-[min(380px,calc(100vw-1.5rem))] pt-3 transition-all duration-200 ${
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <div
          role="menu"
          className="overflow-hidden rounded-2xl border border-border bg-[#1c140ff5] shadow-[0_18px_48px_rgba(0,0,0,0.45)]"
        >
          <div className="flex items-center justify-between px-5 pb-3 pt-4">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-[#f5e6c8]">
              Уведомления
            </h2>
            <button
              type="button"
              onClick={markAll}
              disabled={!unreadCount || pending}
              className="text-xs font-semibold text-accent transition hover:text-accent-strong disabled:cursor-default disabled:opacity-40"
            >
              Прочитать все
            </button>
          </div>

          {list.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted">Пока нет уведомлений</div>
          ) : (
            <ul className="max-h-[420px] overflow-y-auto pb-2">
              {list.map((n, i) => {
                const content = (
                  <>
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-accent/35 bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-xs font-semibold text-accent">
                      {initialsOf(n)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] text-muted">{relativeRu(n.createdAt)}</div>
                      <p className="mt-1 text-[13px] leading-snug text-[#e8dcc8]">{n.body || n.title}</p>
                    </div>
                    <div className="flex w-3 shrink-0 justify-end pt-1">
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                    </div>
                  </>
                );

                const rowClass = `flex items-start gap-3 border-t border-border/70 px-5 py-3.5 transition-colors ${
                  !n.read
                    ? "bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                    : "hover:bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]"
                } ${i === 0 ? "border-t-0" : ""}`;

                return (
                  <li key={n.id}>
                    {n.href ? (
                      <Link
                        href={n.href}
                        className={rowClass}
                        onClick={() => setOpen(false)}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className={rowClass}>{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
