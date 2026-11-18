import { registerAction } from "@/app/actions/auth";
import { getSessionUser, homeForRole } from "@/lib/auth";
import { Button, Input, Panel } from "@/components/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; role?: string }>;
}) {
  const session = await getSessionUser();
  if (session) redirect(homeForRole(session.role));

  const { error, role } = await searchParams;
  const selected = role === "freelancer" ? "freelancer" : "client";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-5 py-8 sm:px-6 sm:py-12 md:py-16">
      <div className="text-center md:text-left">
        <h1 className="font-[family-name:var(--font-syne)] text-[28px] font-bold tracking-[-0.02em] text-[#f5e6c8] sm:text-3xl">
          Регистрация
        </h1>
        <p className="mt-2 text-sm text-muted">Создайте аккаунт заказчика или фрилансера</p>
      </div>

      <Panel className="mt-6 p-5 sm:mt-8 sm:p-6">
        <form action={registerAction} className="space-y-4">
          <div>
            <label htmlFor="register-name" className="mb-1.5 block text-sm text-muted">
              Имя
            </label>
            <Input
              id="register-name"
              name="name"
              required
              autoComplete="name"
              enterKeyHint="next"
              placeholder="Анна"
            />
          </div>
          <div>
            <label htmlFor="register-email" className="mb-1.5 block text-sm text-muted">
              Email
            </label>
            <Input
              id="register-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              enterKeyHint="next"
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label htmlFor="register-password" className="mb-1.5 block text-sm text-muted">
              Пароль
            </label>
            <Input
              id="register-password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              enterKeyHint="done"
              placeholder="минимум 6 символов"
            />
          </div>

          <fieldset>
            <legend className="mb-2 block text-sm text-muted">Роль</legend>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <label className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-border bg-[#1c140f]/40 px-4 py-3.5 text-[15px] font-medium transition-colors has-[:checked]:border-accent has-[:checked]:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] has-[:checked]:text-accent">
                <input
                  type="radio"
                  name="role"
                  value="client"
                  defaultChecked={selected === "client"}
                  className="sr-only"
                />
                Я заказчик
              </label>
              <label className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-border bg-[#1c140f]/40 px-4 py-3.5 text-[15px] font-medium transition-colors has-[:checked]:border-accent has-[:checked]:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] has-[:checked]:text-accent">
                <input
                  type="radio"
                  name="role"
                  value="freelancer"
                  defaultChecked={selected === "freelancer"}
                  className="sr-only"
                />
                Я фрилансер
              </label>
            </div>
          </fieldset>

          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full !py-3.5 !text-[15px]">
            Начать бесплатно
          </Button>
        </form>

        <p className="mt-5 border-t border-border/60 pt-4 text-center text-sm text-muted md:text-left">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Войти
          </Link>
        </p>
      </Panel>
    </div>
  );
}
