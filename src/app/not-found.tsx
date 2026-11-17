import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="text-center">
        <div className="font-[family-name:var(--font-syne)] text-6xl font-bold text-accent">404</div>
        <p className="mt-4 text-muted">Страница не найдена</p>
        <div className="mt-6">
          <ButtonLink href="/">На главную</ButtonLink>
        </div>
      </div>
    </div>
  );
}
