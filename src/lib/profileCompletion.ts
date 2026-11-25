export type ProfileCompletionItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
};

export type ProfileCompletionInput = {
  email?: string | null;
  avatarUrl?: string | null;
  title?: string | null;
  bio?: string | null;
  skills: string[];
  walletAddress?: string | null;
  portfolioCount: number;
};

export function getProfileCompletion(input: ProfileCompletionInput) {
  const items: ProfileCompletionItem[] = [
    {
      id: "email",
      label: "Email подтверждён",
      done: Boolean(input.email?.trim()),
      href: "/freelancer/settings",
    },
    {
      id: "avatar",
      label: "Загрузить фото",
      done: Boolean(input.avatarUrl?.trim()),
      href: "/freelancer/profile",
    },
    {
      id: "title",
      label: "Указать специализацию",
      done: Boolean(input.title?.trim()),
      href: "/freelancer/public",
    },
    {
      id: "bio",
      label: "Рассказать о себе",
      done: Boolean(input.bio?.trim()),
      href: "/freelancer/public",
    },
    {
      id: "skills",
      label: "Добавить навыки",
      done: input.skills.filter(Boolean).length > 0,
      href: "/freelancer/public",
    },
    {
      id: "wallet",
      label: "Привязать кошелёк",
      done: Boolean(input.walletAddress?.trim()),
      href: "/freelancer/profile",
    },
    {
      id: "portfolio",
      label: "Заполнить портфолио",
      done: input.portfolioCount > 0,
      href: "/freelancer/portfolio",
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const percent = Math.round((doneCount / items.length) * 100);

  return { items, doneCount, total: items.length, percent };
}
