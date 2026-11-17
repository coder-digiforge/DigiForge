import { Panel } from "@/components/ui";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:px-12">
      <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold">О бирже</h1>
      <Panel className="mt-8 p-8">
        <p className="leading-relaxed text-muted-2">
          DigiForge — фриланс-биржа для digital-продуктов с крипто-эскроу. Мы строим безопасные
          сделки для команд из Украины, Польши и Европы: ставка → эскроу → сдача → приёмка →
          выплата в USDT.
        </p>
      </Panel>
    </div>
  );
}
