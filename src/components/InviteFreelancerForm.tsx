import { inviteFreelancerAction } from "@/app/actions/marketplace";
import { Button, Textarea } from "@/components/ui";
import type { Project } from "@/lib/types";

export function InviteFreelancerForm({
  freelancerId,
  projects,
}: {
  freelancerId: string;
  projects: Project[];
}) {
  if (projects.length === 0) {
    return (
      <p className="text-sm text-muted">
        Нет открытых проектов —{" "}
        <a href="/client/projects/new" className="text-accent hover:underline">
          создайте проект
        </a>
        , чтобы пригласить исполнителя.
      </p>
    );
  }

  return (
    <form action={inviteFreelancerAction} className="space-y-3">
      <input type="hidden" name="freelancerId" value={freelancerId} />
      <label className="block text-xs text-muted">
        Проект
        <select name="projectId" className="df-input mt-1" required defaultValue={projects[0]?.id}>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-muted">
        Сообщение
        <Textarea
          name="message"
          className="mt-1"
          placeholder="Коротко опишите, почему приглашаете…"
        />
      </label>
      <Button type="submit" className="!rounded-full !text-sm">
        Пригласить на проект
      </Button>
    </form>
  );
}
