import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createUser,
  findUserByEmail,
  findUserById,
  publicUser,
} from "./store";
import type { Role, User } from "./types";

const COOKIE = "df_session";

export async function getSessionUser(): Promise<ReturnType<typeof publicUser> | null> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;
  const user = await findUserById(id);
  if (!user) return null;
  return publicUser(user);
}

export async function requireUser(roles?: Role[]) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) {
    if (user.role === "admin") redirect("/admin");
    if (user.role === "client") redirect("/client");
    redirect("/freelancer");
  }
  return user;
}

export async function login(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user || user.password !== password) {
    throw new Error("Неверный email или пароль");
  }
  const jar = await cookies();
  jar.set(COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return publicUser(user);
}

export async function register(input: {
  email: string;
  password: string;
  name: string;
  role: "client" | "freelancer";
}) {
  const user = await createUser(input);
  const jar = await cookies();
  jar.set(COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return publicUser(user);
}

export async function logout() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export function homeForRole(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "client") return "/client";
  return "/freelancer";
}

/** Если пользователь уже в кабинете — уводим с публичной страницы на кабинетный аналог. */
export async function keepCabinetShell(map: Partial<Record<Role, string>>) {
  const user = await getSessionUser();
  if (!user) return null;
  const target = map[user.role];
  if (target) redirect(target);
  return user;
}

export type SessionUser = Omit<User, "password">;
