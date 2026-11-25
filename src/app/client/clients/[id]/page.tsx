import { notFound } from "next/navigation";
import { ClientPublicView } from "@/components/ClientPublicView";
import { requireUser } from "@/lib/auth";
import { findUserById, getDb, listProjects, listReviewsForUser } from "@/lib/store";

export default async function CabinetClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser(["client"]);
  const { id } = await params;
  const user = await findUserById(id);
  if (!user || user.role !== "client") notFound();
  const projects = (await listProjects()).filter((p) => p.clientId === id);
  const reviews = await listReviewsForUser(id);
  const db = await getDb();
  const reviewAuthors = Object.fromEntries(
    reviews.map((r) => {
      const from = db.users.find((u) => u.id === r.fromUserId);
      return [r.fromUserId, from?.name ?? "Исполнитель"];
    }),
  );

  return (
    <ClientPublicView
      user={user}
      projects={projects}
      reviews={reviews}
      reviewAuthors={reviewAuthors}
      basePath="/client/clients"
      variant="cabinet"
    />
  );
}
