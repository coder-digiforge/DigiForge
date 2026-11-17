"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ButtonLink } from "./ui";

export type TaskPreview = {
  id: string;
  title: string;
  amount: number;
  status: string;
  statusLabel: string;
};

const statusTone: Record<string, string> = {
  funded: "text-muted",
  in_progress: "text-accent",
  delivered: "text-success",
  disputed: "text-danger",
};

export function TasksMenu({ tasks }: { tasks: TaskPreview[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href="/freelancer/work"
        className="df-nav-link pointer-events-auto !text-text hover:!text-accent"
        aria-expanded={open}
        aria-haspopup="true"
      >
        Мои задачи ▾
      </Link>

      <div
        className={`pointer-events-auto absolute left-1/2 top-full z-50 w-[min(300px,calc(100vw-2rem))] -translate-x-1/2 pt-3 transition-all duration-200 ${
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-1 opacity-0"
        }`}
      >
        <div className="overflow-hidden rounded-2xl border border-border bg-[#1a1614] shadow-[0_18px_48px_rgba(0,0,0,0.45)]">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center px-4 pb-4 pt-3 text-center">
              <div className="w-full overflow-hidden rounded-lg bg-[#221c18]">
                <Image
                  src="/freelancer/empty-tasks.jpg"
                  alt=""
                  width={720}
                  height={405}
                  className="h-auto w-full object-cover"
                  priority={false}
                />
              </div>
              <h3 className="mt-3 font-[family-name:var(--font-syne)] text-[15px] font-bold text-text">
                У вас нет активных задач
              </h3>
              <p className="mt-1.5 max-w-[28ch] text-xs leading-relaxed text-muted">
                Ищите проекты по своим навыкам
              </p>
              <div className="mt-3">
                <ButtonLink
                  href="/freelancer/projects"
                  className="!rounded-full !px-4 !py-2 !text-sm"
                >
                  Найти проект
                </ButtonLink>
              </div>
            </div>
          ) : (
            <div className="p-3">
              <div className="px-2 pb-2 pt-1 text-[11px] uppercase tracking-wider text-muted">
                Активные задачи · {tasks.length}
              </div>
              <ul className="max-h-72 space-y-1 overflow-y-auto">
                {tasks.map((task) => (
                  <li key={task.id}>
                    <Link
                      href="/freelancer/work"
                      className="flex items-start justify-between gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-text">{task.title}</div>
                        <div
                          className={`mt-1 text-xs ${statusTone[task.status] ?? "text-muted"}`}
                        >
                          {task.statusLabel}
                        </div>
                      </div>
                      <div className="shrink-0 text-sm font-semibold text-accent">
                        {task.amount} USDT
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-2 border-t border-border px-2 pt-3">
                <Link
                  href="/freelancer/work"
                  className="block text-center text-sm text-accent hover:underline"
                >
                  Все задачи
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
