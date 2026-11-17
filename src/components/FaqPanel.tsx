import { HelpCircle } from "lucide-react";
import { FAQ_ITEMS } from "@/lib/faq";
import { ButtonLink, PageTitle, Panel } from "@/components/ui";

export function FaqPanel({
  variant = "public",
}: {
  variant?: "public" | "cabinet-client" | "cabinet-freelancer";
}) {
  const supportHref =
    variant === "cabinet-client"
      ? "/client/support"
      : variant === "cabinet-freelancer"
        ? "/freelancer/support"
        : "/support";

  return (
    <div className="space-y-6">
      {variant === "public" ? (
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(224,168,107,0.3)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-3 py-1 text-xs font-semibold text-accent">
            <HelpCircle size={14} />
            Помощь
          </div>
          <h1 className="mt-4 font-[family-name:var(--font-syne)] text-3xl font-bold text-[#f5e6c8]">
            FAQ
          </h1>
          <p className="mt-2 text-muted">Эскроу, комиссия, сети и Digi Prime</p>
        </div>
      ) : (
        <PageTitle
          title="FAQ"
          subtitle="Эскроу, комиссия, сети и Digi Prime"
          className="mb-0"
          action={
            <ButtonLink href={supportHref} variant="ghost" className="!rounded-full !text-sm">
              Команда заботы
            </ButtonLink>
          }
        />
      )}

      <div className="space-y-3">
        {FAQ_ITEMS.map((f) => (
          <Panel key={f.q} className="p-5 md:p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-text">
              {f.q}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
          </Panel>
        ))}
      </div>

      <Panel className="p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-text">Не нашли ответ?</h2>
            <p className="mt-1 text-sm text-muted">Напишите команде заботы — ответим в рабочие часы CET.</p>
          </div>
          <ButtonLink href={supportHref} className="!rounded-full !px-5 !py-2.5 !text-sm">
            Открыть поддержку
          </ButtonLink>
        </div>
      </Panel>
    </div>
  );
}
