import { Panel } from "@/components/ui";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:px-12">
      <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold">Контакты</h1>
      <Panel className="mt-8 space-y-3 p-8 text-muted-2">
        <p>Email: hello@digiforge.io</p>
        <p>Поддержка: support@digiforge.io</p>
        <p>Гео: Ukraine · Poland · Europe</p>
      </Panel>
    </div>
  );
}
