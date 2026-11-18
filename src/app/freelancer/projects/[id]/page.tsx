import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getProject } from "@/lib/store";
import { notFound } from "next/navigation";

export default async function FreelancerProjectRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser(["freelancer"]);
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  redirect(`/freelancer/projects?project=${encodeURIComponent(id)}`);
}
