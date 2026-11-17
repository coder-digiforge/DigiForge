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
    <div className="mx-auto flex max-w-md flex-col px-6 py-16">
      <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold">Регистрация</h1>
      <p className="mt-2 text-sm text-muted">Создайте аккаунт заказчика или фрилансера</p>
      <Panel className="mt-8 p-6">
        <form action={registerAction} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted">Имя</label>
            <Input name="name" required placeholder="Анна" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Email</label>
            <Input name="email" type="email" required placeholder="you@email.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Пароль</label>
            <Input name="password" type="password" required minLength={6} placeholder="минимум 6 символов" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted">Роль</label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-3 text-sm has-[:checked]:border-accent has-[:checked]:text-accent">
                <input
                  type="radio"
                  name="role"
                  value="client"
                  defaultChecked={selected === "client"}
                />
                Заказчик
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-3 text-sm has-[:checked]:border-accent has-[:checked]:text-accent">
                <input
                  type="radio"
                  name="role"
                  value="freelancer"
                  defaultChecked={selected === "freelancer"}
                />
                Фрилансер
              </label>
            </div>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full">
            Начать бесплатно
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Войти
          </Link>
        </p>
      </Panel>
    </div>
  );
}
