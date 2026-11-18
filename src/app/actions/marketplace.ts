"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  acceptBid,
  addPortfolioCase,
  addReview,
  buyDigiPrime,
  setDigiPrimeAutoRenew,
  confirmDeposit,
  createBid,
  createDeposit,
  createProject,
  deliverDeal,
  disputeDeal,
  releaseDeal,
  requestWithdraw,
  markNotificationsRead,
  sendMessage,
  updateUserProfile,
} from "@/lib/store";
import type { CryptoNetwork } from "@/lib/types";
import { saveAvatarUpload, saveChatUpload, savePortfolioCover } from "@/lib/uploads";

export async function createProjectAction(formData: FormData) {
  const user = await requireUser(["client"]);
  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  const category = String(formData.get("category") ?? "Сайты и лендинги");
  const budgetMin = Number(formData.get("budgetMin") ?? 0);
  const budgetMax = Number(formData.get("budgetMax") ?? 0);
  const deadlineDays = Number(formData.get("deadlineDays") ?? 14);
  const bidsHidden = formData.get("bidsHidden") === "on";

  const project = await createProject({
    clientId: user.id,
    title,
    description,
    category,
    budgetMin,
    budgetMax,
    deadlineDays,
    bidsHidden,
  });
  redirect(`/client/projects/${project.id}`);
}

export async function createBidAction(formData: FormData) {
  const user = await requireUser(["freelancer"]);
  const projectId = String(formData.get("projectId") ?? "");
  await createBid({
    projectId,
    freelancerId: user.id,
    amount: Number(formData.get("amount") ?? 0),
    days: Number(formData.get("days") ?? 7),
    comment: String(formData.get("comment") ?? ""),
    transferCopyright: formData.get("transferCopyright") === "license",
    hideFromOthers: formData.get("hideFromOthers") === "on",
  });
  revalidatePath(`/freelancer/projects`);
  revalidatePath(`/freelancer/projects/${projectId}`);
  revalidatePath("/freelancer/bids");
  redirect(`/freelancer/projects?project=${encodeURIComponent(projectId)}`);
}

export async function acceptBidAction(formData: FormData) {
  const user = await requireUser(["client"]);
  const projectId = String(formData.get("projectId") ?? "");
  const bidId = String(formData.get("bidId") ?? "");
  try {
    await acceptBid(projectId, bidId, user.id);
  } catch (e) {
    redirect(
      `/client/projects/${projectId}?error=${encodeURIComponent((e as Error).message)}`,
    );
  }
  revalidatePath(`/client/projects/${projectId}`);
  redirect(`/client/work`);
}

export async function deliverDealAction(formData: FormData) {
  const user = await requireUser(["freelancer"]);
  await deliverDeal(String(formData.get("dealId")), user.id);
  revalidatePath("/freelancer/work");
  redirect("/freelancer/work");
}

export async function releaseDealAction(formData: FormData) {
  const user = await requireUser(["client"]);
  await releaseDeal(String(formData.get("dealId")), user.id);
  revalidatePath("/client/work");
  redirect("/client/work");
}

export async function disputeDealAction(formData: FormData) {
  const user = await requireUser(["client", "freelancer"]);
  await disputeDeal(String(formData.get("dealId")), user.id);
  redirect(user.role === "client" ? "/client/work" : "/freelancer/work");
}

export async function depositAction(formData: FormData) {
  const user = await requireUser(["client"]);
  const amount = Number(formData.get("amount") ?? 0);
  const network = String(formData.get("network") ?? "TRC20") as CryptoNetwork;
  const deposit = await createDeposit({
    userId: user.id,
    amount,
    asset: "USDT",
    network,
  });
  // Demo: auto-confirm after create (simulates webhook)
  await confirmDeposit(deposit.id);
  redirect("/client/finance");
}

export async function withdrawAction(formData: FormData) {
  const user = await requireUser(["client", "freelancer"]);
  try {
    await requestWithdraw({
      userId: user.id,
      amount: Number(formData.get("amount") ?? 0),
      asset: "USDT",
      network: String(formData.get("network") ?? "TRC20") as CryptoNetwork,
      address: String(formData.get("address") ?? ""),
    });
  } catch (e) {
    const base = user.role === "client" ? "/client/finance" : "/freelancer/finance";
    redirect(`${base}?error=${encodeURIComponent((e as Error).message)}`);
  }
  redirect(user.role === "client" ? "/client/finance" : "/freelancer/finance");
}

export async function buyPrimeAction() {
  const user = await requireUser(["freelancer"]);
  try {
    await buyDigiPrime(user.id, 30, 29);
  } catch (e) {
    redirect(`/freelancer/prime?error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath("/freelancer/prime");
  revalidatePath("/freelancer", "layout");
  redirect("/freelancer/prime?saved=1");
}

export async function startPrimeTrialAction() {
  const user = await requireUser(["freelancer"]);
  try {
    await buyDigiPrime(user.id, 60, 0, { trial: true });
  } catch (e) {
    redirect(`/freelancer/prime?error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath("/freelancer/prime");
  revalidatePath("/freelancer", "layout");
  redirect("/freelancer/prime?saved=1");
}

export async function setPrimeAutoRenewAction(formData: FormData) {
  const user = await requireUser(["freelancer"]);
  const enabled = String(formData.get("enabled") ?? "0") === "1";
  await setDigiPrimeAutoRenew(user.id, enabled);
  revalidatePath("/freelancer/prime");
  revalidatePath("/freelancer", "layout");
  redirect("/freelancer/prime?saved=1");
}

export async function sendMessageAction(formData: FormData) {
  const user = await requireUser(["client", "freelancer", "admin"]);
  const threadId = String(formData.get("threadId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const file = formData.get("file");
  const base = user.role === "client" ? "/client/messages" : "/freelancer/messages";

  let attachment: Awaited<ReturnType<typeof saveChatUpload>> = null;
  try {
    if (file instanceof File && file.size > 0) {
      attachment = await saveChatUpload(file);
    }
  } catch (e) {
    redirect(`${base}/${threadId}?error=${encodeURIComponent((e as Error).message)}`);
  }

  if (!body && !attachment) {
    redirect(`${base}/${threadId}`);
  }

  await sendMessage(threadId, user.id, body, attachment ?? undefined);
  redirect(`${base}/${threadId}`);
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser(["client", "freelancer"]);
  const skillsRaw = String(formData.get("skills") ?? "");
  const avatarFile = formData.get("avatar");
  const base = user.role === "client" ? "/client/profile" : "/freelancer/profile";

  let avatarUrl: string | undefined;
  try {
    if (avatarFile instanceof File && avatarFile.size > 0) {
      const saved = await saveAvatarUpload(avatarFile);
      avatarUrl = saved?.url;
    }
  } catch (e) {
    redirect(`${base}?error=${encodeURIComponent((e as Error).message)}`);
  }

  await updateUserProfile(user.id, {
    name: String(formData.get("name") ?? user.name),
    title: String(formData.get("title") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    skills: skillsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    walletAddress: String(formData.get("walletAddress") ?? ""),
    walletNetwork: String(formData.get("walletNetwork") ?? "TRC20") as CryptoNetwork,
    walletAsset: "USDT",
    twoFaEnabled: formData.get("twoFaEnabled") === "on",
    ...(avatarUrl ? { avatarUrl } : {}),
  });
  revalidatePath("/freelancer", "layout");
  revalidatePath("/client", "layout");
  revalidatePath("/freelancers");
  revalidatePath(`/freelancers/${user.id}`);
  revalidatePath(base);
  redirect(`${base}?saved=1`);
}

export async function addPortfolioAction(formData: FormData) {
  const user = await requireUser(["freelancer"]);
  const priceRaw = String(formData.get("priceUsdt") ?? "").trim();
  const priceUsdt = priceRaw ? Number(priceRaw) : undefined;
  const projectUrl = String(formData.get("projectUrl") ?? "").trim() || undefined;
  const coverFile = formData.get("cover");

  let coverUrl: string | undefined;
  try {
    if (coverFile instanceof File && coverFile.size > 0) {
      const saved = await savePortfolioCover(coverFile);
      coverUrl = saved?.url;
    }
  } catch (e) {
    redirect(`/freelancer/portfolio?error=${encodeURIComponent((e as Error).message)}`);
  }

  const summary = String(formData.get("summary") ?? "").trim();
  const wordCount = summary ? summary.split(/\s+/).filter(Boolean).length : 0;
  if (!summary) {
    redirect(`/freelancer/portfolio?error=${encodeURIComponent("Заполните описание")}`);
  }
  if (wordCount > 150) {
    redirect(
      `/freelancer/portfolio?error=${encodeURIComponent("Описание — не больше 150 слов")}`,
    );
  }

  await addPortfolioCase({
    freelancerId: user.id,
    title: String(formData.get("title") ?? ""),
    summary,
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    priceUsdt:
      priceUsdt !== undefined && Number.isFinite(priceUsdt) && priceUsdt > 0
        ? priceUsdt
        : undefined,
    projectUrl,
    coverUrl,
  });
  redirect("/freelancer/portfolio");
}

export async function addReviewAction(formData: FormData) {
  const user = await requireUser(["client", "freelancer"]);
  await addReview({
    fromUserId: user.id,
    toUserId: String(formData.get("toUserId")),
    dealId: String(formData.get("dealId")),
    rating: Number(formData.get("rating") ?? 5),
    text: String(formData.get("text") ?? ""),
  });
  redirect(user.role === "client" ? "/client/reviews" : "/freelancer/reviews");
}

export async function markNotificationsReadAction() {
  const user = await requireUser(["client", "freelancer", "admin"]);
  await markNotificationsRead(user.id);
  revalidatePath("/freelancer", "layout");
  revalidatePath("/client", "layout");
}

