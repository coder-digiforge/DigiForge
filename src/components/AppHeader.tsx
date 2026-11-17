import Link from "next/link";
import { MessageSquare } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import {
  NotificationsMenu,
  type NotificationPreview,
} from "./NotificationsMenu";
import { ProfileMenu } from "./ProfileMenu";
import { ButtonLink, Logo } from "./ui";
import { TasksMenu, type TaskPreview } from "./TasksMenu";

export function AppHeader({
  user,
  variant,
  tasks = [],
  notifications = [],
}: {
  user: SessionUser;
  variant: "client" | "freelancer";
  tasks?: TaskPreview[];
  notifications?: NotificationPreview[];
}) {
  const homeHref = variant === "client" ? "/client" : "/freelancer";
  const messagesHref = variant === "client" ? "/client/messages" : "/freelancer/messages";
  const findHref = variant === "client" ? "/client/freelancers" : "/freelancer/projects";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[color-mix(in_srgb,var(--panel)_95%,transparent)] backdrop-blur">
      <div className="relative mx-auto flex h-[68px] max-w-[1440px] items-center justify-between gap-4 px-6 md:px-10">
        <div className="relative z-10 flex min-w-0 items-center">
          <Logo href={homeHref} />
        </div>
        {variant === "freelancer" && (
          <nav className="pointer-events-none absolute inset-x-0 hidden items-center justify-center gap-8 md:flex">
            <div className="pointer-events-auto">
              <TasksMenu tasks={tasks} />
            </div>
            <Link
              href={findHref}
              className="df-nav-link pointer-events-auto !text-text hover:!text-accent"
            >
              Найти проект
            </Link>
          </nav>
        )}
        <div className="relative z-10 flex items-center gap-3">
          {variant === "client" && (
            <>
              <Link href="/client/freelancers" className="df-nav-link hidden md:inline">
                Исполнители
              </Link>
              <ButtonLink href="/client/projects/new" className="!py-2 !text-sm">
                + Новый проект
              </ButtonLink>
            </>
          )}
          <Link
            href={messagesHref}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted transition hover:border-accent/40 hover:text-accent"
            aria-label="Сообщения"
          >
            <MessageSquare size={16} />
          </Link>
          <NotificationsMenu items={notifications} />
          <ProfileMenu user={user} variant={variant} />
        </div>
      </div>
    </header>
  );
}
