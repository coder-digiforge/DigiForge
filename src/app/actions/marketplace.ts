"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { assertCryptoNetwork } from "@/lib/finance";
import {
  acceptBid,
  addPortfolioCase,
  deletePortfolioCase,
  updatePortfolioCase,
  addReview,
  buyDigiPrime,
  setDigiPrimeAutoRenew,
  closeProject,
  confirmDeposit,
  createBid,
  createDeposit,
  createProject,
  deliverDeal,
  disputeDeal,
  fundDeal,
  addProjectComment,
  inviteFreelancerToProject,
  rejectBid,
  releaseDeal,
  requestWithdraw,
  markNotificationsRead,
  sendMessage,
  startChatWithBidder,
  thankProjectComment,
  toggleFavorite,
  updateBid,
  updateProject,
  updateUserProfile,
  withdrawBid,
} from "@/lib/store";
import type { CryptoNetwork, ProjectAttachment } from "@/lib/types";
import { saveAvatarUpload, saveChatUpload, savePortfolioCover } from "@/lib/uploads";

function parseSkills(raw: string) {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function parseBudget(formData: FormData) {
  const budgetRaw = String(formData.get("budget") ?? "").trim();
  const budgetNum = budgetRaw ? Number(budgetRaw) : NaN;
  return Number.isFinite(budgetNum) && budgetNum > 0 ? budgetNum : null;
}

async function collectProjectAttachments(formData: FormData): Promise<ProjectAttachment[]> {
  const files = formData.getAll("attachments").filter((f): f is File => f instanceof File && f.size > 0);
  const out: ProjectAttachment[] = [];
  for (const file of files.slice(0, 5)) {
    const saved = await saveChatUpload(file);
    if (saved) out.push(saved);
  }
  return out;
}

function demoDepositAutoconfirmEnabled() {
  // Hard lock: never autoconfirm in production.
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.ALLOW_DEMO_DEPOSIT_AUTOCONFIRM === "true") return true;
  if (process.env.ALLOW_DEMO_DEPOSIT_AUTOCONFIRM === "false") return false;
  return !process.env.CRYPTOPAY_IPN_SECRET;
}

export async function createProjectAction(formData: FormData) {
  const user = await requireUser(["client"]);
  let projectId = "";
  try {
    const attachments = await collectProjectAttachments(formData);
    const project = await createProject({
      clientId: user.id,
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      category: String(formData.get("category") ?? "Сайты и лендинги"),
      budget: parseBudget(formData),
      deadlineDays: Number(formData.get("deadlineDays") ?? 14),
      bidsHidden: formData.get("bidsHidden") === "on",
      skills: parseSkills(String(formData.get("skills") ?? "")),
      attachments,
    });
    projectId = project.id;
  } catch (e) {
    redirect(
      `/client/projects/new?error=${encodeURIComponent((e as Error).message)}`,
    );
  }
  redirect(`/client/projects/${projectId}`);
}

export async function updateProjectAction(formData: FormData) {
  const user = await requireUser(["client"]);
  const projectId = String(formData.get("projectId") ?? "");
  try {
    const keepRaw = String(formData.get("keepAttachments") ?? "").trim();
    let keep: ProjectAttachment[] = [];
    if (keepRaw) {
      try {
        keep = JSON.parse(keepRaw) as ProjectAttachment[];
      } catch {
        keep = [];
      }
    }
    const added = await collectProjectAttachments(formData);
    await updateProject(projectId, user.id, {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      category: String(formData.get("category") ?? "Сайты и лендинги"),
      budget: parseBudget(formData),
      deadlineDays: Number(formData.get("deadlineDays") ?? 14),
      bidsHidden: formData.get("bidsHidden") === "on",
      skills: parseSkills(String(formData.get("skills") ?? "")),
      attachments: [...keep, ...added].slice(0, 5),
    });
  } catch (e) {
    redirect(
      `/client/projects/${projectId}/edit?error=${encodeURIComponent((e as Error).message)}`,
    );
  }
  revalidatePath(`/client/projects/${projectId}`);
  revalidatePath("/client/projects");
  revalidatePath("/projects");
  redirect(`/client/projects/${projectId}`);
}

export async function closeProjectAction(formData: FormData) {
  const user = await requireUser(["client"]);
  const projectId = String(formData.get("projectId") ?? "");
  try {
    await closeProject(projectId, user.id);
  } catch (e) {
    redirect(
      `/client/projects/${projectId}?error=${encodeURIComponent((e as Error).message)}`,
    );
  }
  revalidatePath(`/client/projects/${projectId}`);
  revalidatePath("/client/projects");
  redirect("/client/projects");
}

export async function createBidAction(formData: FormData) {
  const user = await requireUser(["freelancer"]);
  const projectId = String(formData.get("projectId") ?? "");
  try {
    await createBid({
      projectId,
      freelancerId: user.id,
      amount: Number(formData.get("amount") ?? 0),
      days: Number(formData.get("days") ?? 7),
      comment: String(formData.get("comment") ?? ""),
      transferCopyright: formData.get("transferCopyright") === "license",
      hideFromOthers: formData.get("hideFromOthers") === "on",
    });
  } catch (e) {
    redirect(
      `/freelancer/projects?project=${encodeURIComponent(projectId)}&error=${encodeURIComponent((e as Error).message)}`,
    );
  }
  revalidatePath(`/freelancer/projects`);
  revalidatePath(`/freelancer/projects/${projectId}`);
  revalidatePath("/freelancer/bids");
  redirect(`/freelancer/projects?project=${encodeURIComponent(projectId)}`);
}

export async function updateBidAction(formData: FormData) {
  const user = await requireUser(["freelancer"]);
  const bidId = String(formData.get("bidId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  try {
    await updateBid(bidId, user.id, {
      amount: Number(formData.get("amount") ?? 0),
      days: Number(formData.get("days") ?? 7),
      comment: String(formData.get("comment") ?? ""),
      transferCopyright: formData.get("transferCopyright") === "license",
      hideFromOthers: formData.get("hideFromOthers") === "on",
    });
  } catch (e) {
    redirect(
      `/freelancer/bids?error=${encodeURIComponent((e as Error).message)}`,
    );
  }
  revalidatePath("/freelancer/bids");
  revalidatePath("/freelancer/projects");
  redirect(
    projectId
      ? `/freelancer/projects?project=${encodeURIComponent(projectId)}`
      : "/freelancer/bids",
  );
}

export async function withdrawBidAction(formData: FormData) {
  const user = await requireUser(["freelancer"]);
  const bidId = String(formData.get("bidId") ?? "");
  try {
    await withdrawBid(bidId, user.id);
  } catch (e) {
    redirect(`/freelancer/bids?error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath("/freelancer/bids");
  revalidatePath("/freelancer/projects");
  redirect("/freelancer/bids");
}

export async function rejectBidAction(formData: FormData) {
  const user = await requireUser(["client"]);
  const projectId = String(formData.get("projectId") ?? "");
  const bidId = String(formData.get("bidId") ?? "");
  try {
    await rejectBid(projectId, bidId, user.id);
  } catch (e) {
    redirect(
      `/client/projects/${projectId}?error=${encodeURIComponent((e as Error).message)}`,
    );
  }
  revalidatePath(`/client/projects/${projectId}`);
  redirect(`/client/projects/${projectId}`);
}

export async function toggleFavoriteAction(formData: FormData) {
  const user = await requireUser(["client", "freelancer"]);
  const targetType = String(formData.get("targetType") ?? "") as "project" | "freelancer";
  const targetId = String(formData.get("targetId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/");
  if (targetType !== "project" && targetType !== "freelancer") {
    redirect(returnTo);
  }
  try {
    await toggleFavorite(user.id, targetType, targetId);
  } catch (e) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath(returnTo.split("?")[0] || "/");
  redirect(returnTo);
}

export async function inviteFreelancerAction(formData: FormData) {
  const user = await requireUser(["client"]);
  const freelancerId = String(formData.get("freelancerId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const message = String(formData.get("message") ?? "");
  try {
    await inviteFreelancerToProject({
      clientId: user.id,
      freelancerId,
      projectId,
      message,
    });
  } catch (e) {
    redirect(
      `/client/freelancers/${freelancerId}?error=${encodeURIComponent((e as Error).message)}`,
    );
  }
  revalidatePath(`/client/freelancers/${freelancerId}`);
  redirect(`/client/freelancers/${freelancerId}?invited=1`);
}

export async function addProjectCommentAction(formData: FormData) {
  const user = await requireUser(["client", "freelancer"]);
  const projectId = String(formData.get("projectId") ?? "");
  const parentIdRaw = String(formData.get("parentId") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  const fallback =
    user.role === "freelancer"
      ? `/freelancer/projects?project=${encodeURIComponent(projectId)}`
      : `/client/projects/${projectId}`;
  const dest = returnTo.startsWith("/") ? returnTo : fallback;
  try {
    await addProjectComment({
      projectId,
      authorId: user.id,
      body: String(formData.get("body") ?? ""),
      parentId: parentIdRaw || null,
    });
  } catch (e) {
    redirect(
      `${dest}${dest.includes("?") ? "&" : "?"}error=${encodeURIComponent((e as Error).message)}`,
    );
  }
  revalidatePath("/projects");
  revalidatePath("/freelancer/projects");
  revalidatePath(`/client/projects/${projectId}`);
  redirect(dest);
}

export async function thankProjectCommentAction(formData: FormData) {
  const user = await requireUser(["client", "freelancer"]);
  const commentId = String(formData.get("commentId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/projects");
  try {
    await thankProjectComment(commentId, user.id);
  } catch (e) {
    redirect(
      `${returnTo}${returnTo.includes("?") ? "&" : "?"}error=${encodeURIComponent((e as Error).message)}`,
    );
  }
  revalidatePath("/projects");
  revalidatePath("/freelancer/projects");
  redirect(returnTo);
}

export async function messageBidderAction(formData: FormData) {
  const user = await requireUser(["client"]);
  const projectId = String(formData.get("projectId") ?? "");
  const freelancerId = String(formData.get("freelancerId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  let threadId = "";
  try {
    threadId = await startChatWithBidder({
      clientId: user.id,
      projectId,
      freelancerId,
      body: body || undefined,
    });
  } catch (e) {
    redirect(
      `/client/projects/${projectId}?error=${encodeURIComponent((e as Error).message)}`,
    );
  }
  revalidatePath("/client/messages");
  revalidatePath(`/client/messages/${threadId}`);
  revalidatePath(`/client/projects/${projectId}`);
  redirect(`/client/messages/${threadId}`);
}

export async function acceptBidAction(formData: FormData) {
  const user = await requireUser(["client"]);
  const projectId = String(formData.get("projectId") ?? "");
  const bidId = String(formData.get("bidId") ?? "");
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const amountNum = amountRaw ? Number(amountRaw) : NaN;
  const amountOverride =
    Number.isFinite(amountNum) && amountNum > 0 ? amountNum : undefined;
  try {
    await acceptBid(projectId, bidId, user.id, amountOverride);
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
  try {
    await releaseDeal(String(formData.get("dealId")), user.id);
  } catch (e) {
    redirect(`/client/work?error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath("/client/work");
  redirect("/client/work");
}

export async function fundDealAction(formData: FormData) {
  const user = await requireUser(["client"]);
  try {
    await fundDeal(String(formData.get("dealId")), user.id);
  } catch (e) {
    redirect(`/client/work?error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath("/client/work");
  redirect("/client/work");
}

export async function disputeDealAction(formData: FormData) {
  const user = await requireUser(["client", "freelancer"]);
  try {
    await disputeDeal(String(formData.get("dealId")), user.id);
  } catch (e) {
    const base = user.role === "client" ? "/client/work" : "/freelancer/work";
    redirect(`${base}?error=${encodeURIComponent((e as Error).message)}`);
  }
  redirect(user.role === "client" ? "/client/work" : "/freelancer/work");
}

export async function depositAction(formData: FormData) {
  const user = await requireUser(["client", "freelancer"]);
  const base = user.role === "client" ? "/client/finance" : "/freelancer/finance";
  try {
    const amount = Number(formData.get("amount") ?? 0);
    const network = assertCryptoNetwork(String(formData.get("network") ?? "TRC20"));
    const deposit = await createDeposit({
      userId: user.id,
      amount,
      asset: "USDT",
      network,
    });
    if (demoDepositAutoconfirmEnabled()) {
      await confirmDeposit(deposit.id, {
        actorUserId: user.id,
        eventKey: `demo-auto:${deposit.id}`,
        provider: "demo",
      });
      redirect(`${base}?tab=balance`);
    }
    redirect(
      `${base}?tab=balance&deposit=${encodeURIComponent(deposit.id)}&awaiting=1`,
    );
  } catch (e) {
    redirect(`${base}?error=${encodeURIComponent((e as Error).message)}`);
  }
}

export async function withdrawAction(formData: FormData) {
  const user = await requireUser(["client", "freelancer"]);
  const base = user.role === "client" ? "/client/finance" : "/freelancer/finance";
  try {
    const totpRaw = String(formData.get("totpCode") ?? "").trim();
    await requestWithdraw({
      userId: user.id,
      amount: Number(formData.get("amount") ?? 0),
      asset: "USDT",
      network: assertCryptoNetwork(String(formData.get("network") ?? "TRC20")),
      address: String(formData.get("address") ?? ""),
      totpCode: totpRaw || undefined,
    });
  } catch (e) {
    redirect(`${base}?error=${encodeURIComponent((e as Error).message)}`);
  }
  redirect(base);
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
    const { DIGI_PRIME_LAUNCH_DAYS } = await import("@/lib/finance/constants");
    await buyDigiPrime(user.id, DIGI_PRIME_LAUNCH_DAYS, 0, { trial: true });
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

  let profileI18n = user.profileI18n;
  const i18nRaw = String(formData.get("profileI18n") ?? "").trim();
  if (i18nRaw) {
    try {
      profileI18n = JSON.parse(i18nRaw) as typeof profileI18n;
    } catch {
      /* keep previous */
    }
  }

  const bio = String(formData.get("bio") ?? user.bio ?? "");
  const motto = String(formData.get("motto") ?? "");
  const bidSignature = String(formData.get("bidSignature") ?? "");
  const workStatusRaw = String(formData.get("workStatus") ?? "").trim();
  const legalFormRaw = String(formData.get("legalForm") ?? "").trim();

  await updateUserProfile(user.id, {
    name: String(formData.get("name") ?? user.name),
    title: String(formData.get("title") ?? ""),
    bio,
    motto,
    bidSignature,
    autoAddBidSignature: formData.get("autoAddBidSignature") === "on",
    workStatus: (workStatusRaw || user.workStatus || "open") as NonNullable<
      typeof user.workStatus
    >,
    legalForm: (legalFormRaw || user.legalForm || "none") as NonNullable<
      typeof user.legalForm
    >,
    profileI18n,
    skills: skillsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    walletAddress: String(formData.get("walletAddress") ?? ""),
    walletNetwork: String(formData.get("walletNetwork") ?? "TRC20") as CryptoNetwork,
    walletAsset: "USDT",
    ...(avatarUrl ? { avatarUrl } : {}),
  });
  revalidatePath("/freelancer", "layout");
  revalidatePath("/client", "layout");
  revalidatePath("/freelancers");
  revalidatePath(`/freelancers/${user.id}`);
  revalidatePath(base);
  revalidatePath("/freelancer/public");

  const returnToRaw = String(formData.get("returnTo") ?? "").trim();
  const allowedReturns = new Set([
    "/client/profile",
    "/freelancer/profile",
    "/freelancer/public",
  ]);
  const returnTo = allowedReturns.has(returnToRaw) ? returnToRaw : base;
  redirect(`${returnTo}?saved=1`);
}

function portfolioTagsFromForm(formData: FormData, summary: string) {
  const category = String(formData.get("category") ?? "").trim();
  const hashtags = [...summary.matchAll(/#([\p{L}\p{N}_-]+)/gu)].map((m) => m[1]);
  const extra = String(formData.get("tags") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const t of [category, ...hashtags, ...extra]) {
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(t);
  }
  return tags;
}

function readPortfolioFields(formData: FormData) {
  const priceRaw = String(formData.get("priceUsdt") ?? "").trim();
  const priceUsdt = priceRaw ? Number(priceRaw) : undefined;
  const projectUrl = String(formData.get("projectUrl") ?? "").trim() || undefined;
  const summary = String(formData.get("summary") ?? "").trim();
  const wordCount = summary ? summary.split(/\s+/).filter(Boolean).length : 0;
  return {
    title: String(formData.get("title") ?? "").trim(),
    summary,
    wordCount,
    projectUrl,
    tags: portfolioTagsFromForm(formData, summary),
    priceUsdt:
      priceUsdt !== undefined && Number.isFinite(priceUsdt) && priceUsdt > 0
        ? priceUsdt
        : undefined,
  };
}

export async function addPortfolioAction(formData: FormData) {
  const user = await requireUser(["freelancer"]);
  const fields = readPortfolioFields(formData);
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

  if (!fields.title) {
    redirect(`/freelancer/portfolio?error=${encodeURIComponent("Укажите название работы")}`);
  }
  if (!fields.summary) {
    redirect(`/freelancer/portfolio?error=${encodeURIComponent("Заполните описание")}`);
  }
  if (fields.wordCount > 150) {
    redirect(
      `/freelancer/portfolio?error=${encodeURIComponent("Описание — не больше 150 слов")}`,
    );
  }

  await addPortfolioCase({
    freelancerId: user.id,
    title: fields.title,
    summary: fields.summary,
    tags: fields.tags,
    priceUsdt: fields.priceUsdt,
    projectUrl: fields.projectUrl,
    coverUrl,
  });
  redirect("/freelancer/portfolio");
}

export async function updatePortfolioAction(formData: FormData) {
  const user = await requireUser(["freelancer"]);
  const caseId = String(formData.get("caseId") ?? "").trim();
  if (!caseId) {
    redirect(`/freelancer/portfolio?error=${encodeURIComponent("Кейс не найден")}`);
  }

  const fields = readPortfolioFields(formData);
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

  if (!fields.title) {
    redirect(`/freelancer/portfolio?error=${encodeURIComponent("Укажите название работы")}`);
  }
  if (!fields.summary) {
    redirect(`/freelancer/portfolio?error=${encodeURIComponent("Заполните описание")}`);
  }
  if (fields.wordCount > 150) {
    redirect(
      `/freelancer/portfolio?error=${encodeURIComponent("Описание — не больше 150 слов")}`,
    );
  }

  const patch: Parameters<typeof updatePortfolioCase>[2] = {
    title: fields.title,
    summary: fields.summary,
    tags: fields.tags,
    priceUsdt: fields.priceUsdt,
    projectUrl: fields.projectUrl,
  };
  if (coverUrl) patch.coverUrl = coverUrl;

  const updated = await updatePortfolioCase(caseId, user.id, patch);
  if (!updated) {
    redirect(`/freelancer/portfolio?error=${encodeURIComponent("Кейс не найден")}`);
  }
  redirect("/freelancer/portfolio");
}

export async function deletePortfolioAction(formData: FormData) {
  const user = await requireUser(["freelancer"]);
  const caseId = String(formData.get("caseId") ?? "").trim();
  if (!caseId) {
    redirect(`/freelancer/portfolio?error=${encodeURIComponent("Кейс не найден")}`);
  }
  const removed = await deletePortfolioCase(caseId, user.id);
  if (!removed) {
    redirect(`/freelancer/portfolio?error=${encodeURIComponent("Кейс не найден")}`);
  }
  redirect("/freelancer/portfolio");
}

export async function addReviewAction(formData: FormData) {
  const user = await requireUser(["client", "freelancer"]);
  const base = user.role === "client" ? "/client/work" : "/freelancer/work";
  try {
    await addReview({
      fromUserId: user.id,
      toUserId: String(formData.get("toUserId")),
      dealId: String(formData.get("dealId")),
      rating: Number(formData.get("rating") ?? 5),
      text: String(formData.get("text") ?? ""),
    });
  } catch (e) {
    redirect(`${base}?error=${encodeURIComponent((e as Error).message)}`);
  }
  revalidatePath("/client/reviews");
  revalidatePath("/freelancer/reviews");
  revalidatePath(base);
  redirect(user.role === "client" ? "/client/reviews?saved=1" : "/freelancer/reviews?saved=1");
}

export async function markNotificationsReadAction() {
  const user = await requireUser(["client", "freelancer", "admin"]);
  await markNotificationsRead(user.id);
  revalidatePath("/freelancer", "layout");
  revalidatePath("/client", "layout");
}

