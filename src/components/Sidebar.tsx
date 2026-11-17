"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Briefcase,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Star,
  UserRound,
  Users,
  Wallet,
  Crown,
  LifeBuoy,
  Gavel,
  Sparkles,
  Landmark,
  MessageCircle,
} from "lucide-react";
import { whatsNewFreshCount } from "@/lib/whats-new";

type Item = { href: string; label: string; icon: ReactNode; badge?: number };

function NavGroup({ title, items }: { title: string; items: Item[] }) {
  const pathname = usePathname();
  return (
    <div className="mb-4">
      <div className="mb-2 px-3 text-[11px] uppercase tracking-wider text-muted">{title}</div>
      <div className="space-y-1">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/client" &&
              item.href !== "/freelancer" &&
              item.href !== "/admin" &&
              pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                active
                  ? "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent"
                  : "text-muted-2 hover:bg-[color-mix(in_srgb,var(--panel)_80%,transparent)] hover:text-text"
              }`}
            >
              {item.icon}
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#ff7b86] px-1 text-[11px] font-bold text-[#120d0a]">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function ClientSidebar() {
  const fresh = whatsNewFreshCount();
  return (
    <aside className="df-panel h-fit w-full shrink-0 p-3 md:w-60">
      <NavGroup
        title="Рабочая среда"
        items={[
          { href: "/client", label: "Обзор", icon: <LayoutDashboard size={16} /> },
          { href: "/client/messages", label: "Переписки", icon: <MessageSquare size={16} /> },
          { href: "/client/work", label: "В работе", icon: <Briefcase size={16} /> },
          { href: "/client/projects", label: "Мои проекты", icon: <FolderKanban size={16} /> },
          { href: "/client/freelancers", label: "Исполнители", icon: <Users size={16} /> },
          { href: "/client/finance", label: "Финансы", icon: <Wallet size={16} /> },
          { href: "/client/reviews", label: "Отзывы", icon: <Star size={16} /> },
        ]}
      />
      <NavGroup
        title="Профиль"
        items={[
          { href: "/client/profile", label: "Личные данные", icon: <UserRound size={16} /> },
          { href: "/client/settings", label: "Настройки", icon: <Settings size={16} /> },
        ]}
      />
      <NavGroup
        title="Сервис"
        items={[
          { href: "/client/support", label: "Команда заботы", icon: <LifeBuoy size={16} /> },
          {
            href: "/client/whats-new",
            label: "Что нового?",
            icon: <Sparkles size={16} />,
            badge: fresh,
          },
          { href: "/client/pricing", label: "Тарифы", icon: <Crown size={16} /> },
          { href: "/client/faq", label: "FAQ", icon: <HelpCircle size={16} /> },
        ]}
      />
    </aside>
  );
}

export function FreelancerSidebar() {
  const fresh = whatsNewFreshCount();
  return (
    <aside className="df-panel h-fit w-full shrink-0 p-3 md:w-60">
      <NavGroup
        title="Рабочая среда"
        items={[
          { href: "/freelancer", label: "Кабинет", icon: <LayoutDashboard size={16} /> },
          { href: "/freelancer/messages", label: "Переписки", icon: <MessageSquare size={16} /> },
          { href: "/freelancer/bids", label: "Ставки", icon: <Gavel size={16} /> },
          { href: "/freelancer/finance", label: "Финансы", icon: <Wallet size={16} /> },
          { href: "/freelancer/portfolio", label: "Портфолио", icon: <FolderKanban size={16} /> },
          { href: "/freelancer/reviews", label: "Отзывы", icon: <Star size={16} /> },
        ]}
      />
      <NavGroup
        title="Профиль"
        items={[
          { href: "/freelancer/profile", label: "Личные данные", icon: <UserRound size={16} /> },
          { href: "/freelancer/public", label: "Профиль фрилансера", icon: <Briefcase size={16} /> },
          { href: "/freelancer/settings", label: "Настройки", icon: <Settings size={16} /> },
          { href: "/freelancer/prime", label: "Digi Prime", icon: <Crown size={16} /> },
        ]}
      />
      <NavGroup
        title="Сервис"
        items={[
          { href: "/freelancer/support", label: "Команда заботы", icon: <LifeBuoy size={16} /> },
          {
            href: "/freelancer/whats-new",
            label: "Что нового?",
            icon: <Sparkles size={16} />,
            badge: fresh,
          },
          { href: "/freelancer/faq", label: "FAQ", icon: <HelpCircle size={16} /> },
        ]}
      />
    </aside>
  );
}

export function AdminSidebar() {
  return (
    <aside className="df-panel h-fit w-full shrink-0 p-3 md:w-60">
      <NavGroup
        title="Операции"
        items={[
          { href: "/admin", label: "Обзор", icon: <LayoutDashboard size={16} /> },
          { href: "/admin/users", label: "Пользователи", icon: <Users size={16} /> },
          { href: "/admin/projects", label: "Проекты", icon: <FolderKanban size={16} /> },
          { href: "/admin/deals", label: "Сделки", icon: <Briefcase size={16} /> },
          { href: "/admin/finance", label: "Финансы", icon: <Landmark size={16} /> },
          { href: "/admin/reviews", label: "Отзывы", icon: <MessageCircle size={16} /> },
        ]}
      />
    </aside>
  );
}
