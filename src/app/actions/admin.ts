"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  adminCancelProject,
  adminDeleteReview,
  adminProcessWithdrawal,
  adminResolveDeal,
  adminSetUserActive,
} from "@/lib/store";

function revalidateAdmin() {
  revalidatePath("/admin", "layout");
}

export async function adminResolveAction(formData: FormData) {
  const admin = await requireUser(["admin"]);
  await adminResolveDeal(
    String(formData.get("dealId")),
    String(formData.get("resolution")) as "release" | "refund",
    admin.id,
  );
  revalidateAdmin();
  redirect("/admin/deals");
}

export async function adminSetUserActiveAction(formData: FormData) {
  await requireUser(["admin"]);
  const userId = String(formData.get("userId"));
  const active = String(formData.get("active")) === "1";
  await adminSetUserActive(userId, active);
  revalidateAdmin();
  redirect(`/admin/users/${userId}`);
}

export async function adminCancelProjectAction(formData: FormData) {
  await requireUser(["admin"]);
  await adminCancelProject(String(formData.get("projectId")));
  revalidateAdmin();
  redirect("/admin/projects");
}

export async function adminProcessWithdrawalAction(formData: FormData) {
  const admin = await requireUser(["admin"]);
  await adminProcessWithdrawal(
    String(formData.get("withdrawalId")),
    String(formData.get("decision")) as "approve" | "reject",
    admin.id,
    {
      txHash: String(formData.get("txHash") ?? "") || undefined,
      rejectReason: String(formData.get("rejectReason") ?? "") || undefined,
    },
  );
  revalidateAdmin();
  redirect("/admin/finance");
}

export async function adminDeleteReviewAction(formData: FormData) {
  await requireUser(["admin"]);
  await adminDeleteReview(String(formData.get("reviewId")));
  revalidateAdmin();
  redirect("/admin/reviews");
}
