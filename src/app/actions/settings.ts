"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logout, requireUser } from "@/lib/auth";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";
import {
  beginTwoFaSetup,
  changeUserEmail,
  changeUserPassword,
  clearUserSessions,
  confirmTwoFaSetup,
  deactivateUser,
  disableTwoFa,
  findUserById,
  requestEmailVerification,
  updateUserSettings,
} from "@/lib/store";
import type { DisplayTheme, UiLanguage, VisibilityLevel } from "@/lib/types";

function settingsBase(role: string) {
  return role === "client" ? "/client/settings" : "/freelancer/settings";
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "1" || formData.get(key) === "true";
}

function revalidateSettings() {
  revalidatePath("/freelancer/settings");
  revalidatePath("/client/settings");
  revalidatePath("/freelancer", "layout");
  revalidatePath("/client", "layout");
}

export async function saveServiceSettingsAction(formData: FormData) {
  const user = await requireUser(["client", "freelancer"]);
  const base = settingsBase(user.role);
  const exclude = formData
    .getAll("excludeLanguages")
    .map(String)
    .filter(Boolean) as UiLanguage[];
  const themeRaw = String(formData.get("theme") ?? "dark");
  const theme: DisplayTheme = themeRaw === "standard" ? "standard" : "dark";

  await updateUserSettings(user.id, {
    emailDigest: bool(formData, "emailDigest"),
    emailMessages: bool(formData, "emailMessages"),
    emailService: bool(formData, "emailService"),
    emailOffers: bool(formData, "emailOffers"),
    emailNews: bool(formData, "emailNews"),
    emailBlog: bool(formData, "emailBlog"),
    telegramConnected: bool(formData, "telegramConnected"),
    pushBrowser: bool(formData, "pushBrowser"),
    pushSound: bool(formData, "pushSound"),
    soundName: String(formData.get("soundName") ?? "long-trill"),
    language: (String(formData.get("language") ?? "ru") as UiLanguage) || "ru",
    autoTranslate: bool(formData, "autoTranslate"),
    excludeLanguages: exclude,
    theme,
    visibilityLastName: String(formData.get("visibilityLastName") ?? "nobody") as VisibilityLevel,
    visibilityPhone: String(formData.get("visibilityPhone") ?? "nobody") as VisibilityLevel,
    visibilityBirthdate: String(
      formData.get("visibilityBirthdate") ?? "nobody",
    ) as VisibilityLevel,
    searchIndexing: String(formData.get("searchIndexing") ?? "1") === "1",
  });

  revalidateSettings();
  redirect(`${base}?tab=service&saved=1`);
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireUser(["client", "freelancer"]);
  const base = settingsBase(user.role);
  try {
    await changeUserPassword(
      user.id,
      String(formData.get("currentPassword") ?? ""),
      String(formData.get("nextPassword") ?? ""),
    );
    const fresh = await findUserById(user.id);
    if (fresh) {
      const jar = await cookies();
      jar.set(SESSION_COOKIE, createSessionToken(fresh.id, fresh.sessionVersion ?? 0), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
  } catch (e) {
    redirect(
      `${base}?tab=security&error=${encodeURIComponent((e as Error).message)}`,
    );
  }
  revalidateSettings();
  redirect(`${base}?tab=security&saved=1`);
}

export async function changeEmailAction(formData: FormData) {
  const user = await requireUser(["client", "freelancer"]);
  const base = settingsBase(user.role);
  try {
    await changeUserEmail(
      user.id,
      String(formData.get("email") ?? ""),
      String(formData.get("password") ?? ""),
    );
  } catch (e) {
    redirect(
      `${base}?tab=security&error=${encodeURIComponent((e as Error).message)}`,
    );
  }
  revalidateSettings();
  redirect(`${base}?tab=security&saved=1`);
}

export async function beginTwoFaAction() {
  const user = await requireUser(["client", "freelancer"]);
  const base = settingsBase(user.role);
  try {
    const setup = await beginTwoFaSetup(user.id);
    redirect(
      `${base}?tab=security&totpSecret=${encodeURIComponent(setup.secret)}&totpUri=${encodeURIComponent(setup.otpauthUrl)}`,
    );
  } catch (e) {
    redirect(`${base}?tab=security&error=${encodeURIComponent((e as Error).message)}`);
  }
}

export async function confirmTwoFaAction(formData: FormData) {
  const user = await requireUser(["client", "freelancer"]);
  const base = settingsBase(user.role);
  try {
    await confirmTwoFaSetup(user.id, String(formData.get("code") ?? ""));
  } catch (e) {
    redirect(`${base}?tab=security&error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidateSettings();
  redirect(`${base}?tab=security&saved=1`);
}

export async function disableTwoFaAction(formData: FormData) {
  const user = await requireUser(["client", "freelancer"]);
  const base = settingsBase(user.role);
  try {
    await disableTwoFa(user.id, String(formData.get("code") ?? ""));
  } catch (e) {
    redirect(`${base}?tab=security&error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidateSettings();
  redirect(`${base}?tab=security&saved=1`);
}

/** @deprecated use begin/confirm/disable — kept for form compat */
export async function setTwoFaAction(formData: FormData) {
  const enabled = String(formData.get("enabled") ?? "0") === "1";
  if (enabled) return beginTwoFaAction();
  const user = await requireUser(["client", "freelancer"]);
  const base = settingsBase(user.role);
  redirect(`${base}?tab=security&error=${encodeURIComponent("Введите код 2FA для отключения")}`);
}

export async function requestEmailVerifyAction() {
  const user = await requireUser(["client", "freelancer"]);
  const base = settingsBase(user.role);
  try {
    const result = await requestEmailVerification(user.id);
    const q = result.previewUrl
      ? `&verifyPreview=${encodeURIComponent(result.previewUrl)}`
      : "";
    redirect(`${base}?tab=security&saved=1${q}`);
  } catch (e) {
    redirect(`${base}?tab=security&error=${encodeURIComponent((e as Error).message)}`);
  }
}

export async function clearSessionsAction() {
  const user = await requireUser(["client", "freelancer"]);
  const base = settingsBase(user.role);
  await clearUserSessions(user.id);
  const fresh = await findUserById(user.id);
  if (fresh) {
    const jar = await cookies();
    jar.set(SESSION_COOKIE, createSessionToken(fresh.id, fresh.sessionVersion ?? 0), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  revalidateSettings();
  redirect(`${base}?tab=security&saved=1`);
}

export async function deactivateAccountAction() {
  const user = await requireUser(["client", "freelancer"]);
  await deactivateUser(user.id);
  await logout();
  redirect("/");
}
