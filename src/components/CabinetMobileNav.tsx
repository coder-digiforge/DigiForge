"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bookmark,
  Briefcase,
  FolderKanban,
  Gavel,
  HelpCircle,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  MessageCircle,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  Star,
  UserRound,
  Users,
  Wallet,
  Crown,
  X,
} from "lucide-react";
import { whatsNewFreshCount } from "@/lib/whats-new";
import { useUnreadMessages } from "@/components/UnreadMessagesProvider";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
};

type NavGroup = { title: string; items: NavItem[] };

function isActive(pathname: string, href: string, roots: string[]) {
  if (pathname === href) return true;
  if (roots.includes(href)) return false;
  return pathname.startsWith(href);
}

function TabIcon({ children, active }: { children: ReactNode; active: boolean }) {
  return (
    <span className={active ? "text-accent" : "text-muted"}>{children}</span>
  );
}

function MoreSheet({
  open,
  onClose,
  groups,
  roots,
}: {
  open: boolean;
  onClose: () => void;
  groups: NavGroup[];
  roots: string[];
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button
        type="button"
        aria-label="Закрыть меню"
        className="absolute inset-0 bg-black/55"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto rounded-t-3xl border border-border bg-panel px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.45)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="text-sm font-semibold text-text">Меню</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted"
            aria-label="Закрыть"
          >
            <X size={16} />
          </button>
        </div>
        {groups.map((group) => (
          <div key={group.title} className="mb-4">
            <div className="mb-2 px-1 text-[11px] uppercase tracking-wider text-muted">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href, roots);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                      active
                        ? "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent"
                        : "text-muted-2 hover:bg-[color-mix(in_srgb,var(--panel-soft)_80%,transparent)] hover:text-text"
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
        ))}
      </div>
    </div>
  );
}

function BottomNav({
  tabs,
  moreLabel = "Ещё",
  roots,
  groups,
}: {
  tabs: NavItem[];
  moreLabel?: string;
  roots: string[];
  groups: NavGroup[];
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const hideForChat = /\/messages\/[^/]+$/.test(pathname);

  if (hideForChat) return null;

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-[color-mix(in_srgb,var(--panel)_96%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <ul className="mx-auto grid h-[58px] max-w-[560px] grid-cols-5">
          {tabs.map((tab) => {
            const active = isActive(pathname, tab.href, roots);
            return (
              <li key={tab.href} className="min-w-0">
                <Link
                  href={tab.href}
                  className={`relative flex h-full flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium ${
                    active ? "text-accent" : "text-muted"
                  }`}
                >
                  <span className="relative inline-flex">
                    <TabIcon active={active}>{tab.icon}</TabIcon>
                    {tab.badge != null && tab.badge > 0 && (
                      <span className="absolute -right-2.5 -top-1.5 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-accent px-1 text-[9px] font-bold leading-none text-[#1a120c]">
                        {tab.badge > 99 ? "99+" : tab.badge}
                      </span>
                    )}
                  </span>
                  <span className="max-w-full truncate">{tab.label}</span>
                </Link>
              </li>
            );
          })}
          <li className="min-w-0">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={`flex h-full w-full flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium ${
                moreOpen ? "text-accent" : "text-muted"
              }`}
            >
              <Menu size={18} />
              <span>{moreLabel}</span>
            </button>
          </li>
        </ul>
      </nav>
      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        groups={groups}
        roots={roots}
      />
    </>
  );
}

export function FreelancerMobileNav() {
  const fresh = whatsNewFreshCount();
  const { unreadTotal } = useUnreadMessages();
  const roots = ["/freelancer"];
  const groups: NavGroup[] = [
    {
      title: "Рабочая среда",
      items: [
        { href: "/freelancer", label: "Кабинет", icon: <LayoutDashboard size={16} /> },
        { href: "/freelancer/projects", label: "Найти проект", icon: <Search size={16} /> },
        {
          href: "/freelancer/messages",
          label: "Переписки",
          icon: <MessageSquare size={16} />,
          badge: unreadTotal,
        },
        { href: "/freelancer/bids", label: "Ставки", icon: <Gavel size={16} /> },
        { href: "/freelancer/favorites", label: "Избранное", icon: <Bookmark size={16} /> },
        { href: "/freelancer/finance", label: "Финансы", icon: <Wallet size={16} /> },
        { href: "/freelancer/portfolio", label: "Портфолио", icon: <FolderKanban size={16} /> },
        { href: "/freelancer/reviews", label: "Отзывы", icon: <Star size={16} /> },
      ],
    },
    {
      title: "Профиль",
      items: [
        { href: "/freelancer/profile", label: "Личные данные", icon: <UserRound size={16} /> },
        { href: "/freelancer/public", label: "Профиль фрилансера", icon: <Briefcase size={16} /> },
        { href: "/freelancer/settings", label: "Настройки", icon: <Settings size={16} /> },
        { href: "/freelancer/prime", label: "Digi Prime", icon: <Crown size={16} /> },
      ],
    },
    {
      title: "Сервис",
      items: [
        { href: "/freelancer/support", label: "Команда заботы", icon: <LifeBuoy size={16} /> },
        {
          href: "/freelancer/whats-new",
          label: "Что нового?",
          icon: <Sparkles size={16} />,
          badge: fresh,
        },
        { href: "/freelancer/faq", label: "FAQ", icon: <HelpCircle size={16} /> },
      ],
    },
  ];

  const tabs: NavItem[] = [
    { href: "/freelancer", label: "Кабинет", icon: <LayoutDashboard size={18} /> },
    { href: "/freelancer/projects", label: "Проекты", icon: <Search size={18} /> },
    {
      href: "/freelancer/messages",
      label: "Чаты",
      icon: <MessageSquare size={18} />,
      badge: unreadTotal,
    },
    { href: "/freelancer/finance", label: "Финансы", icon: <Wallet size={18} /> },
  ];

  return <BottomNav tabs={tabs} roots={roots} groups={groups} />;
}

export function ClientMobileNav() {
  const fresh = whatsNewFreshCount();
  const { unreadTotal } = useUnreadMessages();
  const roots = ["/client"];
  const groups: NavGroup[] = [
    {
      title: "Рабочая среда",
      items: [
        { href: "/client", label: "Обзор", icon: <LayoutDashboard size={16} /> },
        {
          href: "/client/messages",
          label: "Переписки",
          icon: <MessageSquare size={16} />,
          badge: unreadTotal,
        },
        { href: "/client/work", label: "В работе", icon: <Briefcase size={16} /> },
        { href: "/client/projects", label: "Мои проекты", icon: <FolderKanban size={16} /> },
        { href: "/client/freelancers", label: "Исполнители", icon: <Users size={16} /> },
        { href: "/client/favorites", label: "Избранное", icon: <Bookmark size={16} /> },
        { href: "/client/finance", label: "Финансы", icon: <Wallet size={16} /> },
        { href: "/client/reviews", label: "Отзывы", icon: <Star size={16} /> },
      ],
    },
    {
      title: "Профиль",
      items: [
        { href: "/client/profile", label: "Личные данные", icon: <UserRound size={16} /> },
        { href: "/client/settings", label: "Настройки", icon: <Settings size={16} /> },
      ],
    },
    {
      title: "Сервис",
      items: [
        { href: "/client/support", label: "Команда заботы", icon: <LifeBuoy size={16} /> },
        {
          href: "/client/whats-new",
          label: "Что нового?",
          icon: <Sparkles size={16} />,
          badge: fresh,
        },
        { href: "/client/pricing", label: "Тарифы", icon: <Crown size={16} /> },
        { href: "/client/faq", label: "FAQ", icon: <HelpCircle size={16} /> },
      ],
    },
  ];

  const tabs: NavItem[] = [
    { href: "/client", label: "Обзор", icon: <LayoutDashboard size={18} /> },
    { href: "/client/projects", label: "Проекты", icon: <FolderKanban size={18} /> },
    {
      href: "/client/messages",
      label: "Чаты",
      icon: <MessageSquare size={18} />,
      badge: unreadTotal,
    },
    { href: "/client/finance", label: "Финансы", icon: <Wallet size={18} /> },
  ];

  return <BottomNav tabs={tabs} roots={roots} groups={groups} />;
}

export function AdminMobileNav() {
  const roots = ["/admin"];
  const groups: NavGroup[] = [
    {
      title: "Операции",
      items: [
        { href: "/admin", label: "Обзор", icon: <LayoutDashboard size={16} /> },
        { href: "/admin/users", label: "Пользователи", icon: <Users size={16} /> },
        { href: "/admin/projects", label: "Проекты", icon: <FolderKanban size={16} /> },
        { href: "/admin/deals", label: "Сделки", icon: <Briefcase size={16} /> },
        { href: "/admin/finance", label: "Финансы", icon: <Landmark size={16} /> },
        { href: "/admin/audit", label: "Audit", icon: <Gavel size={16} /> },
        { href: "/admin/reviews", label: "Отзывы", icon: <MessageCircle size={16} /> },
      ],
    },
  ];

  const tabs: NavItem[] = [
    { href: "/admin", label: "Обзор", icon: <LayoutDashboard size={18} /> },
    { href: "/admin/users", label: "Юзеры", icon: <Users size={18} /> },
    { href: "/admin/deals", label: "Сделки", icon: <Briefcase size={18} /> },
    { href: "/admin/finance", label: "Финансы", icon: <Landmark size={18} /> },
  ];

  return <BottomNav tabs={tabs} roots={roots} groups={groups} />;
}
