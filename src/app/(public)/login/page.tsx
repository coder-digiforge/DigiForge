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
    <div className="mx-auto flex max-w-md flex-col px-6 py-16">
      <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold">Вход</h1>
      <p className="mt-2 text-sm text-muted">Войдите в кабинет DigiForge</p>
      <Panel className="mt-8 p-6">
        <form action={loginAction} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted">Email</label>
            <Input name="email" type="email" required placeholder="you@email.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Пароль</label>
            <Input name="password" type="password" required placeholder="••••••••" />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full">
            Войти
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-accent hover:underline">
            Регистрация
          </Link>
        </p>
      </Panel>
    </div>
  );
}
