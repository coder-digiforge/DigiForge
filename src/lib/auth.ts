import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { pushAudit } from "./finance/audit";
import { needsRehash, verifyPassword, hashPassword } from "./password";
import {
  createUser,
  findUserByEmail,
  findUserById,
  publicUser,
  updateDb,
} from "./store";
import type { Role, User } from "./types";

const COOKIE = "df_session";

function sessionCookieOptions(maxAge = 60 * 60 * 24 * 7) {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge,
  };
}

export async function getSessionUser(): Promise<ReturnType<typeof publicUser> | null> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id || !/^u-[\w-]+$/.test(id)) return null;
  const user = await findUserById(id);
  if (!user || user.deactivatedAt) return null;
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
  const user = await findUserByEmail(email.trim().toLowerCase());
  if (!user || user.deactivatedAt || !verifyPassword(password, user.password)) {
    try {
      await updateDb((db) => {
        pushAudit(db, {
          action: "auth.login_failed",
          meta: { email: email.trim().toLowerCase().slice(0, 120) },
        });
      });
    } catch {
      // audit best-effort
    }
    throw new Error("Неверный email или пароль");
  }

  if (needsRehash(user.password)) {
    await updateDb((db) => {
      const row = db.users.find((u) => u.id === user.id);
      if (row) row.password = hashPassword(password);
      pushAudit(db, {
        actorUserId: user.id,
        action: "auth.login",
        entityType: "user",
        entityId: user.id,
        meta: { rehashed: true },
      });
    });
  } else {
    try {
      await updateDb((db) => {
        pushAudit(db, {
          actorUserId: user.id,
          action: "auth.login",
          entityType: "user",
          entityId: user.id,
        });
      });
    } catch {
      // ignore
    }
  }

  const jar = await cookies();
  jar.set(COOKIE, user.id, sessionCookieOptions());
  return publicUser(user);
}

export async function register(input: {
  email: string;
  password: string;
  name: string;
  role: "client" | "freelancer";
}) {
  if (input.password.length < 8) {
    throw new Error("Пароль — минимум 8 символов");
  }
  const user = await createUser(input);
  const jar = await cookies();
  jar.set(COOKIE, user.id, sessionCookieOptions());
  return publicUser(user);
}

export async function logout() {
  const jar = await cookies();
  jar.set(COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
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
