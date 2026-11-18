import { loginAction } from "@/app/actions/auth";
import { getSessionUser, homeForRole } from "@/lib/auth";
import { Button, Input, Panel } from "@/components/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSessionUser();
  if (session) redirect(homeForRole(session.role));

  const { error } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-5 py-8 sm:px-6 sm:py-12 md:py-16">
      <div className="text-center md:text-left">
        <h1 className="font-[family-name:var(--font-syne)] text-[28px] font-bold tracking-[-0.02em] text-[#f5e6c8] sm:text-3xl">
          Вход
        </h1>
        <p className="mt-2 text-sm text-muted">Войдите в кабинет DigiForge</p>
      </div>

      <Panel className="mt-6 p-5 sm:mt-8 sm:p-6">
        <form action={loginAction} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm text-muted">
              Email
            </label>
            <Input
              id="login-email"
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
            <label htmlFor="login-password" className="mb-1.5 block text-sm text-muted">
              Пароль
            </label>
            <Input
              id="login-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              enterKeyHint="go"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full !py-3.5 !text-[15px]">
            Войти
          </Button>
        </form>

        <p className="mt-5 border-t border-border/60 pt-4 text-center text-sm text-muted md:text-left">
          Нет аккаунта?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Регистрация
          </Link>
        </p>
      </Panel>
    </div>
  );
}
