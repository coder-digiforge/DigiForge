import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import {
  formatWhatsNewDate,
  WHATS_NEW,
  WHATS_NEW_TAG_LABEL,
  type WhatsNewEntry,
  type WhatsNewTag,
} from "@/lib/whats-new";
import { ButtonLink, PageTitle, Panel } from "./ui";

const TAG_TONE: Record<WhatsNewTag, string> = {
  product: "border-accent/35 text-accent",
  prime: "border-accent/50 bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-accent",
  cabinet: "border-border text-muted-2",
  security: "border-border text-muted-2",
  support: "border-accent/40 text-accent",
};

function EntryCard({ entry }: { entry: WhatsNewEntry }) {
  return (
    <Panel className="p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TAG_TONE[entry.tag]}`}
        >
          {WHATS_NEW_TAG_LABEL[entry.tag]}
        </span>
        {entry.fresh && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#ff7b86] px-2 py-0.5 text-[11px] font-bold text-[#120d0a]">
            Новое
          </span>
        )}
        <span className="text-xs text-muted">{formatWhatsNewDate(entry.date)}</span>
      </div>

      <h2 className="mt-3 font-[family-name:var(--font-syne)] text-lg font-bold text-text">
        {entry.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-2">{entry.summary}</p>

      <ul className="mt-4 space-y-2">
        {entry.points.map((point) => (
          <li key={point} className="flex items-start gap-2.5 text-sm text-muted-2">
            <Check size={15} className="mt-0.5 shrink-0 text-accent" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function WhatsNewPanel({
  role,
}: {
  role?: "client" | "freelancer" | "guest";
}) {
  const [featured, ...rest] = WHATS_NEW;
  const careHref =
    role === "client" ? "/client/support" : role === "freelancer" ? "/freelancer/support" : "/support";
  const primeHref =
    role === "freelancer"
      ? "/freelancer/prime"
      : role === "client"
        ? "/client/pricing"
        : "/pricing";

  return (
    <div className="space-y-5">
      <PageTitle
        title="Что нового?"
        subtitle="Обновления DigiForge · продукт, кабинет и сервис"
        className="mb-0"
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-1.5 text-xs font-semibold text-accent">
            <Sparkles size={14} />
            {WHATS_NEW.filter((e) => e.fresh).length} новое
          </span>
        }
      />

      <Panel className="relative overflow-hidden border-accent/35 p-5 md:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(224,168,107,0.26),transparent_70%)]"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-[#ff7b86] px-2.5 py-0.5 text-[11px] font-bold text-[#120d0a]">
                Новое
              </span>
              <span className="text-xs text-muted">{formatWhatsNewDate(featured.date)}</span>
            </div>
            <h2 className="mt-3 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
              {featured.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-2">
              {featured.summary}
            </p>
            <ul className="mt-4 space-y-2">
              {featured.points.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-muted-2">
                  <Check size={15} className="mt-0.5 shrink-0 text-accent" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              {featured.id === "wn-care" && (
                <ButtonLink href={careHref} className="!rounded-full">
                  Открыть команду заботы
                </ButtonLink>
              )}
              {role === "freelancer" && (
                <ButtonLink href={primeHref} variant="ghost" className="!rounded-full">
                  Digi Prime
                </ButtonLink>
              )}
            </div>
          </div>
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${TAG_TONE[featured.tag]}`}
          >
            {WHATS_NEW_TAG_LABEL[featured.tag]}
          </span>
        </div>
      </Panel>

      <div className="grid gap-4">
        {rest.map((entry) => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
      </div>

      <p className="text-center text-xs text-muted">
        Хотите рассказать о баге или идее?{" "}
        <Link href={careHref} className="text-accent hover:underline">
          Напишите команде заботы
        </Link>
        .
      </p>
    </div>
  );
}
