import { PageTitle, Panel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { listAuditLog } from "@/lib/store";

function formatAt(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default async function AdminAuditPage() {
  await requireUser(["admin"]);
  const rows = await listAuditLog(200);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Audit log"
        subtitle="События финансов, эскроу и безопасности"
      />
      <Panel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-panel-soft/60 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Время</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Meta</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Пока пусто
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t border-border/60 align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatAt(r.at)}</td>
                    <td className="px-4 py-3 font-medium text-text">{r.action}</td>
                    <td className="px-4 py-3 text-muted">{r.actorUserId ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">
                      {r.entityType ?? "—"}
                      {r.entityId ? ` · ${r.entityId}` : ""}
                    </td>
                    <td className="max-w-xs break-all px-4 py-3 font-mono text-xs text-muted">
                      {r.meta ? JSON.stringify(r.meta) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
