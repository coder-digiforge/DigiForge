"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { updateDb } from "@/lib/store";

const TOPIC_LABELS: Record<string, string> = {
  escrow: "Сделка и эскроу",
  wallet: "Депозит или вывод",
  dispute: "Диспут",
  prime: "Digi Prime",
  account: "Аккаунт и безопасность",
  other: "Другое",
};

function safeReturnTo(raw: string) {
  if (raw.startsWith("/freelancer/support")) return "/freelancer/support";
  if (raw.startsWith("/client/support")) return "/client/support";
  return "/support";
}

export async function submitSupportRequestAction(formData: FormData) {
  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/support"));
  const topic = String(formData.get("topic") ?? "other");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const message = String(formData.get("message") ?? "").trim();

  if (!email || !email.includes("@")) {
    redirect(`${returnTo}?error=${encodeURIComponent("Укажите корректный email")}`);
  }
  if (message.length < 12) {
    redirect(
      `${returnTo}?error=${encodeURIComponent("Опишите ситуацию чуть подробнее (от 12 символов)")}`,
    );
  }

  const session = await getSessionUser();
  const topicLabel = TOPIC_LABELS[topic] ?? TOPIC_LABELS.other;

  if (session) {
    await updateDb((db) => {
      db.notifications.push({
        id: `n-${crypto.randomUUID().slice(0, 8)}`,
        userId: session.id,
        title: "Запрос принят",
        body: `Команда заботы получила обращение «${topicLabel}». Ответ придёт на ${email}.`,
        initials: "КЗ",
        read: false,
        href: returnTo,
        createdAt: new Date().toISOString(),
      });
    });
    revalidatePath(returnTo);
  }

  redirect(`${returnTo}?sent=1`);
}
