import { NextResponse } from "next/server";
import { confirmEmailVerification } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const app = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  if (!token) {
    return NextResponse.redirect(`${app}/login?error=${encodeURIComponent("Нет токена")}`);
  }
  try {
    await confirmEmailVerification(token);
    return NextResponse.redirect(`${app}/login?verified=1`);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка подтверждения";
    return NextResponse.redirect(`${app}/login?error=${encodeURIComponent(message)}`);
  }
}
