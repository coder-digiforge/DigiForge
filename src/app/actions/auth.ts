"use server";

import { redirect } from "next/navigation";
import { homeForRole, login, logout, register } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  let user;
  try {
    user = await login(email, password);
  } catch (e) {
    redirect(`/login?error=${encodeURIComponent((e as Error).message)}`);
  }
  redirect(homeForRole(user.role));
}

export async function registerAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "");
  const role = String(formData.get("role") ?? "client") as "client" | "freelancer";
  let user;
  try {
    user = await register({ email, password, name, role });
  } catch (e) {
    redirect(`/register?error=${encodeURIComponent((e as Error).message)}`);
  }
  redirect(homeForRole(user.role));
}

export async function logoutAction() {
  await logout();
  redirect("/");
}
